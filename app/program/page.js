'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/components/site/use-api';
import CampaignCard from '@/components/site/campaign-card';
import { CATEGORY_LABEL, formatRupiah } from '@/lib/site-data';
import { ArrowRight, Building2, Heart, Users, LayoutPanelLeft, LayoutGrid, List } from 'lucide-react';

const VIEWS = [
  { value: 'default', label: 'Default', icon: LayoutPanelLeft },
  { value: 'gallery', label: 'Galeri', icon: LayoutGrid },
  { value: 'list', label: 'Daftar', icon: List },
];
const VIEW_KEY = 'yb_program_view';
const pctOf = (p) => (p.target_amount ? Math.min(Math.round((p.collected_amount / p.target_amount) * 100), 100) : 0);

// Zig-zag rows with a fixed height on desktop, so portrait photos no longer stretch one card taller than the rest.
function DefaultView({ list }) {
  return (
    <div className="space-y-8">
      {list.map((p, i) => {
        const pct = pctOf(p);
        return (
          <Card key={p.id || p.slug} className={`rounded-2xl overflow-hidden border-border shadow-sm grid md:grid-cols-2 md:h-[340px] ${i % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}>
            <div className="aspect-[16/10] md:aspect-auto md:h-full overflow-hidden bg-muted">
              {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
            </div>
            <div className="p-7 md:p-9 flex flex-col justify-center min-h-0">
              <Badge className="w-fit bg-brand-bluelight text-brand-blue border-0 hover:bg-brand-bluelight mb-3">{CATEGORY_LABEL[p.category] || p.category}</Badge>
              <h2 className="text-2xl font-extrabold text-brand-ink font-heading line-clamp-2">{p.title}</h2>
              <p className="text-muted-foreground mt-3 line-clamp-3">{p.short_desc}</p>
              {p.target_amount > 0 && (
                <div className="mt-5">
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="font-semibold text-brand-green">{formatRupiah(p.collected_amount)}</span>
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5" />{p.donor_count || 0} donatur</span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <Link href={`/donasi/${p.slug}`}><Button className="rounded-xl"><Heart className="w-4 h-4 mr-2" />Dukung Program</Button></Link>
                <Link href={`/donasi/${p.slug}`}><Button variant="outline" className="rounded-xl">Detail<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function GalleryView({ list }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((p) => <CampaignCard key={p.id || p.slug} c={p} />)}
    </div>
  );
}

function ListView({ list }) {
  return (
    <div className="space-y-3">
      {list.map((p) => {
        const pct = pctOf(p);
        return (
          <Card key={p.id || p.slug} className="rounded-2xl border-border shadow-sm p-3 sm:p-4 flex gap-4 items-center">
            <Link href={`/donasi/${p.slug}`} className="w-28 h-20 sm:w-44 sm:h-28 rounded-xl overflow-hidden bg-muted shrink-0">
              {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
            </Link>
            <div className="flex-1 min-w-0">
              <Badge className="bg-brand-bluelight text-brand-blue border-0 hover:bg-brand-bluelight mb-1.5">{CATEGORY_LABEL[p.category] || p.category}</Badge>
              <Link href={`/donasi/${p.slug}`}><h2 className="font-heading font-bold text-brand-ink leading-snug line-clamp-1 hover:text-brand-green transition-colors">{p.title}</h2></Link>
              <p className="text-sm text-muted-foreground line-clamp-1 hidden sm:block">{p.short_desc}</p>
              {p.target_amount > 0 && (
                <div className="mt-2 max-w-md">
                  <Progress value={pct} className="h-1.5" />
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="font-semibold text-brand-green">{formatRupiah(p.collected_amount)} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                    <span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{p.donor_count || 0}</span>
                  </div>
                </div>
              )}
            </div>
            <Link href={`/donasi/${p.slug}`} className="hidden md:block shrink-0"><Button className="rounded-xl"><Heart className="w-4 h-4 mr-2" />Dukung</Button></Link>
          </Card>
        );
      })}
    </div>
  );
}

export default function ProgramPage() {
  const { data: campaigns } = useApi('/api/campaigns');
  const list = campaigns || [];
  const [view, setView] = useState('default');

  useEffect(() => {
    try { const v = localStorage.getItem(VIEW_KEY); if (VIEWS.some((x) => x.value === v)) setView(v); } catch {}
  }, []);
  const choose = (v) => { setView(v); try { localStorage.setItem(VIEW_KEY, v); } catch {} };

  return (
    <div>
      <section className="bg-brand-slatebg border-b border-border">
        <div className="container py-14 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm mb-3">
            <Building2 className="w-5 h-5" /> Katalog Program
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-ink">Program Jangka Panjang Kami</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Pilar-pilar pemberdayaan Yayasan Banua Berkah Mandiri untuk kemuliaan umat di tanah Banua.</p>
        </div>
      </section>

      <section className="container py-14">
        <div className="flex justify-end mb-6">
          <div className="inline-flex rounded-xl border border-border bg-white p-1" role="group" aria-label="Pilihan tampilan program">
            {VIEWS.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" onClick={() => choose(value)} aria-pressed={view === value}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === value ? 'bg-brand-green text-white' : 'text-brand-ink hover:bg-brand-slatebg'}`}>
                <Icon className="w-4 h-4" /><span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {!campaigns && <div className="space-y-8">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-72" />)}</div>}

        {campaigns && list.length === 0 && (
          <Card className="rounded-2xl p-12 text-center text-muted-foreground">Belum ada program yang dipublikasikan.</Card>
        )}

        {list.length > 0 && (view === 'gallery' ? <GalleryView list={list} /> : view === 'list' ? <ListView list={list} /> : <DefaultView list={list} />)}
      </section>

      <section className="container pb-20">
        <div className="rounded-3xl bg-brand-green text-white p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">Ingin melihat semua kampanye donasi?</h2>
          <p className="text-white/80 mt-2">Jelajahi katalog donasi lengkap kami dan pilih yang paling menggerakkan hati Anda.</p>
          <Link href="/donasi"><Button size="lg" variant="secondary" className="rounded-xl mt-6 bg-white text-brand-green hover:bg-white/90">Buka Katalog Donasi<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
