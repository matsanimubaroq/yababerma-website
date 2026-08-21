// Client-side document generators (run only on user click, use window/print)

const LOGO = 'https://customer-assets-m6fa6gv7.emergentagent.net/job_8686a8aa-42c1-46ab-92c8-1ae6eb1872e2/artifacts/4k17zphv_logo%20yababerma.png';

function terbilang(x) {
  const n = Math.floor(Math.abs(Number(x) || 0));
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  let s = '';
  if (n < 12) s = satuan[n];
  else if (n < 20) s = terbilang(n - 10) + ' belas';
  else if (n < 100) s = terbilang(Math.floor(n / 10)) + ' puluh ' + terbilang(n % 10);
  else if (n < 200) s = 'seratus ' + terbilang(n - 100);
  else if (n < 1000) s = terbilang(Math.floor(n / 100)) + ' ratus ' + terbilang(n % 100);
  else if (n < 2000) s = 'seribu ' + terbilang(n - 1000);
  else if (n < 1000000) s = terbilang(Math.floor(n / 1000)) + ' ribu ' + terbilang(n % 1000);
  else if (n < 1000000000) s = terbilang(Math.floor(n / 1000000)) + ' juta ' + terbilang(n % 1000000);
  else if (n < 1000000000000) s = terbilang(Math.floor(n / 1000000000)) + ' miliar ' + terbilang(n % 1000000000);
  else s = terbilang(Math.floor(n / 1000000000000)) + ' triliun ' + terbilang(n % 1000000000000);
  return s.replace(/\s+/g, ' ').trim();
}
function terbilangRupiah(n) {
  const t = terbilang(n);
  const cap = t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Nol';
  return cap + ' rupiah';
}

export function isZakatDonation(d) {
  const s = (x) => String(x || '').toLowerCase();
  return !!d && (s(d.donation_type) === 'zakat' || s(d.donation_type).includes('zakat') || s(d.campaign_slug).includes('zakat') || s(d.campaign_title).includes('zakat'));
}

