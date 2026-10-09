import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ---------------- MongoDB ----------------
let dbPromise

// Returns a Db instance, or null when MONGO_URL is missing/placeholder/unreachable.
// Never throws: the site must keep serving seed data even without a database.
async function connectToMongo() {
  const uri = String(process.env.MONGO_URL || '').trim()
  if (!uri || uri.includes('cluster0.abcde.mongodb.net') || !/^mongodb(\+srv)?:\/\//.test(uri)) {
    if (uri) console.error('MONGO_URL tidak valid, berjalan tanpa database')
    return null
  }
  if (!dbPromise) {
    try {
      const mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
      dbPromise = mongoClient.connect().then(async (c) => {
        const database = c.db(process.env.DB_NAME || 'yababerma')
        try { await ensureSeed(database) } catch (e) { console.error('Seed error:', e) }
        return database
      }).catch((e) => { console.error('Mongo connect error:', e?.message || e); dbPromise = undefined; return null })
    } catch (e) {
      console.error('Mongo init error:', e?.message || e)
      dbPromise = undefined
      return null
    }
  }
  return dbPromise
}

const NO_DB_MESSAGE = 'Database belum dikonfigurasi di server (MONGO_URL). Hubungi administrator.'
const noDbResponse = () => handleCORS(NextResponse.json({ error: NO_DB_MESSAGE, db_missing: true }, { status: 503 }))

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

const clean = (doc) => { if (!doc) return doc; const { _id, ...rest } = doc; return rest }
const cleanArr = (arr) => arr.map(clean)

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

// ---------------- Email (Resend) ----------------
const ORG_LOGO = 'https://customer-assets-m6fa6gv7.emergentagent.net/job_8686a8aa-42c1-46ab-92c8-1ae6eb1872e2/artifacts/4k17zphv_logo%20yababerma.png'
const BANK_LABELS = { bsi: 'Bank Syariah Indonesia (BSI)', mandiri: 'Bank Mandiri', bca: 'Bank BCA', bri: 'Bank BRI', kalsel: 'Bank Kalsel' }
const rp = (n) => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID')
function escapeHtml(v = '') { return String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])) }

async function sendDonationEmail(donation) {
  if (!resend || !donation.donor_email) return
  const name = escapeHtml(donation.is_anonymous ? 'Sahabat Donatur' : (donation.donor_name || 'Sahabat Donatur'))
  const program = escapeHtml(donation.campaign_title || 'Donasi Umum')
  const bank = escapeHtml(BANK_LABELS[donation.payment_method] || donation.payment_method || '-')
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1E293B">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:#00A651;padding:24px;text-align:center">
        <img src="${ORG_LOGO}" width="64" height="64" style="background:#fff;border-radius:50%;padding:6px" alt="YABABERMA"/>
        <h1 style="color:#ffffff;font-size:18px;margin:12px 0 0">Yayasan Banua Berkah Mandiri</h1>
      </div>
      <div style="padding:28px">
        <h2 style="margin:0 0 6px;font-size:20px">Terima kasih, ${name}!</h2>
        <p style="color:#475569;margin:0 0 20px;line-height:1.6">Jazaakumullahu khairan atas kebaikan Anda. Donasi Anda telah kami catat. Berikut rincian &amp; kuitansi donasi Anda.</p>
        <div style="background:#e6f7ee;border-radius:12px;padding:16px;text-align:center;margin-bottom:16px">
          <div style="font-size:12px;color:#475569">Total Transfer</div>
          <div style="font-size:26px;font-weight:800;color:#00A651">${rp(donation.total_amount)}</div>
          <div style="font-size:12px;color:#475569">termasuk kode unik <b>${donation.unique_code}</b></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#64748b">Program</td><td style="padding:8px 0;text-align:right;font-weight:600">${program}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Nominal Donasi</td><td style="padding:8px 0;text-align:right;font-weight:600">${rp(donation.amount)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Kode Unik</td><td style="padding:8px 0;text-align:right;font-weight:600">${donation.unique_code}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Bank Tujuan</td><td style="padding:8px 0;text-align:right;font-weight:600">${bank}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">No. Referensi</td><td style="padding:8px 0;text-align:right;font-weight:600">${escapeHtml(donation.id)}</td></tr>
        </table>
        <div style="background:#e6f3fb;border-radius:12px;padding:14px;margin-top:16px;font-size:13px;color:#475569">Mohon selesaikan transfer tepat hingga 3 digit terakhir (kode unik) agar donasi mudah terverifikasi. Setelah transfer, konfirmasi via WhatsApp admin: <b>0878-1810-1175</b>.</div>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;text-align:center">Semoga menjadi amal jariyah yang berkah. Aamiin.<br/>&copy; 2026 Yayasan Banua Berkah Mandiri</p>
      </div>
    </div>
  </div>
</body></html>`
  const text = `Terima kasih, ${donation.donor_name}!\nDonasi Anda untuk ${donation.campaign_title} telah dicatat.\nTotal transfer: ${rp(donation.total_amount)} (kode unik ${donation.unique_code}).\nNo. Referensi: ${donation.id}\nSemoga menjadi amal jariyah yang berkah. - Yayasan Banua Berkah Mandiri`
  try {
    const { data, error } = await resend.emails.send({ from: process.env.MAIL_FROM, to: [donation.donor_email], subject: 'Terima kasih atas donasi Anda \u2014 YABABERMA', html, text })
    if (error) console.error('Resend error:', error?.message || JSON.stringify(error))
    else console.log('Resend sent id:', data?.id)
  } catch (e) { console.error('Email exception:', e?.message) }
}

async function sendVerifiedEmail(donation) {
  if (!resend || !donation.donor_email) return
  const name = escapeHtml(donation.is_anonymous ? 'Sahabat Donatur' : (donation.donor_name || 'Sahabat Donatur'))
  const program = escapeHtml(donation.campaign_title || 'Donasi Umum')
  const date = new Date(donation.verified_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1E293B">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:#00A651;padding:24px;text-align:center">
        <img src="${ORG_LOGO}" width="64" height="64" style="background:#fff;border-radius:50%;padding:6px" alt="YABABERMA"/>
        <h1 style="color:#ffffff;font-size:18px;margin:12px 0 0">Yayasan Banua Berkah Mandiri</h1>
      </div>
      <div style="padding:28px">
        <div style="text-align:center;font-size:44px">&#9989;</div>
        <h2 style="margin:8px 0 6px;font-size:20px;text-align:center">Donasi Anda Telah Terverifikasi</h2>
        <p style="color:#475569;margin:0 0 20px;line-height:1.6;text-align:center">Alhamdulillah ${name}, donasi Anda telah kami terima &amp; verifikasi. Jazaakumullahu khairan atas kepercayaan &amp; kebaikannya.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#64748b">Program</td><td style="padding:8px 0;text-align:right;font-weight:600">${program}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Nominal</td><td style="padding:8px 0;text-align:right;font-weight:600">${rp(donation.amount)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Tanggal Verifikasi</td><td style="padding:8px 0;text-align:right;font-weight:600">${date}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">No. Referensi</td><td style="padding:8px 0;text-align:right;font-weight:600">${escapeHtml(donation.id)}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b">Status</td><td style="padding:8px 0;text-align:right"><span style="background:#e6f7ee;color:#00A651;padding:3px 10px;border-radius:999px;font-weight:700;font-size:12px">TERVERIFIKASI</span></td></tr>
        </table>
        <div style="background:#e6f7ee;border-radius:12px;padding:14px;margin-top:16px;font-size:13px;color:#475569;text-align:center">Insya Allah donasi Anda kami salurkan secara amanah. Anda dapat memantau &amp; mengunduh kuitansi resmi di Portal Donatur.</div>
        <p style="color:#94a3b8;font-size:12px;margin-top:20px;text-align:center">Semoga menjadi amal jariyah yang berkah. Aamiin.<br/>&copy; 2026 Yayasan Banua Berkah Mandiri</p>
      </div>
    </div>
  </div>
</body></html>`
  const text = `Alhamdulillah, donasi Anda untuk ${donation.campaign_title} sebesar ${rp(donation.amount)} telah TERVERIFIKASI pada ${date}. No. Referensi: ${donation.id}. Jazaakumullahu khairan. - Yayasan Banua Berkah Mandiri`
  try {
    const { error } = await resend.emails.send({ from: process.env.MAIL_FROM, to: [donation.donor_email], subject: 'Donasi Anda Telah Terverifikasi \u2014 YABABERMA', html, text })
    if (error) console.error('Resend(verified) error:', error?.message || JSON.stringify(error))
  } catch (e) { console.error('Email(verified) exception:', e?.message) }
}

