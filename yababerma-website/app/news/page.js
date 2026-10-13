'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, ArrowRight, Newspaper, Loader2 } from 'lucide-react';

export default function NewsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/news')
            .then(r => r.json())
            .then(data => {
                setItems(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = items.filter(it =>
        it.title?.toLowerCase().includes(search.toLowerCase()) ||
        it.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="min-h-screen bg-brand-slatebg/30 pb-20">
            {/* Hero Section */}
            <section className="bg-brand-green py-16 md:py-24 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-greenlight rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                </div>
                <div className="container relative z-10 text-center">
                    <Badge className="bg-white/20 text-white border-0 mb-4 hover:bg-white/20 backdrop-blur-sm px-4 py-1">Kabar Kebaikan</Badge>
                    <h1 className="text-3xl md:text-5xl font-heading font-extrabold mb-6">Berita & Artikel</h1>
                    <p className="text-white/80 max-w-2xl mx-auto text-lg">
                        Ikuti perkembangan program, kisah inspiratif, dan informasi terbaru dari Yayasan Banua Berkah Mandiri.
                    </p>
                </div>
            </section>

            {/* Search & Filter */}
            <section className="container -mt-8 relative z-20">
                <Card className="p-4 md:p-6 rounded-2xl shadow-xl border-0 bg-white">
                    <div className="relative max-w-xl mx-auto">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari berita, artikel, atau kisah inspiratif..."
                            className="pl-12 h-12 md:h-14 rounded-xl text-lg border-brand-slatebg bg-brand-slatebg/20 focus:bg-white transition-all"
                        />
                    </div>
                </Card>
            </section>

            {/* Content Grid */}
            <section className="container mt-12">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-brand-green opacity-50" />
                        <p className="mt-4 text-muted-foreground font-medium">Memuat kabar kebaikan...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-border">
                        <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-brand-ink">Belum ada berita</h3>
                        <p className="text-muted-foreground mt-2">Coba gunakan kata kunci pencarian lain.</p>
                        <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setSearch('')}>Lihat Semua Berita</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filtered.map((item) => (
                            <Link key={item.id} href={`/news/${item.slug}`} className="group">
                                <Card className="h-full rounded-3xl overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col bg-white">
                                    <div className="aspect-[16/10] overflow-hidden relative">
                                        {item.imageUrl ? (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-brand-slatebg flex items-center justify-center text-brand-green/20">
                                                <Newspaper className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4">
                                            <Badge className="bg-brand-green text-white border-0 shadow-lg px-3 py-1">
                                                {item.category}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        <h3 className="text-xl font-heading font-bold text-brand-ink mb-4 line-clamp-2 group-hover:text-brand-green transition-colors leading-tight">
                                            {item.title}
                                        </h3>
                                        <div className="mt-auto pt-4 flex items-center text-brand-green font-bold text-sm">
                                            Baca Selengkapnya <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
