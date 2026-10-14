'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, LayoutTemplate, Clock, CalendarClock } from 'lucide-react';
import { CATEGORY_LABEL } from '@/lib/site-data';
import MediaUpload from '@/components/admin/media-upload';
import { STATUS_OPTIONS, StatusBadge, DbBanner, toLocalInput, fromLocalInput, adminFetch } from '@/components/admin/cms-common';

const DURATIONS = [[3000, '3 detik'], [5000, '5 detik'], [6000, '6 detik'], [8000, '8 detik'], [10000, '10 detik'], [15000, '15 detik']];
const uid = () => Math.random().toString(36).slice(2, 10);

export default function SliderManager({ adminKey }) {
  const [slides, setSlides] = useState([]);
  const [duration, setDuration] = useState(6000);
  const [campaigns, setCampaigns] = useState([]);
  const [db, setDb] = useState(null); // false => demo mode (read-only)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const readOnly = db === false;

  const load = useCallback(async () => {
    try {
      const [hs, cs] = await Promise.all([
        adminFetch('/api/admin/home-settings', adminKey),
        adminFetch('/api/admin/campaigns', adminKey),
      ]);
      if (!hs.ok) toast.error(hs.data.error || 'Gagal memuat slider');
      setSlides(Array.isArray(hs.data?.slides) ? hs.data.slides : []);
      const d = Number(hs.data?.duration_ms);
      setDuration(d > 0 ? d : 6000);
      setDb(hs.data?.db !== false);
      setCampaigns(Array.isArray(cs.data?.items) ? cs.data.items.filter((c) => c.status === 'Active') : []);
      setDirty(false);
    } finally { setLoading(false); }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const change = (fn) => { setSlides(fn); setDirty(true); };
  const setSlide = (i, patch) => change((arr) => arr.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  const removeSlide = (i) => change((arr) => arr.filter((_, idx) => idx !== i));
  const move = (i, dir) => change((arr) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const addBanner = () => change((arr) => [...arr, { id: uid(), type: 'banner', image: '', title: '', subtitle: '', badge: '', link: '', slug: '', status: 'Active', publishedAt: null }]);
  const addCampaign = (slug) => {
    const c = campaigns.find((x) => x.slug === slug);
    if (!c) return;
    change((arr) => [...arr, { id: uid(), type: 'campaign', image: c.image || '', title: c.title || '', subtitle: c.short_desc || '', badge: CATEGORY_LABEL[c.category] || c.category || '', link: `/donasi/${c.slug}`, slug: c.slug, status: 'Active', publishedAt: null }]);
  };

  const save = async () => {
    setSaving(true);
    const { ok, data } = await adminFetch('/api/admin/home-settings', adminKey, { method: 'POST', body: { slides, duration_ms: duration } });
    setSaving(false);
    if (!ok) { toast.error(data.error || 'Gagal menyimpan'); return; }
    toast.success('Slider beranda disimpan');
    await load();
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const durations = DURATIONS.some(([v]) => v === duration) ? DURATIONS : [...DURATIONS, [duration, `${duration / 1000} detik`]].sort((a, b) => a[0] - b[0]);
  const shown = slides.filter((s) => s.status === 'Active' && !(s.publishedAt && new Date(s.publishedAt).getTime() > Date.now())).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-brand-ink">Slider Beranda</h2>
          <p className="text-sm text-muted-foreground">
            Atur gambar/banner yang berputar di bagian atas halaman utama. Hanya slide <b>Aktif</b> yang tampil.
            <span className="ml-1">({shown} tampil dari {slides.length})</span>
          </p>
        </div>
        <Button className="rounded-xl" onClick={save} disabled={saving || readOnly || !dirty}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Simpan Slider</Button>
      </div>

      <DbBanner db={db} />

      {/* Controls */}
      <Card className="rounded-2xl p-4 border-border bg-white flex flex-wrap items-end gap-4">
        <div>
          <Label className="text-sm flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-blue" />Durasi per slide</Label>
          <Select value={String(duration)} onValueChange={(v) => { setDuration(Number(v)); setDirty(true); }}>
            <SelectTrigger className="rounded-xl mt-1 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{durations.map(([v, l]) => <SelectItem key={v} value={String(v)}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-sm flex items-center gap-1.5"><LayoutTemplate className="w-4 h-4 text-brand-green" />Tambah dari Program</Label>
            <Select value="" onValueChange={(v) => addCampaign(v)} disabled={readOnly}>
              <SelectTrigger className="rounded-xl mt-1 w-56"><SelectValue placeholder="Pilih program..." /></SelectTrigger>
              <SelectContent>{campaigns.length === 0 ? <SelectItem value="none" disabled>Belum ada program aktif</SelectItem> : campaigns.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={addBanner} disabled={readOnly}><Plus className="w-4 h-4 mr-2" />Banner Custom</Button>
        </div>
      </Card>

      {/* Slides */}
      {slides.length === 0 ? (
        <Card className="rounded-2xl p-10 text-center text-muted-foreground">Belum ada slide. Tambahkan dari program atau buat banner custom. Selama tidak ada slide aktif, beranda menampilkan banner sederhana.</Card>
      ) : (
        <div className="space-y-3">
          {slides.map((s, i) => (
            <Card key={s.id || i} className={`rounded-2xl p-4 border-border bg-white ${s.status !== 'Active' ? 'opacity-80' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className={`${s.type === 'banner' ? 'bg-brand-blue' : 'bg-brand-green'} text-white border-0`}>Slide {i + 1} &bull; {s.type === 'banner' ? 'Banner Custom' : 'Program'}</Badge>
                  <StatusBadge item={s} />
                </div>
                <div className="flex items-center gap-1">
                  <label className="flex items-center gap-2 text-xs mr-2 cursor-pointer">
                    <Switch checked={s.status === 'Active'} disabled={readOnly} onCheckedChange={(v) => setSlide(i, { status: v ? 'Active' : 'Inactive' })} />Tampilkan di web
                  </label>
                  <Button size="sm" variant="ghost" className="rounded-lg h-8 w-8 p-0" disabled={readOnly || i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-lg h-8 w-8 p-0" disabled={readOnly || i === slides.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive" disabled={readOnly} onClick={() => removeSlide(i)}><Trash2 className="w-4 h-4" /></Button>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select value={s.status} onValueChange={(v) => setSlide(i, { status: v })}>
                        <SelectTrigger className="rounded-xl mt-0.5"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" />Mulai tayang</Label>
                      <Input type="datetime-local" value={toLocalInput(s.publishedAt)} onChange={(e) => setSlide(i, { publishedAt: fromLocalInput(e.target.value) })} className="rounded-xl mt-0.5" />
                    </div>
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
