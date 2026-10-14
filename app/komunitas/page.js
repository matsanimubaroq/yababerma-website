'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Instagram, UsersRound, HeartHandshake, ArrowRight } from 'lucide-react';
import { useApi } from '@/components/site/use-api';
import Stars from '@/components/site/stars';
import InitialsAvatar from '@/components/site/initials-avatar';
import { WHATSAPP_ADMIN } from '@/lib/site-data';

export default function KomunitasPage() {
  const { data, loading, error } = useApi('/api/communities');
  const list = Array.isArray(data) ? data : [];

  return (
    <div>
      <section className="bg-brand-slatebg border-b border-border">
        <div className="container py-14 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm mb-3">
            <UsersRound className="w-5 h-5" /> Komunitas Relawan
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-ink">Bergabung Bersama Komunitas Kebaikan</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Komunitas relawan yang bergerak bersama program-program Yayasan Banua Berkah Mandiri. Ikuti dan jadilah bagian dari gerakan kebaikan di Banua.</p>
        </div>
      </section>

      <section className="container py-14">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 rounded-2xl bg-muted animate-pulse" />)}</div>
        ) : error || list.length === 0 ? (
          <Card className="rounded-2xl p-12 text-center text-muted-foreground border-dashed border-2">
            <HeartHandshake className="w-12 h-12 mx-auto mb-3 opacity-20" />
            {error ? 'Daftar komunitas sedang tidak dapat dimuat. Silakan coba lagi nanti.' : 'Daftar komunitas segera hadir.'}
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((c) => (
              <Card key={c.id} className="rounded-2xl p-6 border-border bg-white shadow-sm hover:shadow-card transition-all flex flex-col">
                <div className="flex items-center gap-4">
                  <InitialsAvatar src={c.logo} name={c.name} className="w-16 h-16 rounded-2xl" imgClassName="object-contain p-1.5 border border-border" textClassName="text-lg" />
                  <div className="min-w-0">
                    <h2 className="font-heading font-bold text-brand-ink leading-snug line-clamp-2">{c.name}</h2>
                    <div className="mt-1"><Stars value={c.rating} /></div>
                  </div>
                </div>
                {c.description && <p className="text-sm text-muted-foreground mt-4 line-clamp-3">{c.description}</p>}
                {c.program_slug && (
                  <Link href={`/donasi/${c.program_slug}`} className="text-xs text-brand-blue mt-3 inline-flex items-center gap-1 hover:underline">
                    Program terkait: {c.program_title}<ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                <div className="mt-auto pt-5">
                  {c.instagram ? (
                    <a href={c.instagram} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full rounded-xl"><Instagram className="w-4 h-4 mr-2" />Ikuti di Instagram</Button>
                    </a>
                  ) : (
                    <Button variant="outline" className="w-full rounded-xl" disabled>Instagram belum tersedia</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="container pb-20">
        <div className="rounded-3xl bg-brand-green text-white p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">Punya komunitas relawan?</h2>
          <p className="text-white/80 mt-2">Mari berkolaborasi dalam program kebaikan bersama Yayasan Banua Berkah Mandiri.</p>
          <a href={`https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent('Assalamualaikum, komunitas kami ingin berkolaborasi dengan YABABERMA.')}`} target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="secondary" className="rounded-xl mt-6 bg-white text-brand-green hover:bg-white/90">Hubungi Kami</Button>
          </a>
        </div>
      </section>
    </div>
  );
}
