// Route-level tests for the CMS (Program, Berita & Artikel, Slider).
//
// The real API handler runs against an in-memory fake of the `mongodb` driver, so the whole path
// (HTTP request -> route -> lib/cms.js -> "database") is exercised without a MongoDB server.
//
// Run: npm test
import { test, mock } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'

// Next resolves `next/server` through its bundler; plain Node ESM needs the explicit file.
registerHooks({ resolve: (spec, ctx, next) => next(spec === 'next/server' ? 'next/server.js' : spec, ctx) })

// ---------- minimal in-memory MongoDB fake ----------
const stores = new Map()
const matchOne = (v, cond) => {
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    return Object.entries(cond).every(([op, x]) => {
      if (op === '$ne') return v !== x
      if (op === '$in') return x.includes(v)
      if (op === '$nin') return !x.includes(v)
      if (op === '$exists') return (v !== undefined) === x
      if (op === '$lte') return v <= x
      if (op === '$gte') return v >= x
      throw new Error('fake mongo: unsupported operator ' + op)
    })
  }
  return v === cond
}
const matches = (doc, filter = {}) => Object.entries(filter).every(([k, c]) => matchOne(doc[k], c))
class Cursor {
  constructor(rows) { this.rows = rows }
  sort(spec) { const [k, dir] = Object.entries(spec)[0]; this.rows = [...this.rows].sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * dir); return this }
  limit(n) { this.rows = this.rows.slice(0, n); return this }
  async toArray() { return this.rows.map((r) => structuredClone(r)) }
}
class Collection {
  constructor(name) { this.name = name; if (!stores.has(name)) stores.set(name, []); this.rows = stores.get(name) }
  find(filter) { return new Cursor(this.rows.filter((d) => matches(d, filter))) }
  async findOne(filter) { const d = this.rows.find((x) => matches(x, filter)); return d ? structuredClone(d) : null }
  async insertOne(doc) { this.rows.push(structuredClone(doc)); return { insertedId: doc.id } }
  async insertMany(docs) { docs.forEach((d) => this.rows.push(structuredClone(d))); return { insertedCount: docs.length } }
  async countDocuments(filter) { return this.rows.filter((d) => matches(d, filter)).length }
  async updateOne(filter, update, opts = {}) {
    let d = this.rows.find((x) => matches(x, filter))
    if (!d) {
      if (!opts.upsert) return { matchedCount: 0 }
      d = { ...Object.fromEntries(Object.entries(filter).filter(([, v]) => typeof v !== 'object')), ...(update.$setOnInsert || {}) }
      this.rows.push(d)
    }
    Object.assign(d, structuredClone(update.$set || {}))
    return { matchedCount: 1 }
  }
  async deleteOne(filter) { const i = this.rows.findIndex((x) => matches(x, filter)); if (i >= 0) this.rows.splice(i, 1); return { deletedCount: i >= 0 ? 1 : 0 } }
}
class FakeDb { collection(name) { return new Collection(name) } }
class MongoClient { constructor() {} async connect() { return this } db() { return new FakeDb() } }

mock.module('mongodb', { namedExports: { MongoClient } })

// ---------- load the real handler ----------
process.env.ADMIN_KEY = 'test-admin-key'
delete process.env.MONGO_URL
delete process.env.MONGODB_URI
const { NextRequest } = await import('next/server.js')
const routeFile = path.resolve('app/api/[[...path]]/route.js')
const route = await import(pathToFileURL(routeFile).href)
const cms = await import(pathToFileURL(path.resolve('lib/cms.js')).href)

