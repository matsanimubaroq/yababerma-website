'use client';

import { useApi } from '@/components/site/use-api';
import { Quote, HeartHandshake } from 'lucide-react';

export default function PrayerWall() {
  const { data } = useApi('/api/prayers');
  const prayers = data && data.length ? data : [];
  if (!prayers.length) return null;
  const loop = [...prayers, ...prayers];

  return (
    <section className="bg-brand-greenlight/40 border-y border-border overflow-hidden py-12">
      <div className="container">
        <div className="text-center mb-8">
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2"><HeartHandshake className="w-4 h-4" />Dinding Doa</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-ink mt-2">Doa &amp; Harapan Para Donatur</h2>
          <p className="text-muted-foreground mt-2">Setiap donasi disertai doa terbaik. Semoga menjadi keberkahan bagi kita semua.</p>
        </div>
      </div>
      <div className="marquee-pause relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-brand-greenlight/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-brand-greenlight/60 to-transparent z-10 pointer-events-none" />
        <div className="flex gap-4 w-max animate-marquee px-4">
          {loop.map((p, i) => (
            <div key={i} className="w-80 shrink-0 rounded-2xl bg-white border border-border shadow-sm p-5">
              <Quote className="w-6 h-6 text-brand-green/30" />
              <p className="text-sm text-brand-ink mt-2 line-clamp-3 min-h-[3.75rem] leading-relaxed">{p.message}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-greenlight text-brand-green flex items-center justify-center text-sm font-semibold">{(p.name || 'H')[0]}</div>
                <div><p className="text-sm font-semibold text-brand-ink leading-none">{p.name}</p><p className="text-xs text-muted-foreground mt-0.5">{p.program}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
