'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Check, Copy, Loader2, ArrowLeft, Heart, ShieldCheck, MessageCircle, PartyPopper, Award, BookOpen, FileText, Gift, Share2 } from 'lucide-react';
import { BANKS, WHATSAPP_ADMIN, formatRupiah, waLink, donationWaMessage } from '@/lib/site-data';
import { isKurbanDonation, downloadKurbanCertificate, isWakafDonation, downloadWakafCertificate, isZakatDonation, downloadZakatReceipt } from '@/lib/receipts';
import { downloadGreetingCard, shareGreetingWhatsApp } from '@/lib/greeting-card';

const QUICK = [10000, 50000, 100000, 250000, 500000, 1000000];

export function DonationDialog({ open, setOpen, campaign, presetAmount, presetType, kurbanOption, kurbanQty }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(presetAmount || 0);
  const [custom, setCustom] = useState(presetAmount ? String(presetAmount) : '');
  const [form, setForm] = useState({ donor_name: '', donor_email: '', donor_whatsapp: '', message: '' });
  const [anon, setAnon] = useState(false);
  const [bank, setBank] = useState('bsi');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setResult(null);
      if (presetAmount) { setAmount(presetAmount); setCustom(String(presetAmount)); }
    }
  }, [open, presetAmount]);

  const selectedBank = BANKS.find((b) => b.code === bank) || BANKS[0];
  const finalAmount = custom ? Number(custom) : amount;

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const submitDonation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campaign_slug: campaign?.slug || null,
          campaign_title: campaign?.title || (presetType ? `Zakat ${presetType}` : 'Donasi Umum'),
          amount: finalAmount,
          donor_name: form.donor_name,
          donor_email: form.donor_email,
          donor_whatsapp: form.donor_whatsapp,
          message: form.message,
          payment_method: bank,
          is_anonymous: anon,
          donation_type: presetType || campaign?.category,
          kurban_option: kurbanOption || null,
          kurban_qty: kurbanQty || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Gagal membuat donasi'); return; }
      setResult(data);
      setStep(4);
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Nomor rekening disalin'); };

  const waHref = result
    ? waLink(WHATSAPP_ADMIN, donationWaMessage({ program: result.campaign_title, amount: result.total_amount, name: anon ? 'Hamba Allah' : form.donor_name }))
    : '#';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="p-5 pb-4 border-b border-border bg-brand-greenlight/50 text-left space-y-1">
          <DialogTitle className="flex items-center gap-2 text-brand-ink">
            <Heart className="w-5 h-5 text-brand-green" />
            {step < 4 ? 'Tunaikan Donasi' : 'Selesaikan Pembayaran'}
          </DialogTitle>
          {campaign && <p className="text-sm text-muted-foreground line-clamp-1">{campaign.title}</p>}
        </DialogHeader>

        {step < 4 && (
          <div className="flex gap-1.5 px-5 pt-4">
            {[1, 2, 3].map((s) => (<div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-brand-green' : 'bg-muted'}`} />))}
          </div>
        )}

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-brand-ink">Pilih nominal donasi</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK.map((v) => (
                  <button key={v} onClick={() => { setCustom(String(v)); setAmount(v); }} className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${Number(custom) === v ? 'border-brand-green bg-brand-greenlight text-brand-green' : 'border-border hover:border-brand-green/50'}`}>{formatRupiah(v)}</button>
                ))}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Atau masukkan nominal lain</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                  <Input type="number" value={custom} onChange={(e) => setCustom(e.target.value)} className="pl-9 rounded-xl" placeholder="0" />
                </div>
              </div>
              <Button className="w-full rounded-xl" disabled={!finalAmount || finalAmount < 1000} onClick={next}>Lanjutkan</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div><Label className="text-sm">Nama Lengkap *</Label><Input value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} placeholder="Nama Anda" className="rounded-xl mt-1" /></div>
              <div><Label className="text-sm">Email</Label><Input type="email" value={form.donor_email} onChange={(e) => setForm({ ...form, donor_email: e.target.value })} placeholder="email@contoh.com" className="rounded-xl mt-1" /></div>
              <div><Label className="text-sm">Nomor WhatsApp *</Label><Input value={form.donor_whatsapp} onChange={(e) => setForm({ ...form, donor_whatsapp: e.target.value })} placeholder="08xxxxxxxxxx" className="rounded-xl mt-1" /></div>
              <div><Label className="text-sm">Doa / Pesan</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tuliskan doa atau harapan Anda..." rows={3} className="rounded-xl mt-1" /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground">
                <Checkbox checked={anon} onCheckedChange={(v) => setAnon(!!v)} /> Sembunyikan nama saya (tampil sebagai Hamba Allah)
              </label>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="rounded-xl" onClick={back}><ArrowLeft className="w-4 h-4" /></Button>
                <Button className="flex-1 rounded-xl" disabled={!form.donor_name || !form.donor_whatsapp} onClick={next}>Lanjutkan</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-brand-ink">Pilih metode transfer bank</p>
              <div className="space-y-2">
                {BANKS.map((b) => (
                  <button key={b.code} onClick={() => setBank(b.code)} className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${bank === b.code ? 'border-brand-green bg-brand-greenlight' : 'border-border hover:border-brand-green/50'}`}>
                    <span className="text-sm font-medium">{b.name}</span>
                    {bank === b.code && <Check className="w-4 h-4 text-brand-green" />}
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-muted p-3 text-sm flex justify-between"><span className="text-muted-foreground">Nominal Donasi</span><span className="font-semibold text-brand-ink">{formatRupiah(finalAmount)}</span></div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="rounded-xl" onClick={back}><ArrowLeft className="w-4 h-4" /></Button>
                <Button className="flex-1 rounded-xl" disabled={loading} onClick={submitDonation}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lanjut ke Pembayaran'}</Button>
              </div>
            </div>
          )}

          {step === 4 && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-green bg-brand-greenlight rounded-xl p-3 text-sm">
                <PartyPopper className="w-5 h-5" /> Donasi tercatat! Selesaikan transfer di bawah ini.
              </div>
              <div className="rounded-xl bg-brand-greenlight/60 p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Transfer</p>
                <p className="text-3xl font-bold text-brand-green">{formatRupiah(result.total_amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">Termasuk kode unik <span className="font-semibold text-brand-ink">{result.unique_code}</span></p>
              </div>
              <div className="rounded-xl border border-border p-4 space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bank Tujuan</span><span className="font-medium">{selectedBank.name}</span></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">No. Rekening</span>
                  <button onClick={() => copy(selectedBank.number)} className="font-semibold flex items-center gap-1.5 text-brand-ink hover:text-brand-green">{selectedBank.pretty}<Copy className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex justify-between text-sm gap-4"><span className="text-muted-foreground shrink-0">Atas Nama</span><span className="font-medium text-right">{selectedBank.holder}</span></div>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-brand-bluelight/50 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                Mohon transfer tepat hingga 3 digit terakhir (kode unik) agar donasi Anda mudah diverifikasi.
              </div>
              <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(() => setOpen(false), 500)} className="block">
                <Button className="w-full rounded-xl bg-[#25D366] hover:bg-[#1eb659] text-white h-12 text-base font-semibold"><MessageCircle className="w-5 h-5 mr-2" />Konfirmasi via WhatsApp</Button>
              </a>
              {isKurbanDonation(result) && (
                <Button variant="outline" onClick={() => downloadKurbanCertificate(result)} className="w-full rounded-xl border-brand-green text-brand-green hover:bg-brand-greenlight"><Award className="w-4 h-4 mr-2" />Unduh Sertifikat Kurban</Button>
              )}
              {!isKurbanDonation(result) && isWakafDonation(result) && (
                <Button variant="outline" onClick={() => downloadWakafCertificate(result)} className="w-full rounded-xl border-brand-blue text-brand-blue hover:bg-brand-bluelight"><BookOpen className="w-4 h-4 mr-2" />Unduh Sertifikat Wakaf</Button>
              )}
              {!isKurbanDonation(result) && !isWakafDonation(result) && isZakatDonation(result) && (
                <Button variant="outline" onClick={() => downloadZakatReceipt(result)} className="w-full rounded-xl border-brand-green text-brand-green hover:bg-brand-greenlight"><FileText className="w-4 h-4 mr-2" />Unduh Bukti Setor Zakat (BSZ)</Button>
              )}

              <div className="pt-1">
                <div className="flex items-center gap-3 my-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Bagikan Kebaikan</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant="outline" onClick={() => downloadGreetingCard(result)} className="rounded-xl border-brand-green text-brand-green hover:bg-brand-greenlight"><Gift className="w-4 h-4 mr-2" />Kartu Ucapan</Button>
                  <Button variant="outline" onClick={() => shareGreetingWhatsApp(result)} className="rounded-xl border-[#25D366] text-[#128C4B] hover:bg-[#25D366]/10"><Share2 className="w-4 h-4 mr-2" />Bagikan</Button>
                </div>
              </div>

              <button className="w-full text-center text-sm text-muted-foreground hover:text-brand-ink" onClick={() => setOpen(false)}>Nanti saja, tutup</button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DonateButton({ campaign, presetAmount, presetType, kurbanOption, kurbanQty, className, children, size, variant, disabled }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className={className} size={size} variant={variant} disabled={disabled}>{children || 'Donasi Sekarang'}</Button>
      <DonationDialog open={open} setOpen={setOpen} campaign={campaign} presetAmount={presetAmount} presetType={presetType} kurbanOption={kurbanOption} kurbanQty={kurbanQty} />
    </>
  );
}
