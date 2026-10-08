'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/components/site/use-api';
import { CATEGORY_LABEL, formatRupiah } from '@/lib/site-data';
import { ArrowRight, Building2, Heart, Users } from 'lucide-react';

export default function ProgramPage() {
  const { data: campaigns } = useApi('/api/campaigns');
  const list = campaigns || [];

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

      <section className="container py-14 space-y-8">
        {!campaigns && Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-72" />)}

        {campaigns && list.length === 0 && (
          <Card className="rounded-2xl p-12 text-center text-muted-foreground">Belum ada program yang dipublikasikan.</Card>
        )}

        {list.map((p, i) => {
          const pct = p.target_amount ? Math.min(Math.round((p.collected_amount / p.target_amount) * 100), 100) : 0;
          return (
            <Card key={p.id || p.slug} className={`rounded-2xl overflow-hidden border-border shadow-sm grid md:grid-cols-2 ${i % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}>
              <div className="aspect-[16/11] md:aspect-auto overflow-hidden bg-muted">
                {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" />}
              </div>
              <div className="p-7 md:p-10 flex flex-col justify-center">
                <Badge className="w-fit bg-brand-bluelight text-brand-blue border-0 hover:bg-brand-bluelight mb-3">{CATEGORY_LABEL[p.category] || p.category}</Badge>
                <h2 className="text-2xl font-extrabold text-brand-ink font-heading">{p.title}</h2>
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
