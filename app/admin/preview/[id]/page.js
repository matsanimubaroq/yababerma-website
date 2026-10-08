'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Eye } from 'lucide-react';
import CampaignDetailView from '@/components/site/campaign-detail';

const KEY_STORAGE = 'yb_admin_key';

export default function CampaignPreviewPage() {
  const params = useParams();
  const id = params?.id;
  const [c, setC] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | noauth | notfound

  useEffect(() => {
    const key = typeof window !== 'undefined' ? localStorage.getItem(KEY_STORAGE) : null;
    if (!key) { setState('noauth'); return; }
    (async () => {
      try {
        const r = await fetch(`/api/admin/campaigns/${id}`, { headers: { 'x-admin-key': key } });
        if (r.status === 401) { setState('noauth'); return; }
        if (!r.ok) { setState('notfound'); return; }
        const d = await r.json();
        setC(d);
        setState('ok');
      } catch { setState('notfound'); }
    })();
  }, [id]);

  if (state === 'loading') {
    return <div className="container py-24 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /><p className="mt-3">Memuat pratinjau...</p></div>;
  }
  if (state === 'noauth') {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold text-brand-ink">Akses pratinjau memerlukan login admin</h1>
        <p className="text-muted-foreground mt-2">Silakan masuk ke panel admin terlebih dahulu, lalu buka pratinjau dari daftar program.</p>
        <Link href="/admin"><Button className="mt-6 rounded-xl">Ke Panel Admin</Button></Link>
      </div>
    );
  }
  if (state === 'notfound' || !c) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-2xl font-bold text-brand-ink">Program tidak ditemukan</h1>
        <Link href="/admin"><Button className="mt-6 rounded-xl">Kembali ke Panel Admin</Button></Link>
      </div>
    );
  }

  return (
    <div className="bg-brand-slatebg/40">
      <div className="sticky top-0 z-30 bg-amber-500 text-white text-sm font-semibold">
        <div className="container py-2.5 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><Eye className="w-4 h-4" />Mode Pratinjau{c.published === false ? ' — Program ini masih DRAF (belum tampil ke publik)' : ' — Program sudah Publik'}</span>
          <Link href="/admin" className="underline hover:no-underline whitespace-nowrap">Tutup &amp; kembali ke panel</Link>
        </div>
      </div>
      <div className="container py-8 md:py-12">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-green mb-6">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Panel Admin
        </Link>
        <CampaignDetailView c={c} preview />
      </div>
    </div>
  );
}