async function sendAdminNotifyEmail(donation) {
  if (!resend || !process.env.ADMIN_EMAIL) return
  const name = escapeHtml(donation.is_anonymous ? 'Hamba Allah' : (donation.donor_name || '-'))
  const program = escapeHtml(donation.campaign_title || 'Donasi Umum')
  const bank = escapeHtml(BANK_LABELS[donation.payment_method] || donation.payment_method || '-')
  const adminUrl = (process.env.NEXT_PUBLIC_BASE_URL || '') + '/admin'
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#1E293B;padding:20px;background:#f8fafc">
    <div style="max-width:520px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:24px">
      <h2 style="color:#00A651;margin:0 0 4px">\uD83D\uDD14 Donasi Baru Masuk</h2>
      <p style="color:#475569;margin:0 0 16px">Ada donasi baru yang menunggu verifikasi.</p>
      <table style="border-collapse:collapse;font-size:14px;width:100%">
        <tr><td style="padding:7px 0;color:#64748b">Donatur</td><td style="padding:7px 0;text-align:right;font-weight:600">${name}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b">WhatsApp</td><td style="padding:7px 0;text-align:right">${escapeHtml(donation.donor_whatsapp || '-')}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b">Email</td><td style="padding:7px 0;text-align:right">${escapeHtml(donation.donor_email || '-')}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b">Program</td><td style="padding:7px 0;text-align:right;font-weight:600">${program}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b">Nominal</td><td style="padding:7px 0;text-align:right;font-weight:700;color:#00A651">${rp(donation.amount)}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b">Total Transfer</td><td style="padding:7px 0;text-align:right">${rp(donation.total_amount)} (kode ${donation.unique_code})</td></tr>
        <tr><td style="padding:7px 0;color:#64748b">Metode</td><td style="padding:7px 0;text-align:right">${bank}</td></tr>
        <tr><td style="padding:7px 0;color:#64748b">Ref</td><td style="padding:7px 0;text-align:right">${escapeHtml(donation.id)}</td></tr>
      </table>
      <p style="margin-top:18px;text-align:center"><a href="${adminUrl}" style="background:#00A651;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:600;display:inline-block">Buka Panel Admin</a></p>
    </div>
  </body></html>`
  try {
    const { error } = await resend.emails.send({ from: process.env.MAIL_FROM, to: [process.env.ADMIN_EMAIL], subject: `Donasi Baru ${rp(donation.total_amount)} \u2014 ${donation.campaign_title}`, html })
    if (error) console.error('Resend(admin) error:', error?.message || JSON.stringify(error))
  } catch (e) { console.error('Email(admin) exception:', e?.message) }
}

// ---------------- Seed data ----------------
function daysFromNow(n) { return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString() }

// Kurban options + real-time quota targets (sold_base = baseline already registered)
const KURBAN_OPTIONS = [
  { key: 'kambing', name: 'Kambing / Domba', emoji: '\uD83D\uDC10', desc: '1 ekor untuk 1 pekurban', price: 2750000, unit: 'ekor', quota: 50, sold_base: 18 },
  { key: 'sapi-patungan', name: 'Sapi Patungan', emoji: '\uD83D\uDC04', desc: '1 dari 7 bagian (1/7 sapi)', price: 2500000, unit: 'bagian', quota: 70, sold_base: 34 },
  { key: 'sapi-utuh', name: 'Sapi Utuh', emoji: '\uD83D\uDC04', desc: '1 ekor sapi (7 bagian sekaligus)', price: 17500000, unit: 'ekor', quota: 10, sold_base: 3 },
]

// Pre-aggregated historical annual reports (for the year filter on /laporan)
function seedAnnualReports() {
  return [
    {
      id: uuidv4(), year: 2024, total_collected: 890000000, total_donors: 2760, total_donations: 4180,
      by_category: [
        { category: 'zakat', amount: 280000000 }, { category: 'sedekah', amount: 250000000 },
        { category: 'wakaf', amount: 140000000 }, { category: 'kurban', amount: 120000000 },
        { category: 'bencana', amount: 60000000 }, { category: 'fidyah', amount: 40000000 },
      ],
      by_program: [
        { title: 'Panti Asuhan Banua Berkah', slug: 'operasional-panti-asuhan-banua-berkah', collected: 230000000, target: 250000000 },
        { title: 'TPQ & Beasiswa Santri', slug: 'beasiswa-santri-tpq-banua-berkah', collected: 150000000, target: 180000000 },
        { title: "Wakaf Al-Qur'an Pelosok", slug: 'wakaf-al-quran-santri-pelosok', collected: 170000000, target: 200000000 },
        { title: 'Zakat Maal Produktif', slug: 'zakat-maal-penyaluran-produktif', collected: 200000000, target: 220000000 },
        { title: 'Tanggap Bencana', slug: 'tanggap-bencana-kalimantan', collected: 90000000, target: 150000000 },
        { title: 'Kurban Peduli Banua', slug: 'kurban-peduli-banua', collected: 120000000, target: 150000000 },
      ],
    },
    {
      id: uuidv4(), year: 2025, total_collected: 1340000000, total_donors: 4120, total_donations: 6540,
      by_category: [
        { category: 'zakat', amount: 420000000 }, { category: 'sedekah', amount: 380000000 },
        { category: 'wakaf', amount: 210000000 }, { category: 'kurban', amount: 180000000 },
        { category: 'bencana', amount: 100000000 }, { category: 'fidyah', amount: 50000000 },
      ],
      by_program: [
        { title: 'Panti Asuhan Banua Berkah', slug: 'operasional-panti-asuhan-banua-berkah', collected: 310000000, target: 350000000 },
        { title: 'TPQ & Beasiswa Santri', slug: 'beasiswa-santri-tpq-banua-berkah', collected: 220000000, target: 250000000 },
        { title: "Wakaf Al-Qur'an Pelosok", slug: 'wakaf-al-quran-santri-pelosok', collected: 260000000, target: 300000000 },
        { title: 'Zakat Maal Produktif', slug: 'zakat-maal-penyaluran-produktif', collected: 300000000, target: 320000000 },
        { title: 'Tanggap Bencana', slug: 'tanggap-bencana-kalimantan', collected: 150000000, target: 200000000 },
        { title: 'Kurban Peduli Banua', slug: 'kurban-peduli-banua', collected: 100000000, target: 120000000 },
      ],
    },
  ]
}

function seedCampaigns() {
  return [
    {
      id: uuidv4(), slug: 'wakaf-al-quran-santri-pelosok',
      title: "Wakaf Al-Qur'an untuk Santri Pelosok Kalimantan", category: 'wakaf',
      short_desc: 'Hadiahkan mushaf Al-Qur\u2019an bagi santri di pelosok Kalimantan dan alirkan pahala jariyah.',
      image: 'https://images.pexels.com/photos/31528155/pexels-photo-31528155.jpeg',
      target_amount: 150000000, collected_amount: 87500000, donor_count: 342, deadline: daysFromNow(45), featured: true,
      story: [
        'Masih banyak santri di pelosok Kalimantan yang belajar mengaji tanpa memegang mushaf Al-Qur\u2019an yang layak. Sebagian harus bergantian, bahkan menyalin ayat dengan tulisan tangan.',
        'Melalui program Wakaf Al-Qur\u2019an ini, Yayasan Banua Berkah Mandiri menyalurkan mushaf berkualitas langsung ke rumah tahfizh dan TPQ terpencil. Setiap Rp150.000 setara dengan 1 mushaf Al-Qur\u2019an.',
        'Setiap huruf yang dibaca dari mushaf wakaf Anda akan menjadi pahala jariyah yang terus mengalir, insya Allah.'
      ],
      gallery: ['https://images.pexels.com/photos/31528155/pexels-photo-31528155.jpeg', 'https://images.unsplash.com/photo-1618190405497-00f284b5dda5', 'https://images.pexels.com/photos/20627702/pexels-photo-20627702.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'],
      updates: [{ date: daysFromNow(-5), title: 'Penyaluran Tahap 1', text: '250 mushaf telah tersalurkan ke 5 TPQ di Kabupaten Banjar.' }, { date: daysFromNow(-18), title: 'Program Dimulai', text: 'Penggalangan wakaf Al-Qur\u2019an resmi dibuka.' }],
    },
    {
      id: uuidv4(), slug: 'operasional-panti-asuhan-banua-berkah',
      title: 'Operasional Panti Asuhan Banua Berkah', category: 'sedekah',
      short_desc: 'Dukung kebutuhan harian, pendidikan, dan pengasuhan anak yatim & dhuafa binaan panti.',
      image: 'https://images.unsplash.com/photo-1629273229664-11fabc0becc0',
      target_amount: 200000000, collected_amount: 124000000, donor_count: 521, deadline: daysFromNow(60), featured: true,
      story: [
        'Panti Asuhan Banua Berkah saat ini mengasuh puluhan anak yatim dan dhuafa. Mereka membutuhkan makan bergizi, biaya sekolah, seragam, dan pendampingan tumbuh kembang setiap harinya.',
        'Donasi Anda akan digunakan untuk operasional dapur, kebutuhan pendidikan, dan kegiatan pembinaan karakter Islami anak-anak asuh.',
        'Mari menjadi orang tua asuh bagi mereka. Sedekah terbaik adalah yang menjaga keberlangsungan kebaikan.'
      ],
      gallery: ['https://images.unsplash.com/photo-1629273229664-11fabc0becc0', 'https://images.pexels.com/photos/34628746/pexels-photo-34628746.jpeg', 'https://images.pexels.com/photos/35105938/pexels-photo-35105938.jpeg'],
      updates: [{ date: daysFromNow(-3), title: 'Belanja Kebutuhan Bulanan', text: 'Kebutuhan pangan bulan ini telah terpenuhi berkat para donatur.' }],
    },
    {
      id: uuidv4(), slug: 'beasiswa-santri-tpq-banua-berkah',
      title: 'Beasiswa Santri TPQ Banua Berkah', category: 'sedekah',
      short_desc: 'Bantu biaya pendidikan Al-Qur\u2019an dan honor pengajar TPQ Banua Berkah.',
      image: 'https://images.pexels.com/photos/20627702/pexels-photo-20627702.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      target_amount: 100000000, collected_amount: 41000000, donor_count: 210, deadline: daysFromNow(35), featured: true,
      story: [
        'TPQ Banua Berkah membina ratusan santri belajar membaca dan menghafal Al-Qur\u2019an. Banyak dari mereka berasal dari keluarga kurang mampu.',
        'Beasiswa ini menanggung biaya belajar santri serta honor guru mengaji yang ikhlas mengabdi.',
        'Investasi terbaik adalah pada generasi Qur\u2019ani. Bantu mereka terus belajar.'
      ],
      gallery: ['https://images.pexels.com/photos/20627702/pexels-photo-20627702.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', 'https://images.pexels.com/photos/35548841/pexels-photo-35548841.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'],
      updates: [{ date: daysFromNow(-8), title: 'Wisuda Tahfizh', text: '12 santri menuntaskan hafalan Juz 30.' }],
    },
    {
      id: uuidv4(), slug: 'paket-sembako-dhuafa-banjarmasin',
      title: 'Paket Sembako Dhuafa Banjarmasin', category: 'sedekah',
      short_desc: 'Salurkan paket sembako untuk keluarga dhuafa & lansia di Banjarmasin.',
      image: 'https://images.pexels.com/photos/7345447/pexels-photo-7345447.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      target_amount: 75000000, collected_amount: 63000000, donor_count: 480, deadline: daysFromNow(20), featured: true,
      story: [
        'Kenaikan harga kebutuhan pokok memberatkan keluarga dhuafa dan lansia di Banjarmasin.',
        'Setiap Rp150.000 setara satu paket sembako berisi beras, minyak, gula, dan kebutuhan pokok lainnya.',
        'Ringankan beban saudara kita dengan sekantong keberkahan.'
      ],
      gallery: ['https://images.pexels.com/photos/7345447/pexels-photo-7345447.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', 'https://images.pexels.com/photos/7345451/pexels-photo-7345451.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', 'https://images.pexels.com/photos/6646926/pexels-photo-6646926.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'],
      updates: [{ date: daysFromNow(-2), title: 'Distribusi Pekan Ini', text: '120 paket sembako tersalurkan ke Kelurahan sekitar.' }],
    },
    {
      id: uuidv4(), slug: 'zakat-maal-penyaluran-produktif',
      title: 'Penyaluran Zakat Maal Produktif', category: 'zakat',
      short_desc: 'Tunaikan zakat maal Anda dan berdayakan mustahik menuju kemandirian.',
      image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6',
      target_amount: 250000000, collected_amount: 132000000, donor_count: 610, deadline: daysFromNow(90), featured: false,
      story: [
        'Zakat maal yang Anda tunaikan akan disalurkan kepada 8 asnaf sesuai syariat, dengan prioritas program pemberdayaan produktif.',
        'Kami mendampingi mustahik agar naik kelas menjadi muzakki melalui modal usaha & pelatihan.',
        'Tunaikan zakat, sucikan harta, dan berdayakan sesama.'
      ],
      gallery: ['https://images.unsplash.com/photo-1532629345422-7515f3d16bb6', 'https://images.pexels.com/photos/6647027/pexels-photo-6647027.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'],
      updates: [{ date: daysFromNow(-10), title: 'Modal Usaha Tersalur', text: '15 mustahik menerima modal usaha mikro.' }],
    },
    {
      id: uuidv4(), slug: 'tanggap-bencana-kalimantan',
      title: 'Tanggap Bencana Banjir Kalimantan', category: 'bencana',
      short_desc: 'Bantuan cepat logistik & evakuasi bagi korban banjir di Kalimantan.',
      image: 'https://images.pexels.com/photos/6646926/pexels-photo-6646926.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      target_amount: 300000000, collected_amount: 95000000, donor_count: 730, deadline: daysFromNow(25), featured: false,
      story: [
        'Banjir kembali melanda sejumlah wilayah di Kalimantan. Ribuan warga mengungsi dan membutuhkan bantuan darurat.',
        'Tim relawan YABABERMA bergerak menyalurkan makanan siap saji, air bersih, selimut, dan kebutuhan bayi.',
        'Respon cepat Anda menyelamatkan lebih banyak keluarga.'
      ],
      gallery: ['https://images.pexels.com/photos/6646926/pexels-photo-6646926.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', 'https://images.pexels.com/photos/6647027/pexels-photo-6647027.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'],
      updates: [{ date: daysFromNow(-1), title: 'Posko Didirikan', text: 'Posko bantuan berdiri di 3 titik pengungsian.' }],
    },
    {
      id: uuidv4(), slug: 'fidyah-peduli-ramadhan',
      title: 'Fidyah Peduli untuk Kaum Dhuafa', category: 'fidyah',
      short_desc: 'Tunaikan fidyah Anda dalam bentuk makanan bergizi untuk fakir miskin.',
      image: 'https://images.pexels.com/photos/36853519/pexels-photo-36853519.jpeg',
      target_amount: 50000000, collected_amount: 12000000, donor_count: 95, deadline: daysFromNow(120), featured: false,
      story: [
        'Fidyah wajib ditunaikan bagi yang tidak mampu berpuasa. YABABERMA menyalurkannya dalam bentuk makanan bergizi kepada fakir miskin.',
        'Setiap porsi fidyah menjadi keberkahan bagi pemberi dan penerima.',
        'Tunaikan fidyah dengan mudah, kami yang menyalurkan amanahnya.'
      ],
      gallery: ['https://images.pexels.com/photos/36853519/pexels-photo-36853519.jpeg', 'https://images.pexels.com/photos/7345451/pexels-photo-7345451.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'],
      updates: [{ date: daysFromNow(-6), title: 'Penyaluran Awal', text: 'Fidyah tersalur kepada 40 penerima.' }],
    },
    {
      id: uuidv4(), slug: 'kurban-peduli-banua',
      title: 'Kurban Peduli Banua', category: 'kurban',
      short_desc: 'Tunaikan kurban Anda, dagingnya kami salurkan untuk yatim & dhuafa hingga pelosok Kalimantan.',
      image: 'https://images.pexels.com/photos/6646926/pexels-photo-6646926.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      target_amount: 200000000, collected_amount: 45000000, donor_count: 120, deadline: daysFromNow(70), featured: false,
      story: [
        'Setiap tahun, banyak keluarga dhuafa di pelosok Kalimantan yang jarang menikmati daging. Melalui program Kurban Peduli Banua, hewan kurban Anda kami sembelih dan distribusikan tepat sasaran.',
        'Anda dapat berkurban kambing/domba, atau patungan sapi (1/7 bagian) bersama keluarga. Seluruh proses dilaporkan lengkap dengan dokumentasi.',
        'Sempurnakan ibadah kurban Anda, hadirkan kebahagiaan di wajah saudara kita di Banua.'
      ],
      gallery: ['https://images.pexels.com/photos/6646926/pexels-photo-6646926.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', 'https://images.pexels.com/photos/7345447/pexels-photo-7345447.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'],
      updates: [{ date: daysFromNow(-7), title: 'Pendaftaran Dibuka', text: 'Pendaftaran pekurban tahun ini resmi dibuka.' }],
      kurban_options: KURBAN_OPTIONS,
    },
  ]
}

function seedNews() {
  return [
    { id: uuidv4(), slug: 'penyaluran-wakaf-quran-pelosok', title: "Penyaluran Wakaf Al-Qur'an ke Pelosok Kalimantan", excerpt: 'Sebanyak 250 mushaf Al-Qur\u2019an tersalurkan ke lima TPQ di Kabupaten Banjar.', image: 'https://images.pexels.com/photos/31528155/pexels-photo-31528155.jpeg', date: daysFromNow(-4), read_time: 3, category: 'Program', content: 'Alhamdulillah, program Wakaf Al-Qur\u2019an kembali menyalurkan 250 mushaf ke lima TPQ di pelosok Kabupaten Banjar. Antusiasme santri sangat tinggi menyambut mushaf baru mereka.' },
    { id: uuidv4(), slug: 'kegiatan-belajar-santri-tpq', title: 'Semangat Belajar Santri TPQ Banua Berkah', excerpt: 'Kegiatan belajar mengaji rutin santri TPQ Banua Berkah setiap sore.', image: 'https://images.pexels.com/photos/35548841/pexels-photo-35548841.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', date: daysFromNow(-9), read_time: 4, category: 'Pendidikan', content: 'Setiap sore, puluhan santri berkumpul di TPQ Banua Berkah untuk belajar membaca dan menghafal Al-Qur\u2019an bersama para ustaz dan ustazah.' },
    { id: uuidv4(), slug: 'distribusi-paket-sembako-dhuafa', title: 'Distribusi Paket Sembako untuk Keluarga Dhuafa', excerpt: '120 paket sembako tersalur ke keluarga dhuafa dan lansia di Banjarmasin.', image: 'https://images.pexels.com/photos/7345447/pexels-photo-7345447.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', date: daysFromNow(-14), read_time: 2, category: 'Kemanusiaan', content: 'Tim relawan YABABERMA menyalurkan 120 paket sembako kepada keluarga dhuafa dan lansia di beberapa kelurahan di Banjarmasin.' },
    { id: uuidv4(), slug: 'santunan-anak-panti-asuhan', title: 'Santunan & Kunjungan Anak Panti Asuhan', excerpt: 'Kegiatan santunan rutin bersama anak-anak Panti Asuhan Banua Berkah.', image: 'https://images.pexels.com/photos/34628746/pexels-photo-34628746.jpeg', date: daysFromNow(-21), read_time: 3, category: 'Sosial', content: 'Kegiatan santunan bulanan bersama anak-anak Panti Asuhan Banua Berkah berlangsung penuh kehangatan dan kebahagiaan.' },
  ]
}

function seedTestimonials() {
  const av = (n) => 'https://ui-avatars.com/api/?name=' + encodeURIComponent(n) + '&background=00A651&color=fff&bold=true'
  return [
    { id: uuidv4(), name: 'Ustaz H. Ahmad Fauzi', role: 'Tokoh Masyarakat', quote: 'YABABERMA amanah dan transparan dalam menyalurkan donasi. Semoga terus menjadi berkah bagi Banua.', avatar: av('Ahmad Fauzi') },
    { id: uuidv4(), name: 'Siti Aminah', role: 'Penerima Manfaat', quote: 'Alhamdulillah, bantuan sembako sangat membantu keluarga kami. Terima kasih para donatur.', avatar: av('Siti Aminah') },
    { id: uuidv4(), name: 'Budi Santoso', role: 'Donatur Rutin', quote: 'Prosesnya mudah, laporannya jelas. Saya tenang berdonasi lewat YABABERMA.', avatar: av('Budi Santoso') },
    { id: uuidv4(), name: 'Hj. Nurul Hidayah', role: 'Donatur', quote: 'Senang bisa ikut wakaf Al-Qur\u2019an. Semoga menjadi jariyah yang tak terputus.', avatar: av('Nurul Hidayah') },
  ]
}

function seedGallery() {
  return [
    { id: uuidv4(), image: 'https://images.pexels.com/photos/35105938/pexels-photo-35105938.jpeg', caption: 'Kebahagiaan anak binaan panti' },
    { id: uuidv4(), image: 'https://images.pexels.com/photos/20627702/pexels-photo-20627702.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', caption: 'Santri belajar Al-Qur\u2019an' },
    { id: uuidv4(), image: 'https://images.pexels.com/photos/6647027/pexels-photo-6647027.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', caption: 'Relawan turun ke lapangan' },
    { id: uuidv4(), image: 'https://images.pexels.com/photos/6646926/pexels-photo-6646926.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', caption: 'Distribusi bantuan untuk warga' },
    { id: uuidv4(), image: 'https://images.pexels.com/photos/34628746/pexels-photo-34628746.jpeg', caption: 'Ceria bersama anak yatim' },
    { id: uuidv4(), image: 'https://images.pexels.com/photos/35548841/pexels-photo-35548841.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', caption: 'Suasana belajar di TPQ' },
    { id: uuidv4(), image: 'https://images.pexels.com/photos/7345447/pexels-photo-7345447.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', caption: 'Paket sembako siap disalurkan' },
    { id: uuidv4(), image: 'https://images.pexels.com/photos/31528155/pexels-photo-31528155.jpeg', caption: 'Wakaf Al-Qur\u2019an untuk santri' },
  ]
}

function seedPrayers() {
  const now = Date.now()
  const mk = (name, message, program, i) => ({ id: uuidv4(), name, message, program, created_at: new Date(now - i * 3600000).toISOString() })
  return [
    mk('Hamba Allah', 'Semoga menjadi amal jariyah yang tak pernah terputus. Aamiin.', "Wakaf Al-Qur'an", 1),
    mk('Ahmad R.', 'Ya Allah, mudahkanlah urusan para donatur dan penerima manfaat.', 'Panti Asuhan', 2),
    mk('Fatimah', 'Semoga Allah membalas kebaikan Yayasan dengan surga-Nya.', 'Sembako Dhuafa', 3),
    mk('Hamba Allah', 'Barakallahu fiikum, semoga Banua semakin berkah.', 'Zakat Maal', 4),
    mk('Rizky P.', 'Semoga anak-anak panti tumbuh menjadi generasi Qur\u2019ani.', 'Beasiswa TPQ', 5),
    mk('Hamba Allah', 'Sedikit dari kami, semoga besar manfaatnya. Aamiin.', 'Tanggap Bencana', 6),
    mk('Nadia', 'Semoga rezeki kita semakin lapang dan berkah.', 'Sedekah', 7),
    mk('Hamba Allah', 'Terima kasih sudah menjadi jembatan kebaikan kami.', "Wakaf Al-Qur'an", 8),
  ]
}

async function ensureSeed(db) {
  if (await db.collection('campaigns').countDocuments() === 0) await db.collection('campaigns').insertMany(seedCampaigns())
  if (await db.collection('news').countDocuments() === 0) await db.collection('news').insertMany(seedNews())
  if (await db.collection('testimonials').countDocuments() === 0) await db.collection('testimonials').insertMany(seedTestimonials())
  if (await db.collection('gallery').countDocuments() === 0) await db.collection('gallery').insertMany(seedGallery())
  if (await db.collection('prayers').countDocuments() === 0) await db.collection('prayers').insertMany(seedPrayers())
  if (await db.collection('annual_reports').countDocuments() === 0) await db.collection('annual_reports').insertMany(seedAnnualReports())
  // Idempotent migration: ensure kurban campaign options carry quota targets
  const kurban = await db.collection('campaigns').findOne({ slug: 'kurban-peduli-banua' })
  if (kurban && (!Array.isArray(kurban.kurban_options) || !kurban.kurban_options[0] || kurban.kurban_options[0].quota == null)) {
    await db.collection('campaigns').updateOne({ slug: 'kurban-peduli-banua' }, { $set: { kurban_options: KURBAN_OPTIONS } })
  }
}

// ---------------- Auth helpers ----------------
const SESSION_COOKIE = 'yb_session'
const EMERGENT_SESSION_URL = 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'

async function getUserFromRequest(request, db) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await db.collection('sessions').findOne({ session_token: token })
  if (!session) return null
  if (session.expires && new Date(session.expires).getTime() < Date.now()) return null
  const user = await db.collection('users').findOne({ id: session.user_id })
  return user ? clean(user) : null
}

// ---------------- Admin key ----------------
// The default key always works (recovery path); the env ADMIN_KEY and the key stored in the
// `settings` collection (changed via the admin panel / OTP reset) are accepted as well.
const DEFAULT_ADMIN_KEY = 'yababerma-admin-2026'

async function getValidAdminKeys(db) {
  const keys = new Set([DEFAULT_ADMIN_KEY])
  const envKey = String(process.env.ADMIN_KEY || '').trim()
  if (envKey) keys.add(envKey)
  if (db) {
    try {
      const doc = await db.collection('settings').findOne({ id: 'admin_auth' })
      const stored = doc && typeof doc.password === 'string' ? doc.password.trim() : ''
      if (stored) keys.add(stored)
    } catch (e) { console.error('Admin key lookup error:', e?.message || e) }
  }
  return keys
}

async function isValidAdminKey(db, provided) {
  const key = String(provided || '').trim()
  if (!key) return false
  const valid = await getValidAdminKeys(db)
  return valid.has(key)
}

function maskEmail(email) {
  const parts = String(email || '').split('@')
  if (parts.length !== 2 || !parts[0]) return email || ''
  const u = parts[0]
  const masked = u.length <= 2 ? u[0] + '*' : u[0] + '*'.repeat(Math.max(1, u.length - 2)) + u[u.length - 1]
  return masked + '@' + parts[1]
}

async function sendAdminOtpEmail(otp) {
  if (!resend || !process.env.ADMIN_EMAIL) return false
  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#1E293B">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:#00A651;padding:22px;text-align:center">
        <img src="${ORG_LOGO}" width="56" height="56" style="background:#fff;border-radius:50%;padding:6px" alt="YABABERMA"/>
        <h1 style="color:#fff;font-size:17px;margin:10px 0 0">Yayasan Banua Berkah Mandiri</h1>
      </div>
      <div style="padding:28px;text-align:center">
        <h2 style="margin:0 0 6px;font-size:19px">Kode Reset Password Admin</h2>
        <p style="color:#475569;margin:0 0 18px;line-height:1.6">Gunakan kode verifikasi berikut untuk membuat password admin baru. Abaikan email ini jika Anda tidak meminta reset.</p>
        <div style="background:#e6f7ee;border-radius:12px;padding:18px;margin:0 auto 14px;max-width:280px">
          <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#00A651">${escapeHtml(otp)}</div>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:0">Kode berlaku selama 10 menit.</p>
      </div>
    </div>
  </div>
</body></html>`
  try {
    const { error } = await resend.emails.send({ from: process.env.MAIL_FROM, to: [process.env.ADMIN_EMAIL], subject: 'Kode Reset Password Admin \u2014 YABABERMA', html, text: `Kode verifikasi reset password admin Anda: ${otp}. Berlaku 10 menit.` })
    if (error) { console.error('Resend(otp) error:', error?.message || JSON.stringify(error)); return false }
    return true
  } catch (e) { console.error('Email(otp) exception:', e?.message); return false }
}