export function downloadZakatReceipt(d) {
  const w = window.open('', '_blank');
  if (!w) return;
  const date = new Date(d.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = d.is_anonymous ? (d.donor_name || 'Hamba Allah') : (d.donor_name || 'Hamba Allah');
  const ref = d.id || '-';
  const jenis = (d.donation_type && String(d.donation_type).toLowerCase().includes('zakat')) ? d.donation_type : 'Zakat';
  const noBsz = 'BSZ/' + String(ref).slice(0, 8).toUpperCase() + '/' + new Date(d.created_at || Date.now()).getFullYear();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Bukti Setoran Zakat - ${name}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Arial, Helvetica, sans-serif; color:#1E293B; }
    .page { width:794px; min-height:1123px; margin:auto; padding:56px; position:relative; }
    .head { display:flex; align-items:center; gap:16px; border-bottom:3px solid #00A651; padding-bottom:18px; }
    .head img { width:66px; height:66px; object-fit:contain; }
    .head h1 { margin:0; font-size:19px; color:#00A651; }
    .head .sub { font-size:11px; color:#64748b; line-height:1.5; }
    .title { text-align:center; margin:34px 0 4px; }
    .title h2 { margin:0; font-size:22px; letter-spacing:1px; }
    .no { text-align:center; color:#64748b; font-size:13px; margin-bottom:24px; }
    table { width:100%; border-collapse:collapse; font-size:14px; }
    td { padding:11px 6px; border-bottom:1px solid #e2e8f0; vertical-align:top; }
    td.k { color:#64748b; width:38%; }
    .amount { font-size:20px; font-weight:800; color:#00A651; }
    .terbilang { font-style:italic; color:#334155; }
    .badge { display:inline-block; background:#e6f7ee; color:#00A651; padding:4px 12px; border-radius:999px; font-weight:700; font-size:12px; }
    .note { margin-top:26px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; font-size:12px; color:#475569; line-height:1.7; }
    .sign { margin-top:40px; display:flex; justify-content:flex-end; text-align:center; }
    .sign .box { width:230px; font-size:13px; }
    .foot { position:absolute; bottom:48px; left:56px; right:56px; text-align:center; font-size:11px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:12px; }
  </style></head><body>
    <div class="page">
      <div class="head">
        <img src="${LOGO}"/>
        <div>
          <h1>YAYASAN BANUA BERKAH MANDIRI</h1>
          <div class="sub">Unit Pengumpul &amp; Penyalur Zakat (UPZ)<br/>Banjarmasin, Kalimantan Selatan &bull; Akta Kemenkumham: AHU-004194.AH.01.04.Tahun 2019</div>
        </div>
      </div>
      <div class="title"><h2>BUKTI SETORAN ZAKAT</h2></div>
      <div class="no">Nomor: ${noBsz}</div>
      <table>
        <tr><td class="k">Telah diterima dari (Muzakki)</td><td><b>${name}</b></td></tr>
        <tr><td class="k">NPWZ Muzakki</td><td>${d.npwz || '-'}</td></tr>
        <tr><td class="k">Jenis Zakat</td><td><span class="badge">${jenis}</span></td></tr>
        <tr><td class="k">Jumlah Setoran</td><td class="amount">Rp ${(Number(d.amount) || 0).toLocaleString('id-ID')}</td></tr>
        <tr><td class="k">Terbilang</td><td class="terbilang">${terbilangRupiah(d.amount)}</td></tr>
        <tr><td class="k">Tanggal Setor</td><td>${date}</td></tr>
        <tr><td class="k">No. Referensi</td><td>${ref}</td></tr>
      </table>
      <div class="note">
        Bukti Setoran Zakat (BSZ) ini sah dikeluarkan oleh Yayasan Banua Berkah Mandiri. Sesuai <b>UU No. 23 Tahun 2011</b> tentang Pengelolaan Zakat dan <b>PP No. 60 Tahun 2010</b>, zakat yang dibayarkan kepada lembaga amil zakat resmi dapat menjadi <b>pengurang penghasilan kena pajak (PKP)</b>. Simpan bukti ini untuk pelaporan pajak Anda.
      </div>
      <div class="sign">
        <div class="box">Banjarmasin, ${date}<br/>Amil / Petugas UPZ<br/><br/><br/><b>Yayasan Banua Berkah Mandiri</b></div>
      </div>
      <div class="foot">Jazaakumullahu khairan. Semoga zakat Anda menyucikan harta &amp; menjadi keberkahan. &copy; 2026 Yayasan Banua Berkah Mandiri</div>
    </div>
    <script>setTimeout(function(){ window.print(); }, 500);</script>
  </body></html>`);
  w.document.close();
  w.focus();
}

export function isKurbanDonation(d) {
  const s = (x) => String(x || '').toLowerCase();
  return !!d && (d.campaign_slug === 'kurban-peduli-banua' || s(d.donation_type).includes('kurban') || s(d.campaign_title).includes('kurban'));
}

export function downloadKurbanCertificate(d) {
  const w = window.open('', '_blank');
  if (!w) return;
  const date = new Date(d.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const jenis = (d.donation_type && String(d.donation_type).toLowerCase().includes('kurban')) ? d.donation_type : (d.campaign_title || 'Kurban Peduli Banua');
  const name = d.donor_name || 'Hamba Allah';
  const ref = d.id || '-';
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Sertifikat Kurban - ${name}</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Georgia, 'Times New Roman', serif; color:#1E293B; background:#fff; }
    .cert { width: 1122px; height: 793px; margin:auto; position:relative; padding:48px; }
    .frame { position:absolute; inset:22px; border:3px solid #00A651; border-radius:14px; }
    .frame:before { content:''; position:absolute; inset:8px; border:1px solid #0082C8; border-radius:10px; }
    .inner { position:relative; height:100%; display:flex; flex-direction:column; align-items:center; text-align:center; padding:44px 80px; }
    img.logo { width:84px; height:84px; object-fit:contain; }
    .org { color:#00A651; font-weight:bold; letter-spacing:1px; margin-top:8px; font-size:16px; }
    .sub { color:#64748b; font-size:12px; }
    h1 { font-size:42px; margin:20px 0 2px; color:#0082C8; letter-spacing:7px; }
    .line { width:120px; height:3px; background:#00A651; margin:8px auto 20px; border-radius:2px; }
    .to { color:#475569; font-size:14px; }
    .name { font-size:34px; color:#1E293B; font-weight:bold; margin:12px 0; border-bottom:2px dotted #cbd5e1; padding:0 40px 10px; }
    .desc { color:#475569; font-size:15px; max-width:680px; line-height:1.7; margin-top:10px; }
    .badge { display:inline-block; background:#e6f7ee; color:#00A651; padding:7px 18px; border-radius:999px; font-weight:bold; margin-top:16px; font-family: Arial, sans-serif; font-size:13px; }
    .quote { font-style:italic; color:#94a3b8; margin-top:18px; font-size:13px; }
    .foot { position:absolute; bottom:64px; left:80px; right:80px; display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; color:#64748b; }
  </style></head><body>
    <div class="cert"><div class="frame"></div>
      <div class="inner">
        <img class="logo" src="${LOGO}"/>
        <div class="org">YAYASAN BANUA BERKAH MANDIRI</div>
        <div class="sub">Filantropi Islam &amp; Kemanusiaan &bull; Banjarmasin</div>
        <h1>SERTIFIKAT KURBAN</h1><div class="line"></div>
        <div class="to">Dengan penuh syukur, sertifikat ini diberikan kepada Pekurban:</div>
        <div class="name">${name}</div>
        <div class="desc">Telah menunaikan ibadah kurban <b>${jenis}</b> melalui program <b>Kurban Peduli Banua</b>. Semoga Allah SWT menerima amal ibadah kurban Anda dan menjadikannya sebagai amal saleh yang berlipat ganda pahalanya.</div>
        <div class="badge">${jenis}</div>
        <div class="quote">&ldquo;Maka laksanakanlah salat karena Tuhanmu, dan berkurbanlah.&rdquo; (QS. Al-Kautsar: 2)</div>
        <div class="foot">
          <div style="text-align:left">No. Sertifikat<br/><b>${ref}</b></div>
          <div style="text-align:center">Banjarmasin, ${date}<br/><br/><b>Pengurus Yayasan</b><br/>Banua Berkah Mandiri</div>
        </div>
      </div>
    </div>
    <script>setTimeout(function(){ window.print(); }, 500);</script>
  </body></html>`);
  w.document.close();
  w.focus();
}

export function isWakafDonation(d) {
  const s = (x) => String(x || '').toLowerCase();
  return !!d && (d.campaign_slug === 'wakaf-al-quran-santri-pelosok' || s(d.donation_type) === 'wakaf' || s(d.donation_type).includes('wakaf') || s(d.campaign_title).includes('wakaf') || s(d.campaign_title).includes("qur'an") || s(d.campaign_title).includes('quran'));
}

export function downloadWakafCertificate(d) {
  const w = window.open('', '_blank');
  if (!w) return;
  const date = new Date(d.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const name = d.donor_name || 'Hamba Allah';
  const ref = d.id || '-';
  const mushaf = Math.max(1, Math.round((Number(d.amount) || 0) / 150000));
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Sertifikat Wakaf - ${name}</title>
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Georgia, 'Times New Roman', serif; color:#1E293B; background:#fff; }
    .cert { width: 1122px; height: 793px; margin:auto; position:relative; padding:48px; }
    .frame { position:absolute; inset:22px; border:3px solid #0082C8; border-radius:14px; }
    .frame:before { content:''; position:absolute; inset:8px; border:1px solid #00A651; border-radius:10px; }
    .inner { position:relative; height:100%; display:flex; flex-direction:column; align-items:center; text-align:center; padding:44px 80px; }
    img.logo { width:84px; height:84px; object-fit:contain; }
    .org { color:#00A651; font-weight:bold; letter-spacing:1px; margin-top:8px; font-size:16px; }
    .sub { color:#64748b; font-size:12px; }
    h1 { font-size:36px; margin:20px 0 2px; color:#0082C8; letter-spacing:5px; }
    .line { width:120px; height:3px; background:#0082C8; margin:8px auto 20px; border-radius:2px; }
    .to { color:#475569; font-size:14px; }
    .name { font-size:34px; color:#1E293B; font-weight:bold; margin:12px 0; border-bottom:2px dotted #cbd5e1; padding:0 40px 10px; }
    .desc { color:#475569; font-size:15px; max-width:700px; line-height:1.7; margin-top:10px; }
    .badge { display:inline-block; background:#e6f3fb; color:#0082C8; padding:7px 18px; border-radius:999px; font-weight:bold; margin-top:16px; font-family: Arial, sans-serif; font-size:13px; }
    .quote { font-style:italic; color:#94a3b8; margin-top:18px; font-size:13px; }
    .foot { position:absolute; bottom:64px; left:80px; right:80px; display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; color:#64748b; }
  </style></head><body>
    <div class="cert"><div class="frame"></div>
      <div class="inner">
        <img class="logo" src="${LOGO}"/>
        <div class="org">YAYASAN BANUA BERKAH MANDIRI</div>
        <div class="sub">Filantropi Islam &amp; Kemanusiaan &bull; Banjarmasin</div>
        <h1>SERTIFIKAT WAKAF AL-QUR'AN</h1><div class="line"></div>
        <div class="to">Sertifikat wakaf ini dengan tulus diberikan kepada Wakif:</div>
        <div class="name">${name}</div>
        <div class="desc">Telah menunaikan <b>Wakaf Al-Qur'an</b> (setara <b>${mushaf} mushaf</b>) untuk santri di pelosok Kalimantan melalui program <b>Wakaf Al-Qur'an untuk Santri Pelosok</b>. Semoga setiap huruf yang dibaca menjadi aliran pahala jariyah yang tak pernah terputus untuk Anda.</div>
        <div class="badge">Wakaf Al-Qur'an &bull; \u00b1 ${mushaf} Mushaf</div>
        <div class="quote">&ldquo;Apabila manusia meninggal, terputuslah amalnya kecuali tiga: sedekah jariyah, ilmu yang bermanfaat, dan anak saleh yang mendoakannya.&rdquo; (HR. Muslim)</div>
        <div class="foot">
          <div style="text-align:left">No. Sertifikat<br/><b>${ref}</b></div>
          <div style="text-align:center">Banjarmasin, ${date}<br/><br/><b>Pengurus Yayasan</b><br/>Banua Berkah Mandiri</div>
        </div>
      </div>
    </div>
    <script>setTimeout(function(){ window.print(); }, 500);</script>
  </body></html>`);
  w.document.close();
  w.focus();
}
