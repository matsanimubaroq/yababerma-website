import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ---------------- MongoDB ----------------
let dbPromise

async function connectToMongo() {
  if (!dbPromise) {
    const mongoClient = new MongoClient(process.env.MONGO_URL)
    dbPromise = mongoClient.connect().then(async (c) => {
      const database = c.db(process.env.DB_NAME)
      try { await ensureSeed(database) } catch (e) { console.error('Seed error:', e) }
      return database
    }).catch((e) => { dbPromise = undefined; throw e })
  }
  return dbPromise
}

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
        <div style="background:#e6f3fb;border-radius:12px;padding:14px;margin-top:16px;font-size:13px;color:#475569">Mohon selesaikan transfer tepat hingga 3 digit terakhir (kode unik) agar donasi mudah terverifikasi. Setelah transfer, konfirmasi via WhatsApp admin: <b>0858-2811-2032</b>.</div>
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

// ---------------- Seed data ----------------
function daysFromNow(n) { return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString() }

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
      updates: [ { date: daysFromNow(-5), title: 'Penyaluran Tahap 1', text: '250 mushaf telah tersalurkan ke 5 TPQ di Kabupaten Banjar.' }, { date: daysFromNow(-18), title: 'Program Dimulai', text: 'Penggalangan wakaf Al-Qur\u2019an resmi dibuka.' } ],
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
      updates: [ { date: daysFromNow(-3), title: 'Belanja Kebutuhan Bulanan', text: 'Kebutuhan pangan bulan ini telah terpenuhi berkat para donatur.' } ],
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
      updates: [ { date: daysFromNow(-8), title: 'Wisuda Tahfizh', text: '12 santri menuntaskan hafalan Juz 30.' } ],
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
      updates: [ { date: daysFromNow(-2), title: 'Distribusi Pekan Ini', text: '120 paket sembako tersalurkan ke Kelurahan sekitar.' } ],
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
      updates: [ { date: daysFromNow(-10), title: 'Modal Usaha Tersalur', text: '15 mustahik menerima modal usaha mikro.' } ],
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
      updates: [ { date: daysFromNow(-1), title: 'Posko Didirikan', text: 'Posko bantuan berdiri di 3 titik pengungsian.' } ],
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
      updates: [ { date: daysFromNow(-6), title: 'Penyaluran Awal', text: 'Fidyah tersalur kepada 40 penerima.' } ],
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
      updates: [ { date: daysFromNow(-7), title: 'Pendaftaran Dibuka', text: 'Pendaftaran pekurban tahun ini resmi dibuka.' } ],
      kurban_options: [
        { key: 'kambing', name: 'Kambing / Domba', emoji: '\uD83D\uDC10', desc: '1 ekor untuk 1 pekurban', price: 2750000, unit: 'ekor' },
        { key: 'sapi-patungan', name: 'Sapi Patungan', emoji: '\uD83D\uDC04', desc: '1 dari 7 bagian (1/7 sapi)', price: 2500000, unit: 'bagian' },
        { key: 'sapi-utuh', name: 'Sapi Utuh', emoji: '\uD83D\uDC04', desc: '1 ekor sapi (7 bagian sekaligus)', price: 17500000, unit: 'ekor' },
      ],
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

function isAdmin(request) {
  const key = request.headers.get('x-admin-key')
  return !!key && key === process.env.ADMIN_KEY
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
      return handleCORS(NextResponse.json({ message: 'YABABERMA API OK' }))
    }

    // ---- Campaigns ----
    if (route === '/campaigns' && method === 'GET') {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const featured = url.searchParams.get('featured')
      const q = {}
      if (category && category !== 'semua') q.category = category
      if (featured === 'true') q.featured = true
      const items = await db.collection('campaigns').find(q).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }

    if (path[0] === 'campaigns' && path[1] && method === 'GET') {
      const item = await db.collection('campaigns').findOne({ slug: path[1] })
      if (!item) return handleCORS(NextResponse.json({ error: 'Campaign not found' }, { status: 404 }))
      // recent public donations for this campaign
      const donations = await db.collection('donations').find({ campaign_slug: path[1] }).sort({ created_at: -1 }).limit(10).toArray()
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
        payment_method: body.payment_method || 'bsi',
        is_anonymous: !!body.is_anonymous,
        donation_type: body.donation_type || (campaign ? campaign.category : 'sedekah'),
        status: 'pending',
        user_id: currentUser ? currentUser.id : null,
        created_at: new Date().toISOString(),
      }
      await db.collection('donations').insertOne({ ...donation })

      // Optimistically reflect impact on campaign progress (demo behaviour)
      if (campaign) {
        await db.collection('campaigns').updateOne({ slug: campaign.slug }, { $inc: { collected_amount: amount, donor_count: 1 } })
      }

      // Send automatic thank-you + receipt email in the background (non-blocking)
      sendDonationEmail(donation).catch(() => {})

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
      const items = await db.collection('donations').find(q).sort({ created_at: -1 }).toArray()
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
      const { proof_image, ...safe } = conf
      return handleCORS(NextResponse.json({ ok: true, confirmation: safe }))
    }

    // ---- News ----
    if (route === '/news' && method === 'GET') {
      const items = await db.collection('news').find({}).sort({ date: -1 }).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }
    if (path[0] === 'news' && path[1] && method === 'GET') {
      const item = await db.collection('news').findOne({ slug: path[1] })
      if (!item) return handleCORS(NextResponse.json({ error: 'News not found' }, { status: 404 }))
      return handleCORS(NextResponse.json(clean(item)))
    }

    // ---- Testimonials & Gallery ----
    if (route === '/testimonials' && method === 'GET') {
      const items = await db.collection('testimonials').find({}).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }
    if (route === '/gallery' && method === 'GET') {
      const items = await db.collection('gallery').find({}).toArray()
      return handleCORS(NextResponse.json(cleanArr(items)))
    }

    // ---- Stats ----
    if (route === '/stats' && method === 'GET') {
      const campaigns = await db.collection('campaigns').find({}).toArray()
      const total_collected = campaigns.reduce((s, c) => s + (c.collected_amount || 0), 0)
      const total_donations = await db.collection('donations').countDocuments()
      return handleCORS(NextResponse.json({
        humanitarian: 3000, wakaf_quran: 2100, panti: 500, pemberdayaan: 200,
        total_collected, total_donations, active_campaigns: campaigns.length,
      }))
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
      const real = await db.collection('donations').find({ message: { $nin: [null, ''] } }).sort({ created_at: -1 }).limit(20).toArray()
      const realMapped = real.map(d => ({ name: d.is_anonymous ? 'Hamba Allah' : (d.donor_name || 'Hamba Allah'), message: d.message, program: d.campaign_title || '' }))
      const seeded = await db.collection('prayers').find({}).sort({ created_at: -1 }).toArray()
      const seededMapped = seeded.map(p => ({ name: p.name, message: p.message, program: p.program }))
      const all = [...realMapped, ...seededMapped].slice(0, 30)
      return handleCORS(NextResponse.json(all))
    }

    // ---- Admin ----
    if (route === '/admin/login' && method === 'POST') {
      const body = await request.json()
      if (!body.key || body.key !== process.env.ADMIN_KEY) return handleCORS(NextResponse.json({ error: 'Kunci admin salah' }, { status: 401 }))
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route.startsWith('/admin')) {
      if (!isAdmin(request)) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

      if (route === '/admin/summary' && method === 'GET') {
        const donations = await db.collection('donations').find({}).toArray()
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
        return handleCORS(NextResponse.json({ ok: true, donation: d ? clean(d) : null }))
      }
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
