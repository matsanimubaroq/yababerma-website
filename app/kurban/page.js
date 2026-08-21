'use client';

import { useState } from 'react';
import { useApi } from '@/components/site/use-api';
import { DonateButton } from '@/components/site/donation-modal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, daysLeft } from '@/lib/site-data';
import { Minus, Plus, CheckCircle2, Sparkles, Users, Clock } from 'lucide-react';

export default function KurbanPage() {
  const { data: c } = useApi('/api/campaigns/kurban-peduli-banua');
  const [qty, setQty] = useState({});
  const getQty = (k) => qty[k] || 1;
  const setQ = (k, v) => setQty((s) => ({ ...s, [k]: Math.max(1, Math.min(99, v)) }));
  const options = (c && c.kurban_options) || [];
  const pct = c ? Math.min(Math.round((c.collected_amount / c.target_amount) * 100), 100) : 0;

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-brand-ink text-white overflow-hidden">
        {c && <img src={c.image} alt="Kurban" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
        <div className="container relative py-16 md:py-24">
          <Badge className="bg-brand-green hover:bg-brand-green text-white border-0 mb-4"><Sparkles className="w-3.5 h-3.5 mr-1" />Program Musiman</Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold max-w-2xl leading-tight">Kurban Peduli Banua {new Date().getFullYear()}</h1>
          <p className="text-white/85 mt-4 max-w-xl text-lg">Tunaikan ibadah kurban Anda, dagingnya kami salurkan untuk yatim &amp; dhuafa hingga pelosok Kalimantan. Amanah, tepat sasaran, berdokumentasi lengkap.</p>
          {c && (
            <div className="mt-8 max-w-md bg-white/10 backdrop-blur rounded-2xl p-5">
              <div className="flex justify-between text-sm mb-2"><span className="text-white/80">Terkumpul</span><span className="font-bold">{formatRupiah(c.collected_amount)}</span></div>
              <Progress value={pct} className="h-2" />
              <div className="flex items-center gap-4 text-xs text-white/80 mt-3">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.donor_count} pekurban</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{daysLeft(c.deadline)} hari lagi</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* OPTIONS */}
      <section className="container py-14">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2">Pilih Hewan Kurban</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-ink">Mudah, Amanah, &amp; Sesuai Syariat</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {options.length === 0 && Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-80" />)}
          {options.map((opt) => {
            const q = getQty(opt.key);
            const total = opt.price * q;
            return (
              <Card key={opt.key} className="rounded-2xl p-6 border-border hover:shadow-card transition-all duration-300 flex flex-col">
                <div className="text-5xl">{opt.emoji}</div>
                <h3 className="font-heading font-bold text-xl text-brand-ink mt-3">{opt.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
                <div className="mt-4 text-2xl font-extrabold text-brand-green">{formatRupiah(opt.price)}<span className="text-sm font-medium text-muted-foreground">/{opt.unit}</span></div>

                <div className="flex items-center justify-between mt-5">
                  <span className="text-sm text-muted-foreground">Jumlah</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQ(opt.key, q - 1)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:border-brand-green"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-bold text-brand-ink">{q}</span>
                    <button onClick={() => setQ(opt.key, q + 1)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:border-brand-green"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-bold text-brand-ink">{formatRupiah(total)}</span>
                </div>

                <DonateButton campaign={c} presetAmount={total} presetType={`Kurban ${opt.name} (${q} ${opt.unit})`} className="w-full rounded-xl mt-4 h-11">Kurban Sekarang</DonateButton>
              </Card>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-12">
          {['Hewan sehat & memenuhi syarat syariat', 'Disembelih & disalurkan tepat waktu', 'Laporan + dokumentasi untuk pekurban'].map((t) => (
            <div key={t} className="flex items-start gap-3 rounded-2xl bg-brand-slatebg p-5">
              <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <span className="text-sm text-brand-ink">{t}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
