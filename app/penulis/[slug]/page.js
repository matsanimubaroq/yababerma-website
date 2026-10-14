'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, GraduationCap, Instagram, Loader2, Newspaper, Calendar, Clock, PenLine } from 'lucide-react';
import InitialsAvatar from '@/components/site/initials-avatar';

export default function AuthorPage({ params }) {
  const { slug } = use(params);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/authors/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setAuthor(d && !d.error ? d : null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand-green opacity-50" /></div>;
  }

  if (!author) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center rounded-3xl border-0 shadow-xl">
          <PenLine className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h1 className="text-2xl font-bold text-brand-ink">Penulis Tidak Ditemukan</h1>
          <p className="text-muted-foreground mt-2">Profil penulis ini tidak tersedia.</p>
          <Link href="/news" className="mt-6 block"><Button className="w-full rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Kembali ke Berita</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-brand-slatebg/30 pb-20">
      <section className="bg-white border-b border-border">
        <div className="container py-8">
          <Link href="/news" className="inline-flex items-center text-sm text-muted-foreground hover:text-brand-green transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />Kembali ke Berita &amp; Artikel
          </Link>
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
            <InitialsAvatar src={author.photo} name={author.name} className="w-32 h-32 rounded-full shadow-lg" textClassName="text-4xl" />
            <div className="flex-1">
              <p className="text-brand-green font-semibold text-sm uppercase tracking-wide">{author.role || 'Penulis'}</p>
              <h1 className="text-3xl md:text-4xl font-heading font-extrabold text-brand-ink mt-1">{author.display_name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 mt-4 text-sm text-muted-foreground">
                {author.since_year && <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />Menulis di YABABERMA sejak {author.since_year}</span>}
                {author.education && <span className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4" />{author.education}</span>}
                {author.instagram && <a href={author.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand-blue hover:underline"><Instagram className="w-4 h-4" />Instagram</a>}
              </div>
              {author.expertise?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ranah keilmuan</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {author.expertise.map((x) => <Badge key={x} className="bg-brand-greenlight text-brand-green border-0 hover:bg-brand-greenlight">{x}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          </div>
          {author.bio && (
            <div className="max-w-4xl mx-auto mt-8">
              <h2 className="font-heading font-bold text-brand-ink mb-2">Latar Belakang</h2>
              <p className="text-brand-ink/80 leading-relaxed whitespace-pre-wrap">{author.bio}</p>
            </div>
          )}
        </div>
      </section>

      <section className="container mt-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-heading font-bold text-brand-ink mb-5">Tulisan {author.name} ({author.articles.length})</h2>
          {author.articles.length === 0 ? (
            <Card className="p-10 text-center rounded-2xl border-dashed border-2 text-muted-foreground"><Newspaper className="w-10 h-10 mx-auto mb-3 opacity-20" />Belum ada tulisan yang terbit.</Card>
          ) : (
            <div className="space-y-4">
              {author.articles.map((a) => (
                <Link key={a.id} href={`/news/${a.slug}`} className="block group">
                  <Card className="rounded-2xl border-0 shadow-sm hover:shadow-lg transition-all p-4 flex gap-4 bg-white">
                    <div className="w-28 h-20 sm:w-40 sm:h-28 rounded-xl overflow-hidden bg-brand-slatebg shrink-0">
                      {a.image && <img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <div className="min-w-0">
                      <Badge variant="secondary" className="text-brand-blue bg-brand-bluelight border-0 mb-1.5">{a.category}</Badge>
                      <h3 className="font-heading font-bold text-brand-ink leading-snug line-clamp-2 group-hover:text-brand-green transition-colors">{a.title}</h3>
                      {a.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2 hidden sm:block">{a.excerpt}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(a.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {a.read_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.read_time} mnt baca</span>}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
