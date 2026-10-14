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
// Artikel  : status, publishedAt, author_id (+ author name copy), category, tags[], image + image_caption,
//            gallery[{url, caption}] + title, slug, excerpt, content, read_time.
// Slider   : each slide has status, publishedAt; slides live in settings/{id:'home_settings'}.slides.
// Testimoni, Komunitas, Partner, Penulis: simple "entries" with status + manual `order` (see ENTRY KINDS).

import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { PARTNER_TYPES, PARTNER_TYPE_LABEL, authorDisplayName } from './content-types.js'

export const STATUSES = ['Active', 'Inactive', 'Draft']
const LEGACY_STATUS = { Published: 'Active', Publish: 'Active', Hidden: 'Inactive' }

// `sort: 'order'` kinds are arranged manually in the admin panel; the others are newest first.
const KINDS = {
  program: { collection: 'campaigns', normalize: normalizeProgram },
  article: { collection: 'news', normalize: normalizeArticle },
  testimonial: { collection: 'testimonials', normalize: normalizeTestimonial, sort: 'order' },
  community: { collection: 'communities', normalize: normalizeCommunity, sort: 'order' },
  partner: { collection: 'partners', normalize: normalizePartner, sort: 'order' },
  author: { collection: 'authors', normalize: normalizeAuthor, sort: 'order' },
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
    image_caption: c.image_caption || '',
    gallery: Array.isArray(c.gallery) ? c.gallery.filter((g) => g && g.url) : [],
    author_id: c.author_id || '',
    excerpt: c.excerpt || '',
    content: c.content || '',
  }
}

const ORDER_LAST = 1e9
function normalizeEntry(d) {
  const c = clean(d)
  const order = c.order === null || c.order === undefined || c.order === '' ? ORDER_LAST : num(c.order)
  return { ...c, status: resolveStatus(c), order }
}

export function normalizeTestimonial(d) {
  const e = normalizeEntry(d)
  return { ...e, name: e.name || '', role: e.role || '', quote: e.quote || '', avatar: e.avatar || '' }
}

export function normalizeCommunity(d) {
  const e = normalizeEntry(d)
  const rating = Math.min(5, Math.max(1, Math.round(num(e.rating) || 1)))
  return { ...e, name: e.name || '', logo: e.logo || '', instagram: e.instagram || '', rating, description: e.description || '', program_slug: e.program_slug || '' }
}

export function normalizePartner(d) {
  const e = normalizeEntry(d)
  const type = PARTNER_TYPE_LABEL[e.type] ? e.type : 'kebaikan'
  return { ...e, name: e.name || '', logo: e.logo || '', url: e.url || '', type, type_label: PARTNER_TYPE_LABEL[type] }
}

export function normalizeAuthor(d) {
  const e = normalizeEntry(d)
  const author = {
    ...e, name: e.name || '', degree: e.degree || '', photo: e.photo || '', bio: e.bio || '', education: e.education || '',
    role: e.role || '', instagram: e.instagram || '', since_year: e.since_year ? num(e.since_year) : null,
    expertise: Array.isArray(e.expertise) ? e.expertise : [],
  }
  return { ...author, display_name: authorDisplayName(author) }
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
const byOrder = (a, b) => a.order - b.order // stable sort keeps insertion order for ties

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

// Links/images rendered on the public site: only http(s) URLs or site paths (blocks `javascript:` and friends).
const urlField = (label) => text(2000, label).refine((v) => v === '' || /^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v), `${label} harus berupa tautan http(s):// atau path /...`)

// Accepts a full instagram.com URL, "@handle" or "handle"; stores a full https URL.
const instagramField = z.string({ invalid_type_error: 'Link Instagram harus berupa teks' }).trim().max(300).transform((v, ctx) => {
  if (!v) return ''
  const handle = v.match(/^@?([A-Za-z0-9._]{1,30})$/)
  if (handle) return `https://instagram.com/${handle[1]}`
  let u
  try { u = new URL(v) } catch { u = null }
  if (!u || !/^https?:$/.test(u.protocol) || !/(^|\.)instagram\.com$/i.test(u.hostname)) {
    ctx.addIssue({ code: 'custom', message: 'Link Instagram harus berupa @username atau tautan instagram.com' })
    return z.NEVER
  }
  return u.toString()
})

