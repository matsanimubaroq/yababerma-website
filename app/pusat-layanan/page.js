'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import ZakatCalculator from '@/components/site/zakat-calculator';
import { BANKS, WHATSAPP_ADMIN, ORG, waLink } from '@/lib/site-data';
import { Calculator, MessageCircleQuestion, ReceiptText, MapPin, Phone, Mail, Clock, Loader2, Upload, MessageCircle, CheckCircle2 } from 'lucide-react';

const INIT = { name: '', whatsapp: '', bank: 'bsi', amount: '', program: '', note: '', proof_image: null, proof_name: null };

export default function PusatLayananPage() {
  const [form, setForm] = useState(INIT);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) return toast.error('Ukuran file maksimal 3MB');
    const reader = new FileReader();
    reader.onload = () => setForm((s) => ({ ...s, proof_image: reader.result, proof_name: f.name }));
    reader.readAsDataURL(f);
    setFileName(f.name);
  };

  const submit = async () => {
    if (!form.name || !form.whatsapp || !form.amount) return toast.error('Lengkapi nama, WhatsApp, dan nominal');
    setLoading(true);
    try {
      const r = await fetch('/api/confirmations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await r.json();
      if (r.ok) { toast.success('Konfirmasi terkirim! Tim kami akan segera memverifikasi.'); setForm(INIT); setFileName(''); }
      else toast.error(d.error || 'Gagal mengirim konfirmasi');
    } catch { toast.error('Terjadi kesalahan jaringan'); }
    finally { setLoading(false); }
  };

  const consultWa = waLink(WHATSAPP_ADMIN, 'Halo Admin YABABERMA, saya ingin berkonsultasi mengenai zakat.');

  return (
    <div>
      <section className="bg-brand-slatebg border-b border-border">
        <div className="container py-14 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm mb-3"><Calculator className="w-5 h-5" />Pusat Layanan</div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-ink">Layanan Zakat &amp; Donasi</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Hitung zakat, konsultasi dengan amil kami, dan konfirmasikan donasi Anda dengan mudah.</p>
        </div>
      </section>

      {/* KALKULATOR */}
      <section id="kalkulator" className="container py-14 scroll-mt-24">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2">Kalkulator Zakat</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-ink">Hitung Zakat Anda dengan Tepat</h2>
            <p className="text-muted-foreground mt-3">Tunaikan kewajiban zakat sesuai syariat. Hasil perhitungan dapat langsung Anda tunaikan melalui program penyaluran zakat kami.</p>
            <div className="mt-6 space-y-3">
              {['Sesuai standar Nishab 85 gram emas', 'Perhitungan otomatis kadar 2,5%', 'Langsung tersambung ke penyaluran zakat produktif'].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-brand-ink"><CheckCircle2 className="w-5 h-5 text-brand-green" />{t}</div>
              ))}
            </div>
          </div>
          <ZakatCalculator />
        </div>
      </section>

      {/* KONSULTASI + KONFIRMASI SHORTCUT */}
      <section className="bg-brand-slatebg">
        <div className="container py-14 grid md:grid-cols-2 gap-6">
          <Card id="konsultasi" className="rounded-2xl p-7 border-border bg-white scroll-mt-24">
            <div className="w-12 h-12 rounded-xl bg-brand-bluelight flex items-center justify-center mb-4"><MessageCircleQuestion className="w-6 h-6 text-brand-blue" /></div>
            <h3 className="font-heading font-bold text-xl text-brand-ink">Konsultasi Zakat</h3>
            <p className="text-muted-foreground mt-2 text-sm">Bingung menghitung atau menyalurkan zakat? Konsultasikan langsung dengan Ustaz &amp; Amil yayasan kami secara gratis.</p>
            <a href={consultWa} target="_blank" rel="noopener noreferrer" className="block mt-5">
              <Button className="rounded-xl bg-[#25D366] hover:bg-[#1eb659] text-white"><MessageCircle className="w-4 h-4 mr-2" />Chat Amil via WhatsApp</Button>
            </a>
          </Card>

          <Card className="rounded-2xl p-7 border-border bg-white">
            <div className="w-12 h-12 rounded-xl bg-brand-greenlight flex items-center justify-center mb-4"><ReceiptText className="w-6 h-6 text-brand-green" /></div>
            <h3 className="font-heading font-bold text-xl text-brand-ink">Sudah Berdonasi?</h3>
            <p className="text-muted-foreground mt-2 text-sm">Lupa konfirmasi via WhatsApp? Kirim bukti transfer Anda melalui form konfirmasi manual di bawah ini agar donasi segera terverifikasi.</p>
            <a href="#konfirmasi" className="block mt-5"><Button variant="outline" className="rounded-xl">Isi Form Konfirmasi</Button></a>
          </Card>
        </div>
      </section>

      {/* KONFIRMASI FORM */}
      <section id="konfirmasi" className="container py-14 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2">Konfirmasi Donasi</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-ink">Form Konfirmasi Transfer Manual</h2>
          </div>
          <Card className="rounded-2xl p-6 md:p-8 border-border bg-white shadow-sm space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="text-sm">Nama Lengkap *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" placeholder="Nama Anda" /></div>
              <div><Label className="text-sm">Nomor WhatsApp *</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="rounded-xl mt-1" placeholder="08xxxxxxxxxx" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Bank Tujuan Transfer</Label>
                <Select value={form.bank} onValueChange={(v) => setForm({ ...form, bank: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{BANKS.map((b) => <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm">Nominal Transfer *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="rounded-xl mt-1" placeholder="Contoh: 100000" /></div>
            </div>
            <div><Label className="text-sm">Program yang Didonasikan</Label><Input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} className="rounded-xl mt-1" placeholder="Contoh: Wakaf Al-Qur'an" /></div>
            <div><Label className="text-sm">Catatan / Pesan</Label><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="rounded-xl mt-1" placeholder="Tanggal & keterangan transfer..." /></div>
            <div>
              <Label className="text-sm">Unggah Bukti Transfer</Label>
              <label className="mt-1 flex items-center gap-3 rounded-xl border border-dashed border-border p-4 cursor-pointer hover:border-brand-green/50 transition">
                <Upload className="w-5 h-5 text-brand-green" />
                <span className="text-sm text-muted-foreground">{fileName || 'Klik untuk memilih gambar (maks. 3MB)'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>
            </div>
            <Button onClick={submit} disabled={loading} className="w-full rounded-xl h-12">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Konfirmasi Donasi'}</Button>
          </Card>
        </div>
      </section>

      {/* KANTOR LAYANAN */}
      <section className="bg-brand-slatebg">
        <div className="container py-14 grid lg:grid-cols-2 gap-8 items-stretch">
          <div>
            <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" />Kantor Layanan</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-ink">Kunjungi Kami di Banjarmasin</h2>
            <div className="mt-6 space-y-4">
              <div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-brand-greenlight flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-brand-green" /></div><div><p className="font-semibold text-brand-ink text-sm">Alamat</p><p className="text-muted-foreground text-sm">{ORG.address}</p></div></div>
              <div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-brand-greenlight flex items-center justify-center shrink-0"><Phone className="w-5 h-5 text-brand-green" /></div><div><p className="font-semibold text-brand-ink text-sm">Telepon / WhatsApp</p><p className="text-muted-foreground text-sm">{ORG.phone}</p></div></div>
              <div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-brand-greenlight flex items-center justify-center shrink-0"><Mail className="w-5 h-5 text-brand-green" /></div><div><p className="font-semibold text-brand-ink text-sm">Email</p><p className="text-muted-foreground text-sm">{ORG.email}</p></div></div>
              <div className="flex gap-3"><div className="w-10 h-10 rounded-xl bg-brand-greenlight flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-brand-green" /></div><div><p className="font-semibold text-brand-ink text-sm">Jam Operasional</p><p className="text-muted-foreground text-sm">Senin - Sabtu, 08.00 - 17.00 WITA</p></div></div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-card min-h-[320px] border border-border">
            <iframe title="Peta Kantor" src="https://www.google.com/maps?q=Banjarmasin,Kalimantan%20Selatan&output=embed" className="w-full h-full min-h-[320px]" loading="lazy" />
          </div>
        </div>
      </section>
    </div>
  );
}
