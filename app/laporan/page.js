'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/components/site/use-api';
import CountUp from '@/components/site/count-up';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatRupiah, IMPACT_STATS, ORG, CATEGORY_LABEL } from '@/lib/site-data';
import { FileBarChart, ShieldCheck, TrendingUp, Users, HandCoins, Target, Printer, Heart, PieChart, Calendar } from 'lucide-react';

const YEAR_LABEL = (y) => (y === 'all' ? 'Semua Tahun' : `Tahun ${y}`);

export default function LaporanPage() {
  const [year, setYear] = useState('all');
  const { data: report } = useApi(`/api/reports?year=${year}`);

  const years = report?.years || ['all'];
  const catRows = (report?.by_category || []).map((c) => [c.category, c.amount]).sort((a, b) => b[1] - a[1]);
  const totalCat = catRows.reduce((a, b) => a + b[1], 0) || 1;
  const programs = report?.by_program || [];

  const live = [
    { label: 'Total Dana Terkumpul', value: report?.total_collected || 0, prefix: 'Rp ', icon: HandCoins },
    { label: 'Total Donatur', value: report?.total_donors || 0, suffix: '+', icon: Users },
    { label: 'Total Donasi', value: report?.total_donations || 0, suffix: '+', icon: FileBarChart },
    { label: 'Jumlah Program', value: programs.length || 0, icon: Target },
  ];

  return (
    <div>
      <section className="relative bg-brand-ink text-white overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-30" />
        <div className="container relative py-16 md:py-20">
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm mb-3"><FileBarChart className="w-5 h-5" />Laporan Publik</div>
          <h1 className="text-3xl md:text-5xl font-extrabold max-w-2xl leading-tight">Laporan Dampak &amp; Transparansi</h1>
          <p className="text-white/80 mt-4 max-w-xl">Komitmen kami pada amanah: setiap rupiah donasi Anda kami laporkan secara terbuka. Data diperbarui langsung dari sistem kami.</p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <div className="flex items-center gap-2 bg-white/10 rounded-xl pl-3 pr-1 py-1">
              <Calendar className="w-4 h-4 text-white/80" />
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[150px] bg-transparent border-0 text-white focus:ring-0 focus:ring-offset-0 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (<SelectItem key={y} value={y}>{YEAR_LABEL(y)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => window.print()} variant="secondary" className="rounded-xl bg-white text-brand-ink hover:bg-white/90"><Printer className="w-4 h-4 mr-2" />Unduh / Cetak Laporan</Button>
          </div>
        </div>
      </section>

      {/* LIVE STATS */}
      <section className="container py-14">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <h2 className="text-lg font-bold text-brand-ink">Ringkasan {YEAR_LABEL(year)}</h2>
          <span className="text-xs text-muted-foreground">Menampilkan data periode {year === 'all' ? 'kumulatif semua tahun' : year}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {live.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="rounded-2xl p-6 border-border text-center">
                <div className="w-11 h-11 rounded-xl bg-brand-greenlight flex items-center justify-center mx-auto mb-3"><Icon className="w-5 h-5 text-brand-green" /></div>
                <div className="text-2xl md:text-3xl font-extrabold text-brand-ink"><CountUp end={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} /></div>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* IMPACT */}
      <section className="bg-brand-green text-white">
        <div className="container py-14">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">Dampak Kumulatif Program</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {IMPACT_STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold font-heading"><CountUp end={s.value} suffix={s.suffix} /></div>
                <p className="text-white/80 text-sm mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ALLOCATION BY CATEGORY */}
      <section className="container py-14 grid lg:grid-cols-2 gap-10">
        <div>
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2 flex items-center gap-2"><PieChart className="w-4 h-4" />Distribusi Dana</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-ink mb-6">Alokasi Dana per Kategori</h2>
          <div className="space-y-4">
            {catRows.length === 0 && <p className="text-muted-foreground">Memuat data...</p>}
            {catRows.map(([cat, val]) => {
              const p = Math.round((val / totalCat) * 100);
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink font-medium">{CATEGORY_LABEL[cat] || cat}</span><span className="text-brand-green font-semibold">{p}% • {formatRupiah(val)}</span></div>
                  <Progress value={p} className="h-2.5" />
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Progres Program</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-ink mb-6">Capaian Setiap Program</h2>
          <div className="space-y-4">
            {programs.length === 0 && <p className="text-muted-foreground">Memuat data...</p>}
            {programs.map((c, i) => {
              const p = Math.min(Math.round((c.collected / (c.target || 1)) * 100), 100);
              const inner = (
                <>
                  <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink font-medium line-clamp-1">{c.title}</span><span className="text-brand-green font-semibold shrink-0 ml-2">{p}%</span></div>
                  <Progress value={p} className="h-2" />
                </>
              );
              return c.slug ? (
                <Link key={c.slug || i} href={`/donasi/${c.slug}`} className="block">{inner}</Link>
              ) : (
                <div key={i} className="block">{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRANSPARENCY / LEGALITY */}
      <section className="container pb-16">
        <Card className="rounded-2xl p-6 md:p-8 border-0 bg-brand-slatebg">
          <div className="flex flex-col md:flex-row items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-brand-green text-white flex items-center justify-center shrink-0"><ShieldCheck className="w-7 h-7" /></div>
            <div>
              <h3 className="font-heading font-bold text-xl text-brand-ink">Komitmen Transparansi &amp; Legalitas</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">Yayasan Banua Berkah Mandiri berkomitmen mengelola dana umat secara amanah, transparan, dan sesuai syariat. Laporan penyaluran lengkap beserta dokumentasi tersedia bagi para donatur secara berkala.</p>
              <p className="text-sm mt-3">Terdaftar &amp; Sah — Akta Kemenkumham RI: <span className="font-semibold text-brand-ink">{ORG.ahu}</span></p>
            </div>
          </div>
        </Card>
      </section>

      <section className="container pb-20">
        <div className="rounded-3xl bg-brand-green text-white p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">Jadilah Bagian dari Laporan Kebaikan Berikutnya</h2>
          <p className="text-white/80 mt-2">Setiap donasi Anda akan tercatat &amp; tersalurkan secara amanah.</p>
          <Link href="/donasi"><Button size="lg" className="rounded-xl mt-6 bg-white text-brand-green hover:bg-white/90"><Heart className="w-5 h-5 mr-2" />Donasi Sekarang</Button></Link>
        </div>
      </section>
    </div>
  );
}