const yearField = z.any().transform((v, ctx) => {
  if (v === '' || v === null || v === undefined) return null
  const n = Number(v)
  const max = new Date().getFullYear()
  if (!Number.isInteger(n) || n < 1950 || n > max) {
    ctx.addIssue({ code: 'custom', message: `Tahun mulai menulis harus antara 1950 dan ${max}` })
    return z.NEVER
  }
  return n
})

const orderField = z.coerce.number({ invalid_type_error: 'Urutan harus berupa angka' }).int('Urutan harus bilangan bulat').min(0).max(1e6)

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
  image: urlField('Gambar'),
  image_caption: text(300, 'Caption foto sampul'),
  gallery: z.array(z.object({
    url: urlField('Foto galeri').refine((v) => v.length > 0, 'Foto galeri wajib diisi'),
    caption: text(300, 'Caption foto').default(''),
  }), { invalid_type_error: 'Galeri harus berupa daftar foto' }).max(20, 'Maksimal 20 foto galeri'),
  category: text(40, 'Kategori').min(1, 'Kategori wajib diisi'),
  author: text(80, 'Penulis').min(1, 'Penulis wajib diisi'),
  author_id: text(64, 'Penulis'),
  tags: z.union([z.array(z.string()), z.string()]).transform(toTags),
  read_time: moneyField.transform((n) => Math.max(1, Math.round(n))),
  status: statusField,
  publishedAt: dateField,
}
const articleUpdateSchema = z.object(articleShape).partial()

// ---- entry kinds (manual order, status) ----
const ENTRY_SCHEMAS = {
  testimonial: {
    shape: {
      name: text(80, 'Nama').min(1, 'Nama wajib diisi'),
      role: text(80, 'Peran'),
      quote: text(600, 'Testimoni').min(1, 'Testimoni wajib diisi'),
      avatar: urlField('Foto'),
    },
    required: { name: true, quote: true },
    defaults: { role: '', avatar: '' },
  },
  community: {
    shape: {
      name: text(120, 'Nama komunitas').min(1, 'Nama komunitas wajib diisi'),
      logo: urlField('Logo'),
      instagram: instagramField,
      rating: z.coerce.number({ invalid_type_error: 'Peringkat harus berupa angka' }).int('Peringkat harus bilangan bulat').min(1, 'Peringkat minimal 1 bintang').max(5, 'Peringkat maksimal 5 bintang'),
      description: text(300, 'Deskripsi'),
      program_slug: text(120, 'Program terkait'),
    },
    required: { name: true },
    defaults: { logo: '', instagram: '', rating: 3, description: '', program_slug: '' },
  },
  partner: {
    shape: {
      name: text(120, 'Nama partner').min(1, 'Nama partner wajib diisi'),
      logo: urlField('Logo'),
      type: z.enum(PARTNER_TYPES.map(([v]) => v), { errorMap: () => ({ message: 'Tipe partner harus Media Partner, Partner Kebaikan, atau Community Partner' }) }),
      url: urlField('Website partner'),
    },
    required: { name: true },
    defaults: { logo: '', type: 'kebaikan', url: '' },
  },
  author: {
    shape: {
      name: text(120, 'Nama penulis').min(1, 'Nama penulis wajib diisi'),
      degree: text(60, 'Gelar'),
      photo: urlField('Foto'),
      bio: text(3000, 'Latar belakang'),
      since_year: yearField,
      education: text(300, 'Pendidikan'),
      expertise: z.union([z.array(z.string()), z.string()]).transform(toTags),
      role: text(80, 'Peran'),
      instagram: instagramField,
    },
    required: { name: true },
    defaults: { degree: '', photo: '', bio: '', since_year: null, education: '', expertise: [], role: '', instagram: '' },
    slugFrom: 'name',
  },
}
for (const s of Object.values(ENTRY_SCHEMAS)) {
  s.update = z.object({ ...s.shape, status: statusField, order: orderField }).partial()
  s.create = s.update.required(s.required)
}

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
  return raw.map(k.normalize).sort(k.sort === 'order' ? byOrder : byNewest)
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

