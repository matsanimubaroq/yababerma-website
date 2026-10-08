'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, LayoutTemplate, Clock } from 'lucide-react';
import { CATEGORY_LABEL } from '@/lib/site-data';
import MediaUpload from '@/components/admin/media-upload';

const DURATIONS = [[2000, '2 detik'], [5000, '5 detik'], [10000, '10 detik'], [30000, '30 detik']];
const uid = () => Math.random().toString(36).slice(2, 10);

export default function SliderManager({ adminKey }) {
  const [slides, setSlides] = useState([]);
  const [duration, setDuration] = useState(5000);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [hs, cs] = await Promise.all([
        fetch('/api/home-settings').then((r) => r.json()).catch(() => ({})),
        fetch('/api/admin/campaigns', { headers: { 'x-admin-key': adminKey } }).then((r) => r.json()).catch(() => []),
      ]);
      setSlides(Array.isArray(hs?.slides) ? hs.slides : []);
      const d = Number(hs?.duration_ms);
      setDuration(DURATIONS.some(([v]) => v === d) ? d : 5000);
      setCampaigns(Array.isArray(cs) ? cs.filter((c) => c.published !== false) : []);
    } finally { setLoading(false); }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const setSlide = (i, patch) => setSlides((arr) => arr.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const removeSlide = (i) => setSlides((arr) => arr.filter((_, idx) => idx !== i));
  const move = (i, dir) => setSlides((arr) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const addBanner = () => setSlides((arr) => [...arr, { id: uid(), type: 'banner', image: '', title: '', subtitle: '', badge: '', link: '', slug: '' }]);
  const addCampaign = (slug) => {
    const c = campaigns.find((x) => x.slug === slug);
    if (!c) return;
    setSlides((arr) => [...arr, { id: uid(), type: 'campaign', image: c.image || '', title: c.title || '', subtitle: c.short_desc || '', badge: CATEGORY_LABEL[c.category] || c.category || '', link: `/donasi/${c.slug}`, slug: c.slug }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/home-settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ slides, duration_ms: duration }) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Gagal menyimpan'); return; }
      toast.success('Slider beranda disimpan');
    } catch { toast.error('Terjadi kesalahan jaringan'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-brand-ink">Slider Beranda</h2>
          <p className="text-sm text-muted-foreground">Atur gambar/banner yang berputar di bagian atas halaman utama.</p>
        </div>
        <Button className="rounded-xl" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Simpan Slider</Button>
      </div>

      {/* Controls */}
      <Card className="rounded-2xl p-4 border-border bg-white flex flex-wrap items-end gap-4">
        <div>
          <Label className="text-sm flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-blue" />Durasi per slide</Label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
            <SelectTrigger className="rounded-xl mt-1 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{DURATIONS.map(([v, l]) => <SelectItem key={v} value={String(v)}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-sm flex items-center gap-1.5"><LayoutTemplate className="w-4 h-4 text-brand-green" />Tambah dari Program</Label>
            <Select value="" onValueChange={(v) => addCampaign(v)}>
              <SelectTrigger className="rounded-xl mt-1 w-56"><SelectValue placeholder="Pilih program..." /></SelectTrigger>
              <SelectContent>{campaigns.length === 0 ? <SelectItem value="none" disabled>Belum ada program publik</SelectItem> : campaigns.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={addBanner}><Plus className="w-4 h-4 mr-2" />Banner Custom</Button>
        </div>
      </Card>

      {/* Slides */}
      {slides.length === 0 ? (
        <Card className="rounded-2xl p-10 text-center text-muted-foreground">Belum ada slide. Tambahkan dari program atau buat banner custom. (Jika kosong, halaman utama memakai slider bawaan.)</Card>
      ) : (
        <div className="space-y-3">
          {slides.map((s, i) => (
            <Card key={s.id || i} className="rounded-2xl p-4 border-border bg-white">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge className={`${s.type === 'banner' ? 'bg-brand-blue' : 'bg-brand-green'} text-white border-0`}>Slide {i + 1} &bull; {s.type === 'banner' ? 'Banner Custom' : 'Program'}</Badge>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="rounded-lg h-8 w-8 p-0" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-lg h-8 w-8 p-0" disabled={i === slides.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive" onClick={() => removeSlide(i)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="grid md:grid-cols-[200px_1fr] gap-4">
                <MediaUpload adminKey={adminKey} kind="image" value={s.image} onChange={(url) => setSlide(i, { image: url })} label="Gambar slide" />
                <div className="space-y-2">
                  <div><Label className="text-xs text-muted-foreground">Judul</Label><Input value={s.title} onChange={(e) => setSlide(i, { title: e.target.value })} placeholder="Judul slide" className="rounded-xl mt-0.5" /></div>
                  <div><Label className="text-xs text-muted-foreground">Subjudul</Label><Input value={s.subtitle} onChange={(e) => setSlide(i, { subtitle: e.target.value })} placeholder="Teks pendukung" className="rounded-xl mt-0.5" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs text-muted-foreground">Label/Badge</Label><Input value={s.badge} onChange={(e) => setSlide(i, { badge: e.target.value })} placeholder="mis. Wakaf" className="rounded-xl mt-0.5" /></div>
                    <div><Label className="text-xs text-muted-foreground">Tautan tombol</Label><Input value={s.link} onChange={(e) => setSlide(i, { link: e.target.value })} placeholder="/donasi/slug atau https://" className="rounded-xl mt-0.5" /></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
