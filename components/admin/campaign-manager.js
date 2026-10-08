'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Save, Eye, EyeOff, Star, ExternalLink, Image as ImageIcon, History, FileBarChart, Film, Search, X } from 'lucide-react';
import { formatRupiah } from '@/lib/site-data';
import MediaUpload from '@/components/admin/media-upload';

const CATS = [['zakat', 'Zakat'], ['sedekah', 'Sedekah'], ['wakaf', 'Wakaf'], ['fidyah', 'Fidyah'], ['kurban', 'Kurban'], ['bencana', 'Tanggap Bencana'], ['pendidikan', 'Pendidikan']];
const CAT_LABEL = Object.fromEntries(CATS);

const EMPTY = {
  title: '', category: 'sedekah', short_desc: '', image: '', story: '', video_url: '',
  target_amount: 0, collected_amount: 0, donor_count: 0, deadline: '',
  featured: false, published: false, gallery: [], updates: [], reports: [],
};

export default function CampaignManager({ adminKey }) {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/campaigns', { headers: { 'x-admin-key': adminKey } });
      const d = await r.json();
      setItems(Array.isArray(d) ? d : []);
    } catch { setItems([]); }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const openNew = () => { setEditId(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (c) => {
    setEditId(c.id);
    setForm({
      title: c.title || '', category: c.category || 'sedekah', short_desc: c.short_desc || '', image: c.image || '',
      story: Array.isArray(c.story) ? c.story.join('\n') : (c.story || ''),
      video_url: c.video_url || '', target_amount: c.target_amount || 0, collected_amount: c.collected_amount || 0,
      donor_count: c.donor_count || 0, deadline: c.deadline ? String(c.deadline).slice(0, 10) : '',
      featured: !!c.featured, published: c.published !== false,
      gallery: Array.isArray(c.gallery) ? c.gallery : [],
      updates: Array.isArray(c.updates) ? c.updates : [],
      reports: Array.isArray(c.reports) ? c.reports : [],
    });
    setOpen(true);
  };

  const save = async (publishState) => {
    if (!form.title.trim()) { toast.error('Nama program wajib diisi'); return; }
    setSaving(true);
    const payload = { ...form, published: publishState !== undefined ? publishState : form.published };
    try {
      const url = editId ? `/api/admin/campaigns/${editId}` : '/api/admin/campaigns';
      const method = editId ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Gagal menyimpan'); return; }
      toast.success(editId ? 'Program diperbarui' : 'Program dibuat');
      setOpen(false);
      await load();
    } catch { toast.error('Terjadi kesalahan jaringan'); }
    finally { setSaving(false); }
  };

  const togglePublish = async (c) => {
    setBusyId(c.id);
    try {
      const r = await fetch(`/api/admin/campaigns/${c.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify({ published: c.published === false }) });
      if (r.ok) { toast.success(c.published === false ? 'Program dipublikasikan' : 'Program dijadikan draf'); await load(); }
    } finally { setBusyId(''); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Hapus program "${c.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyId(c.id);
    try {
      const r = await fetch(`/api/admin/campaigns/${c.id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
      if (r.ok) { toast.success('Program dihapus'); await load(); }
    } finally { setBusyId(''); }
  };

  // ---- array field helpers ----
  const addGallery = (url) => { if (url) set({ gallery: [...form.gallery, url] }); };
  const removeGallery = (i) => set({ gallery: form.gallery.filter((_, idx) => idx !== i) });
  const addUpdate = () => set({ updates: [...form.updates, { date: new Date().toISOString().slice(0, 10), title: '', text: '' }] });
  const setUpdate = (i, patch) => set({ updates: form.updates.map((u, idx) => idx === i ? { ...u, ...patch } : u) });
  const removeUpdate = (i) => set({ updates: form.updates.filter((_, idx) => idx !== i) });
  const addReport = () => set({ reports: [...form.reports, { title: '', date: new Date().toISOString().slice(0, 10), note: '', photo_url: '', pdf_url: '', pdf_name: '' }] });
  const setReport = (i, patch) => set({ reports: form.reports.map((rp, idx) => idx === i ? { ...rp, ...patch } : rp) });
  const removeReport = (i) => set({ reports: form.reports.filter((_, idx) => idx !== i) });

  const filtered = (items || []).filter((c) => !q || (c.title || '').toLowerCase().includes(q.toLowerCase()) || (c.category || '').includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-brand-ink">Program &amp; Donasi</h2>
          <p className="text-sm text-muted-foreground">Kelola semua program yang tampil di halaman Program &amp; Donasi.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari program..." className="pl-9 rounded-xl w-48" />
          </div>
          <Button className="rounded-xl" onClick={openNew}><Plus className="w-4 h-4 mr-2" />Tambah Program</Button>
        </div>
      </div>

      {items === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl p-10 text-center text-muted-foreground">Belum ada program. Klik “Tambah Program” untuk membuat yang pertama.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const pct = c.target_amount ? Math.min(Math.round((c.collected_amount / c.target_amount) * 100), 100) : 0;
            return (
              <Card key={c.id} className="rounded-2xl overflow-hidden border-border bg-white flex flex-col">
                <div className="relative h-32 bg-muted">
                  {c.image ? <img src={c.image} alt={c.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-8 h-8" /></div>}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <Badge className={`${c.published === false ? 'bg-amber-500' : 'bg-brand-green'} text-white border-0`}>{c.published === false ? 'Draf' : 'Publik'}</Badge>
                    {c.featured && <Badge className="bg-brand-blue text-white border-0"><Star className="w-3 h-3" /></Badge>}
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <Badge variant="secondary" className="w-fit mb-2 text-brand-blue bg-brand-bluelight border-0">{CAT_LABEL[c.category] || c.category}</Badge>
                  <h3 className="font-bold text-sm text-brand-ink line-clamp-2 leading-snug">{c.title}</h3>
                  <div className="mt-2 text-xs text-muted-foreground">{formatRupiah(c.collected_amount)} / {formatRupiah(c.target_amount)} • {pct}% • {c.donor_count} donatur</div>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <Button size="sm" variant="outline" className="rounded-lg flex-1" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
                    <Button size="sm" variant="outline" className="rounded-lg" title="Pratinjau" onClick={() => window.open(`/admin/preview/${c.id}`, '_blank')}><ExternalLink className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="outline" className="rounded-lg" title={c.published === false ? 'Publikasikan' : 'Jadikan draf'} disabled={busyId === c.id} onClick={() => togglePublish(c)}>{busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (c.published === false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />)}</Button>
                    <Button size="sm" variant="ghost" className="rounded-lg text-destructive" disabled={busyId === c.id} onClick={() => remove(c)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-2xl p-0 max-h-[90vh] flex flex-col">
          <DialogHeader className="p-5 pb-3 border-b border-border">
            <DialogTitle>{editId ? 'Edit Program' : 'Tambah Program Baru'}</DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-5 overflow-y-auto">
            {/* Basic */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label className="text-sm">Nama Program *</Label><Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="mis. Wakaf Al-Qur'an Pelosok" className="rounded-xl mt-1" /></div>
              <div>
                <Label className="text-sm">Jenis Program</Label>
                <Select value={form.category} onValueChange={(v) => set({ category: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm">Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => set({ deadline: e.target.value })} className="rounded-xl mt-1" /></div>
              <div className="sm:col-span-2"><Label className="text-sm">Deskripsi Singkat</Label><Textarea value={form.short_desc} onChange={(e) => set({ short_desc: e.target.value })} rows={2} placeholder="Ringkasan singkat yang tampil di kartu program" className="rounded-xl mt-1" /></div>
            </div>

            {/* Cover */}
            <div><Label className="text-sm">Foto Sampul (Cover)</Label><div className="mt-1"><MediaUpload adminKey={adminKey} kind="image" value={form.image} onChange={(url) => set({ image: url })} /></div></div>

            {/* Numbers */}
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-sm">Target (Rp)</Label><Input type="number" value={form.target_amount} onChange={(e) => set({ target_amount: e.target.value })} className="rounded-xl mt-1" /></div>
              <div><Label className="text-sm">Terkumpul (Rp)</Label><Input type="number" value={form.collected_amount} onChange={(e) => set({ collected_amount: e.target.value })} className="rounded-xl mt-1" /></div>
              <div><Label className="text-sm">Jumlah Donatur</Label><Input type="number" value={form.donor_count} onChange={(e) => set({ donor_count: e.target.value })} className="rounded-xl mt-1" /></div>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-2">Angka Terkumpul &amp; Jumlah Donatur diisi &amp; diperbarui manual oleh admin.</p>

            {/* Story */}
            <div><Label className="text-sm">Cerita / Deskripsi Lengkap</Label><Textarea value={form.story} onChange={(e) => set({ story: e.target.value })} rows={5} placeholder="Tulis deskripsi lengkap. Pisahkan antar paragraf dengan baris baru (Enter)." className="rounded-xl mt-1" /></div>

            {/* Video */}
            <div><Label className="text-sm flex items-center gap-1.5"><Film className="w-4 h-4 text-brand-blue" />Video Penjelasan (link YouTube)</Label><Input value={form.video_url} onChange={(e) => set({ video_url: e.target.value })} placeholder="https://youtu.be/..." className="rounded-xl mt-1" /></div>

            {/* Gallery */}
            <div>
              <Label className="text-sm flex items-center gap-1.5"><ImageIcon className="w-4 h-4 text-brand-green" />Galeri Program</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {form.gallery.map((g, i) => (
                  <div key={i} className="relative group"><img src={g} alt="galeri" className="w-full h-20 object-cover rounded-lg border border-border" /><button type="button" onClick={() => removeGallery(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"><X className="w-3.5 h-3.5" /></button></div>
                ))}
                <div className="h-20"><MediaUpload adminKey={adminKey} kind="image" value="" onChange={(url) => addGallery(url)} compact /></div>
              </div>
            </div>

            {/* Updates */}
            <div>
              <div className="flex items-center justify-between"><Label className="text-sm flex items-center gap-1.5"><History className="w-4 h-4 text-brand-blue" />Log Pembaruan</Label><Button type="button" size="sm" variant="outline" className="rounded-lg h-8" onClick={addUpdate}><Plus className="w-3.5 h-3.5 mr-1" />Tambah</Button></div>
              <div className="space-y-2 mt-2">
                {form.updates.map((u, i) => (
                  <div key={i} className="rounded-xl border border-border p-3 space-y-2 bg-muted/30">
                    <div className="flex gap-2"><Input type="date" value={u.date ? String(u.date).slice(0, 10) : ''} onChange={(e) => setUpdate(i, { date: e.target.value })} className="rounded-lg w-40" /><Input value={u.title} onChange={(e) => setUpdate(i, { title: e.target.value })} placeholder="Judul pembaruan" className="rounded-lg flex-1" /><Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeUpdate(i)}><Trash2 className="w-4 h-4" /></Button></div>
                    <Textarea value={u.text} onChange={(e) => setUpdate(i, { text: e.target.value })} rows={2} placeholder="Isi pembaruan" className="rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Reports (LPJ) */}
            <div>
              <div className="flex items-center justify-between"><Label className="text-sm flex items-center gap-1.5"><FileBarChart className="w-4 h-4 text-brand-green" />Laporan Penyaluran Dana (Foto &amp; PDF LPJ)</Label><Button type="button" size="sm" variant="outline" className="rounded-lg h-8" onClick={addReport}><Plus className="w-3.5 h-3.5 mr-1" />Tambah</Button></div>
              <div className="space-y-3 mt-2">
                {form.reports.map((rp, i) => (
                  <div key={i} className="rounded-xl border border-border p-3 space-y-2 bg-muted/30">
                    <div className="flex gap-2"><Input type="date" value={rp.date ? String(rp.date).slice(0, 10) : ''} onChange={(e) => setReport(i, { date: e.target.value })} className="rounded-lg w-40" /><Input value={rp.title} onChange={(e) => setReport(i, { title: e.target.value })} placeholder="Judul laporan" className="rounded-lg flex-1" /><Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeReport(i)}><Trash2 className="w-4 h-4" /></Button></div>
                    <Textarea value={rp.note} onChange={(e) => setReport(i, { note: e.target.value })} rows={2} placeholder="Catatan laporan (opsional)" className="rounded-lg" />
                    <div className="grid sm:grid-cols-2 gap-2">
                      <MediaUpload adminKey={adminKey} kind="image" value={rp.photo_url} onChange={(url) => setReport(i, { photo_url: url })} label="Foto dokumentasi" compact />
                      <MediaUpload adminKey={adminKey} kind="file" value={rp.pdf_url} fileName={rp.pdf_name} onChange={(url, name) => setReport(i, { pdf_url: url, pdf_name: name })} label="Berkas PDF LPJ" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flags */}
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer"><Switch checked={form.featured} onCheckedChange={(v) => set({ featured: v })} /><span className="text-sm">Tampilkan sebagai Program Pilihan</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><Switch checked={form.published} onCheckedChange={(v) => set({ published: v })} /><span className="text-sm">Publikasikan (tampil ke publik)</span></label>
            </div>
          </div>

          <DialogFooter className="p-5 pt-3 border-t border-border gap-2 sm:justify-between">
            <div>
              {editId && <Button variant="ghost" className="rounded-xl" onClick={() => window.open(`/admin/preview/${editId}`, '_blank')}><ExternalLink className="w-4 h-4 mr-2" />Pratinjau</Button>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => save(false)} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Simpan sebagai Draf</Button>
              <Button className="rounded-xl" onClick={() => save(true)} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Simpan &amp; Publikasikan</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