// ---- WhatsApp (Fonnte) helpers ----
const DEFAULT_WA_TEMPLATE = `Assalamu'alaikum {name} \uD83E\uDD0D\n\nAlhamdulillah, donasi Anda sebesar *{amount}* untuk *{program}* telah kami *VERIFIKASI* dan diterima oleh Yayasan Banua Berkah Mandiri.\n\nSemoga menjadi amal jariyah yang berkah dan berlipat ganda, serta menjadi pemberat timbangan kebaikan Anda. Aamiin \uD83E\uDD32\n\nTerima kasih atas kepercayaan & kebaikan Anda.\n\n\u2014 Yayasan Banua Berkah Mandiri\nyababerma.org`

async function getWaSettings(db) {
  const doc = await db.collection('settings').findOne({ id: 'wa_settings' })
  return {
    thank_you_template: (doc && doc.thank_you_template) || DEFAULT_WA_TEMPLATE,
    admin_notify_enabled: doc ? !!doc.admin_notify_enabled : false,
    admin_number: (doc && doc.admin_number) || '',
  }
}

function renderWaTemplate(tpl, donation) {
  const name = donation.is_anonymous ? 'Sahabat Donatur' : (donation.donor_name || 'Sahabat Donatur')
  const amount = 'Rp ' + Number(donation.amount || 0).toLocaleString('id-ID')
  const program = donation.campaign_title || 'program kebaikan'
  const total = 'Rp ' + Number(donation.total_amount || donation.amount || 0).toLocaleString('id-ID')
  return String(tpl || DEFAULT_WA_TEMPLATE)
    .replace(/\{name\}/g, name)
    .replace(/\{amount\}/g, amount)
    .replace(/\{program\}/g, program)
    .replace(/\{total\}/g, total)
}

