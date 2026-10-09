'use client';

import { useApi } from '@/components/site/use-api';
import { Instagram, Heart, MessageCircle } from 'lucide-react';
import { SOCIALS } from '@/lib/site-data';
import { Button } from '@/components/ui/button';

export default function InstagramFeed() {
  const { data: gallery } = useApi('/api/gallery');
  const posts = Array.isArray(gallery) ? gallery.slice(0, 6) : [];

  return (
    <section className="container py-16 md:py-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="text-center sm:text-left">
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-1 flex items-center gap-2 justify-center sm:justify-start"><Instagram className="w-4 h-4" />Instagram</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-ink">Ikuti Perjalanan Kami</h2>
          <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="text-brand-blue font-medium hover:underline">@yababerma.official</a>
        </div>
        <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="rounded-xl"><Instagram className="w-4 h-4 mr-2" />Ikuti Kami</Button>
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {!gallery && Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />)}
        {posts.map((p) => (
          <a key={p.id} href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden">
            <img src={p.image} alt={p.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-5 text-white">
              <span className="flex items-center gap-1.5 text-sm font-medium"><Heart className="w-4 h-4" fill="currentColor" /></span>
              <span className="flex items-center gap-1.5 text-sm font-medium"><MessageCircle className="w-4 h-4" /></span>
            </div>
            <div className="absolute top-2 right-2 text-white drop-shadow"><Instagram className="w-4 h-4" /></div>
          </a>
        ))}
      </div>
    </section>
  );
}
