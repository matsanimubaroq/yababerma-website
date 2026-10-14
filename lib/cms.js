// Shared content-management logic for Program (campaigns), Artikel (news) and Slider (home settings).
//
// The API route is the only consumer. Everything here takes a MongoDB `db` (or null when the database
// is not configured) so the public site and the admin panel read through the *same* functions and can
// never drift apart.
//
// This project is plain JavaScript (no Prisma/Mongoose/TypeScript): the "schema" lives in the zod
// validators below, which also give runtime type safety for every write.
//
// Stored dates are always ISO-8601 strings so they sort and compare consistently.
//
// Program  : status, publishedAt, target_amount (API alias targetAmount), collected_amount (collectedAmount),
//            deadline (endDate) + the pre-existing fields (title, slug, category, story, gallery, ...).
// Artikel  : status, publishedAt, author, category, tags[] + title, slug, excerpt, content, image, read_time.
// Slider   : each slide has status, publishedAt; slides live in settings/{id:'home_settings'}.slides.

import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

export const STATUSES = ['Active', 'Inactive', 'Draft']
const LEGACY_STATUS = { Published: 'Active', Publish: 'Active', Hidden: 'Inactive' }

const KINDS = {
  program: { collection: 'campaigns', normalize: normalizeProgram },
  article: { collection: 'news', normalize: normalizeArticle },
}

export class CmsError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.name = 'CmsError'
    this.status = status
    this.fields = fields
  }
}

// ---------------- small helpers ----------------
const clean = (doc) => { if (!doc) return doc; const { _id, ...rest } = doc; return rest }
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const nowISO = () => new Date().toISOString()

