'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/components/site/use-api';
import CampaignCard from '@/components/site/campaign-card';
import { CATEGORIES } from '@/lib/site-data';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { HandHeart, Search } from 'lucide-react';

const SORTS = [
  { value: 'default', label: 'Paling Sesuai' },
  { value: 'populer', label: 'Terpopuler' },
  { value: 'hampir', label: 'Hampir Tercapai' },
  { value: 'terbesar', label: 'Dana Terbesar' },
];

export default function DonasiPage() {
  const { data: campaigns } = useApi('/api/campaigns');
  const [category, setCategory] = useState('semua');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('default');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get('category');
    if (c) setCategory(c);
  }, []);

  const pct = (c) => (c.target_amount ? c.collected_amount / c.target_amount : 0);

  let list = (campaigns || []).filter((c) => (category === 'semua' ? true : c.category === category));
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter((c) => (c.title || '').toLowerCase().includes(q) || (c.short_desc || '').toLowerCase().includes(q));
  }
  list = [...list];
  if (sort === 'populer') list.sort((a, b) => (b.donor_count || 0) - (a.donor_count || 0));
  else if (sort === 'hampir') list.sort((a, b) => pct(b) - pct(a));
  else if (sort === 'terbesar') list.sort((a, b) => (b.collected_amount || 0) - (a.collected_amount || 0));

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
        <div className="flex flex-wrap gap-2 justify-center mb-6">
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

        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari program donasi..." className="pl-9 rounded-xl h-11" />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="rounded-xl h-11 w-full sm:w-56"><SelectValue placeholder="Urutkan" /></SelectTrigger>
            <SelectContent>{SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {!campaigns ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-96" />)}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Tidak ada program yang cocok. Coba kata kunci atau kategori lain.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((c) => <CampaignCard key={c.id} c={c} />)}
          </div>
        )}
      </section>
    </div>
  );
}
