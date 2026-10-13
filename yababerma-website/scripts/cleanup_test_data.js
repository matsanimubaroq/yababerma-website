// One-off cleanup: remove test donations & restore campaign figures to seed baseline
const fs = require('fs');
const { MongoClient } = require('mongodb');

function readEnv() {
  const txt = fs.readFileSync('/app/.env', 'utf8');
  const env = {};
  txt.split('\n').forEach((line) => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
  });
  return env;
}

const SEED = {
  'wakaf-al-quran-santri-pelosok': { collected_amount: 87500000, donor_count: 342 },
  'operasional-panti-asuhan-banua-berkah': { collected_amount: 124000000, donor_count: 521 },
  'beasiswa-santri-tpq-banua-berkah': { collected_amount: 41000000, donor_count: 210 },
  'paket-sembako-dhuafa-banjarmasin': { collected_amount: 63000000, donor_count: 480 },
  'zakat-maal-penyaluran-produktif': { collected_amount: 132000000, donor_count: 610 },
  'tanggap-bencana-kalimantan': { collected_amount: 95000000, donor_count: 730 },
  'fidyah-peduli-ramadhan': { collected_amount: 12000000, donor_count: 95 },
  'kurban-peduli-banua': { collected_amount: 45000000, donor_count: 120 },
};

const KURBAN_OPTIONS = [
  { key: 'kambing', name: 'Kambing / Domba', emoji: '\uD83D\uDC10', desc: '1 ekor untuk 1 pekurban', price: 2750000, unit: 'ekor', quota: 50, sold_base: 18 },
  { key: 'sapi-patungan', name: 'Sapi Patungan', emoji: '\uD83D\uDC04', desc: '1 dari 7 bagian (1/7 sapi)', price: 2500000, unit: 'bagian', quota: 70, sold_base: 34 },
  { key: 'sapi-utuh', name: 'Sapi Utuh', emoji: '\uD83D\uDC04', desc: '1 ekor sapi (7 bagian sekaligus)', price: 17500000, unit: 'ekor', quota: 10, sold_base: 3 },
];

(async () => {
  const env = readEnv();
  const client = new MongoClient(env.MONGO_URL);
  await client.connect();
  const db = client.db(env.DB_NAME);

  const delCount = await db.collection('donations').countDocuments();
  await db.collection('donations').deleteMany({});
  console.log('Deleted donations:', delCount);

  const confCount = await db.collection('confirmations').countDocuments();
  await db.collection('confirmations').deleteMany({});
  console.log('Deleted confirmations:', confCount);

  for (const [slug, v] of Object.entries(SEED)) {
    await db.collection('campaigns').updateOne({ slug }, { $set: v });
  }
  await db.collection('campaigns').updateOne({ slug: 'kurban-peduli-banua' }, { $set: { kurban_options: KURBAN_OPTIONS } });
  console.log('Campaigns reset to seed baseline. Kurban options restored.');

  await client.close();
  console.log('DONE');
})().catch((e) => { console.error('Cleanup error:', e); process.exit(1); });
