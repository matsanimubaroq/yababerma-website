'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatRupiah } from '@/lib/site-data';
import { ShieldCheck, LogIn, CheckCircle2, RotateCcw, RefreshCw, Wallet, Clock, FileCheck2, Users, Loader2, LogOut, Download } from 'lucide-react';

const KEY_STORAGE = 'yb_admin_key';

export default function AdminPage() {
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [donations, setDonations] = useState([]);
  const [confs, setConfs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');

  const loadAll = useCallback(async (k) => {
    const h = { 'x-admin-key': k };
    try {
      const [s, d, cf] = await Promise.all([
        fetch('/api/admin/summary', { headers: h }).then((r) => r.json()),
        fetch('/api/admin/donations', { headers: h }).then((r) => r.json()),
        fetch('/api/admin/confirmations', { headers: h }).then((r) => r.json()),
      ]);
      setSummary(s && !s.error ? s : null);
      setDonations(Array.isArray(d) ? d : []);
      setConfs(Array.isArray(cf) ? cf : []);
    } catch (e) { toast.error('Gagal memuat data'); }
  }, []);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(KEY_STORAGE) : null;
    if (saved) { setKey(saved); setAuthed(true); loadAll(saved); }
  }, [loadAll]);

  const login = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
      if (r.ok) { localStorage.setItem(KEY_STORAGE, key); setAuthed(true); await loadAll(key); toast.success('Selamat datang, Admin'); }
      else toast.error('Kunci admin salah');
    } catch { toast.error('Gagal login'); } finally { setLoading(false); }
  };

  const verify = async (id, status) => {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key }, body: JSON.stringify({ donation_id: id, status }) });
      if (r.ok) { toast.success(status === 'verified' ? 'Donasi terverifikasi' : 'Status dikembalikan ke pending'); await loadAll(key); }
      else toast.error('Gagal memperbarui');
    } catch { toast.error('Terjadi kesalahan'); } finally { setBusy(''); }
  };

  const logout = () => { localStorage.removeItem(KEY_STORAGE); setAuthed(false); setKey(''); setDonations([]); setConfs([]); setSummary(null); };

  const exportCsv = () => {
    if (!donations.length) { toast.error('Tidak ada data untuk diekspor'); return; }
    const headers = ['Tanggal', 'Nama', 'Anonim', 'WhatsApp', 'Email', 'Program', 'Nominal', 'KodeUnik', 'TotalTransfer', 'Metode', 'Status', 'ID'];
    const rows = donations.map((d) => [
      new Date(d.created_at).toLocaleString('id-ID'), d.donor_name || '', d.is_anonymous ? 'Ya' : 'Tidak',
      d.donor_whatsapp || '', d.donor_email || '', d.campaign_title || '', d.amount || 0, d.unique_code || '',
      d.total_amount || 0, d.payment_method || '', d.status || '', d.id,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `donasi-yababerma-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Data donasi diekspor ke CSV');
  };

  if (!authed) {
    return (
      <div className="container py-24">
        <Card className="max-w-md mx-auto rounded-2xl p-8 text-center border-border shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-greenlight flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-8 h-8 text-brand-green" /></div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Panel Admin YABABERMA</h1>
          <p className="text-muted-foreground mt-2">Masukkan kunci admin untuk meninjau &amp; memverifikasi donasi.</p>
          <div className="mt-6 text-left">
            <Label className="text-sm">Kunci Admin</Label>
            <Input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} className="rounded-xl mt-1" placeholder="Masukkan kunci admin" />
          </div>
          <Button onClick={login} disabled={loading || !key} className="w-full rounded-xl mt-4 h-11">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><LogIn className="w-4 h-4 mr-2" />Masuk</>)}</Button>
        </Card>
      </div>
    );
  }

  const stat = [
    { label: 'Total Donasi', value: summary ? summary.total_donations : 0, icon: Users, color: 'text-brand-blue bg-brand-bluelight' },
    { label: 'Terverifikasi', value: summary ? summary.verified : 0, icon: CheckCircle2, color: 'text-brand-green bg-brand-greenlight' },
    { label: 'Menunggu', value: summary ? summary.pending : 0, icon: Clock, color: 'text-amber-600 bg-amber-100' },
    { label: 'Dana Terverifikasi', value: summary ? formatRupiah(summary.total_verified) : 'Rp 0', icon: Wallet, color: 'text-brand-green bg-brand-greenlight', small: true },
  ];

  return (
    <div className="bg-brand-slatebg/40 min-h-screen">
      <div className="container py-8 md:py-12 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-green text-white flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
            <div><h1 className="text-xl font-extrabold text-brand-ink">Panel Admin</h1><p className="text-sm text-muted-foreground">Verifikasi donasi &amp; konfirmasi transfer</p></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="rounded-xl" onClick={exportCsv}><Download className="w-4 h-4 mr-2" />Ekspor CSV</Button>
            <Button variant="outline" className="rounded-xl" onClick={() => loadAll(key)}><RefreshCw className="w-4 h-4 mr-2" />Segarkan</Button>
            <Button variant="outline" className="rounded-xl" onClick={logout}><LogOut className="w-4 h-4 mr-2" />Keluar</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stat.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="rounded-2xl p-5 border-border bg-white">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><Icon className="w-5 h-5" /></div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`font-extrabold text-brand-ink mt-1 ${s.small ? 'text-lg' : 'text-2xl'}`}>{s.value}</p>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="donasi">
          <TabsList className="rounded-xl">
            <TabsTrigger value="donasi" className="rounded-lg data-[state=active]:bg-brand-green data-[state=active]:text-white">Donasi ({donations.length})</TabsTrigger>
            <TabsTrigger value="konfirmasi" className="rounded-lg data-[state=active]:bg-brand-green data-[state=active]:text-white">Konfirmasi Transfer ({confs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="donasi" className="mt-4">
            <Card className="rounded-2xl border-border bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Donatur</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      <TableHead className="text-right">Total+Kode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donations.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">Belum ada donasi.</TableCell></TableRow>
                    ) : donations.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm whitespace-nowrap">{new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</TableCell>
                        <TableCell className="text-sm"><div className="font-medium">{d.is_anonymous ? 'Hamba Allah' : d.donor_name}</div><div className="text-xs text-muted-foreground">{d.donor_whatsapp}</div></TableCell>
                        <TableCell className="text-sm max-w-[180px] truncate">{d.campaign_title}</TableCell>
                        <TableCell className="text-right text-sm font-semibold whitespace-nowrap">{formatRupiah(d.amount)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">{formatRupiah(d.total_amount)}</TableCell>
                        <TableCell>{d.status === 'verified' ? <Badge className="bg-brand-greenlight text-brand-green border-0 hover:bg-brand-greenlight">Terverifikasi</Badge> : <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 hover:bg-amber-100">Pending</Badge>}</TableCell>
                        <TableCell className="text-right">
                          {d.status === 'verified' ? (
                            <Button size="sm" variant="ghost" className="rounded-lg text-muted-foreground" disabled={busy === d.id} onClick={() => verify(d.id, 'pending')}><RotateCcw className="w-4 h-4 mr-1" />Batalkan</Button>
                          ) : (
                            <Button size="sm" className="rounded-lg" disabled={busy === d.id} onClick={() => verify(d.id, 'verified')}>{busy === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><CheckCircle2 className="w-4 h-4 mr-1" />Verifikasi</>)}</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="konfirmasi" className="mt-4">
            {confs.length === 0 ? (
              <Card className="rounded-2xl border-border bg-white p-10 text-center text-muted-foreground">Belum ada konfirmasi transfer manual.</Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {confs.map((cf) => (
                  <Card key={cf.id} className="rounded-2xl border-border bg-white overflow-hidden">
                    {cf.proof_image ? (
                      <a href={cf.proof_image} target="_blank" rel="noopener noreferrer"><img src={cf.proof_image} alt="bukti" className="w-full h-40 object-cover" /></a>
                    ) : (
                      <div className="w-full h-40 bg-brand-slatebg flex items-center justify-center text-muted-foreground text-sm"><FileCheck2 className="w-6 h-6 mr-2" />Tanpa lampiran</div>
                    )}
                    <div className="p-4 space-y-1.5">
                      <div className="flex justify-between items-start"><span className="font-semibold text-brand-ink">{cf.name}</span><span className="font-bold text-brand-green">{formatRupiah(cf.amount)}</span></div>
                      <p className="text-xs text-muted-foreground">WA: {cf.whatsapp}</p>
                      <p className="text-xs text-muted-foreground">Bank: {cf.bank || '-'} &bull; Program: {cf.program || '-'}</p>
                      {cf.note && <p className="text-sm text-brand-ink mt-1 italic">&ldquo;{cf.note}&rdquo;</p>}
                      <p className="text-[11px] text-muted-foreground pt-1">{new Date(cf.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
