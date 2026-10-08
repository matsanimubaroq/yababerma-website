'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/components/site/use-api';
import { DonateButton } from '@/components/site/donation-modal';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRupiah, daysLeft, CATEGORY_LABEL } from '@/lib/site-data';
import { Users, Clock, Target, ArrowLeft, HeartHandshake, MessageSquareQuote, History, PieChart, ShieldCheck, Play, Download } from 'lucide-react';

const ALLOC_DEFAULT = {
  zakat: [['Penyaluran untuk 8 asnaf', 85], ['Hak amil', 10], ['Operasional program', 5]],
  wakaf: [['Pengadaan mushaf & aset wakaf', 88], ['Distribusi ke penerima', 8], ['Operasional', 4]],
  sedekah: [['Program & bantuan langsung', 85], ['Distribusi & logistik', 9], ['Operasional', 6]],
  fidyah: [['Paket makanan fakir miskin', 90], ['Distribusi', 6], ['Operasional', 4]],
  kurban: [['Pengadaan hewan kurban', 85], ['Penyembelihan & distribusi', 10], ['Operasional', 5]],
  bencana: [['Logistik & evakuasi darurat', 80], ['Relawan & transportasi', 13], ['Operasional', 7]],
  pendidikan: [['Beasiswa & biaya belajar', 84], ['Honor pengajar', 10], ['Operasional', 6]],
};
function allocationFor(c) {
  if (c && Array.isArray(c.allocation) && c.allocation.length) return c.allocation.map((a) => [a.label, a.percent]);
  return ALLOC_DEFAULT[c && c.category] || ALLOC_DEFAULT.sedekah;
}