// A chosen author_id must exist; the article keeps a copy of the display name for old readers.
async function applyAuthor(db, data) {
  if (!data.author_id) return
  const a = await db.collection('authors').findOne({ id: data.author_id })
  if (!a) throw new CmsError(400, 'author_id: Penulis tidak ditemukan', { author_id: 'Penulis tidak ditemukan' })
  data.author = authorDisplayName(a)
}

export async function createArticle(db, body) {
  const data = parseBody(articleUpdateSchema.required({ title: true }), body, ALIASES.article)
  await applyAuthor(db, data)
  const status = data.status || 'Draft'
  const publishedAt = data.publishedAt ?? (status === 'Active' ? nowISO() : null)
  const doc = {
    image: '', image_caption: '', gallery: [], content: '', category: 'Berita', author: 'Admin', author_id: '', tags: [],
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
  await applyAuthor(db, data)
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
  if (kind === 'author') {
    const used = await db.collection('news').countDocuments({ author_id: id })
    if (used > 0) throw new CmsError(409, `Penulis ini masih dipakai oleh ${used} artikel. Nonaktifkan penulis atau pindahkan artikelnya ke penulis lain dulu.`)
  }
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

// ---------------- entries: Testimoni, Komunitas, Partner, Penulis ----------------
async function nextOrder(db, collection) {
  const all = await db.collection(collection).find({}).limit(1000).toArray()
  return all.reduce((m, d) => (Number.isFinite(Number(d.order)) && d.order !== null ? Math.max(m, Number(d.order) + 1) : m), all.length)
}

export async function createEntry(db, kind, body) {
  const k = KINDS[kind], s = ENTRY_SCHEMAS[kind]
  const data = parseBody(s.create, body)
  const doc = {
    ...s.defaults, ...data,
    id: uuidv4(),
    status: data.status || 'Active',
    order: data.order ?? await nextOrder(db, k.collection),
    created_at: nowISO(), updated_at: nowISO(),
  }
  if (s.slugFrom) doc.slug = await uniqueSlug(db, k.collection, data[s.slugFrom], kind)
  await db.collection(k.collection).insertOne({ ...doc })
  return k.normalize(doc)
}

/** Partial update; a slug, once created, never changes so shared links keep working. */
export async function updateEntry(db, kind, id, body) {
  const k = KINDS[kind], s = ENTRY_SCHEMAS[kind]
  const existing = await db.collection(k.collection).findOne({ id })
  if (!existing) throw new CmsError(404, 'Data tidak ditemukan')
  const data = parseBody(s.update, body)
  await db.collection(k.collection).updateOne({ id }, { $set: { ...data, updated_at: nowISO() } })
  const saved = await db.collection(k.collection).findOne({ id })
  // Keep the author-name copy on articles in step with a renamed author.
  if (kind === 'author' && ('name' in data || 'degree' in data)) {
    const articles = await db.collection('news').find({ author_id: id }).limit(1000).toArray()
    for (const a of articles) await db.collection('news').updateOne({ id: a.id }, { $set: { author: authorDisplayName(saved) } })
  }
  return k.normalize(saved)
}

/** Saves the admin's drag order: ids[0] becomes order 0, and so on. */
export async function reorderEntries(db, kind, body) {
  const ids = body?.ids
  if (!Array.isArray(ids) || ids.length > 1000 || !ids.every((x) => typeof x === 'string')) throw new CmsError(400, 'Urutan tidak valid.')
  const col = db.collection(KINDS[kind].collection)
  for (let i = 0; i < ids.length; i++) await col.updateOne({ id: ids[i] }, { $set: { order: i } })
  return { ok: true }
}

// ---------------- authors on articles ----------------
const authorCard = (a) => ({ id: a.id, slug: a.slug, name: a.name, display_name: a.display_name, photo: a.photo, role: a.role, since_year: a.since_year, bio: a.bio })

/**
 * Resolves each article's author from the authors collection (by author_id, falling back to a name match for
 * older articles): the shown name follows the author's current profile, and `author_profile` is set when the
 * author is Active so the site can link to /penulis/[slug].
 */
export async function attachAuthors(db, articles, seedAuthors) {
  const authors = await listAll(db, 'author', seedAuthors)
  const byId = new Map(authors.map((a) => [a.id, a]))
  const byName = new Map(authors.flatMap((a) => [[a.name.toLowerCase(), a], [a.display_name.toLowerCase(), a]]).filter(([k]) => k))
  return articles.map((art) => {
    const a = byId.get(art.author_id) || byName.get(String(art.author || '').toLowerCase())
    if (!a) return { ...art, author_profile: null }
    return { ...art, author: a.display_name, author_profile: a.status === 'Active' ? authorCard(a) : null }
  })
}

/** Public author page: an Active author plus their published articles. */
export async function getAuthorProfile(db, slug, { seedAuthors, seedArticles }) {
  const author = await getLiveBySlug(db, 'author', slug, seedAuthors)
  if (!author) return null
  const articles = (await attachAuthors(db, await listLive(db, 'article', seedArticles), seedAuthors))
    .filter((a) => a.author_profile?.id === author.id)
    .map(({ id, slug: s, title, excerpt, image, category, publishedAt, read_time }) => ({ id, slug: s, title, excerpt, image, category, publishedAt, read_time }))
  return { ...author, articles }
}

/** Adds the related program's title to communities, only when that program is publicly visible. */
export async function withProgramTitles(db, items, seedPrograms) {
  const live = new Map((await listLive(db, 'program', seedPrograms)).map((p) => [p.slug, p.title]))
  return items.map((c) => ({ ...c, program_title: live.get(c.program_slug) || '', program_slug: live.has(c.program_slug) ? c.program_slug : '' }))
}

// ---------------- per-kind one-time seeding & migrations ----------------
/** Runs `fn` once per database, tracked by a marker document in `settings`. */
export async function runOnce(db, key, fn) {
  const id = `once:${key}`
  if (await db.collection('settings').findOne({ id })) return false
  await fn()
  await db.collection('settings').updateOne({ id }, { $set: { id, at: nowISO() } }, { upsert: true })
  return true
}

/**
 * Seeds each entry kind once. A collection that already has data is left as is, but its documents get a
 * stable `order` so the admin can rearrange them.
 */
export async function ensureEntrySeeds(db, seeds) {
  for (const [kind, seed] of Object.entries(seeds)) {
    await runOnce(db, `seed:${kind}`, async () => {
      const col = db.collection(KINDS[kind].collection)
      const existing = await col.find({}).limit(1000).toArray()
      if (existing.length === 0) {
        const docs = seed()
        if (docs.length) await col.insertMany(docs)
        return
      }
      for (let i = 0; i < existing.length; i++) {
        if (existing[i].order === undefined || existing[i].order === null) await col.updateOne({ id: existing[i].id }, { $set: { order: i } })
      }
    })
  }
}

/** Gives articles written under one of `names` (and without an author_id) to the author with `authorSlug`. */
export async function assignArticlesToAuthor(db, names, authorSlug) {
  const author = await db.collection('authors').findOne({ slug: authorSlug })
  if (!author) return 0
  const wanted = new Set(names.map((n) => n.toLowerCase()))
  const articles = await db.collection('news').find({}).limit(1000).toArray()
  let n = 0
  for (const a of articles) {
    if (a.author_id || !wanted.has(String(a.author || '').toLowerCase())) continue
    await db.collection('news').updateOne({ id: a.id }, { $set: { author_id: author.id, author: authorDisplayName(author) } })
    n++
  }
  return n
}
