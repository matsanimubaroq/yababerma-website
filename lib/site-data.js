// Central, client-safe configuration & constants for Yayasan Banua Berkah Mandiri

export const ORG = {
  name: 'Yayasan Banua Berkah Mandiri',
  short: 'YABABERMA',
  tagline: 'Menebar Kebaikan, Memberdayakan Banua',
  logo: 'https://customer-assets-m6fa6gv7.emergentagent.net/job_8686a8aa-42c1-46ab-92c8-1ae6eb1872e2/artifacts/4k17zphv_logo%20yababerma.png',
  ahu: 'AHU-004194.AH.01.04.Tahun 2019',
  founded: 2018,
  founders: ["Bapak Nu'man Rafiq", 'Ibu Saparina Wulandari'],
  address: 'Jl. Banua Berkah, Banjarmasin, Kalimantan Selatan 70000',
  email: 'info@yababerma.org',
  phone: '0878-1810-1175',
  website: 'yababerma.org',
};

// Admin WhatsApp: 0878-1810-1175 -> 6287818101175
export const WHATSAPP_ADMIN = '6287818101175';

// Pesan otomatis saat menekan ikon WhatsApp di footer
export const WA_INQUIRY_MESSAGE = 'Hai, saya ingin bertanya tentang panduan donasi ke panti/yayasan. Boleh bantu saya?';

export const SOCIALS = {
  instagram: 'https://www.instagram.com/yababerma.official/',
  instagram_panti: 'https://www.instagram.com/pantiasuhanbanuaberkah/',
  facebook: 'https://www.facebook.com/share/17xdP66w1E/',
  youtube: 'https://www.youtube.com/@PantiAsuhanBanuaBerkah',
  tiktok: 'https://www.tiktok.com/@pantiasuhan.banuaberkah',
};

// Lokasi lembaga & panti asuhan (link Google Maps = sumber lokasi resmi)
export const LOCATIONS = [
  {
    name: 'Panti Asuhan Banua Berkah – Putra',
    role: 'Panti Putra & Sekretariat Yayasan',
    address: 'Jl. Kinibalu No.44, Teluk Dalam, Kec. Banjarmasin Tengah, Kota Banjarmasin, Kalimantan Selatan 70114',
    maps: 'https://share.google/8S2AlvN2Pxyl9ie4v',
    tag: 'Putra',
    primary: true,
  },
  {
    name: 'Panti Asuhan Banua Berkah – Putri',
    role: 'Panti Asuhan Putri',
    address: 'Gg. Telerama, Antasan Besar, Kec. Banjarmasin Tengah, Kota Banjarmasin, Kalimantan Selatan 70123',
    maps: 'https://share.google/X3J6nNGOk5oziAxiK',
    tag: 'Putri',
    primary: false,
  },
  {
    name: 'Panti Asuhan Banua Berkah – Putri & Balita',
    role: 'Panti Putri & Balita',
    address: 'Kota Banjarmasin, Kalimantan Selatan',
    maps: 'https://share.google/7vpuFLW7SEp3iqRq3',
    tag: 'Putri & Balita',
    primary: false,
  },
];