export function toISO(v) {
  if (v === null || v === undefined || v === '') return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

// ---------------- status / visibility ----------------
/** Canonical status of any CMS document. Understands the legacy `published` flag and 'Published'. */
export function resolveStatus(d) {
  const s = LEGACY_STATUS[d?.status] || d?.status
  if (STATUSES.includes(s)) return s
  if (d?.published === false) return 'Draft'
  return 'Active'
}

/** A document is shown on the public site only when Active and its publishedAt is not in the future. */
export function isLive(item, now = Date.now()) {
  if (resolveStatus(item) !== 'Active') return false
  const t = item.publishedAt ? new Date(item.publishedAt).getTime() : NaN
  return Number.isNaN(t) || t <= now
}

// ---------------- normalizers (DB doc -> API shape) ----------------
export function normalizeProgram(d) {
  const c = clean(d)
  const target = num(c.target_amount ?? c.targetAmount)
  const collected = num(c.collected_amount ?? c.collectedAmount)
  const end = toISO(c.deadline ?? c.endDate)
  const status = resolveStatus(c)
  return {
    ...c,
    status,
    // Legacy active docs without publishedAt fall back to their creation date; drafts stay unscheduled.
    publishedAt: toISO(c.publishedAt) || (status === 'Active' ? toISO(c.created_at) : null),
    target_amount: target, collected_amount: collected, deadline: end,
    targetAmount: target, collectedAmount: collected, endDate: end,
  }
}

export function normalizeArticle(d) {
  const c = clean(d)
  const status = resolveStatus(c)
  const publishedAt = toISO(c.publishedAt) || (status === 'Active' ? (toISO(c.date) || toISO(c.createdAt)) : null)
  return {
    ...c,
    status,
    publishedAt,
    date: publishedAt,
    createdAt: toISO(c.createdAt) || toISO(c.date) || publishedAt,
    author: c.author || 'Admin',
    category: c.category || 'Berita',
    tags: Array.isArray(c.tags) ? c.tags : [],
    image: c.image || c.imageUrl || '',
    excerpt: c.excerpt || '',
    content: c.content || '',
  }
}

export function normalizeSlide(s) {
  return {
    id: s.id || uuidv4(),
    type: s.type === 'banner' ? 'banner' : 'campaign',
    image: String(s.image || ''), title: String(s.title || ''), subtitle: String(s.subtitle || ''),
    badge: String(s.badge || ''), link: String(s.link || ''), slug: String(s.slug || ''),
    status: resolveStatus(s),
    publishedAt: toISO(s.publishedAt),
  }
}

const byNewest = (a, b) => (new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())

// ---------------- validation (zod) ----------------
const statusField = z.enum(STATUSES, { errorMap: () => ({ message: 'Status harus Active, Inactive, atau Draft' }) })

// '' / null / undefined clear the date; anything else must be a valid date.
const dateField = z.any().transform((v, ctx) => {
  if (v === '' || v === null || v === undefined) return null
  const iso = toISO(v)
  if (!iso) { ctx.addIssue({ code: 'custom', message: 'Tanggal tidak valid' }); return z.NEVER }
  return iso
})

const moneyField = z.preprocess((v) => (v === '' || v === null || v === undefined ? 0 : v),
  z.coerce.number({ invalid_type_error: 'Harus berupa angka' }).finite('Harus berupa angka').min(0, 'Tidak boleh negatif'))

const toLines = (v) => (Array.isArray(v) ? v : String(v || '').split('\n')).map((x) => String(x).trim()).filter(Boolean)
const toTags = (v) => {
  const arr = Array.isArray(v) ? v : String(v || '').split(',')
  return [...new Set(arr.map((x) => String(x).trim().replace(/^#/, '')).filter(Boolean))].slice(0, 20)
}

const text = (max, label) => z.string({ required_error: `${label} wajib diisi`, invalid_type_error: `${label} harus berupa teks` }).trim().max(max, `${label} maksimal ${max} karakter`)

const programShape = {
  title: text(200, 'Nama program').min(1, 'Nama program wajib diisi'),
  category: text(40, 'Jenis program').min(1, 'Jenis program wajib diisi'),
  short_desc: text(500, 'Deskripsi singkat'),
  image: text(2000, 'Foto sampul'),
  video_url: text(500, 'Link video'),
  story: z.union([z.array(z.string()), z.string()]).transform(toLines),
  gallery: z.array(z.string()).transform((a) => a.filter(Boolean)),
  updates: z.array(z.object({}).passthrough()),
  reports: z.array(z.object({}).passthrough()),
  target_amount: moneyField,
  collected_amount: moneyField,
  donor_count: moneyField.transform((n) => Math.round(n)),
  deadline: dateField,
  featured: z.boolean({ invalid_type_error: 'Harus berupa true/false' }),
  status: statusField,
  publishedAt: dateField,
}
const programUpdateSchema = z.object(programShape).partial()

const articleShape = {
  title: text(200, 'Judul').min(1, 'Judul wajib diisi'),
  excerpt: text(400, 'Ringkasan'),
  content: text(100000, 'Konten'),
  image: text(2000, 'Gambar'),
  category: text(40, 'Kategori').min(1, 'Kategori wajib diisi'),
  author: text(80, 'Penulis').min(1, 'Penulis wajib diisi'),
  tags: z.union([z.array(z.string()), z.string()]).transform(toTags),
  read_time: moneyField.transform((n) => Math.max(1, Math.round(n))),
  status: statusField,
  publishedAt: dateField,
}
const articleUpdateSchema = z.object(articleShape).partial()

const slideShape = z.object({
  id: z.string().optional(),
  type: z.enum(['campaign', 'banner'], { errorMap: () => ({ message: 'Tipe slide tidak valid' }) }).default('campaign'),
  image: text(2000, 'Gambar slide').default(''),
  title: text(200, 'Judul slide').default(''),
  subtitle: text(400, 'Subjudul slide').default(''),
  badge: text(40, 'Label slide').default(''),
  link: text(500, 'Tautan slide').default(''),
  slug: text(120, 'Slug slide').default(''),
  status: statusField.default('Active'),
  publishedAt: dateField.default(null),
})
const homeSettingsSchema = z.object({
  slides: z.array(slideShape).max(20, 'Maksimal 20 slide'),
  duration_ms: z.coerce.number().min(1000, 'Durasi minimal 1 detik').max(60000, 'Durasi maksimal 60 detik').optional(),
})

const ALIASES = {
  program: { targetAmount: 'target_amount', collectedAmount: 'collected_amount', endDate: 'deadline', imageUrl: 'image' },
  article: { imageUrl: 'image' },
}

function parseBody(schema, body, aliases) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new CmsError(400, 'Data yang dikirim tidak valid.')
  const src = { ...body }
  for (const [alias, key] of Object.entries(aliases || {})) {
    if (alias in src) { if (!(key in src)) src[key] = src[alias]; delete src[alias] }
  }
  const r = schema.safeParse(src)
  if (!r.success) {
    const fields = {}
    for (const i of r.error.issues) fields[i.path.join('.') || '_'] ||= i.message
    const first = r.error.issues[0]
    const where = first.path.length ? `${first.path.join('.')}: ` : ''
    throw new CmsError(400, `${where}${first.message}`, fields)
  }
  return r.data
}

// ---------------- reads ----------------
async function loadAll(db, kind, seeds) {
  const k = KINDS[kind]
  const raw = db ? await db.collection(k.collection).find({}).limit(1000).toArray() : seeds()
  return raw.map(k.normalize).sort(byNewest)
}

/** Everything (drafts and hidden included) – for the admin panel. */
export const listAll = (db, kind, seeds) => loadAll(db, kind, seeds)

/** Only what visitors may see: Active and already published. */
export async function listLive(db, kind, seeds, { now = Date.now() } = {}) {
  return (await loadAll(db, kind, seeds)).filter((x) => isLive(x, now))
}

export async function getById(db, kind, id, seeds) {
  const k = KINDS[kind]
  const raw = db ? await db.collection(k.collection).findOne({ id }) : seeds().find((x) => x.id === id)
  return raw ? k.normalize(raw) : null
}

export async function getLiveBySlug(db, kind, slug, seeds) {
  const k = KINDS[kind]
  const raw = db ? await db.collection(k.collection).findOne({ slug }) : seeds().find((x) => x.slug === slug)
  if (!raw) return null
  const item = k.normalize(raw)
  return isLive(item) ? item : null
}

async function uniqueSlug(db, collection, title, fallbackPrefix) {
  const base = slugify(title) || `${fallbackPrefix}-${Date.now()}`
  let slug = base, n = 1
  while (await db.collection(collection).findOne({ slug })) slug = `${base}-${++n}`
  return slug
}

// ---------------- writes: Program ----------------
export async function createProgram(db, body) {
  const data = parseBody(programUpdateSchema.required({ title: true }), body, ALIASES.program)
  const status = data.status || 'Draft'
  const doc = {
    category: 'sedekah', short_desc: '', image: '', video_url: '', story: [], gallery: [], updates: [], reports: [],
    target_amount: 0, collected_amount: 0, donor_count: 0, deadline: null, featured: false,
    ...data,
    id: uuidv4(),
    slug: await uniqueSlug(db, 'campaigns', data.title, 'program'),
    status,
    publishedAt: data.publishedAt ?? (status === 'Active' ? nowISO() : null),
    created_at: nowISO(),
  }
  await db.collection('campaigns').insertOne({ ...doc })
  return normalizeProgram(doc)
}

export async function updateProgram(db, id, body) {
  const existing = await db.collection('campaigns').findOne({ id })
  if (!existing) throw new CmsError(404, 'Program tidak ditemukan')
  const data = parseBody(programUpdateSchema, body, ALIASES.program)
  const prev = normalizeProgram(existing)
  const update = { ...data, updated_at: nowISO() }
  // Switching to Active without any publish date publishes it now.
  if (resolveStatus({ ...prev, ...data }) === 'Active' && !('publishedAt' in data) && !existing.publishedAt) update.publishedAt = nowISO()
  await db.collection('campaigns').updateOne({ id }, { $set: update })
  return normalizeProgram(await db.collection('campaigns').findOne({ id }))
}

// ---------------- writes: Artikel ----------------
const autoExcerpt = (content) => String(content || '').replace(/\s+/g, ' ').trim().slice(0, 160)
const readTime = (content) => Math.max(1, Math.ceil(String(content || '').trim().split(/\s+/).filter(Boolean).length / 200))

export async function createArticle(db, body) {
  const data = parseBody(articleUpdateSchema.required({ title: true }), body, ALIASES.article)
  const status = data.status || 'Draft'
  const publishedAt = data.publishedAt ?? (status === 'Active' ? nowISO() : null)
  const doc = {
    image: '', content: '', category: 'Berita', author: 'Admin', tags: [],
    ...data,
    id: uuidv4(),
    slug: await uniqueSlug(db, 'news', data.title, 'news'),
    excerpt: data.excerpt || autoExcerpt(data.content),
    read_time: data.read_time ?? readTime(data.content),
    status, publishedAt,
    createdAt: nowISO(), updatedAt: nowISO(),
  }
  await db.collection('news').insertOne({ ...doc })
  return normalizeArticle(doc)
}

export async function updateArticle(db, id, body) {
  const existing = await db.collection('news').findOne({ id })
  if (!existing) throw new CmsError(404, 'Berita tidak ditemukan')
  const data = parseBody(articleUpdateSchema, body, ALIASES.article)
  const prev = normalizeArticle(existing)
  const update = { ...data, updatedAt: nowISO() }
  if ('content' in data && !('read_time' in data)) update.read_time = readTime(data.content)
  if (resolveStatus({ ...prev, ...data }) === 'Active' && !('publishedAt' in data) && !existing.publishedAt) update.publishedAt = nowISO()
  // The legacy `date` mirror follows publishedAt so old readers stay consistent.
  const effectivePublished = 'publishedAt' in update ? update.publishedAt : prev.publishedAt
  update.date = effectivePublished
  await db.collection('news').updateOne({ id }, { $set: update })
  return normalizeArticle(await db.collection('news').findOne({ id }))
}

export async function deleteItem(db, kind, id) {
  const r = await db.collection(KINDS[kind].collection).deleteOne({ id })
  return { ok: true, deleted: r.deletedCount || 0 }
}

// ---------------- Slider ----------------
const HOME_ID = 'home_settings'
const DEFAULT_DURATION = 6000

/** Admin view: every slide, including hidden/scheduled ones. */
export async function getHomeSettings(db, seedSlides) {
  const doc = db ? await db.collection('settings').findOne({ id: HOME_ID }) : null
  const slides = Array.isArray(doc?.slides) ? doc.slides : (db ? [] : seedSlides())
  const d = Number(doc?.duration_ms)
  return { slides: slides.map(normalizeSlide), duration_ms: d > 0 ? d : DEFAULT_DURATION }
}

/** Public view: Active + published slides whose target program (if any) is still visible. */
export async function getPublicHomeSettings(db, seedSlides, seedPrograms) {
  const settings = await getHomeSettings(db, seedSlides)
  const liveSlugs = new Set((await listLive(db, 'program', seedPrograms)).map((p) => p.slug))
  const slides = settings.slides.filter((s) => isLive(s) && (s.type !== 'campaign' || !s.slug || liveSlugs.has(s.slug)))
  return { slides, duration_ms: settings.duration_ms }
}

export async function saveHomeSettings(db, body) {
  const data = parseBody(homeSettingsSchema, body)
  const slides = data.slides.map((s) => normalizeSlide({ ...s, publishedAt: s.publishedAt ?? (s.status === 'Active' ? nowISO() : null) }))
  const duration_ms = data.duration_ms ?? DEFAULT_DURATION
  await db.collection('settings').updateOne({ id: HOME_ID }, { $set: { id: HOME_ID, slides, duration_ms, updated_at: nowISO() } }, { upsert: true })
  return { ok: true, slides, duration_ms }
}

// ---------------- one-time seeding ----------------
/**
 * Seeds starter content exactly once per database (tracked by a marker document), so content that an
 * admin deletes does not reappear on the next cold start. A collection that already has data is left alone.
 */
export async function ensureCmsSeed(db, { programs, articles, slides }) {
  const marker = await db.collection('settings').findOne({ id: 'cms_seeded' })
  if (marker) return false
  if (await db.collection('campaigns').countDocuments() === 0) await db.collection('campaigns').insertMany(programs())
  if (await db.collection('news').countDocuments() === 0) await db.collection('news').insertMany(articles())
  if (!(await db.collection('settings').findOne({ id: HOME_ID }))) {
    await db.collection('settings').updateOne({ id: HOME_ID }, { $set: { id: HOME_ID, slides: slides(), duration_ms: DEFAULT_DURATION, updated_at: nowISO() } }, { upsert: true })
  }
  await db.collection('settings').updateOne({ id: 'cms_seeded' }, { $set: { id: 'cms_seeded', at: nowISO() } }, { upsert: true })
  return true
}