// Low-level sender (inert unless FONNTE_TOKEN is set)
async function fonnteSend(target, message) {
  const token = process.env.FONNTE_TOKEN
  if (!token || !target || !message) return false
  let value = String(target || '').trim().replace(/[\s().+-]/g, '')
  if (value.startsWith('62')) value = '0' + value.slice(2)
  if (!/^08\d{7,14}$/.test(value)) { console.error('Fonnte: nomor tidak valid:', target); return false }
  try {
    const form = new FormData()
    form.append('target', value)
    form.append('message', message)
    form.append('countryCode', '62')
    const res = await fetch('https://api.fonnte.com/send', { method: 'POST', headers: { Authorization: token }, body: form, cache: 'no-store', signal: AbortSignal.timeout(8000) })
    const result = await res.json().catch(() => ({}))
    if (!res.ok || result.status === false) { console.error('Fonnte gagal:', result.reason || result.detail || res.status); return false }
    console.info('Fonnte terkirim (queued):', JSON.stringify(result.id || result.requestid || ''))
    return true
  } catch (e) { console.error('Fonnte exception:', e?.message); return false }
}

// Thank-you to donor (uses admin-editable template)
async function sendWhatsAppThankYou(donation, template) {
  if (!donation || !donation.donor_whatsapp) return false
  return fonnteSend(donation.donor_whatsapp, renderWaTemplate(template, donation))
}

