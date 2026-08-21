'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import {
  Calculator, BookOpen, MessageCircleQuestion, ReceiptText, ArrowRight, Heart,
  Play, Quote, Calendar, Clock, Mail, ShieldCheck, HeartHandshake, Loader2,
} from 'lucide-react';
import CampaignCard from '@/components/site/campaign-card';
import CountUp from '@/components/site/count-up';
import { useApi } from '@/components/site/use-api';
import { HERO_SLIDES, QUICK_SERVICES, IMPACT_STATS, ORG } from '@/lib/site-data';

const ICONS = { Calculator, BookOpen, MessageCircleQuestion, ReceiptText };

function SectionHeading({ eyebrow, title, desc, center }) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <p className="text-brand-green font-semibold text-sm mb-2 uppercase tracking-wide">{eyebrow}</p>}
      <h2 className="text-2xl md:text-4xl font-extrabold text-brand-ink leading-tight">{title}</h2>
      {desc && <p className="text-muted-foreground mt-3">{desc}</p>}
    </div>
  );
}

export default function App() {
  const [current, setCurrent] = useState(0);
  const [email, setEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const [playing, setPlaying] = useState(false);

  const { data: featured } = useApi('/api/campaigns?featured=true');
  const { data: news } = useApi('/api/news');
  const { data: testimonials } = useApi('/api/testimonials');
  const { data: gallery } = useApi('/api/gallery');

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const subscribe = async () => {
    if (!email.includes('@')) return toast.error('Masukkan alamat email yang valid');
    setSubLoading(true);
    try {
      const r = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (r.ok) { toast.success(d.message || 'Berhasil berlangganan!'); setEmail(''); }
      else toast.error(d.error || 'Gagal berlangganan');
    } catch { toast.error('Terjadi kesalahan'); }
    finally { setSubLoading(false); }
  };

  const slide = HERO_SLIDES[current];

  return (
    <div>
      {/* HERO SLIDER */}
      <section className="relative h-[560px] md:h-[640px] overflow-hidden bg-brand-ink">
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }} className="absolute inset-0">
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 hero-gradient" />
          </motion.div>
        </AnimatePresence>

        <div className="container relative h-full flex items-center">
          <div className="max-w-xl text-white animate-fade-up">
            <Badge className="bg-brand-green hover:bg-brand-green text-white border-0 mb-4">{slide.badge}</Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight drop-shadow-sm">{slide.title}</h1>
            <p className="mt-4 text-white/90 text-base md:text-lg max-w-lg">{slide.subtitle}</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href={`/donasi/${slide.slug}`}><Button size="lg" className="rounded-xl h-12 px-7 text-base"><Heart className="w-5 h-5 mr-2" />Donasi Sekarang</Button></Link>
              <Link href="/program"><Button size="lg" variant="outline" className="rounded-xl h-12 px-7 text-base bg-white/10 text-white border-white/50 hover:bg-white hover:text-brand-ink">Lihat Program</Button></Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* QUICK SERVICES */}
      <section className="container -mt-16 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_SERVICES.map((s) => {
            const Icon = ICONS[s.icon];
            return (
              <Link key={s.key} href={s.href}>
                <Card className="rounded-2xl p-5 shadow-card hover:-translate-y-1 transition-all duration-300 h-full border-border bg-white">
                  <div className="w-12 h-12 rounded-xl bg-brand-greenlight flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-brand-green" />
                  </div>
                  <h3 className="font-heading font-bold text-brand-ink">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* PROGRAM PILIHAN */}
      <section className="container py-16 md:py-20">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <SectionHeading eyebrow="Program Pilihan" title="Salurkan Kebaikan Anda Hari Ini" desc="Pilih program donasi yang menggerakkan hati Anda dan jadilah bagian dari perubahan." />
          <Link href="/donasi" className="hidden md:block"><Button variant="outline" className="rounded-xl">Semua Program<ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(featured || []).slice(0, 4).map((c) => <CampaignCard key={c.id} c={c} />)}
          {!featured && Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl bg-muted animate-pulse h-96" />)}
        </div>
      </section>

      {/* IMPACT STATS */}
      <section className="bg-brand-green text-white">
        <div className="container py-14 md:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-4xl font-extrabold">Jejak Kebaikan Bersama Anda</h2>
            <p className="text-white/80 mt-3">Setiap angka adalah senyuman, harapan, dan doa yang tersalurkan.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {IMPACT_STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-5xl font-extrabold font-heading"><CountUp end={s.value} suffix={s.suffix} /></div>
                <p className="text-white/80 text-sm mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BERITA & ARTIKEL */}
      <section className="container py-16 md:py-20">
        <SectionHeading eyebrow="Kabar Kebaikan" title="Berita &amp; Artikel Terbaru" center />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {(news || []).slice(0, 4).map((n) => (
            <Link key={n.id} href={`/kegiatan`}>
              <Card className="overflow-hidden rounded-2xl border-border shadow-sm hover:shadow-card transition-all duration-300 group h-full">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={n.image} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <Badge variant="secondary" className="mb-2 text-brand-blue bg-brand-bluelight border-0">{n.category}</Badge>
                  <h3 className="font-heading font-bold text-sm leading-snug line-clamp-2 group-hover:text-brand-green transition-colors">{n.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(n.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{n.read_time} mnt baca</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONI */}
      <section className="bg-brand-slatebg">
        <div className="container py-16 md:py-20">
          <SectionHeading eyebrow="Kata Mereka" title="Cerita &amp; Kepercayaan" center desc="Suara para donatur, tokoh masyarakat, dan penerima manfaat." />
          <div className="mt-10 px-4 md:px-10">
            <Carousel opts={{ align: 'start', loop: true }}>
              <CarouselContent>
                {(testimonials || []).map((t) => (
                  <CarouselItem key={t.id} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="rounded-2xl p-6 h-full border-border bg-white shadow-sm">
                      <Quote className="w-8 h-8 text-brand-green/30" />
                      <p className="text-brand-ink mt-3 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                      <div className="flex items-center gap-3 mt-5">
                        <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full" />
                        <div>
                          <p className="font-semibold text-sm text-brand-ink">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex" />
              <CarouselNext className="hidden md:flex" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* GALERI */}
      <section className="container py-16 md:py-20">
        <SectionHeading eyebrow="Galeri Kami" title="Dokumentasi Kegiatan" center />
        <div className="grid lg:grid-cols-2 gap-6 mt-10 items-start">
          <div className="rounded-2xl overflow-hidden shadow-card relative aspect-video bg-brand-ink">
            {playing ? (
              <iframe className="w-full h-full" src="https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=1" title="Video Yayasan" allow="accelerator; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            ) : (
              <button onClick={() => setPlaying(true)} className="group w-full h-full relative">
                <img src="https://images.unsplash.com/photo-1589995635011-078e0bb91d11" alt="Video" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-brand-green ml-1" fill="currentColor" />
                  </span>
                </div>
                <span className="absolute bottom-4 left-4 text-white font-semibold text-sm bg-black/40 px-3 py-1 rounded-full">Profil Yayasan Banua Berkah Mandiri</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(gallery || []).slice(0, 6).map((g) => (
              <div key={g.id} className="aspect-square rounded-xl overflow-hidden group relative">
                <img src={g.image} alt={g.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="container pb-20">
        <div className="rounded-3xl bg-brand-ink text-white p-8 md:p-14 relative overflow-hidden">
          <div className="absolute inset-0 pattern-dots opacity-40" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-brand-green mb-3"><HeartHandshake className="w-6 h-6" /><span className="font-semibold">Langganan Kabar Kebaikan</span></div>
              <h2 className="text-2xl md:text-3xl font-extrabold">Jadilah yang pertama tahu kabar baik.</h2>
              <p className="text-white/70 mt-2">Dapatkan update program, kisah inspiratif, dan laporan penyaluran donasi langsung ke email Anda.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Alamat email Anda" className="h-12 rounded-xl bg-white text-brand-ink border-0" />
              <Button onClick={subscribe} disabled={subLoading} className="h-12 rounded-xl px-6 whitespace-nowrap">{subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Mail className="w-4 h-4 mr-2" />Langganan</>)}</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
