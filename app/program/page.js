'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LONG_PROGRAMS } from '@/lib/site-data';
import { ArrowRight, Building2, Heart } from 'lucide-react';

export default function ProgramPage() {
  return (
    <div>
      <section className="bg-brand-slatebg border-b border-border">
        <div className="container py-14 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm mb-3">
            <Building2 className="w-5 h-5" /> Katalog Program
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-ink">Program Jangka Panjang Kami</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Empat pilar utama pemberdayaan Yayasan Banua Berkah Mandiri untuk kemuliaan umat di tanah Banua.</p>
        </div>
      </section>

      <section className="container py-14 space-y-8">
        {LONG_PROGRAMS.map((p, i) => (
          <Card key={p.slug} className={`rounded-2xl overflow-hidden border-border shadow-sm grid md:grid-cols-2 ${i % 2 === 1 ? 'md:[&>div:first-child]:order-2' : ''}`}>
            <div className="aspect-[16/11] md:aspect-auto overflow-hidden">
              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-7 md:p-10 flex flex-col justify-center">
              <Badge className="w-fit bg-brand-bluelight text-brand-blue border-0 hover:bg-brand-bluelight mb-3">{p.tag}</Badge>
              <h2 className="text-2xl font-extrabold text-brand-ink font-heading">{p.title}</h2>
              <p className="text-muted-foreground mt-3">{p.desc}</p>
              <div className="flex gap-3 mt-6">
                <Link href={`/donasi/${p.slug}`}><Button className="rounded-xl"><Heart className="w-4 h-4 mr-2" />Dukung Program</Button></Link>
                <Link href={`/donasi/${p.slug}`}><Button variant="outline" className="rounded-xl">Detail<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
              </div>
            </div>
          </Card>
        ))}
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
