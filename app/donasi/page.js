'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/components/site/use-api';
import CampaignCard from '@/components/site/campaign-card';
import { CATEGORIES } from '@/lib/site-data';
import { HandHeart } from 'lucide-react';

export default function DonasiPage() {
  const { data: campaigns } = useApi('/api/campaigns');
  const [category, setCategory] = useState('semua');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get('category');
    if (c) setCategory(c);
  }, []);

  const filtered = (campaigns || []).filter((c) => (category === 'semua' ? true : c.category === category));

  return (
    <div>
      <section className="bg-brand-slatebg border-b border-border">
        <div className="container py-14 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm mb-3">
            <HandHeart className="w-5 h-5" /> Katalog Donasi
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-ink">Pilih Kebaikan yang Anda Perjuangkan</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Setiap donasi Anda 100% amanah kami salurkan kepada yang berhak. Pilih kategori dan program di bawah ini.</p>
        </div>
      </section>

      <section className="container py-10">
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${category === cat.value ? 'bg-brand-green text-white shadow-sm' : 'bg-white border border-border text-brand-ink hover:border-brand-green/50'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!campaigns ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-96" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Belum ada program pada kategori ini.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}
