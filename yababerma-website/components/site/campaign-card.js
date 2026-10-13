'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users } from 'lucide-react';
import { formatRupiah, daysLeft, CATEGORY_LABEL } from '@/lib/site-data';

export default function CampaignCard({ c }) {
  const pct = Math.min(Math.round((c.collected_amount / c.target_amount) * 100), 100);
  const dleft = daysLeft(c.deadline);
  return (
    <Card className="overflow-hidden rounded-2xl border-border shadow-sm hover:shadow-card transition-all duration-300 group flex flex-col">
      <Link href={`/donasi/${c.slug}`} className="block relative">
        <div className="aspect-[16/10] overflow-hidden">
          <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
        <Badge className="absolute top-3 left-3 bg-brand-blue text-white border-0 hover:bg-brand-blue">{CATEGORY_LABEL[c.category] || c.category}</Badge>
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <Link href={`/donasi/${c.slug}`}>
          <h3 className="font-heading font-bold text-base leading-snug line-clamp-2 min-h-[2.8rem] hover:text-brand-green transition-colors">{c.title}</h3>
        </Link>
        <div className="mt-4">
          <Progress value={pct} className="h-2" />
          <div className="flex justify-between text-xs mt-2 text-muted-foreground">
            <span>Terkumpul</span><span className="font-semibold text-brand-green">{pct}%</span>
          </div>
          <div className="mt-1 font-bold text-brand-ink">{formatRupiah(c.collected_amount)}</div>
          <div className="text-xs text-muted-foreground">dari target {formatRupiah(c.target_amount)}</div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.donor_count} donatur</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{dleft} hari lagi</span>
        </div>
        <Link href={`/donasi/${c.slug}`} className="mt-4">
          <Button className="w-full rounded-xl">Donasi Sekarang</Button>
        </Link>
      </div>
    </Card>
  );
}
