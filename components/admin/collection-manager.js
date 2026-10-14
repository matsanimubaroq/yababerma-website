'use client';

// Generic admin manager for simple, manually ordered content (Testimoni, Komunitas, Partner, Penulis).
// Each manager is just a configuration: endpoint, form fields and how a card looks (see content-managers.js).

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Save, Search, ArrowUp, ArrowDown } from 'lucide-react';
import MediaUpload from '@/components/admin/media-upload';
import { StarInput } from '@/components/site/stars';
import { STATUS_OPTIONS, StatusBadge, DbBanner, adminFetch } from '@/components/admin/cms-common';

const NONE = '__none'; // Radix Select cannot use '' as an item value

/**
 * fields: [{ key, label, type: 'text'|'textarea'|'image'|'url'|'select'|'stars'|'tags'|'number',
 *            required?, placeholder?, help?, options?: [[value,label]], allowEmpty?, full? }]
 * filters: [{ key, label, options: [[value,label]] }]   extra dropdown filters (besides status)
 */
export default function CollectionManager({
  adminKey, endpoint, title, description, addLabel, emptyText, fields, defaults, filters = [], searchKeys = ['name'],
  renderCard, onChanged,
}) {
  const [items, setItems] = useState(null);
  const [db, setDb] = useState(null); // false => demo mode (read-only)
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');
  const [extra, setExtra] = useState({});
  const readOnly = db === false;
  const base = `/api/admin/${endpoint}`;

  const load = useCallback(async () => {
    const { ok, data } = await adminFetch(base, adminKey);
    if (!ok) { toast.error(data.error || 'Gagal memuat data'); setItems([]); return; }
    setItems(Array.isArray(data.items) ? data.items : []);
    setDb(data.db !== false);
  }, [adminKey, base]);

  useEffect(() => { if (adminKey) load(); }, [adminKey, load]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const afterChange = async () => { await load(); onChanged?.(); };

  const toForm = (item) => {
    const f = { ...defaults };
    for (const fd of fields) {
      const v = item[fd.key];
      f[fd.key] = fd.type === 'tags' ? (Array.isArray(v) ? v.join(', ') : v || '') : (v ?? defaults[fd.key] ?? '');
    }
    f.status = item.status || 'Active';
    return f;
  };
  const openNew = () => { setEditing(null); setForm({ ...defaults, status: 'Active' }); setOpen(true); };
  const openEdit = (item) => { setEditing(item); setForm(toForm(item)); setOpen(true); };

  const save = async () => {
    const missing = fields.find((fd) => fd.required && !String(form[fd.key] ?? '').trim());
    if (missing) { toast.error(`${missing.label} wajib diisi`); return; }
    setSaving(true);
    const { ok, data } = await adminFetch(editing ? `${base}/${editing.id}` : base, adminKey, { method: editing ? 'PUT' : 'POST', body: form });
    setSaving(false);
    if (!ok) { toast.error(data.error || 'Gagal menyimpan'); return; }
    toast.success(editing ? 'Perubahan disimpan' : 'Data ditambahkan');
    setOpen(false);
    afterChange();
  };

  const toggleVisible = async (item) => {
    const next = item.status === 'Active' ? 'Inactive' : 'Active';
    setBusyId(item.id);
    const { ok, data } = await adminFetch(`${base}/${item.id}`, adminKey, { method: 'PUT', body: { status: next } });
    setBusyId('');
    if (!ok) { toast.error(data.error || 'Gagal mengubah status'); return; }
    toast.success(next === 'Active' ? 'Ditampilkan di web' : 'Disembunyikan dari web');
    afterChange();
  };

  const remove = async (item) => {
    if (!window.confirm(`Hapus "${item.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyId(item.id);
    const { ok, data } = await adminFetch(`${base}/${item.id}`, adminKey, { method: 'DELETE' });
    setBusyId('');
    if (!ok) { toast.error(data.error || 'Gagal menghapus'); return; }
    toast.success('Data dihapus');
    afterChange();
  };

  // Reordering works on the full list (it is disabled while a search/filter hides some items).
  const move = async (index, dir) => {
    const list = [...items];
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    [list[index], list[j]] = [list[j], list[index]];
    setItems(list);
    const { ok, data } = await adminFetch(`${base}/reorder`, adminKey, { method: 'POST', body: { ids: list.map((x) => x.id) } });
    if (!ok) { toast.error(data.error || 'Gagal menyimpan urutan'); }
    afterChange();
  };

  const filtering = !!q.trim() || statusF !== 'all' || Object.values(extra).some((v) => v && v !== 'all');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (items || []).filter((it) =>
      (statusF === 'all' || it.status === statusF) &&
      filters.every((f) => !extra[f.key] || extra[f.key] === 'all' || String(it[f.key]) === extra[f.key]) &&
      (!needle || searchKeys.some((k) => [].concat(it[k] ?? []).some((v) => String(v).toLowerCase().includes(needle)))));
  }, [items, q, statusF, extra, filters, searchKeys]);

  const renderField = (fd) => {
    const value = form[fd.key];
    switch (fd.type) {
      case 'textarea':
        return <Textarea value={value || ''} onChange={(e) => set({ [fd.key]: e.target.value })} rows={fd.rows || 3} placeholder={fd.placeholder} className="rounded-xl mt-1" />;
      case 'image':
        return <div className="mt-1"><MediaUpload adminKey={adminKey} kind="image" value={value || ''} onChange={(url) => set({ [fd.key]: url })} /></div>;
      case 'stars':
        return <div className="mt-1"><StarInput value={value} onChange={(v) => set({ [fd.key]: v })} /></div>;
      case 'select':
        return (
          <Select value={value ? String(value) : NONE} onValueChange={(v) => set({ [fd.key]: v === NONE ? '' : v })}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {fd.allowEmpty && <SelectItem value={NONE}>{fd.emptyLabel || '— Tidak ada —'}</SelectItem>}
              {(fd.options || []).map(([v, l]) => <SelectItem key={v} value={String(v)}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case 'number':
        return <Input type="number" value={value ?? ''} onChange={(e) => set({ [fd.key]: e.target.value })} placeholder={fd.placeholder} className="rounded-xl mt-1" />;
      default: // text, url, tags
        return <Input type={fd.type === 'url' ? 'url' : 'text'} value={value || ''} onChange={(e) => set({ [fd.key]: e.target.value })} placeholder={fd.placeholder} className="rounded-xl mt-1" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-brand-ink">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {description}
            {items && <span className="ml-1">({items.filter((i) => i.status === 'Active').length} tampil dari {items.length})</span>}
          </p>
        </div>
        <Button className="rounded-xl" onClick={openNew} disabled={readOnly}><Plus className="w-4 h-4 mr-2" />{addLabel}</Button>
      </div>

      <DbBanner db={db} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..." className="pl-9 rounded-xl w-52 bg-white" />
        </div>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="rounded-xl w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {STATUS_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l.split(' — ')[0]}</SelectItem>)}
          </SelectContent>
        </Select>
        {filters.map((f) => (
          <Select key={f.key} value={extra[f.key] || 'all'} onValueChange={(v) => setExtra((e) => ({ ...e, [f.key]: v }))}>
            <SelectTrigger className="rounded-xl w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{f.label}</SelectItem>
              {f.options.map(([v, l]) => <SelectItem key={v} value={String(v)}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
        {filtering && <span className="text-xs text-muted-foreground">Urutan hanya bisa diubah saat filter &amp; pencarian kosong.</span>}
      </div>

      {items === null ? (
        <div className="py-16 text-center"><Loader2 className="w-7 h-7 animate-spin mx-auto text-brand-green" /></div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl p-10 text-center text-muted-foreground border-dashed border-2">{items.length === 0 ? emptyText : 'Tidak ada data yang cocok dengan filter.'}</Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const index = items.indexOf(item);
            return (
              <Card key={item.id} className={`rounded-2xl border-border bg-white flex flex-col overflow-hidden ${item.status !== 'Active' ? 'opacity-75' : ''}`}>
                <div className="p-4 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge item={item} />
                    <div className="flex items-center">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" title="Naikkan urutan" disabled={readOnly || filtering || index === 0} onClick={() => move(index, -1)}><ArrowUp className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" title="Turunkan urutan" disabled={readOnly || filtering || index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  {renderCard(item)}
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <Switch checked={item.status === 'Active'} disabled={readOnly || busyId === item.id} onCheckedChange={() => toggleVisible(item)} />
                    {busyId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (item.status === 'Active' ? 'Tampil' : 'Tersembunyi')}
                  </label>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="rounded-lg" disabled={readOnly} onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
                    <Button size="sm" variant="ghost" className="rounded-lg text-destructive" disabled={readOnly || busyId === item.id} onClick={() => remove(item)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Edit ${editing.name}` : addLabel}</DialogTitle></DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4 py-1">
            {fields.map((fd) => (
              <div key={fd.key} className={fd.full || ['textarea', 'image', 'stars'].includes(fd.type) ? 'sm:col-span-2' : ''}>
                <Label className="text-sm">{fd.label}{fd.required ? ' *' : ''}</Label>
                {renderField(fd)}
                {fd.help && <p className="text-[11px] text-muted-foreground mt-1">{fd.help}</p>}
              </div>
            ))}
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={form.status || 'Active'} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTIONS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)} disabled={saving}>Batal</Button>
            <Button className="rounded-xl" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
