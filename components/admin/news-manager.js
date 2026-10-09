'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Edit2, Trash2, Loader2, Newspaper, Calendar, Tag, Eye } from 'lucide-react';

export default function NewsManager({ adminKey }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState(null);

    const [form, setForm] = useState({
        title: '',
        imageUrl: '',
        content: '',
        category: 'Berita',
        status: 'Draft'
    });

    const load = async () => {
        setLoading(true);
        try {
            const r = await fetch('/api/admin/news', { headers: { 'x-admin-key': adminKey } });
            const data = await r.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            toast.error('Gagal memuat berita');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (adminKey) load();
    }, [adminKey]);

    const save = async () => {
        if (!form.title.trim()) return toast.error('Judul wajib diisi');
        setBusy(true);
        try {
            const url = editing ? `/api/admin/news/${editing.id}` : '/api/admin/news';
            const method = editing ? 'PUT' : 'POST';
            const r = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
                body: JSON.stringify(form)
            });
            if (r.ok) {
                toast.success(editing ? 'Berita diperbarui' : 'Berita ditambahkan');
                setOpen(false);
                load();
            } else {
                const d = await r.json();
                toast.error(d.error || 'Gagal menyimpan');
            }
        } catch (e) {
            toast.error('Terjadi kesalahan');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id) => {
        if (!confirm('Hapus berita ini?')) return;
        try {
            const r = await fetch(`/api/admin/news/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey }
            });
            if (r.ok) {
                toast.success('Berita dihapus');
                load();
            } else toast.error('Gagal menghapus');
        } catch (e) {
            toast.error('Terjadi kesalahan');
        }
    };

    const openAdd = () => {
        setEditing(null);
        setForm({ title: '', imageUrl: '', content: '', category: 'Berita', status: 'Draft' });
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            title: item.title || '',
            imageUrl: item.imageUrl || '',
            content: item.content || '',
            category: item.category || 'Berita',
            status: item.status || 'Draft'
        });
        setOpen(true);
    };

    const filtered = items.filter(it =>
        it.title?.toLowerCase().includes(search.toLowerCase()) ||
        it.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari berita atau artikel..."
                        className="pl-9 rounded-xl bg-white"
                    />
                </div>
                <Button onClick={openAdd} className="rounded-xl bg-brand-green hover:bg-brand-green/90">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Berita
                </Button>
            </div>

            {loading ? (
                <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-green" /></div>
            ) : filtered.length === 0 ? (
                <Card className="p-12 text-center rounded-2xl border-dashed border-2">
                    <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-muted-foreground">Belum ada berita atau artikel.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map((item) => (
                        <Card key={item.id} className="rounded-2xl overflow-hidden border-border bg-white flex flex-col">
                            <div className="aspect-video w-full bg-brand-slatebg relative overflow-hidden">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Newspaper className="w-8 h-8 opacity-20" /></div>
                                )}
                                <div className="absolute top-2 left-2 flex gap-1">
                                    <Badge className="bg-white/90 text-brand-ink hover:bg-white/90 border-0 backdrop-blur-sm">{item.category}</Badge>
                                    <Badge className={item.status === 'Published' ? 'bg-brand-green text-white border-0' : 'bg-amber-500 text-white border-0'}>
                                        {item.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-brand-ink line-clamp-2 mb-2 leading-tight">{item.title}</h3>
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4">
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(item.createdAt).toLocaleDateString('id-ID')}</span>
                                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {item.category}</span>
                                </div>
                                <div className="flex gap-2 mt-auto pt-3 border-t border-border">
                                    <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => openEdit(item)}>
                                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                                    </Button>
                                    <Button variant="outline" size="sm" className="rounded-lg text-red-600 border-red-100 hover:bg-red-50 hover:text-red-700" onClick={() => remove(item.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <a href={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm" className="rounded-lg">
                                            <Eye className="w-3.5 h-3.5" />
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Berita' : 'Tambah Berita Baru'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Judul Berita</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Masukkan judul berita..."
                                className="rounded-xl"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kategori</Label>
                                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Berita">Berita</SelectItem>
                                        <SelectItem value="Artikel">Artikel</SelectItem>
                                        <SelectItem value="Kisah Inspiratif">Kisah Inspiratif</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Draft">Draft</SelectItem>
                                        <SelectItem value="Published">Published</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>URL Gambar Thumbnail</Label>
                            <Input
                                value={form.imageUrl}
                                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                placeholder="https://..."
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Konten Artikel</Label>
                            <Textarea
                                value={form.content}
                                onChange={(e) => setForm({ ...form, content: e.target.value })}
                                placeholder="Tulis isi berita di sini..."
                                className="rounded-xl min-h-[300px] whitespace-pre-wrap"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Batal</Button>
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

function Save(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    )
}