async function call(method, p, { body, admin = false } = {}) {
  const url = 'http://localhost/api/' + p
  const headers = { 'content-type': 'application/json' }
  if (admin) headers['x-admin-key'] = 'test-admin-key'
  const req = new NextRequest(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const res = await route[method](req, { params: Promise.resolve({ path: p.split('?')[0].split('/') }) })
  return { status: res.status, body: await res.json() }
}
const useDb = () => { process.env.MONGO_URL = 'mongodb://fake:27017' }
const noDb = () => { delete process.env.MONGO_URL }
const ids = (arr) => arr.map((x) => x.id).sort()
const future = () => new Date(Date.now() + 7 * 86400000).toISOString()
const past = () => new Date(Date.now() - 7 * 86400000).toISOString()

// ================= no database: public and admin must show the same demo content =================
test('no DB: admin panel shows exactly what the public site shows (the original bug)', async () => {
  noDb()
  const pub = (await call('GET', 'campaigns')).body
  const adm = (await call('GET', 'admin/campaigns', { admin: true })).body
  assert.equal(adm.db, false)
  assert.ok(pub.length >= 3, 'public has demo programs')
  assert.deepEqual(ids(adm.items), ids(pub), 'admin program ids == public program ids')

  const pubNews = (await call('GET', 'news')).body
  const admNews = (await call('GET', 'admin/news', { admin: true })).body
  assert.ok(pubNews.length >= 3)
  assert.deepEqual(ids(admNews.items), ids(pubNews))

  const pubSlides = (await call('GET', 'home-settings')).body
  const admSlides = (await call('GET', 'admin/home-settings', { admin: true })).body
  assert.ok(pubSlides.slides.length >= 1)
  assert.deepEqual(ids(admSlides.slides), ids(pubSlides.slides))
})

test('no DB: writes are refused with a clear 503 (nothing pretends to be saved)', async () => {
  noDb()
  const r = await call('POST', 'admin/news', { admin: true, body: { title: 'x' } })
  assert.equal(r.status, 503)
  assert.equal(r.body.db_missing, true)
})

test('admin endpoints require the admin key', async () => {
  noDb()
  assert.equal((await call('GET', 'admin/campaigns')).status, 401)
  assert.equal((await call('POST', 'admin/news', { body: { title: 'x' } })).status, 401)
})

// ================= with a database =================
test('DB: starter content is seeded once and is identical in public and admin views', async () => {
  useDb()
  const pub = (await call('GET', 'campaigns')).body
  const adm = (await call('GET', 'admin/campaigns', { admin: true })).body
  assert.equal(adm.db, true)
  assert.ok(pub.length >= 3)
  assert.deepEqual(ids(adm.items), ids(pub))
  const news = (await call('GET', 'news')).body
  assert.ok(news.length >= 3, 'seeded news must be visible publicly (they used to lack status:Published)')
  assert.ok(news.every((n) => n.status === 'Active' && n.author && Array.isArray(n.tags) && n.publishedAt))
})

test('Program: create as Draft -> hidden publicly; Active -> visible; Inactive -> hidden; edit persists', async () => {
  useDb()
  const c = await call('POST', 'admin/campaigns', { admin: true, body: { title: 'Program Uji', targetAmount: '5000000', collectedAmount: 1000000, endDate: '2027-01-31', category: 'zakat' } })
  assert.equal(c.status, 200)
  const id = c.body.id, slug = c.body.slug
  assert.equal(c.body.status, 'Draft')
  assert.equal(c.body.targetAmount, 5000000)
  assert.equal(c.body.collected_amount, 1000000)
  assert.ok(c.body.endDate.startsWith('2027-01-31'))

  assert.ok(!(await call('GET', 'campaigns')).body.some((x) => x.id === id), 'Draft must not be public')
  assert.equal((await call('GET', `campaigns/${slug}`)).status, 404)
  assert.ok((await call('GET', 'admin/campaigns', { admin: true })).body.items.some((x) => x.id === id), 'Draft visible in admin')

  const a = await call('PUT', `admin/campaigns/${id}`, { admin: true, body: { status: 'Active' } })
  assert.equal(a.body.status, 'Active')
  assert.ok(a.body.publishedAt, 'publishing sets publishedAt')
  assert.ok((await call('GET', 'campaigns')).body.some((x) => x.id === id))
  assert.equal((await call('GET', `campaigns/${slug}`)).status, 200)

  const e = await call('PUT', `admin/campaigns/${id}`, { admin: true, body: { title: 'Program Uji Edit', targetAmount: 7000000 } })
  assert.equal(e.body.title, 'Program Uji Edit')
  assert.equal(e.body.slug, slug, 'slug stays stable on edit')
  assert.equal((await call('GET', `campaigns/${slug}`)).body.target_amount, 7000000, 'edit persisted to DB')

  await call('PUT', `admin/campaigns/${id}`, { admin: true, body: { status: 'Inactive' } })
  assert.ok(!(await call('GET', 'campaigns')).body.some((x) => x.id === id), 'Inactive must not be public')
  assert.equal((await call('GET', `campaigns/${slug}`)).status, 404)
  assert.ok((await call('GET', 'admin/campaigns', { admin: true })).body.items.some((x) => x.id === id))

  assert.equal((await call('DELETE', `admin/campaigns/${id}`, { admin: true })).body.deleted, 1)
  assert.ok(!(await call('GET', 'admin/campaigns', { admin: true })).body.items.some((x) => x.id === id), 'deleted from DB')
})

test('Program: scheduled publishedAt in the future stays hidden until it arrives', async () => {
  useDb()
  const c = await call('POST', 'admin/campaigns', { admin: true, body: { title: 'Terjadwal', status: 'Active', publishedAt: future() } })
  assert.ok(!(await call('GET', 'campaigns')).body.some((x) => x.id === c.body.id))
  await call('PUT', `admin/campaigns/${c.body.id}`, { admin: true, body: { publishedAt: past() } })
  assert.ok((await call('GET', 'campaigns')).body.some((x) => x.id === c.body.id))
})

test('Program: stats only count visible programs', async () => {
  useDb()
  const before = (await call('GET', 'stats')).body
  const c = await call('POST', 'admin/campaigns', { admin: true, body: { title: 'Draf Statistik', targetAmount: 999, collectedAmount: 999, status: 'Draft' } })
  const after = (await call('GET', 'stats')).body
  assert.equal(after.total_collected, before.total_collected)
  assert.equal(after.active_campaigns, before.active_campaigns)
  await call('DELETE', `admin/campaigns/${c.body.id}`, { admin: true })
})

test('Validation rejects bad types with 400 and a readable message', async () => {
  useDb()
  const bad = async (path, body, re) => { const r = await call('POST', path, { admin: true, body }); assert.equal(r.status, 400, JSON.stringify(body)); assert.match(r.body.error, re) }
  await bad('admin/campaigns', {}, /Nama program wajib/)
  await bad('admin/campaigns', { title: 'x', targetAmount: 'abc' }, /angka/i)
  await bad('admin/campaigns', { title: 'x', targetAmount: -5 }, /negatif/i)
  await bad('admin/campaigns', { title: 'x', status: 'Foo' }, /Status harus/)
  await bad('admin/campaigns', { title: 'x', endDate: 'bukan-tanggal' }, /Tanggal tidak valid/)
  await bad('admin/news', { title: '' }, /Judul wajib/)
  await bad('admin/news', { title: 'x', status: 'Published?' }, /Status harus/)
  await bad('admin/home-settings', { slides: [{ type: 'weird' }] }, /Tipe slide/)
  const nothing = await call('PUT', 'admin/campaigns/tidak-ada', { admin: true, body: { title: 'x' } })
  assert.equal(nothing.status, 404)
})

test('Artikel: author, category, tags, status, publishedAt; filters and legacy data', async () => {
  useDb()
  const a = await call('POST', 'admin/news', { admin: true, body: { title: 'Kabar Baru', content: 'isi '.repeat(450), category: 'Artikel', author: 'Ustaz Ali', tags: 'zakat, #wakaf , zakat', imageUrl: 'https://x/y.jpg', status: 'Active' } })
  assert.equal(a.status, 200)
  assert.equal(a.body.author, 'Ustaz Ali')
  assert.deepEqual(a.body.tags, ['zakat', 'wakaf'], 'tags trimmed, de-duplicated, # stripped')
  assert.equal(a.body.image, 'https://x/y.jpg', 'imageUrl alias stored as image')
  assert.equal(a.body.read_time, 3, 'read time computed from content')
  assert.ok(a.body.excerpt.length > 0 && a.body.publishedAt)

  const pub = (await call('GET', 'news')).body
  assert.equal(pub[0].id, a.body.id, 'newest published first')
  assert.equal((await call('GET', `news/${a.body.slug}`)).status, 200)
  assert.equal((await call('GET', 'news?category=Artikel')).body.every((n) => n.category === 'Artikel'), true)

  await call('PUT', `admin/news/${a.body.id}`, { admin: true, body: { status: 'Inactive' } })
  assert.ok(!(await call('GET', 'news')).body.some((n) => n.id === a.body.id))
  assert.equal((await call('GET', `news/${a.body.slug}`)).status, 404)
  const admin = (await call('GET', 'admin/news', { admin: true })).body.items
  assert.ok(admin.some((n) => n.id === a.body.id && n.status === 'Inactive'))

  // legacy document written by the old admin: status 'Published', no author/tags/publishedAt
  stores.get('news').push({ id: 'legacy-1', slug: 'legacy-1', title: 'Warisan', status: 'Published', category: 'Berita', createdAt: '2026-01-02T00:00:00.000Z', content: 'x' })
  const legacy = (await call('GET', 'news')).body.find((n) => n.id === 'legacy-1')
  assert.ok(legacy, 'legacy Published article is shown')
  assert.equal(legacy.status, 'Active'); assert.equal(legacy.author, 'Admin'); assert.deepEqual(legacy.tags, [])
  stores.get('news').push({ id: 'legacy-2', slug: 'legacy-2', title: 'Draf lama', status: 'Draft' })
  assert.ok(!(await call('GET', 'news')).body.some((n) => n.id === 'legacy-2'))

  await call('DELETE', `admin/news/${a.body.id}`, { admin: true })
})

test('Slider: per-slide status/schedule are honoured publicly; admin sees all; persisted', async () => {
  useDb()
  const prog = (await call('POST', 'admin/campaigns', { admin: true, body: { title: 'Untuk Slider', status: 'Active' } })).body
  const save = await call('POST', 'admin/home-settings', { admin: true, body: {
    duration_ms: 4000,
    slides: [
      { id: 's-ok', type: 'banner', title: 'Tampil', image: 'a.jpg', status: 'Active' },
      { id: 's-off', type: 'banner', title: 'Disembunyikan', image: 'b.jpg', status: 'Inactive' },
      { id: 's-later', type: 'banner', title: 'Terjadwal', image: 'c.jpg', status: 'Active', publishedAt: future() },
      { id: 's-prog', type: 'campaign', title: 'Program', slug: prog.slug, image: 'd.jpg', link: `/donasi/${prog.slug}`, status: 'Active' },
    ] } })
  assert.equal(save.status, 200)
  let pub = (await call('GET', 'home-settings')).body
  assert.deepEqual(pub.slides.map((s) => s.id).sort(), ['s-ok', 's-prog'])
  assert.equal(pub.duration_ms, 4000)
  const adm = (await call('GET', 'admin/home-settings', { admin: true })).body
  assert.equal(adm.slides.length, 4, 'admin sees hidden + scheduled slides too')

  // hiding the program also hides the slide that points at it (no dead links on the hero)
  await call('PUT', `admin/campaigns/${prog.id}`, { admin: true, body: { status: 'Inactive' } })
  pub = (await call('GET', 'home-settings')).body
  assert.deepEqual(pub.slides.map((s) => s.id), ['s-ok'])
  await call('DELETE', `admin/campaigns/${prog.id}`, { admin: true })
})

test('Seeding happens once: deleting everything does not bring demo content back', async () => {
  useDb()
  for (const n of (await call('GET', 'admin/news', { admin: true })).body.items) await call('DELETE', `admin/news/${n.id}`, { admin: true })
  assert.equal((await call('GET', 'news')).body.length, 0)
  const reseeded = await cms.ensureCmsSeed(new FakeDb(), { programs: () => [], articles: () => [{ id: 'z', slug: 'z', title: 'z' }], slides: () => [] })
  assert.equal(reseeded, false, 'marker prevents re-seeding')
  assert.equal((await call('GET', 'news')).body.length, 0)
})

test('Public lists never leak non-Active items (property check over many states)', async () => {
  useDb()
  const made = []
  for (const status of ['Active', 'Inactive', 'Draft']) {
    for (const when of [past(), future(), null]) {
      const r = await call('POST', 'admin/campaigns', { admin: true, body: { title: `P ${status} ${when}`, status, publishedAt: when } })
      made.push(r.body)
    }
  }
  const pubIds = new Set((await call('GET', 'campaigns')).body.map((x) => x.id))
  for (const m of made) {
    const live = m.status === 'Active' && (!m.publishedAt || m.publishedAt <= new Date().toISOString())
    assert.equal(pubIds.has(m.id), live, `${m.title} -> expected live=${live}`)
  }
  for (const m of made) await call('DELETE', `admin/campaigns/${m.id}`, { admin: true })
})