function ytEmbed(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const { data: c, loading } = useApi(`/api/campaigns/${slug}`);

  if (loading) {
    return (
      <div className="container py-16">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-[16/9] rounded-2xl bg-muted animate-pulse" />
            <div className="h-8 bg-muted animate-pulse rounded-lg w-3/4" />
            <div className="h-40 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="h-80 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!c || c.error) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold text-brand-ink">Program tidak ditemukan</h1>
        <Link href="/donasi"><Button className="mt-6 rounded-xl">Kembali ke Katalog Donasi</Button></Link>
      </div>
    );
  }

  const pct = Math.min(Math.round((c.collected_amount / c.target_amount) * 100), 100);
  const dleft = daysLeft(c.deadline);

  return (
    <div className="bg-brand-slatebg/40">
      <div className="container py-8 md:py-12">
        <Link href="/donasi" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-green mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* MAIN */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl overflow-hidden shadow-card">
              <img src={c.image} alt={c.title} className="w-full aspect-[16/9] object-cover" />
            </div>
            <div>
              <Badge className="bg-brand-blue hover:bg-brand-blue text-white border-0 mb-3">{CATEGORY_LABEL[c.category] || c.category}</Badge>
              <h1 className="text-2xl md:text-4xl font-extrabold text-brand-ink leading-tight">{c.title}</h1>
              <p className="text-muted-foreground mt-3">{c.short_desc}</p>
            </div>

            {/* STORY */}
            <Card className="rounded-2xl p-6 border-border bg-white">
              <h2 className="font-heading font-bold text-lg text-brand-ink flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-brand-green" />Tentang Program Ini</h2>
              <div className="prose prose-sm max-w-none mt-4 space-y-3 text-brand-ink/90 leading-relaxed">
                {(c.story || []).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </Card>

            {/* VIDEO */}
            {ytEmbed(c.video_url) && (
              <Card className="rounded-2xl p-6 border-border bg-white">
                <h2 className="font-heading font-bold text-lg text-brand-ink flex items-center gap-2 mb-4"><Play className="w-5 h-5 text-brand-green" />Video Penjelasan Program</h2>
                <div className="aspect-video rounded-xl overflow-hidden bg-brand-ink">
                  <iframe src={ytEmbed(c.video_url)} title={c.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </Card>
            )}

            {/* LAPORAN PENYALURAN */}
            <Card className="rounded-2xl p-6 border-border bg-white">
              <h2 className="font-heading font-bold text-lg text-brand-ink flex items-center gap-2 mb-1"><PieChart className="w-5 h-5 text-brand-blue" />Laporan Penyaluran Dana</h2>
              <p className="text-sm text-muted-foreground mb-4">Rincian alokasi dana program secara transparan &amp; amanah.</p>
              <div className="space-y-4">
                {allocationFor(c).map(([label, pctv], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-brand-ink">{label}</span><span className="font-semibold text-brand-green">{pctv}%</span></div>
                    <Progress value={pctv} className="h-2" />
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-brand-bluelight/40 rounded-xl p-3 mt-4">
                <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                Laporan lengkap &amp; dokumentasi penyaluran dikirimkan berkala kepada para donatur. InsyaAllah amanah.
              </div>

              {Array.isArray(c.reports) && c.reports.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h3 className="font-semibold text-sm text-brand-ink">Dokumentasi &amp; LPJ Kegiatan</h3>
                  {c.reports.map((rp, i) => (
                    <div key={i} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-sm text-brand-ink">{rp.title || 'Laporan Penyaluran'}</p>
                          {rp.date && <p className="text-xs text-muted-foreground">{new Date(rp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                        </div>
                        {rp.pdf_url && (
                          <a href={rp.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="rounded-lg border-brand-blue text-brand-blue hover:bg-brand-bluelight"><Download className="w-4 h-4 mr-1.5" />Unduh LPJ (PDF)</Button>
                          </a>
                        )}
                      </div>
                      {rp.note && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{rp.note}</p>}
                      {rp.photo_url && <img src={rp.photo_url} alt={rp.title || 'dokumentasi'} className="w-full rounded-lg mt-3 object-cover max-h-80" />}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* GALLERY */}
            {c.gallery && c.gallery.length > 0 && (
              <Card className="rounded-2xl p-6 border-border bg-white">
                <h2 className="font-heading font-bold text-lg text-brand-ink mb-4">Galeri Program</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {c.gallery.map((g, i) => <div key={i} className="aspect-square rounded-xl overflow-hidden"><img src={g} alt="galeri" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" /></div>)}
                </div>
              </Card>
            )}

            {/* UPDATES */}
            {c.updates && c.updates.length > 0 && (
              <Card className="rounded-2xl p-6 border-border bg-white">
                <h2 className="font-heading font-bold text-lg text-brand-ink flex items-center gap-2 mb-4"><History className="w-5 h-5 text-brand-blue" />Log Pembaruan</h2>
                <div className="space-y-4">
                  {c.updates.map((u, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-brand-green mt-1.5" />
                        {i < c.updates.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-2">
                        <p className="text-xs text-muted-foreground">{new Date(u.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="font-semibold text-brand-ink text-sm mt-0.5">{u.title}</p>
                        <p className="text-sm text-muted-foreground">{u.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* RECENT DONATIONS */}
            <Card className="rounded-2xl p-6 border-border bg-white">
              <h2 className="font-heading font-bold text-lg text-brand-ink flex items-center gap-2 mb-4"><MessageSquareQuote className="w-5 h-5 text-brand-green" />Donatur Terbaru</h2>
              {(!c.recent_donations || c.recent_donations.length === 0) ? (
                <p className="text-sm text-muted-foreground">Jadilah donatur pertama untuk program ini.</p>
              ) : (
                <div className="space-y-3">
                  {c.recent_donations.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                      <div className="w-9 h-9 rounded-full bg-brand-greenlight text-brand-green flex items-center justify-center font-semibold shrink-0">{(d.name || 'H')[0]}</div>
                      <div className="flex-1">
                        <p className="text-sm"><span className="font-semibold text-brand-ink">{d.name}</span> berdonasi <span className="font-semibold text-brand-green">{formatRupiah(d.amount)}</span></p>
                        {d.message && <p className="text-xs text-muted-foreground italic mt-0.5">&ldquo;{d.message}&rdquo;</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="rounded-2xl p-6 border-border bg-white shadow-card">
                <div className="text-2xl font-extrabold text-brand-green">{formatRupiah(c.collected_amount)}</div>
                <p className="text-sm text-muted-foreground">terkumpul dari target {formatRupiah(c.target_amount)}</p>
                <Progress value={pct} className="h-2.5 mt-4" />
                <div className="flex justify-between text-xs text-muted-foreground mt-2"><span>{pct}% tercapai</span></div>

                <div className="grid grid-cols-3 gap-2 mt-5 text-center">
                  <div className="rounded-xl bg-brand-slatebg p-3">
                    <Users className="w-4 h-4 text-brand-green mx-auto" />
                    <p className="font-bold text-brand-ink mt-1 text-sm">{c.donor_count}</p>
                    <p className="text-[10px] text-muted-foreground">Donatur</p>
                  </div>
                  <div className="rounded-xl bg-brand-slatebg p-3">
                    <Clock className="w-4 h-4 text-brand-blue mx-auto" />
                    <p className="font-bold text-brand-ink mt-1 text-sm">{dleft}</p>
                    <p className="text-[10px] text-muted-foreground">Hari lagi</p>
                  </div>
                  <div className="rounded-xl bg-brand-slatebg p-3">
                    <Target className="w-4 h-4 text-brand-green mx-auto" />
                    <p className="font-bold text-brand-ink mt-1 text-sm">{pct}%</p>
                    <p className="text-[10px] text-muted-foreground">Progres</p>
                  </div>
                </div>

                <DonateButton campaign={c} className="w-full rounded-xl mt-5 h-12 text-base">Donasi Sekarang</DonateButton>
                <p className="text-xs text-center text-muted-foreground mt-3">Transfer bank &bull; Konfirmasi otomatis via WhatsApp</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