// ---------------- Router ----------------
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Health
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'YABABERMA API OK', db: !!db }))
    }

    // ---- Campaigns ----
    if (route === '/campaigns' && method === 'GET') {
      if (!db) return handleCORS(NextResponse.json(cleanArr(seedCampaigns())))
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const featured = url.searchParams.get('featured')
      const q = { published: { $ne: false } }
      if (category && category !== 'semua') q.category = category
      if (featured === 'true') q.featured = true
      const items = await db.collection('campaigns').find(q).limit(200).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }

    // ---- Media (serve uploaded files from DB) ----
    if (path[0] === 'media' && path[1] && method === 'GET') {
      const m = await db.collection('media').findOne({ id: path[1] })
      if (!m || !m.data) return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
      const raw = m.data.buffer ? m.data.buffer : m.data
      const buf = Buffer.from(raw)
      const res = new NextResponse(buf, {
        status: 200, headers: {
          'Content-Type': m.content_type || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${(m.filename || 'file').replace(/"/g, '')}"`,
          'Content-Length': String(buf.length),
          'Cache-Control': 'public, max-age=31536000, immutable',
        }
      })
      return handleCORS(res)
    }

    // ---- Home slider settings (public read) ----
    if (route === '/home-settings' && method === 'GET') {
      const doc = db ? await db.collection('settings').findOne({ id: 'home_settings' }) : null
      return handleCORS(NextResponse.json({
        slides: Array.isArray(doc?.slides) ? doc.slides : [],
        duration_ms: Number(doc?.duration_ms) > 0 ? Number(doc.duration_ms) : 6000,
      }))
    }

    if (path[0] === 'campaigns' && path[1] && method === 'GET') {
      const item = db ? await db.collection('campaigns').findOne({ slug: path[1] }) : seedCampaigns().find(c => c.slug === path[1])
      if (!item) return handleCORS(NextResponse.json({ error: 'Campaign not found' }, { status: 404 }))
      if (item.published === false) return handleCORS(NextResponse.json({ error: 'Campaign not found' }, { status: 404 }))
      // recent public donations for this campaign
      const donations = db ? await db.collection('donations').find({ campaign_slug: path[1] }).sort({ created_at: -1 }).limit(10).toArray() : []
      const recent = donations.map(d => ({ name: d.is_anonymous ? 'Hamba Allah' : d.donor_name, amount: d.amount, message: d.message || '', created_at: d.created_at }))
      return handleCORS(NextResponse.json({ ...clean(item), recent_donations: recent }))
    }

    // ---- Donations ----
    if (route === '/donations' && method === 'POST') {
      const body = await request.json()
      const amount = Number(body.amount)
      if (!amount || amount < 1000) return handleCORS(NextResponse.json({ error: 'Nominal donasi tidak valid (min Rp1.000)' }, { status: 400 }))
      if (!body.donor_name || !body.donor_whatsapp) return handleCORS(NextResponse.json({ error: 'Nama dan nomor WhatsApp wajib diisi' }, { status: 400 }))

      const campaign = body.campaign_slug ? await db.collection('campaigns').findOne({ slug: body.campaign_slug }) : null
      const unique_code = Math.floor(Math.random() * 899) + 100 // 100..999
      const total_amount = amount + unique_code

      const currentUser = await getUserFromRequest(request, db)

      const donation = {
        id: uuidv4(),
        campaign_slug: body.campaign_slug || null,
        campaign_title: campaign ? campaign.title : (body.campaign_title || 'Donasi Umum'),
        amount,
        unique_code,
        total_amount,
        donor_name: body.donor_name,
        donor_email: body.donor_email || (currentUser ? currentUser.email : null),
        donor_whatsapp: body.donor_whatsapp,
        message: body.message || '',
        show_on_wall: body.show_on_wall === undefined ? false : !!body.show_on_wall,
        payment_method: body.payment_method || 'bsi',
        is_anonymous: !!body.is_anonymous,
        donation_type: body.donation_type || (campaign ? campaign.category : 'sedekah'),
        kurban_option: body.kurban_option || null,
        kurban_qty: body.kurban_qty ? Number(body.kurban_qty) : null,
        status: 'pending',
        user_id: currentUser ? currentUser.id : null,
        created_at: new Date().toISOString(),
      }
      await db.collection('donations').insertOne({ ...donation })

      // Campaign progress numbers (collected_amount & donor_count) are now MANAGED MANUALLY
      // by admin via the panel (per configuration). New donations no longer auto-increment them.

      // Thank-you email is sent ONLY after admin verification (per config).
      // On creation we only notify the admin (background, non-blocking).
      sendAdminNotifyEmail(donation).catch(() => { })
      // WhatsApp notification to admin on new donation (fire-and-forget, if enabled)
      getWaSettings(db).then((wa) => {
        if (wa.admin_notify_enabled && wa.admin_number) {
          const who = donation.is_anonymous ? 'Hamba Allah' : donation.donor_name
          const msg = `\uD83D\uDD14 *Donasi Baru Masuk*\n\nNama: ${who}\nProgram: ${donation.campaign_title}\nNominal: Rp ${Number(donation.amount || 0).toLocaleString('id-ID')}\nTotal transfer: Rp ${Number(donation.total_amount || 0).toLocaleString('id-ID')} (kode unik ${donation.unique_code})\nWA donatur: ${donation.donor_whatsapp}\n\nSegera verifikasi di panel admin:\nyababerma.org/admin`
          fonnteSend(wa.admin_number, msg)
        }
      }).catch(() => { })

      return handleCORS(NextResponse.json(donation))
    }

    if (route === '/donations' && method === 'GET') {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')
      const currentUser = await getUserFromRequest(request, db)
      const q = {}
      if (email) q.donor_email = email
      else if (currentUser) q.donor_email = currentUser.email
      else return handleCORS(NextResponse.json([]))
      const items = await db.collection('donations').find(q).sort({ created_at: -1 }).limit(200).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }

    // single donation by id (for receipt / summary)
    if (path[0] === 'donations' && path[1] && method === 'GET') {
      const item = await db.collection('donations').findOne({ id: path[1] })
      if (!item) return handleCORS(NextResponse.json({ error: 'Donation not found' }, { status: 404 }))
      return handleCORS(NextResponse.json(clean(item)))
    }

    // ---- Newsletter ----
    if (route === '/newsletter' && method === 'POST') {
      const body = await request.json()
      const email = (body.email || '').trim().toLowerCase()
      if (!email || !email.includes('@')) return handleCORS(NextResponse.json({ error: 'Email tidak valid' }, { status: 400 }))
      await db.collection('newsletter').updateOne({ email }, { $set: { email, subscribed: true, updated_at: new Date().toISOString() }, $setOnInsert: { id: uuidv4(), created_at: new Date().toISOString() } }, { upsert: true })
      return handleCORS(NextResponse.json({ ok: true, message: 'Berhasil berlangganan Kabar Kebaikan!' }))
    }

    // ---- Manual confirmation ----
    if (route === '/confirmations' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.whatsapp || !body.amount) return handleCORS(NextResponse.json({ error: 'Nama, WhatsApp, dan nominal wajib diisi' }, { status: 400 }))
      const conf = {
        id: uuidv4(),
        name: body.name,
        whatsapp: body.whatsapp,
        bank: body.bank || '',
        amount: Number(body.amount) || 0,
        program: body.program || '',
        note: body.note || '',
        proof_image: body.proof_image || null, // base64 data url (optional)
        proof_name: body.proof_name || null,
        created_at: new Date().toISOString(),
      }
      await db.collection('confirmations').insertOne({ ...conf })
      // WhatsApp notification to admin on new manual confirmation (fire-and-forget, if enabled)
      getWaSettings(db).then((wa) => {
        if (wa.admin_notify_enabled && wa.admin_number) {
          const msg = `\uD83D\uDCE8 *Konfirmasi Transfer Baru*\n\nNama: ${conf.name}\nProgram: ${conf.program || '-'}\nNominal: Rp ${Number(conf.amount || 0).toLocaleString('id-ID')}\nBank: ${conf.bank || '-'}\nWA: ${conf.whatsapp}\nLampiran bukti: ${conf.proof_image ? 'Ada' : 'Tidak ada'}\n\nCek di panel admin:\nyababerma.org/admin`
          fonnteSend(wa.admin_number, msg)
        }
      }).catch(() => { })
      const { proof_image, ...safe } = conf
      return handleCORS(NextResponse.json({ ok: true, confirmation: safe }))
    }

    // ---- News & Articles ----
    if (route === '/news' && method === 'GET') {
      if (!db) return handleCORS(NextResponse.json(cleanArr(seedNews())))
      const items = await db.collection('news').find({ status: 'Published' }).sort({ createdAt: -1 }).limit(50).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }
    if (path[0] === 'news' && path[1] && method === 'GET') {
      const item = db ? await db.collection('news').findOne({ slug: path[1], status: 'Published' }) : seedNews().find(n => n.slug === path[1])
      if (!item) return handleCORS(NextResponse.json({ error: 'News not found' }, { status: 404 }))
      return handleCORS(NextResponse.json(clean(item)))
    }

    // ---- Testimonials & Gallery ----
    if (route === '/testimonials' && method === 'GET') {
      if (!db) return handleCORS(NextResponse.json(cleanArr(seedTestimonials())))
      const items = await db.collection('testimonials').find({}).limit(50).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }
    if (route === '/gallery' && method === 'GET') {
      if (!db) return handleCORS(NextResponse.json(cleanArr(seedGallery())))
      const items = await db.collection('gallery').find({}).limit(100).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }

    // ---- Stats ----
    if (route === '/stats' && method === 'GET') {
      const campaigns = db ? await db.collection('campaigns').find({}).limit(200).toArray() : seedCampaigns()
      const total_collected = campaigns.reduce((s, c) => s + (c.collected_amount || 0), 0)
      const total_donors = campaigns.reduce((s, c) => s + (c.donor_count || 0), 0)
      const total_target = campaigns.reduce((s, c) => s + (c.target_amount || 0), 0)
      const total_donations = db ? await db.collection('donations').countDocuments() : 0
      return handleCORS(NextResponse.json({
        humanitarian: 3000, wakaf_quran: 2100, panti: 500, pemberdayaan: 200,
        total_collected, total_donors, total_target, total_donations, active_campaigns: campaigns.length,
      }))
    }

    // ---- Kurban real-time quota ----
    if (route === '/kurban/quota' && method === 'GET') {
      const camp = db ? await db.collection('campaigns').findOne({ slug: 'kurban-peduli-banua' }) : null
      const opts = (camp && Array.isArray(camp.kurban_options) && camp.kurban_options[0] && camp.kurban_options[0].quota != null)
        ? camp.kurban_options : KURBAN_OPTIONS
      const dons = db ? await db.collection('donations').find({ campaign_slug: 'kurban-peduli-banua', kurban_option: { $nin: [null, ''] } }).limit(5000).toArray() : []
      const soldMap = {}
      dons.forEach(d => { const q = Number(d.kurban_qty) || 1; soldMap[d.kurban_option] = (soldMap[d.kurban_option] || 0) + q })
      const options = opts.map(o => {
        const sold = (o.sold_base || 0) + (soldMap[o.key] || 0)
        const quota = o.quota || 0
        const remaining = Math.max(quota - sold, 0)
        return { key: o.key, name: o.name, emoji: o.emoji, desc: o.desc, price: o.price, unit: o.unit, quota, sold, remaining }
      })
      return handleCORS(NextResponse.json({ options }))
    }

    // ---- Annual reports (public transparency, filterable by year) ----
    if (route === '/reports' && method === 'GET') {
      const url = new URL(request.url)
      const yearParam = url.searchParams.get('year') || 'all'
      const currentYear = new Date().getFullYear()

      // Live current-year figures derived from live campaigns + donations
      const campaigns = db ? await db.collection('campaigns').find({}).limit(200).toArray() : seedCampaigns()
      const catMap = {}
      campaigns.forEach(c => { catMap[c.category] = (catMap[c.category] || 0) + (c.collected_amount || 0) })
      const liveDoc = {
        year: currentYear,
        total_collected: campaigns.reduce((s, c) => s + (c.collected_amount || 0), 0),
        total_donors: campaigns.reduce((s, c) => s + (c.donor_count || 0), 0),
        total_donations: db ? await db.collection('donations').countDocuments() : 0,
        by_category: Object.entries(catMap).map(([category, amount]) => ({ category, amount })),
        by_program: campaigns.map(c => ({ title: c.title, slug: c.slug, collected: c.collected_amount || 0, target: c.target_amount || 0 })),
      }

      const history = db ? cleanArr(await db.collection('annual_reports').find({}).sort({ year: -1 }).limit(20).toArray()) : seedAnnualReports()
      const allDocs = [liveDoc, ...history.filter(h => h.year !== currentYear)]
      const years = ['all', ...allDocs.map(d => String(d.year)).sort((a, b) => Number(b) - Number(a))]

      const buildResp = (doc) => ({ ...doc, years })

      if (yearParam !== 'all') {
        const doc = allDocs.find(d => String(d.year) === String(yearParam))
        if (!doc) return handleCORS(NextResponse.json({ error: 'Year not found', years }, { status: 404 }))
        return handleCORS(NextResponse.json(buildResp(doc)))
      }

      // Aggregate ALL years
      const aggCat = {}
      allDocs.forEach(d => (d.by_category || []).forEach(c => { aggCat[c.category] = (aggCat[c.category] || 0) + (c.amount || 0) }))
      const aggregate = {
        year: 'all',
        total_collected: allDocs.reduce((s, d) => s + (d.total_collected || 0), 0),
        total_donors: allDocs.reduce((s, d) => s + (d.total_donors || 0), 0),
        total_donations: allDocs.reduce((s, d) => s + (d.total_donations || 0), 0),
        by_category: Object.entries(aggCat).map(([category, amount]) => ({ category, amount })),
        by_program: liveDoc.by_program,
      }
      return handleCORS(NextResponse.json(buildResp(aggregate)))
    }

    // ---- Auth ----
    if (route === '/auth/session' && method === 'POST') {
      const body = await request.json()
      const session_id = body.session_id
      if (!session_id) return handleCORS(NextResponse.json({ error: 'Missing session_id' }, { status: 400 }))
      const res = await fetch(EMERGENT_SESSION_URL, { headers: { 'X-Session-ID': session_id } })
      if (!res.ok) return handleCORS(NextResponse.json({ error: 'Invalid session' }, { status: 401 }))
      const data = await res.json()
      const userId = data.id || data.user_id || data.email
      const user = {
        id: userId,
        email: data.email,
        name: data.name || data.email,
        picture: data.picture || null,
      }
      await db.collection('users').updateOne({ id: userId }, { $set: { ...user, updated_at: new Date().toISOString() }, $setOnInsert: { created_at: new Date().toISOString(), newsletter: true } }, { upsert: true })
      const session_token = data.session_token || uuidv4()
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await db.collection('sessions').updateOne({ session_token }, { $set: { session_token, user_id: userId, expires, created_at: new Date().toISOString() } }, { upsert: true })
      const dbUser = await db.collection('users').findOne({ id: userId })
      const response = NextResponse.json({ ok: true, user: clean(dbUser) })
      response.cookies.set(SESSION_COOKIE, session_token, {
        httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 7 * 24 * 60 * 60,
      })
      return handleCORS(response)
    }

    if (route === '/auth/me' && method === 'GET') {
      if (!db) return handleCORS(NextResponse.json({ user: null }, { status: 200 }))
      const user = await getUserFromRequest(request, db)
      if (!user) return handleCORS(NextResponse.json({ user: null }, { status: 200 }))
      return handleCORS(NextResponse.json({ user }))
    }

    if (route === '/auth/logout' && method === 'POST') {
      const token = request.cookies.get(SESSION_COOKIE)?.value
      if (token) await db.collection('sessions').deleteOne({ session_token: token })
      const response = NextResponse.json({ ok: true })
      response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0 })
      return handleCORS(response)
    }

    // profile update (newsletter toggle)
    if (route === '/auth/profile' && method === 'PUT') {
      const user = await getUserFromRequest(request, db)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const update = {}
      if (typeof body.newsletter === 'boolean') update.newsletter = body.newsletter
      if (Object.keys(update).length) await db.collection('users').updateOne({ id: user.id }, { $set: update })
      const dbUser = await db.collection('users').findOne({ id: user.id })
      return handleCORS(NextResponse.json({ ok: true, user: clean(dbUser) }))
    }

    // ---- Prayers (Dinding Doa) ----
    if (route === '/prayers' && method === 'GET') {
      // Only include donation messages the donor explicitly opted to display on the wall
      const real = db ? await db.collection('donations').find({ message: { $nin: [null, ''] }, show_on_wall: true }).sort({ created_at: -1 }).limit(20).toArray() : []
      const realMapped = real.map(d => ({ name: d.is_anonymous ? 'Hamba Allah' : (d.donor_name || 'Hamba Allah'), message: d.message, program: d.campaign_title || '' }))
      const seeded = db ? await db.collection('prayers').find({}).sort({ created_at: -1 }).limit(50).toArray() : seedPrayers()
      const seededMapped = seeded.map(p => ({ name: p.name, message: p.message, program: p.program }))
      const all = [...realMapped, ...seededMapped].slice(0, 30)
      return handleCORS(NextResponse.json(all))
    }

    // ---- Admin ----
    if (route === '/admin/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const providedKey = String(body.key || '').trim()
      if (await isValidAdminKey(db, providedKey)) {
        return handleCORS(NextResponse.json({ ok: true, db: !!db }))
      }
      return handleCORS(NextResponse.json({ error: 'Kunci admin salah' }, { status: 401 }))
    }

    // Forgot password: send an OTP to the configured admin email
    if (route === '/admin/forgot-password' && method === 'POST') {
      if (!db) return noDbResponse()
      if (!resend || !process.env.ADMIN_EMAIL) return handleCORS(NextResponse.json({ error: 'Email admin belum dikonfigurasi di server.' }, { status: 500 }))
      const now = Date.now()
      const existing = await db.collection('settings').findOne({ id: 'admin_reset' })
      if (existing && existing.last_sent && now - existing.last_sent < 60000) {
        return handleCORS(NextResponse.json({ error: 'Mohon tunggu 1 menit sebelum meminta kode baru.' }, { status: 429 }))
      }
      const otp = String(Math.floor(100000 + Math.random() * 900000))
      await db.collection('settings').updateOne({ id: 'admin_reset' }, { $set: { id: 'admin_reset', otp, expires_at: now + 10 * 60 * 1000, last_sent: now } }, { upsert: true })
      const sent = await sendAdminOtpEmail(otp)
      if (!sent) return handleCORS(NextResponse.json({ error: 'Gagal mengirim email kode. Coba lagi nanti.' }, { status: 502 }))
      return handleCORS(NextResponse.json({ ok: true, email: maskEmail(process.env.ADMIN_EMAIL) }))
    }

    // Reset password using OTP
    if (route === '/admin/reset-password' && method === 'POST') {
      if (!db) return noDbResponse()
      const body = await request.json()
      const otp = String(body.otp || '').trim()
      const newPass = String(body.new_password || '')
      if (!otp || !newPass) return handleCORS(NextResponse.json({ error: 'Kode OTP dan password baru wajib diisi.' }, { status: 400 }))
      if (newPass.length < 6) return handleCORS(NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 }))
      const rec = await db.collection('settings').findOne({ id: 'admin_reset' })
      if (!rec || !rec.otp) return handleCORS(NextResponse.json({ error: 'Belum ada permintaan reset. Klik "Lupa Password" dulu.' }, { status: 400 }))
      if (Date.now() > (rec.expires_at || 0)) return handleCORS(NextResponse.json({ error: 'Kode sudah kedaluwarsa. Minta kode baru.' }, { status: 400 }))
      if (otp !== rec.otp) return handleCORS(NextResponse.json({ error: 'Kode verifikasi salah.' }, { status: 400 }))
      await db.collection('settings').updateOne({ id: 'admin_auth' }, { $set: { id: 'admin_auth', password: newPass, updated_at: new Date().toISOString() } }, { upsert: true })
      await db.collection('settings').deleteOne({ id: 'admin_reset' })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route.startsWith('/admin')) {
      const provided = String(request.headers.get('x-admin-key') || '').trim()
      if (!(await isValidAdminKey(db, provided))) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

      // Without a database the panel can still be opened, but there is nothing to manage:
      // answer GETs with empty/default payloads and refuse writes with a clear message.
      if (!db) {
        if (method === 'GET') {
          if (route === '/admin/summary') return handleCORS(NextResponse.json({ total_donations: 0, verified: 0, pending: 0, total_verified: 0, total_all: 0, confirmations: 0, db_missing: true }))
          if (route === '/admin/kurban') return handleCORS(NextResponse.json({ options: KURBAN_OPTIONS.map(o => ({ key: o.key, name: o.name, unit: o.unit, price: o.price, quota: o.quota || 0, sold_base: o.sold_base || 0 })), db_missing: true }))
          if (route === '/admin/wa-settings') return handleCORS(NextResponse.json({ thank_you_template: DEFAULT_WA_TEMPLATE, admin_notify_enabled: false, admin_number: '', token_configured: !!process.env.FONNTE_TOKEN, default_template: DEFAULT_WA_TEMPLATE, db_missing: true }))
          if (route === '/admin/home-settings') return handleCORS(NextResponse.json({ slides: [], duration_ms: 6000, db_missing: true }))
          return handleCORS(NextResponse.json([]))
        }
        return noDbResponse()
      }

      if (route === '/admin/summary' && method === 'GET') {
        const donations = await db.collection('donations').find({}).limit(10000).toArray()
        const verified = donations.filter(d => d.status === 'verified')
        const total_verified = verified.reduce((s, d) => s + (d.amount || 0), 0)
        const total_all = donations.reduce((s, d) => s + (d.amount || 0), 0)
        const confirmations = await db.collection('confirmations').countDocuments()
        return handleCORS(NextResponse.json({ total_donations: donations.length, verified: verified.length, pending: donations.length - verified.length, total_verified, total_all, confirmations }))
      }
      if (route === '/admin/donations' && method === 'GET') {
        const items = await db.collection('donations').find({}).sort({ created_at: -1 }).limit(500).toArray()
        return handleCORS(NextResponse.json(cleanArr(items)))
      }
      if (route === '/admin/confirmations' && method === 'GET') {
        const items = await db.collection('confirmations').find({}).sort({ created_at: -1 }).limit(500).toArray()
        return handleCORS(NextResponse.json(cleanArr(items)))
      }
      if (route === '/admin/verify' && method === 'POST') {
        const body = await request.json()
        if (!body.donation_id) return handleCORS(NextResponse.json({ error: 'donation_id wajib' }, { status: 400 }))
        const status = body.status === 'verified' ? 'verified' : 'pending'
        await db.collection('donations').updateOne({ id: body.donation_id }, { $set: { status, verified_at: status === 'verified' ? new Date().toISOString() : null } })
        const d = await db.collection('donations').findOne({ id: body.donation_id })
        if (d && status === 'verified') {
          sendVerifiedEmail(clean(d)).catch(() => { })
          // Fire-and-forget WhatsApp thank-you (idempotent) via Fonnte, using admin-editable template
          if (!d.wa_thanked_at) {
            getWaSettings(db).then((wa) => sendWhatsAppThankYou(clean(d), wa.thank_you_template)).then((ok) => {
              if (ok) db.collection('donations').updateOne({ id: d.id }, { $set: { wa_thanked_at: new Date().toISOString() } }).catch(() => { })
            }).catch(() => { })
          }
        }
        return handleCORS(NextResponse.json({ ok: true, donation: d ? clean(d) : null }))
      }

      // Change admin password (already authenticated via x-admin-key guard above)
      if (route === '/admin/change-password' && method === 'POST') {
        const body = await request.json()
        const newPass = String(body.new_password || '')
        if (newPass.length < 6) return handleCORS(NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 }))
        if (newPass === provided) return handleCORS(NextResponse.json({ error: 'Password baru harus berbeda dari yang sekarang.' }, { status: 400 }))
        await db.collection('settings').updateOne({ id: 'admin_auth' }, { $set: { id: 'admin_auth', password: newPass, updated_at: new Date().toISOString() } }, { upsert: true })
        return handleCORS(NextResponse.json({ ok: true }))
      }

      // WhatsApp settings (editable template + admin notification toggle)
      if (route === '/admin/wa-settings' && method === 'GET') {
        const wa = await getWaSettings(db)
        return handleCORS(NextResponse.json({ ...wa, token_configured: !!process.env.FONNTE_TOKEN, default_template: DEFAULT_WA_TEMPLATE }))
      }
      if (route === '/admin/wa-settings' && method === 'POST') {
        const body = await request.json()
        const update = {
          id: 'wa_settings',
          thank_you_template: (typeof body.thank_you_template === 'string' && body.thank_you_template.trim()) ? body.thank_you_template : DEFAULT_WA_TEMPLATE,
          admin_notify_enabled: !!body.admin_notify_enabled,
          admin_number: String(body.admin_number || '').trim(),
          updated_at: new Date().toISOString(),
        }
        await db.collection('settings').updateOne({ id: 'wa_settings' }, { $set: update }, { upsert: true })
        return handleCORS(NextResponse.json({ ok: true, ...update, token_configured: !!process.env.FONNTE_TOKEN }))
      }
      // Send a test WhatsApp message (awaited so admin gets immediate feedback)
      if (route === '/admin/wa-test' && method === 'POST') {
        const body = await request.json()
        const number = String(body.number || '').trim()
        if (!number) return handleCORS(NextResponse.json({ error: 'Nomor WhatsApp wajib diisi.' }, { status: 400 }))
        if (!process.env.FONNTE_TOKEN) return handleCORS(NextResponse.json({ error: 'Token Fonnte belum dikonfigurasi di server.' }, { status: 400 }))
        const msg = body.message || 'Tes koneksi WhatsApp dari panel admin Yayasan Banua Berkah Mandiri. Jika Anda menerima pesan ini, integrasi WhatsApp sudah aktif. \u2705'
        const ok = await fonnteSend(number, msg)
        if (!ok) return handleCORS(NextResponse.json({ error: 'Gagal mengirim WA. Periksa nomor tujuan & token Fonnte.' }, { status: 502 }))
        return handleCORS(NextResponse.json({ ok: true }))
      }

      // Bulk delete (admin) — donations or confirmations
      if (route === '/admin/delete' && method === 'POST') {
        const body = await request.json()
        const coll = body.collection === 'confirmations' ? 'confirmations' : 'donations'
        const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []
        if (ids.length === 0) return handleCORS(NextResponse.json({ error: 'ids wajib berupa array tidak kosong' }, { status: 400 }))
        // Campaign numbers are managed manually; deleting a donation does NOT change campaign totals.
        const res = await db.collection(coll).deleteMany({ id: { $in: ids } })
        return handleCORS(NextResponse.json({ ok: true, deleted: res.deletedCount || 0, reverted: 0 }))
      }

      // Kurban quota management (admin)
      if (route === '/admin/kurban' && method === 'GET') {
        const camp = await db.collection('campaigns').findOne({ slug: 'kurban-peduli-banua' })
        const opts = (camp && Array.isArray(camp.kurban_options) && camp.kurban_options[0] && camp.kurban_options[0].quota != null) ? camp.kurban_options : KURBAN_OPTIONS
        return handleCORS(NextResponse.json({ options: opts.map(o => ({ key: o.key, name: o.name, unit: o.unit, price: o.price, quota: o.quota || 0, sold_base: o.sold_base || 0 })) }))
      }
      if (route === '/admin/kurban-quota' && method === 'POST') {
        const body = await request.json()
        if (!Array.isArray(body.options)) return handleCORS(NextResponse.json({ error: 'options wajib berupa array' }, { status: 400 }))
        const camp = await db.collection('campaigns').findOne({ slug: 'kurban-peduli-banua' })
        const base = (camp && Array.isArray(camp.kurban_options) && camp.kurban_options[0] && camp.kurban_options[0].quota != null) ? camp.kurban_options : KURBAN_OPTIONS
        const updateMap = {}
        body.options.forEach(o => { if (o && o.key) updateMap[o.key] = o })
        const merged = base.map(o => {
          const u = updateMap[o.key]
          if (!u) return o
          const quota = u.quota != null && !isNaN(Number(u.quota)) ? Math.max(0, Math.floor(Number(u.quota))) : o.quota
          const sold_base = u.sold_base != null && !isNaN(Number(u.sold_base)) ? Math.max(0, Math.floor(Number(u.sold_base))) : (o.sold_base || 0)
          return { ...o, quota, sold_base }
        })
        await db.collection('campaigns').updateOne({ slug: 'kurban-peduli-banua' }, { $set: { kurban_options: merged } })
        return handleCORS(NextResponse.json({ ok: true, options: merged.map(o => ({ key: o.key, name: o.name, unit: o.unit, price: o.price, quota: o.quota || 0, sold_base: o.sold_base || 0 })) }))
      }

      // ---- Media upload (stored in DB; served via GET /api/media/{id}) ----
      if (route === '/admin/upload' && method === 'POST') {
        const form = await request.formData()
        const file = form.get('file')
        if (!file || typeof file === 'string') return handleCORS(NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 }))
        const MAX = 10 * 1024 * 1024
        if (file.size > MAX) return handleCORS(NextResponse.json({ error: 'Ukuran file terlalu besar (maksimal 10MB).' }, { status: 400 }))
        const buffer = Buffer.from(await file.arrayBuffer())
        const id = uuidv4()
        const doc = { id, filename: file.name || 'file', content_type: file.type || 'application/octet-stream', size: buffer.length, data: buffer, created_at: new Date().toISOString() }
        await db.collection('media').insertOne(doc)
        return handleCORS(NextResponse.json({ ok: true, id, url: `/api/media/${id}`, filename: doc.filename, content_type: doc.content_type, size: doc.size }))
      }

      // ---- Program/Campaign CMS ----
      if (route === '/admin/campaigns' && method === 'GET') {
        const items = await db.collection('campaigns').find({}).sort({ created_at: -1 }).limit(500).toArray()
        return handleCORS(NextResponse.json(cleanArr(items)))
      }
      // Single campaign (incl. drafts) for admin preview
      if (path[0] === 'admin' && path[1] === 'campaigns' && path[2] && method === 'GET') {
        const item = await db.collection('campaigns').findOne({ id: path[2] })
        if (!item) return handleCORS(NextResponse.json({ error: 'Program tidak ditemukan' }, { status: 404 }))
        const donations = await db.collection('donations').find({ campaign_slug: item.slug }).sort({ created_at: -1 }).limit(10).toArray()
        const recent = donations.map(d => ({ name: d.is_anonymous ? 'Hamba Allah' : d.donor_name, amount: d.amount, message: d.message || '', created_at: d.created_at }))
        return handleCORS(NextResponse.json({ ...clean(item), recent_donations: recent }))
      }
      if (route === '/admin/campaigns' && method === 'POST') {
        const body = await request.json()
        const title = String(body.title || '').trim()
        if (!title) return handleCORS(NextResponse.json({ error: 'Nama program wajib diisi.' }, { status: 400 }))
        let base = slugify(title) || ('program-' + Date.now())
        let slug = base, n = 1
        while (await db.collection('campaigns').findOne({ slug })) { slug = `${base}-${++n}` }
        const toArr = (v) => Array.isArray(v) ? v : (v ? String(v).split('\n').map(x => x.trim()).filter(Boolean) : [])
        const doc = {
          id: uuidv4(), slug, title,
          category: body.category || 'sedekah',
          short_desc: body.short_desc || '',
          image: body.image || '',
          story: toArr(body.story),
          gallery: Array.isArray(body.gallery) ? body.gallery.filter(Boolean) : [],
          updates: Array.isArray(body.updates) ? body.updates : [],
          reports: Array.isArray(body.reports) ? body.reports : [],
          video_url: body.video_url || '',
          target_amount: Number(body.target_amount) || 0,
          collected_amount: Number(body.collected_amount) || 0,
          donor_count: Number(body.donor_count) || 0,
          deadline: body.deadline || null,
          featured: !!body.featured,
          published: body.published === undefined ? false : !!body.published,
          created_at: new Date().toISOString(),
        }
        await db.collection('campaigns').insertOne({ ...doc })
        return handleCORS(NextResponse.json(clean(doc)))
      }
      if (path[0] === 'admin' && path[1] === 'campaigns' && path[2] && method === 'PUT') {
        const id = path[2]
        const body = await request.json()
        const existing = await db.collection('campaigns').findOne({ id })
        if (!existing) return handleCORS(NextResponse.json({ error: 'Program tidak ditemukan' }, { status: 404 }))
        const toArr = (v) => Array.isArray(v) ? v : (v ? String(v).split('\n').map(x => x.trim()).filter(Boolean) : [])
        const update = { updated_at: new Date().toISOString() }
        const strFields = ['category', 'short_desc', 'image', 'video_url']
        for (const k of strFields) if (k in body) update[k] = body[k] || ''
        if ('title' in body) update.title = String(body.title).trim() || existing.title
        if ('story' in body) update.story = toArr(body.story)
        if ('gallery' in body) update.gallery = Array.isArray(body.gallery) ? body.gallery.filter(Boolean) : []
        if ('updates' in body) update.updates = Array.isArray(body.updates) ? body.updates : []
        if ('reports' in body) update.reports = Array.isArray(body.reports) ? body.reports : []
        for (const k of ['target_amount', 'collected_amount', 'donor_count']) if (k in body) update[k] = Number(body[k]) || 0
        if ('deadline' in body) update.deadline = body.deadline || null
        if ('featured' in body) update.featured = !!body.featured
        if ('published' in body) update.published = !!body.published
        await db.collection('campaigns').updateOne({ id }, { $set: update })
        const d = await db.collection('campaigns').findOne({ id })
        return handleCORS(NextResponse.json(clean(d)))
      }
      if (path[0] === 'admin' && path[1] === 'campaigns' && path[2] && method === 'DELETE') {
        const r = await db.collection('campaigns').deleteOne({ id: path[2] })
        return handleCORS(NextResponse.json({ ok: true, deleted: r.deletedCount || 0 }))
      }

      // ---- Home slider settings (admin save) ----
      if (route === '/admin/home-settings' && method === 'POST') {
        const body = await request.json()
        const slides = Array.isArray(body.slides) ? body.slides.map((s) => ({
          id: s.id || uuidv4(),
          type: s.type === 'banner' ? 'banner' : 'campaign',
          image: String(s.image || ''),
          title: String(s.title || ''),
          subtitle: String(s.subtitle || ''),
          badge: String(s.badge || ''),
          link: String(s.link || ''),
          slug: String(s.slug || ''),
        })) : []
        const duration_ms = Number(body.duration_ms) > 0 ? Number(body.duration_ms) : 6000
        await db.collection('settings').updateOne({ id: 'home_settings' }, { $set: { id: 'home_settings', slides, duration_ms, updated_at: new Date().toISOString() } }, { upsert: true })
        return handleCORS(NextResponse.json({ ok: true, slides, duration_ms }))
      }

      // ---- News/Articles CMS ----
      if (route === '/admin/news' && method === 'GET') {
        const items = await db.collection('news').find({}).sort({ createdAt: -1 }).limit(500).toArray()
        return handleCORS(NextResponse.json(cleanArr(items)))
      }
      if (route === '/admin/news' && method === 'POST') {
        const body = await request.json()
        const title = String(body.title || '').trim()
        if (!title) return handleCORS(NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 }))
        let base = slugify(title) || ('news-' + Date.now())
        let slug = base, n = 1
        while (await db.collection('news').findOne({ slug })) { slug = `${base}-${++n}` }
        const doc = {
          id: uuidv4(),
          slug,
          title,
          imageUrl: body.imageUrl || '',
          content: body.content || '',
          category: body.category || 'Berita',
          status: body.status || 'Draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await db.collection('news').insertOne({ ...doc })
        return handleCORS(NextResponse.json(clean(doc)))
      }
      if (path[0] === 'admin' && path[1] === 'news' && path[2] && method === 'PUT') {
        const id = path[2]
        const body = await request.json()
        const existing = await db.collection('news').findOne({ id })
        if (!existing) return handleCORS(NextResponse.json({ error: 'Berita tidak ditemukan' }, { status: 404 }))
        const update = { updatedAt: new Date().toISOString() }
        if ('title' in body) update.title = String(body.title).trim() || existing.title
        if ('imageUrl' in body) update.imageUrl = body.imageUrl
        if ('content' in body) update.content = body.content
        if ('category' in body) update.category = body.category
        if ('status' in body) update.status = body.status
        await db.collection('news').updateOne({ id }, { $set: update })
        const d = await db.collection('news').findOne({ id })
        return handleCORS(NextResponse.json(clean(d)))
      }
      if (path[0] === 'admin' && path[1] === 'news' && path[2] && method === 'DELETE') {
        const r = await db.collection('news').deleteOne({ id: path[2] })
        return handleCORS(NextResponse.json({ ok: true, deleted: r.deletedCount || 0 }))
      }
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', route, error)
    // Most crashes on a DB-less deployment are `db.collection` on null → tell the caller clearly.
    if (!dbPromise && /Cannot read propert(y|ies) of null/.test(String(error))) return noDbResponse()
    return handleCORS(NextResponse.json({ error: 'Internal server error', detail: String(error?.message || error) }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
