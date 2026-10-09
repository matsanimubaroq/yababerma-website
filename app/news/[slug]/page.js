'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft, Share2, Newspaper, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';

export default function NewsDetailPage({ params }) {
    const { slug } = use(params);
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/news/${slug}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) setItem(null);
                else setItem(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [slug]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: item.title,
                url: window.location.href,
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link berhasil disalin ke clipboard');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-slatebg/30">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-brand-green opacity-50" />
                    <p className="mt-4 text-muted-foreground font-medium">Memuat artikel...</p>
                </div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-slatebg/30 px-4">
                <Card className="max-w-md w-full p-8 text-center rounded-3xl shadow-xl border-0">
                    <Newspaper className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h1 className="text-2xl font-bold text-brand-ink">Artikel Tidak Ditemukan</h1>
                    <p className="text-muted-foreground mt-2">Maaf, artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
                    <Link href="/news" className="mt-6 block">
                        <Button className="w-full rounded-xl bg-brand-green hover:bg-brand-green/90">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Berita
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-slatebg/30 pb-20">
            {/* Header / Cover */}
            <div className="bg-white border-b border-border">
                <div className="container py-8">
                    <Link href="/news" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-green transition-colors mb-6 group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Kembali ke Berita & Artikel
                    </Link>

                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 mb-4">
                            <Badge className="bg-brand-greenlight text-brand-green border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                {item.category}
                            </Badge>
                            <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-brand-ink leading-tight mb-8">
                            {item.title}
                        </h1>

                        {item.imageUrl && (
                            <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl mb-12 bg-brand-slatebg">
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container -mt-8 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <Card className="p-6 md:p-12 rounded-3xl shadow-xl border-0 bg-white">
                        <article className="prose prose-green max-w-none">
                            <div className="text-brand-ink text-lg leading-relaxed whitespace-pre-wrap font-medium opacity-90">
                                {item.content}
                            </div>
                        </article>

                        <div className="mt-12 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold">Y</div>
                                <div>
                                    <p className="text-sm font-bold text-brand-ink">Tim Redaksi YABABERMA</p>
                                    <p className="text-xs text-muted-foreground">Yayasan Banua Berkah Mandiri</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="rounded-xl" onClick={handleShare}>
                                    <Share2 className="w-4 h-4 mr-2" /> Bagikan
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Related / CTA */}
                    <div className="mt-12 bg-brand-green rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-bold mb-2">Terinspirasi dari kabar ini?</h3>
                            <p className="text-white/80">Mari wujudkan lebih banyak senyum melalui donasi Anda.</p>
                        </div>
                        <Link href="/donasi">
                            <Button className="bg-white text-brand-green hover:bg-white/90 rounded-xl px-8 h-12 font-bold text-lg shadow-xl">
                                Donasi Sekarang
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
