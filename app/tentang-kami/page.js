'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CountUp from '@/components/site/count-up';
import { ORG, BERKAH_VALUES, IMPACT_STATS, PARTNERS, LOCATIONS, WHATSAPP_ADMIN } from '@/lib/site-data';
import { ShieldCheck, Eye, Compass, Flag, Building2, Users, Heart, CheckCircle2, Award, MapPin, Navigation, Phone } from 'lucide-react';

const MISI = [
  'Menghimpun & menyalurkan Zakat, Infak, Sedekah, dan Wakaf (ZISWAF) secara amanah dan transparan.',
  'Membina dan mengasuh anak yatim & dhuafa menuju masa depan yang lebih baik.',
  'Menyebarkan pendidikan Al-Qur\u2019an dan karakter Islami bagi generasi Banua.',
  'Memberdayakan ekonomi umat agar mustahik naik kelas menjadi muzakki.',
];

export default function TentangKamiPage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative bg-brand-slatebg border-b border-border overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-brand-green" />
        <div className="absolute left-3 top-0 h-full w-1 bg-brand-blue/60" />
        <div className="absolute inset-0 pattern-dots opacity-60" />
        <div className="container relative py-16 md:py-20">
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-3">Tentang Kami</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-ink max-w-3xl leading-tight">Menebar Kebaikan, Memberdayakan Banua Sejak {ORG.founded}</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">Yayasan Banua Berkah Mandiri hadir sebagai lembaga filantropi Islam & kemanusiaan yang amanah, responsif, dan berdampak nyata bagi masyarakat Kalimantan Selatan.</p>
        </div>
      </section>

      {/* SEJARAH */}
      <section className="container py-16 grid md:grid-cols-2 gap-10 items-center">
        <div className="rounded-2xl overflow-hidden shadow-card">
          <img src="https://images.pexels.com/photos/6647027/pexels-photo-6647027.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" alt="Sejarah Yayasan" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2">Kisah Kami</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-brand-ink">Berawal dari Ketulusan, Tumbuh Menjadi Harapan</h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">Yayasan Banua Berkah Mandiri didirikan pada tahun {ORG.founded} oleh <span className="font-semibold text-brand-ink">{ORG.founders[0]}</span> dan <span className="font-semibold text-brand-ink">{ORG.founders[1]}</span>. Berangkat dari keprihatinan terhadap kondisi anak yatim, dhuafa, dan minimnya akses pendidikan Al-Qur\u2019an di pelosok Kalimantan.</p>
          <p className="text-muted-foreground mt-3 leading-relaxed">Dari langkah kecil yang tulus, yayasan tumbuh menjadi rumah harapan bagi ribuan penerima manfaat melalui program panti asuhan, pendidikan TPQ, wakaf Al-Qur\u2019an, dan pemberdayaan ekonomi umat.</p>
        </div>
      </section>

      {/* LEGALITAS */}
      <section className="container pb-4">
        <Card className="rounded-2xl p-6 md:p-8 border-0 bg-gradient-to-r from-brand-green to-brand-greendark text-white flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0"><ShieldCheck className="w-8 h-8" /></div>
          <div className="text-center md:text-left">
            <p className="text-white/80 text-sm">Legalitas &amp; Terdaftar Resmi</p>
            <h3 className="text-xl md:text-2xl font-extrabold font-heading">Pengesahan Kemenkumham RI</h3>
            <p className="font-mono text-lg md:text-xl mt-1 font-bold tracking-wide">{ORG.ahu}</p>
          </div>
        </Card>
      </section>

      {/* VISI MISI TUJUAN */}
      <section className="container py-16 grid md:grid-cols-3 gap-6">
        <Card className="rounded-2xl p-7 border-border">
          <div className="w-12 h-12 rounded-xl bg-brand-greenlight flex items-center justify-center mb-4"><Eye className="w-6 h-6 text-brand-green" /></div>
          <h3 className="font-heading font-bold text-lg text-brand-ink">Visi</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">Menjadi lembaga filantropi Islam terpercaya yang memberdayakan masyarakat Banua menuju kemandirian dan keberkahan.</p>
        </Card>
        <Card className="rounded-2xl p-7 border-border">
          <div className="w-12 h-12 rounded-xl bg-brand-bluelight flex items-center justify-center mb-4"><Compass className="w-6 h-6 text-brand-blue" /></div>
          <h3 className="font-heading font-bold text-lg text-brand-ink">Misi</h3>
          <ul className="mt-3 space-y-2">
            {MISI.map((m, i) => <li key={i} className="flex gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />{m}</li>)}
          </ul>
        </Card>
        <Card className="rounded-2xl p-7 border-border">
          <div className="w-12 h-12 rounded-xl bg-brand-greenlight flex items-center justify-center mb-4"><Flag className="w-6 h-6 text-brand-green" /></div>
          <h3 className="font-heading font-bold text-lg text-brand-ink">Tujuan</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">Mewujudkan kesejahteraan sosial berbasis nilai Islam, meningkatkan kualitas hidup dhuafa, serta melahirkan generasi Qur\u2019ani yang mandiri dan berakhlak.</p>
        </Card>
      </section>

      {/* NILAI BERKAH */}
      <section className="bg-brand-slatebg">
        <div className="container py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2">Nilai Utama</p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-brand-ink">Filosofi B.E.R.K.A.H</h2>
            <p className="text-muted-foreground mt-3">Enam nilai yang menjadi ruh setiap langkah pengabdian kami.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BERKAH_VALUES.map((v) => (
              <Card key={v.letter} className="rounded-2xl p-6 border-border bg-white hover:-translate-y-1 hover:shadow-card transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-green text-white font-heading font-extrabold text-2xl flex items-center justify-center group-hover:bg-brand-blue transition-colors">{v.letter}</div>
                  <h3 className="font-heading font-bold text-lg text-brand-ink">{v.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-4">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* STRUKTUR ORGANISASI */}
      <section className="container py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2">Struktur Organisasi</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-ink">Pengurus Yayasan</h2>
        </div>
        <div className="flex flex-col items-center gap-6">
          <OrgNode icon={ShieldCheck} title="Pembina" name="Dewan Pembina Yayasan" primary />
          <div className="w-px h-6 bg-border" />
          <OrgNode icon={Users} title="Ketua Yayasan" name={ORG.founders[0]} primary />
          <div className="w-px h-6 bg-border" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl">
            <OrgNode icon={Building2} title="Sekretaris" name={ORG.founders[1]} />
            <OrgNode icon={Heart} title="Bendahara" name="Pengurus Keuangan" />
            <OrgNode icon={Users} title="Divisi Program" name="Tim Program & Relawan" />
          </div>
        </div>
      </section>

      {/* MILESTONE */}
      <section className="bg-brand-ink text-white">
        <div className="container py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-4xl font-extrabold">Dampak &amp; Pencapaian</h2>
            <p className="text-white/70 mt-3">Angka-angka yang lahir dari kebaikan para donatur.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {IMPACT_STATS.map((s, i) => (
              <div key={i} className="text-center rounded-2xl bg-white/5 py-8 px-4">
                <div className="text-3xl md:text-4xl font-extrabold font-heading text-brand-green"><CountUp end={s.value} suffix={s.suffix} /></div>
                <p className="text-white/70 text-sm mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="container py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2 flex items-center justify-center gap-2"><Award className="w-4 h-4" />Penghargaan &amp; Kemitraan</p>
          <h2 className="text-2xl md:text-4xl font-extrabold text-brand-ink">Dipercaya oleh Mitra Strategis</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PARTNERS.map((p) => (
            <div key={p} className="rounded-2xl border border-border bg-white h-24 flex items-center justify-center text-brand-ink font-heading font-bold text-center px-3 hover:border-brand-green/50 transition">{p}</div>
          ))}
        </div>
      </section>

      {/* LOKASI KAMI */}
      <section className="bg-brand-slatebg">
        <div className="container py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-brand-green font-semibold text-sm uppercase tracking-wide mb-2 flex items-center justify-center gap-2"><MapPin className="w-4 h-4" />Lokasi Kami</p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-brand-ink">Kunjungi Lembaga &amp; Panti Asuhan Kami</h2>
            <p className="text-muted-foreground mt-3">Kami memiliki beberapa lokasi pengasuhan di Kota Banjarmasin. Klik peta untuk melihat titik lokasi yang tepat &amp; petunjuk arah.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {LOCATIONS.map((loc) => (
              <Card key={loc.name} className={`rounded-2xl p-6 border bg-white flex flex-col hover:shadow-card transition-all duration-300 ${loc.primary ? 'border-brand-green/40' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${loc.primary ? 'bg-brand-green text-white' : 'bg-brand-greenlight text-brand-green'}`}><Building2 className="w-6 h-6" /></div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${loc.primary ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-bluelight text-brand-blue'}`}>{loc.tag}</span>
                </div>
                <h3 className="font-heading font-bold text-lg text-brand-ink mt-4 leading-snug">{loc.name}</h3>
                <p className="text-xs text-brand-green font-medium mt-1">{loc.role}</p>
                <p className="text-sm text-muted-foreground mt-3 flex items-start gap-2 flex-1"><MapPin className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />{loc.address}</p>
                <a href={loc.maps} target="_blank" rel="noopener noreferrer" className="mt-4">
                  <Button variant="outline" className="w-full rounded-xl border-brand-green text-brand-green hover:bg-brand-greenlight"><Navigation className="w-4 h-4 mr-2" />Buka di Google Maps</Button>
                </a>
              </Card>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
            <a href={`https://wa.me/${WHATSAPP_ADMIN}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-ink hover:text-brand-green font-medium"><Phone className="w-4 h-4 text-brand-green" />{ORG.phone}</a>
            <span className="hidden sm:inline text-border">•</span>
            <span className="text-muted-foreground">{ORG.email}</span>
          </div>
        </div>
      </section>

      <section className="container pb-20 pt-16">
        <div className="rounded-3xl bg-brand-green text-white p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">Mari Bergabung dalam Kebaikan</h2>
          <p className="text-white/80 mt-2">Bersama Anda, kami bisa menjangkau lebih banyak yang membutuhkan.</p>
          <Link href="/donasi"><Button size="lg" className="rounded-xl mt-6 bg-white text-brand-green hover:bg-white/90"><Heart className="w-5 h-5 mr-2" />Donasi Sekarang</Button></Link>
        </div>
      </section>
    </div>
  );
}

function OrgNode({ icon: Icon, title, name, primary }) {
  return (
    <Card className={`rounded-2xl p-4 border-border text-center w-full max-w-xs ${primary ? 'bg-brand-greenlight border-brand-green/30' : 'bg-white'}`}>
      <div className={`w-11 h-11 rounded-xl mx-auto flex items-center justify-center mb-2 ${primary ? 'bg-brand-green text-white' : 'bg-brand-bluelight text-brand-blue'}`}><Icon className="w-5 h-5" /></div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="font-semibold text-brand-ink text-sm">{name}</p>
    </Card>
  );
}
