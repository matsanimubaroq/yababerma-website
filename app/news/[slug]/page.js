'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Calendar, ArrowLeft, Share2, Newspaper, Loader2, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import InitialsAvatar from '@/components/site/initials-avatar';

export default function NewsDetailPage({ params }) {
    const { slug } = use(params);
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lightbox, setLightbox] = useState(null); // gallery photo being viewed

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
                                {new Date(item.publishedAt || item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            {item.author && (
                                <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                                    <User className="w-4 h-4" />
                                    {item.author_profile
                                        ? <Link href={`/penulis/${item.author_profile.slug}`} className="hover:text-brand-green hover:underline">{item.author}</Link>
                                        : item.author}
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-brand-ink leading-tight mb-8">
                            {item.title}
                        </h1>

                        {item.image && (
                            <figure className="mb-12">
                                <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl bg-brand-slatebg">
                                    <img
                                        src={item.image}
                                        alt={item.image_caption || item.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {item.image_caption && <figcaption className="text-sm text-muted-foreground mt-3 text-center italic">{item.image_caption}</figcaption>}
                            </figure>
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

                        {item.gallery?.length > 0 && (
                            <section className="mt-10">
                                <h2 className="text-lg font-heading font-bold text-brand-ink mb-4">Galeri Foto</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {item.gallery.map((g, i) => (
                                        <figure key={i}>
                                            <button type="button" onClick={() => setLightbox(g)} className="block w-full aspect-[4/3] rounded-2xl overflow-hidden bg-brand-slatebg group">
                                                <img src={g.url} alt={g.caption || `Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </button>
                                            {g.caption && <figcaption className="text-xs text-muted-foreground mt-2 leading-snug">{g.caption}</figcaption>}
                                        </figure>
                                    ))}
                                </div>
                            </section>
                        )}

                        {item.tags?.length > 0 && (
                            <div className="mt-8 flex flex-wrap gap-2">
                                {item.tags.map(t => <span key={t} className="text-xs px-3 py-1 rounded-full bg-brand-greenlight text-brand-green font-medium">#{t}</span>)}
                            </div>
                        )}

                        <div className="mt-12 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-6">
                            {item.author_profile ? (
                                <Link href={`/penulis/${item.author_profile.slug}`} className="flex items-center gap-3 group max-w-xl">
                                    <InitialsAvatar src={item.author_profile.photo} name={item.author_profile.name} className="w-14 h-14 rounded-full" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Ditulis oleh</p>
                                        <p className="font-bold text-brand-ink group-hover:text-brand-green transition-colors">{item.author}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {[item.author_profile.role, item.author_profile.since_year ? `Menulis di YABABERMA sejak ${item.author_profile.since_year}` : ''].filter(Boolean).join(' · ')}
                                        </p>
                                        <span className="text-xs text-brand-green font-semibold inline-flex items-center gap-1 mt-1">Lihat profil penulis <ArrowRight className="w-3 h-3" /></span>
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <InitialsAvatar name={item.author || 'YABABERMA'} className="w-10 h-10 rounded-full" />
                                    <div>
                                        <p className="text-sm font-bold text-brand-ink">{item.author || 'Tim Redaksi YABABERMA'}</p>
                                        <p className="text-xs text-muted-foreground">Yayasan Banua Berkah Mandiri</p>
                                    </div>
                                </div>
                            )}

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
            <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
                <DialogContent className="max-w-4xl p-3 rounded-2xl">
                    <DialogTitle className="sr-only">{lightbox?.caption || 'Foto artikel'}</DialogTitle>
                    {lightbox && (
                        <figure>
                            <img src={lightbox.url} alt={lightbox.caption || 'Foto artikel'} className="w-full max-h-[75vh] object-contain rounded-xl bg-black/5" />
                            {lightbox.caption && <figcaption className="text-sm text-muted-foreground mt-3 text-center">{lightbox.caption}</figcaption>}
                        </figure>
                    )}
                </DialogContent>
            </Dialog>
        </main>
    );
}
