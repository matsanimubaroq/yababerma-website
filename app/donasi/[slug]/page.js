'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApi } from '@/components/site/use-api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CampaignDetailView from '@/components/site/campaign-detail';

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

  return (
    <div className="bg-brand-slatebg/40">
      <div className="container py-8 md:py-12">
        <Link href="/donasi" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-green mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
        </Link>
        <CampaignDetailView c={c} />
      </div>
    </div>
  );
}