export const NAV_ITEMS = [
  { label: 'Beranda', href: '/' },
  { label: 'Program', href: '/program' },
  { label: 'Donasi', href: '/donasi' },
  { label: 'Kurban', href: '/kurban' },
  { label: 'Berita & Artikel', href: '/news' },
  { label: 'Kegiatan', href: '/kegiatan' },
  { label: 'Pusat Layanan', href: '/pusat-layanan' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
];

// Bank accounts (a/n YAYASAN BANUA BERKAH MANDIRI)
export const BANKS = [
  { code: 'bsi', name: 'Bank Syariah Indonesia (BSI)', number: '7206758346', pretty: '720.675.8346', holder: 'YAYASAN BANUA BERKAH MANDIRI' },
  { code: 'mandiri', name: 'Bank Mandiri', number: '0310512312318', pretty: '031.05.123.123.18', holder: 'YAYASAN BANUA BERKAH MANDIRI' },
  { code: 'bca', name: 'Bank BCA', number: '0512882020', pretty: '0512.88.2020', holder: 'YAYASAN BANUA BERKAH MANDIRI' },
  { code: 'bri', name: 'Bank BRI', number: '000301002670304', pretty: '000.30.100.2670.304', holder: 'YAYASAN BANUA BERKAH MANDIRI' },
  { code: 'kalsel', name: 'Bank Kalsel', number: '3201783328', pretty: '320.178.3328', holder: 'YAYASAN BANUA BERKAH MANDIRI' },
];

export const CATEGORIES = [
  { value: 'semua', label: 'Semua' },
  { value: 'zakat', label: 'Zakat' },
  { value: 'sedekah', label: 'Sedekah' },
  { value: 'wakaf', label: 'Wakaf' },
  { value: 'fidyah', label: 'Fidyah' },
  { value: 'kurban', label: 'Kurban' },
  { value: 'bencana', label: 'Tanggap Bencana' },
];

export const CATEGORY_LABEL = {
  zakat: 'Zakat', sedekah: 'Sedekah', wakaf: 'Wakaf', fidyah: 'Fidyah', bencana: 'Tanggap Bencana', pendidikan: 'Pendidikan', kurban: 'Kurban',
};

export const HERO_SLIDES = [
  {
    title: 'Bahagiakan Anak Yatim & Dhuafa Banua',
    subtitle: 'Uluran tangan Anda menghadirkan senyum, pendidikan, dan masa depan bagi mereka.',
    image: 'https://images.pexels.com/photos/35105938/pexels-photo-35105938.jpeg',
    slug: 'operasional-panti-asuhan-banua-berkah',
    badge: 'Panti Asuhan',
  },
  {
    title: "Wakaf Al-Qur'an untuk Santri Pelosok",
    subtitle: 'Hadiahkan mushaf Al-Qur\u2019an, alirkan pahala jariyah yang tak pernah putus.',
    image: 'https://images.unsplash.com/photo-1589995635011-078e0bb91d11',
    slug: 'wakaf-al-quran-santri-pelosok',
    badge: 'Wakaf',
  },
  {
    title: 'Paket Sembako untuk Keluarga Dhuafa',
    subtitle: 'Ringankan beban saudara kita di Banjarmasin dengan sekantong keberkahan.',
    image: 'https://images.pexels.com/photos/31679144/pexels-photo-31679144.jpeg',
    slug: 'paket-sembako-dhuafa-banjarmasin',
    badge: 'Sedekah',
  },
];

export const QUICK_SERVICES = [
  { key: 'zakat', title: 'Kalkulator Zakat', desc: 'Hitung zakat penghasilan & maal Anda', icon: 'Calculator', href: '/pusat-layanan#kalkulator' },
  { key: 'wakaf', title: 'Wakaf Online', desc: 'Alirkan pahala jariyah kapan saja', icon: 'BookOpen', href: '/donasi?category=wakaf' },
  { key: 'konsultasi', title: 'Konsultasi Zakat', desc: 'Tanya langsung ke Amil & Ustaz kami', icon: 'MessageCircleQuestion', href: '/pusat-layanan#konsultasi' },
  { key: 'konfirmasi', title: 'Konfirmasi Donasi', desc: 'Kirim bukti transfer Anda di sini', icon: 'ReceiptText', href: '/pusat-layanan#konfirmasi' },
];

export const BERKAH_VALUES = [
  { letter: 'B', title: 'Banua', desc: 'Berakar & berkhidmat untuk kemuliaan tanah Banua Kalimantan.' },
  { letter: 'E', title: 'Empati', desc: 'Hadir dengan hati, merasakan kesulitan sesama.' },
  { letter: 'R', title: 'Responsif', desc: 'Cepat & tepat menjawab kebutuhan umat.' },
  { letter: 'K', title: 'Kemandirian', desc: 'Memberdayakan menuju kemandirian, bukan sekadar memberi.' },
  { letter: 'A', title: 'Amanah', desc: 'Menjaga setiap titipan donatur secara transparan.' },
  { letter: 'H', title: 'Humanis', desc: 'Memuliakan kemanusiaan tanpa memandang latar belakang.' },
];

export const IMPACT_STATS = [
  { value: 3000, suffix: '+', label: 'Penerima Manfaat Kemanusiaan' },
  { value: 2100, suffix: '+', label: "Wakaf Al-Qur'an Tersalurkan" },
  { value: 500, suffix: '+', label: 'Anak Binaan Panti' },
  { value: 200, suffix: '+', label: 'Program Pemberdayaan' },
];

export const LONG_PROGRAMS = [
  { title: 'Panti Asuhan Banua Berkah', desc: 'Pengasuhan, pendidikan, dan tumbuh kembang anak yatim & dhuafa.', image: 'https://images.unsplash.com/photo-1629273229664-11fabc0becc0', slug: 'operasional-panti-asuhan-banua-berkah', tag: 'Sosial' },
  { title: 'TPQ Banua Berkah', desc: 'Pendidikan Al-Qur\u2019an & karakter Islami untuk generasi Banua.', image: 'https://images.pexels.com/photos/20627702/pexels-photo-20627702.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940', slug: 'beasiswa-santri-tpq-banua-berkah', tag: 'Pendidikan' },
  { title: 'Program Dhuafa', desc: 'Bantuan pangan, kesehatan, & ekonomi bagi keluarga kurang mampu.', image: 'https://images.pexels.com/photos/31679144/pexels-photo-31679144.jpeg', slug: 'paket-sembako-dhuafa-banjarmasin', tag: 'Kemanusiaan' },
  { title: "Wakaf Qur'an Pelosok", desc: 'Distribusi mushaf Al-Qur\u2019an hingga ke pelosok Kalimantan.', image: 'https://images.unsplash.com/photo-1589995635011-078e0bb91d11', slug: 'wakaf-al-quran-santri-pelosok', tag: 'Wakaf' },
];

export const PARTNERS = ['BAZNAS', 'Bank Kalsel', 'Kemenag RI', 'Baitulmaal', 'Rumah Zakat', 'Dompet Dhuafa'];

// Nishab standard: 85 gram gold. Assumed gold price per gram (IDR) - editable.
export const GOLD_PRICE_PER_GRAM = 1350000; // Rp
export const NISHAB_GRAM = 85;
export const ZAKAT_RATE = 0.025;

// ---------- helpers ----------
export function formatRupiah(n) {
  const num = Number(n) || 0;
  return 'Rp\u00a0' + num.toLocaleString('id-ID');
}

export function normalizeWa(num) {
  let s = String(num || '').replace(/[^0-9]/g, '');
  if (s.startsWith('0')) s = '62' + s.slice(1);
  if (!s.startsWith('62')) s = '62' + s;
  return s;
}

export function waLink(number, text) {
  return 'https://wa.me/' + normalizeWa(number) + '?text=' + encodeURIComponent(text);
}

export function donationWaMessage({ program, amount, name }) {
  return `Halo Admin YABABERMA, saya telah melakukan donasi untuk ${program} sebesar ${formatRupiah(amount)} atas nama ${name}. Berikut bukti transfernya.`;
}

export function daysLeft(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}
