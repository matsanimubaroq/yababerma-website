'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Pencil, Trash2, Loader2, Newspaper, CalendarClock, User, Save, Eye } from 'lucide-react';
import MediaUpload from '@/components/admin/media-upload';
import {
  STATUS_OPTIONS, SORT_OPTIONS, StatusBadge, DbBanner, isScheduled, formatDate,
  toLocalInput, fromLocalInput, sortByTime, adminFetch,
} from '@/components/admin/cms-common';

const BASE_CATEGORIES = ['Berita', 'Artikel', 'Kisah Inspiratif', 'Laporan Kegiatan'];

const EMPTY = {
  title: '', excerpt: '', content: '', image: '', category: 'Berita', author: 'Admin',
  tags: '', status: 'Draft', publishedAt: '',
};

export default function NewsManager({ adminKey }) {
  const [items, setItems] = useState(null);
  const [db, setDb] = useState(null); // false => demo mode (read-only)
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [catF, setCatF] = useState('all');
  const [authorF, setAuthorF] = useState('all');
  const [sort, setSort] = useState('newest');
  const readOnly = db === false;

  const load = useCallback(async () => {
    const { ok, data } = await adminFetch('/api/admin/news', adminKey);
    if (!ok) { toast.error(data.error || 'Gagal memuat berita'); setItems([]); return; }
    setItems(Array.isArray(data.items) ? data.items : []);
    setDb(data.db !== false);
  }, [adminKey]);

  useEffect(() => { if (adminKey) load(); }, [adminKey, load]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const categories = useMemo(() => [...new Set([...BASE_CATEGORIES, ...(items || []).map((i) => i.category).filter(Boolean)])], [items]);
  const authors = useMemo(() => [...new Set((items || []).map((i) => i.author).filter(Boolean))].sort(), [items]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '', excerpt: item.excerpt || '', content: item.content || '', image: item.image || '',
      category: item.category || 'Berita', author: item.author || 'Admin', tags: (item.tags || []).join(', '),
      status: item.status || 'Draft', publishedAt: toLocalInput(item.publishedAt),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error('Judul wajib diisi');
    setBusy(true);
    const payload = { ...form, publishedAt: fromLocalInput(form.publishedAt) };
    const { ok, data } = await adminFetch(editing ? `/api/admin/news/${editing.id}` : '/api/admin/news', adminKey, { method: editing ? 'PUT' : 'POST', body: payload });
    setBusy(false);
    if (!ok) return toast.error(data.error || 'Gagal menyimpan');
    toast.success(editing ? 'Berita diperbarui' : 'Berita ditambahkan');
    setOpen(false);
    load();
  };

  const toggleVisible = async (item) => {
    const next = item.status === 'Active' ? 'Inactive' : 'Active';
    setBusyId(item.id);
    const { ok, data } = await adminFetch(`/api/admin/news/${item.id}`, adminKey, { method: 'PUT', body: { status: next } });
    setBusyId('');
    if (!ok) return toast.error(data.error || 'Gagal mengubah status');
    toast.success(next === 'Active' ? 'Berita ditampilkan di web' : 'Berita disembunyikan dari web');
    load();
  };

  const remove = async (item) => {
    if (!window.confirm(`Hapus berita "${item.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyId(item.id);
    const { ok, data } = await adminFetch(`/api/admin/news/${item.id}`, adminKey, { method: 'DELETE' });
    setBusyId('');
    if (!ok) return toast.error(data.error || 'Gagal menghapus');
    toast.success('Berita dihapus');
    load();
  };

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = (items || []).filter((it) =>
      (statusF === 'all' || it.status === statusF) &&
      (catF === 'all' || it.category === catF) &&
      (authorF === 'all' || it.author === authorF) &&
      (!needle || [it.title, it.category, it.author, ...(it.tags || [])].some((v) => String(v || '').toLowerCase().includes(needle))));
    return sortByTime(list, sort);
  }, [items, search, statusF, catF, authorF, sort]);

  const tagPreview = form.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-brand-ink">Berita &amp; Artikel</h2>
          <p className="text-sm text-muted-foreground">
            Hanya tulisan berstatus <b>Aktif</b> dan sudah lewat tanggal tayang yang muncul di website.
            {items && <span className="ml-1">({items.filter((i) => i.status === 'Active').length} aktif dari {items.length})</span>}
          </p>
        </div>
        <Button onClick={openAdd} disabled={readOnly} className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> Tambah Berita</Button>
      </div>

      <DbBanner db={db} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari judul, penulis, tag..." className="pl-9 rounded-xl bg-white w-60" />
        </div>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="rounded-xl w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {STATUS_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l.split(' — ')[0]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={catF} onValueChange={setCatF}>
          <SelectTrigger className="rounded-xl w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={authorF} onValueChange={setAuthorF}>
          <SelectTrigger className="rounded-xl w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua penulis</SelectItem>
            {authors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="rounded-xl w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{SORT_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {items === null ? (
        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-green" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-dashed border-2">
          <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
          <p className="text-muted-foreground">{items.length === 0 ? 'Belum ada berita atau artikel.' : 'Tidak ada berita yang cocok dengan filter.'}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const live = item.status === 'Active' && !isScheduled(item);
            return (
              <Card key={item.id} className={`rounded-2xl overflow-hidden border-border bg-white flex flex-col ${item.status !== 'Active' ? 'opacity-80' : ''}`}>
                <div className="aspect-video w-full bg-brand-slatebg relative overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Newspaper className="w-8 h-8 opacity-20" /></div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge className="bg-white/90 text-brand-ink hover:bg-white/90 border-0 backdrop-blur-sm">{item.category}</Badge>
                    <StatusBadge item={item} />
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-brand-ink line-clamp-2 mb-2 leading-tight">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.author}</span>
                    <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {item.publishedAt ? formatDate(item.publishedAt) : 'Belum dijadwalkan'}</span>
                  </div>
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">{item.tags.slice(0, 4).map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">#{t}</span>)}</div>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <Switch checked={item.status === 'Active'} disabled={readOnly || busyId === item.id} onCheckedChange={() => toggleVisible(item)} />
                      {busyId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (isScheduled(item) ? 'Terjadwal' : item.status === 'Active' ? 'Tampil' : 'Tersembunyi')}
                    </label>
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" className="rounded-lg" disabled={readOnly} onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5 mr-1" /> Edit</Button>
                      {live ? (
                        <a href={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="rounded-lg" title="Lihat di website"><Eye className="w-3.5 h-3.5" /></Button></a>
                      ) : (
                        <Button variant="outline" size="sm" className="rounded-lg" disabled title="Belum tayang di website"><Eye className="w-3.5 h-3.5" /></Button>
                      )}
                      <Button variant="outline" size="sm" className="rounded-lg text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700" disabled={readOnly || busyId === item.id} onClick={() => remove(item)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Berita' : 'Tambah Berita Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Masukkan judul berita..." className="rounded-xl" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => set({ category: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{(categories.includes(form.category) ? categories : [...categories, form.category]).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Penulis</Label>
                <Input list="yb-authors" value={form.author} onChange={(e) => set({ author: e.target.value })} placeholder="Nama penulis" className="rounded-xl" />
                <datalist id="yb-authors">{authors.map((a) => <option key={a} value={a} />)}</datalist>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Terbit</Label>
                <Input type="datetime-local" value={form.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} className="rounded-xl" />
                <p className="text-[11px] text-muted-foreground">Kosongkan = terbit saat diaktifkan. Tanggal depan = terjadwal.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tag</Label>
              <Input value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="pisahkan dengan koma, mis. zakat, wakaf, ramadan" className="rounded-xl" />
              {tagPreview.length > 0 && <div className="flex flex-wrap gap-1">{tagPreview.map((t) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-greenlight text-brand-green">#{t}</span>)}</div>}
            </div>
            <div className="space-y-2">
              <Label>Gambar Thumbnail</Label>
              <MediaUpload adminKey={adminKey} kind="image" value={form.image} onChange={(url) => set({ image: url })} />
            </div>
            <div className="space-y-2">
              <Label>Ringkasan</Label>
              <Textarea value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} rows={2} placeholder="Tampil di kartu berita. Kosongkan untuk diambil otomatis dari awal konten." className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Konten Artikel</Label>
              <Textarea value={form.content} onChange={(e) => set({ content: e.target.value })} placeholder="Tulis isi berita di sini..." className="rounded-xl min-h-[260px] whitespace-pre-wrap" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl" disabled={busy}>Batal</Button>
            <Button onClick={save} disabled={busy} className="rounded-xl bg-brand-green hover:bg-brand-green/90">
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Berita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
