'use client';

import Link from 'next/link';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle, MessageCircle, Calculator, BookOpen, Sparkles, HandHeart } from 'lucide-react';
import { waLink, WHATSAPP_ADMIN } from '@/lib/site-data';

const GROUPS = [
  {
    title: 'Seputar Zakat', icon: Calculator,
    items: [
      { q: 'Apa saja jenis zakat yang bisa saya tunaikan di sini?', a: 'Anda dapat menunaikan Zakat Penghasilan (Profesi) dan Zakat Maal (Harta). Gunakan Kalkulator Zakat di menu Pusat Layanan untuk menghitung secara otomatis sesuai nishab 85 gram emas dan kadar 2,5%.' },
      { q: 'Bagaimana cara menghitung zakat penghasilan saya?', a: 'Masukkan pendapatan bulanan, bonus, pendapatan lain, dan hutang/cicilan bulanan pada Kalkulator Zakat. Sistem akan menghitung 2,5% dan memberi tahu apakah penghasilan Anda sudah mencapai nishab.' },
      { q: 'Apakah saya mendapat bukti setor zakat resmi?', a: 'Ya. Untuk donasi berjenis Zakat, Anda dapat mengunduh Bukti Setoran Zakat (BSZ) resmi dari Portal Donatur. Bukti ini dapat digunakan sebagai pengurang penghasilan kena pajak sesuai UU No. 23 Tahun 2011.' },
    ],
  },
  {
    title: "Wakaf Al-Qur'an", icon: BookOpen,
    items: [
      { q: "Berapa nilai untuk satu mushaf Al-Qur'an?", a: "Setiap Rp150.000 setara dengan 1 mushaf Al-Qur'an yang akan disalurkan ke santri dan TPQ di pelosok Kalimantan." },
      { q: 'Apakah wakaf termasuk amal jariyah?', a: 'Benar. Wakaf Al-Qur\u2019an termasuk sedekah jariyah. Setiap huruf yang dibaca dari mushaf wakaf Anda, insya Allah, menjadi pahala yang terus mengalir meski Anda telah tiada.' },
      { q: 'Apakah ada sertifikat wakaf?', a: 'Ada. Setelah berwakaf, Anda dapat mengunduh e-Sertifikat Wakaf Al-Qur\u2019an ber-nama Anda dari langkah akhir donasi maupun Portal Donatur.' },
    ],
  },
  {
    title: 'Kurban', icon: Sparkles,
    items: [
      { q: 'Pilihan hewan kurban apa saja yang tersedia?', a: 'Tersedia Kambing/Domba (Rp2.750.000), Sapi Patungan 1/7 bagian (Rp2.500.000), dan Sapi Utuh (Rp17.500.000). Kunjungi halaman Kurban untuk berkurban.' },
      { q: 'Ke mana daging kurban disalurkan?', a: 'Daging kurban disalurkan kepada yatim, dhuafa, dan keluarga kurang mampu hingga ke pelosok Kalimantan, lengkap dengan dokumentasi.' },
      { q: 'Apakah saya menerima sertifikat kurban?', a: 'Ya, Anda akan menerima e-Sertifikat Kurban ber-nama pekurban yang dapat diunduh dan dibagikan ke keluarga.' },
    ],
  },
  {
    title: 'Cara Donasi & Konfirmasi', icon: HandHeart,
    items: [
      { q: 'Bagaimana cara berdonasi?', a: 'Pilih program di menu Donasi, klik "Donasi Sekarang", tentukan nominal, isi data diri, pilih bank tujuan, lalu selesaikan transfer sesuai nominal + kode unik yang tertera.' },
      { q: 'Apa fungsi kode unik pada nominal transfer?', a: 'Kode unik (3 digit terakhir) membantu tim kami memverifikasi donasi Anda secara cepat dan akurat. Mohon transfer tepat hingga digit terakhir.' },
      { q: 'Bagaimana konfirmasi setelah transfer?', a: 'Klik tombol "Konfirmasi via WhatsApp" yang otomatis membuka pesan siap kirim ke admin. Jika terlewat, gunakan Form Konfirmasi Donasi di menu Pusat Layanan untuk mengunggah bukti transfer.' },
      { q: 'Bank apa saja yang bisa digunakan?', a: 'Anda dapat transfer melalui BSI, Mandiri, BCA, BRI, atau Bank Kalsel \u2014 semua atas nama Yayasan Banua Berkah Mandiri.' },
    ],
  },
];

export default function FaqPage() {
  const waHelp = waLink(WHATSAPP_ADMIN, 'Halo Admin YABABERMA, saya ingin bertanya seputar donasi.');
  return (
    <div>
      <section className="bg-brand-slatebg border-b border-border">
        <div className="container py-14 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 text-brand-green font-semibold text-sm mb-3"><HelpCircle className="w-5 h-5" />Tanya Jawab</div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-brand-ink">Pertanyaan yang Sering Diajukan</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Temukan jawaban seputar zakat, wakaf, kurban, dan cara berdonasi di Yayasan Banua Berkah Mandiri.</p>
        </div>
      </section>

      <section className="container py-14 max-w-3xl">
        <div className="space-y-8">
          {GROUPS.map((g, gi) => {
            const Icon = g.icon;
            return (
              <div key={gi}>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-brand-ink mb-3"><Icon className="w-5 h-5 text-brand-green" />{g.title}</h2>
                <Accordion type="single" collapsible className="rounded-2xl border border-border bg-white px-4">
                  {g.items.map((it, i) => (
                    <AccordionItem key={i} value={`${gi}-${i}`}>
                      <AccordionTrigger className="text-left text-sm font-semibold text-brand-ink hover:no-underline">{it.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{it.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-brand-greenlight/60 p-6 md:p-8 text-center mt-12">
          <h3 className="font-heading font-bold text-xl text-brand-ink">Masih ada pertanyaan?</h3>
          <p className="text-muted-foreground mt-2">Tim kami siap membantu Anda melalui WhatsApp.</p>
          <div className="flex flex-wrap gap-3 justify-center mt-5">
            <a href={waHelp} target="_blank" rel="noopener noreferrer"><Button className="rounded-xl bg-[#25D366] hover:bg-[#1eb659] text-white"><MessageCircle className="w-4 h-4 mr-2" />Tanya via WhatsApp</Button></a>
            <Link href="/donasi"><Button variant="outline" className="rounded-xl"><HandHeart className="w-4 h-4 mr-2" />Mulai Donasi</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
