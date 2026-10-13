'use client';

import { useApi } from '@/components/site/use-api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Newspaper, Images } from 'lucide-react';

export default function KegiatanPage() {
  const { data: news } = useApi('/api/news');
  const { data: gallery } = useApi('/api/gallery');

  return (
    <div>
      <section className="bg-brand-slatebg border-b border-border">
        <div className="container py-14 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm mb-3">
            <Newspaper className="w-5 h-5" /> Kegiatan &amp; Kabar
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-ink">Berita &amp; Dokumentasi Kegiatan</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Ikuti jejak kebaikan dan laporan kegiatan Yayasan Banua Berkah Mandiri.</p>
        </div>
      </section>

      <section className="container py-14">
        <h2 className="text-2xl font-extrabold text-brand-ink mb-6 flex items-center gap-2"><Newspaper className="w-6 h-6 text-brand-green" />Berita Terbaru</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(news || []).map((n) => (
            <Card key={n.id} className="overflow-hidden rounded-2xl border-border shadow-sm hover:shadow-card transition-all duration-300 group">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={n.image} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <Badge variant="secondary" className="mb-2 text-brand-blue bg-brand-bluelight border-0">{n.category}</Badge>
                <h3 className="font-heading font-bold leading-snug group-hover:text-brand-green transition-colors">{n.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{n.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-4">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(n.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{n.read_time} mnt baca</span>
                </div>
              </div>
            </Card>
          ))}
          {!news && Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-80" />)}
        </div>
      </section>

      <section className="bg-brand-slatebg">
        <div className="container py-14">
          <h2 className="text-2xl font-extrabold text-brand-ink mb-6 flex items-center gap-2"><Images className="w-6 h-6 text-brand-blue" />Galeri Kegiatan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(gallery || []).map((g) => (
              <div key={g.id} className="group relative aspect-square rounded-2xl overflow-hidden">
                <img src={g.image} alt={g.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-3">
                  <span className="text-white text-xs font-medium">{g.caption}</span>
                </div>
              </div>
            ))}
            {!gallery && Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-square" />)}
          </div>
        </div>
      </section>
    </div>
  );
}
