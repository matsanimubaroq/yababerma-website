'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatRupiah } from '@/lib/site-data';
import CampaignManager from '@/components/admin/campaign-manager';
import { ShieldCheck, LogIn, CheckCircle2, RotateCcw, RefreshCw, Wallet, Clock, FileCheck2, Users, Loader2, LogOut, Download, Save, PawPrint, Search, Trash2, LayoutGrid, List as ListIcon, BarChart3, ImageDown, SlidersHorizontal, Eye, EyeOff, Mail, ArrowLeft, KeyRound, MessageSquare, Bell, Send } from 'lucide-react';

const CHART_COLORS = ['#00A651', '#0082C8', '#F59E0B', '#8B5CF6', '#EF4444', '#14B8A6', '#EC4899', '#64748B'];

const KEY_STORAGE = 'yb_admin_key';

export default function AdminPage() {
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [donations, setDonations] = useState([]);
  const [confs, setConfs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [kurban, setKurban] = useState([]);
  const [kurbanSaving, setKurbanSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  // Login UX: show password + forgot/reset flow
  const [showPass, setShowPass] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  // Change password (in-panel)
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeNew, setChangeNew] = useState('');
  const [changeConfirm, setChangeConfirm] = useState('');
  const [showChange, setShowChange] = useState(false);
  const [changeBusy, setChangeBusy] = useState(false);
  // WhatsApp settings
  const [wa, setWa] = useState({ thank_you_template: '', admin_notify_enabled: false, admin_number: '', token_configured: false });
  const [waSaving, setWaSaving] = useState(false);
  const [waTestNumber, setWaTestNumber] = useState('');
  const [waTestBusy, setWaTestBusy] = useState(false);
  // Toolbar / filters / views / selection
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [timeFilter, setTimeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [donView, setDonView] = useState('table');
  const [confView, setConfView] = useState('gallery');
  const [selDon, setSelDon] = useState([]);
  const [selConf, setSelConf] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [tab, setTab] = useState('donasi');

  const loadAll = useCallback(async (k) => {
    const h = { 'x-admin-key': k };
    try {
      const [s, d, cf, ku, ws] = await Promise.all([
        fetch('/api/admin/summary', { headers: h }).then((r) => r.json()),
        fetch('/api/admin/donations', { headers: h }).then((r) => r.json()),
        fetch('/api/admin/confirmations', { headers: h }).then((r) => r.json()),
        fetch('/api/admin/kurban', { headers: h }).then((r) => r.json()),
        fetch('/api/admin/wa-settings', { headers: h }).then((r) => r.json()),
      ]);
      setSummary(s && !s.error ? s : null);
      setDonations(Array.isArray(d) ? d : []);
      setConfs(Array.isArray(cf) ? cf : []);
      setKurban(ku && Array.isArray(ku.options) ? ku.options : []);
      if (ws && !ws.error) setWa({ thank_you_template: ws.thank_you_template || '', admin_notify_enabled: !!ws.admin_notify_enabled, admin_number: ws.admin_number || '', token_configured: !!ws.token_configured });
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

  const requestReset = async () => {
    setResetLoading(true);
    try {
      const r = await fetch('/api/admin/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await r.json();
      if (r.ok) { setResetEmail(data.email || ''); setAuthMode('reset'); toast.success('Kode verifikasi telah dikirim ke email admin'); }
      else toast.error(data.error || 'Gagal mengirim kode');
    } catch { toast.error('Terjadi kesalahan'); } finally { setResetLoading(false); }
  };

  const submitReset = async () => {
    setResetLoading(true);
    try {
      const r = await fetch('/api/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otp, new_password: newPass }) });
      const data = await r.json();
      if (r.ok) { toast.success('Password berhasil diubah. Silakan masuk.'); setKey(newPass); setOtp(''); setNewPass(''); setAuthMode('login'); }
      else toast.error(data.error || 'Gagal reset password');
    } catch { toast.error('Terjadi kesalahan'); } finally { setResetLoading(false); }
  };

  const verify = async (id, status) => {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key }, body: JSON.stringify({ donation_id: id, status }) });
      if (r.ok) { toast.success(status === 'verified' ? 'Donasi terverifikasi' : 'Status dikembalikan ke pending'); await loadAll(key); }
      else toast.error('Gagal memperbarui');
    } catch { toast.error('Terjadi kesalahan'); } finally { setBusy(''); }
  };

  const logout = () => { localStorage.removeItem(KEY_STORAGE); setAuthed(false); setKey(''); setDonations([]); setConfs([]); setSummary(null); setKurban([]); setSelDon([]); setSelConf([]); };

  const changePassword = async () => {
    if (changeNew.length < 6) { toast.error('Password baru minimal 6 karakter'); return; }
    if (changeNew !== changeConfirm) { toast.error('Konfirmasi password tidak cocok'); return; }
    setChangeBusy(true);
    try {
      const r = await fetch('/api/admin/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key }, body: JSON.stringify({ new_password: changeNew }) });
      const data = await r.json();
      if (r.ok) {
        localStorage.setItem(KEY_STORAGE, changeNew);
        setKey(changeNew);
        setChangeNew(''); setChangeConfirm(''); setChangeOpen(false);
        toast.success('Password admin berhasil diubah');
      } else toast.error(data.error || 'Gagal mengubah password');
    } catch { toast.error('Terjadi kesalahan'); } finally { setChangeBusy(false); }
  };

  const saveWaSettings = async () => {
    setWaSaving(true);
    try {
      const r = await fetch('/api/admin/wa-settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key }, body: JSON.stringify({ thank_you_template: wa.thank_you_template, admin_notify_enabled: wa.admin_notify_enabled, admin_number: wa.admin_number }) });
      const data = await r.json();
      if (r.ok) { setWa((w) => ({ ...w, thank_you_template: data.thank_you_template, admin_notify_enabled: data.admin_notify_enabled, admin_number: data.admin_number })); toast.success('Pengaturan WhatsApp tersimpan'); }
      else toast.error(data.error || 'Gagal menyimpan');
    } catch { toast.error('Terjadi kesalahan'); } finally { setWaSaving(false); }
  };

  const testWa = async () => {
    if (!waTestNumber.trim()) { toast.error('Isi nomor WhatsApp tujuan tes'); return; }
    setWaTestBusy(true);
    try {
      const r = await fetch('/api/admin/wa-test', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key }, body: JSON.stringify({ number: waTestNumber }) });
      const data = await r.json();
      if (r.ok) toast.success('Pesan tes terkirim! Cek WhatsApp tujuan.');
      else toast.error(data.error || 'Gagal mengirim tes');
    } catch { toast.error('Terjadi kesalahan'); } finally { setWaTestBusy(false); }
  };

  const setKurbanField = (idx, field, value) => setKurban((arr) => arr.map((o, i) => (i === idx ? { ...o, [field]: value } : o)));

  const saveKurban = async () => {
    setKurbanSaving(true);
    try {
      const payload = { options: kurban.map((o) => ({ key: o.key, quota: Number(o.quota) || 0, sold_base: Number(o.sold_base) || 0 })) };
      const r = await fetch('/api/admin/kurban-quota', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key }, body: JSON.stringify(payload) });
      const data = await r.json();
      if (r.ok) { setKurban(Array.isArray(data.options) ? data.options : kurban); toast.success('Kuota kurban berhasil diperbarui'); }
      else toast.error(data.error || 'Gagal menyimpan kuota');
    } catch { toast.error('Terjadi kesalahan'); } finally { setKurbanSaving(false); }
  };

  const exportCsv = (list) => {
    const data = Array.isArray(list) && list.length ? list : donations;
    if (!data.length) { toast.error('Tidak ada data untuk diekspor'); return; }
    const headers = ['Tanggal', 'Nama', 'Anonim', 'WhatsApp', 'Email', 'Program', 'Nominal', 'KodeUnik', 'TotalTransfer', 'Metode', 'Status', 'ID'];
    const rows = data.map((d) => [
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
    toast.success(`${data.length} data donasi diekspor ke CSV`);
  };

  // ---- Filtering / sorting ----
  const timeOk = (iso) => {
    if (timeFilter === 'all') return true;
    const t = new Date(iso).getTime();
    const now = Date.now();
    if (timeFilter === 'week') return t >= now - 7 * 864e5;
    if (timeFilter === 'month') return t >= now - 30 * 864e5;
    if (timeFilter === 'year') return t >= now - 365 * 864e5;
    if (timeFilter === 'custom') {
      const from = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : -Infinity;
      const to = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
      return t >= from && t <= to;
    }
    return true;
  };
  const sortList = (arr) => {
    const a = [...arr];
    if (sortBy === 'oldest') a.sort((x, y) => new Date(x.created_at) - new Date(y.created_at));
    else if (sortBy === 'amount_desc') a.sort((x, y) => (y.amount || 0) - (x.amount || 0));
    else if (sortBy === 'amount_asc') a.sort((x, y) => (x.amount || 0) - (y.amount || 0));
    else a.sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
    return a;
  };
  const q = search.trim().toLowerCase();
  const filteredDon = sortList((donations || []).filter((d) => {
    const name = (d.is_anonymous ? 'hamba allah' : (d.donor_name || '')).toLowerCase();
    if (q && !(name.includes(q) || (d.campaign_title || '').toLowerCase().includes(q) || (d.donor_whatsapp || '').includes(q))) return false;
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (!timeOk(d.created_at)) return false;
    return true;
  }));
  const filteredConf = sortList((confs || []).filter((cf) => {
    if (q && !((cf.name || '').toLowerCase().includes(q) || (cf.program || '').toLowerCase().includes(q) || (cf.whatsapp || '').includes(q))) return false;
    if (!timeOk(cf.created_at)) return false;
    return true;
  }));

  // ---- Selection ----
  const toggleSel = (which, id) => {
    if (which === 'don') setSelDon((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
    else setSelConf((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  };
  const toggleAll = (which, list) => {
    const ids = list.map((x) => x.id);
    if (which === 'don') setSelDon((a) => (a.length === ids.length ? [] : ids));
    else setSelConf((a) => (a.length === ids.length ? [] : ids));
  };

  // ---- Bulk delete ----
  const bulkDelete = async (coll, ids, clearFn) => {
    if (!ids.length) return;
    if (typeof window !== 'undefined' && !window.confirm(`Hapus ${ids.length} data terpilih? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBulkBusy(true);
    try {
      const r = await fetch('/api/admin/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': key }, body: JSON.stringify({ collection: coll, ids }) });
      const data = await r.json();
      if (r.ok) { toast.success(`${data.deleted} data berhasil dihapus`); clearFn([]); await loadAll(key); }
      else toast.error(data.error || 'Gagal menghapus');
    } catch { toast.error('Terjadi kesalahan'); } finally { setBulkBusy(false); }
  };

  // ---- Download helpers ----
  const downloadUrl = (url, filename) => {
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const downloadProof = (cf) => {
    if (!cf.proof_image) { toast.error('Konfirmasi ini tanpa lampiran'); return; }
    const ext = (cf.proof_image.match(/^data:image\/(\w+)/)?.[1]) || 'png';
    downloadUrl(cf.proof_image, `resi-${(cf.name || 'donatur').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.${ext}`);
  };
  const bulkDownloadProofs = async (ids) => {
    const items = (confs || []).filter((c) => ids.includes(c.id) && c.proof_image);
    if (!items.length) { toast.error('Tidak ada lampiran pada data terpilih'); return; }
    for (let i = 0; i < items.length; i++) { downloadProof(items[i]); await new Promise((r) => setTimeout(r, 450)); }
    toast.success(`${items.length} foto resi diunduh`);
  };

  // ---- Infographic data ----
  const progAgg = {};
  filteredDon.forEach((d) => { const k = d.campaign_title || 'Lainnya'; if (!progAgg[k]) progAgg[k] = { name: k, amount: 0, count: 0 }; progAgg[k].amount += d.amount || 0; progAgg[k].count += 1; });
  const progData = Object.values(progAgg).sort((a, b) => b.amount - a.amount).map((x) => ({ ...x, name: x.name.replace('Yayasan ', '').slice(0, 20) }));
  const statusData = [
    { name: 'Terverifikasi', value: filteredDon.filter((d) => d.status === 'verified').length },
    { name: 'Menunggu', value: filteredDon.filter((d) => d.status !== 'verified').length },
  ].filter((x) => x.value > 0);
  const shortRp = (n) => { const v = Number(n) || 0; if (v >= 1e9) return 'Rp ' + (v / 1e9).toFixed(1).replace('.0', '') + ' M'; if (v >= 1e6) return 'Rp ' + (v / 1e6).toFixed(0) + ' jt'; return 'Rp ' + v.toLocaleString('id-ID'); };

  if (!authed) {
    return (
      <div className="container py-24">
        <Card className="max-w-md mx-auto rounded-2xl p-8 border-border shadow-sm">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-greenlight flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-8 h-8 text-brand-green" /></div>
            <h1 className="text-2xl font-extrabold text-brand-ink">Panel Admin YABABERMA</h1>
          </div>

          {authMode === 'login' && (
            <>
              <p className="text-muted-foreground mt-2 text-center">Masukkan kunci admin untuk meninjau &amp; memverifikasi donasi.</p>
              <div className="mt-6 text-left">
                <Label className="text-sm">Kunci Admin</Label>
                <div className="relative mt-1">
                  <Input type={showPass ? 'text' : 'password'} value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} className="rounded-xl pr-11" placeholder="Masukkan kunci admin" />
                  <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-ink" title={showPass ? 'Sembunyikan password' : 'Lihat password'}>{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <Button onClick={login} disabled={loading || !key} className="w-full rounded-xl mt-4 h-11">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><LogIn className="w-4 h-4 mr-2" />Masuk</>)}</Button>
              <button type="button" onClick={() => setAuthMode('forgot')} className="w-full text-center text-sm text-brand-blue hover:underline mt-4">Lupa password?</button>
            </>
          )}

          {authMode === 'forgot' && (
            <>
              <p className="text-muted-foreground mt-2 text-center">Kami akan mengirim kode verifikasi ke email admin terdaftar untuk membuat password baru.</p>
              <div className="mt-6 rounded-xl bg-brand-slatebg p-4 flex items-center gap-3 text-sm"><Mail className="w-5 h-5 text-brand-green shrink-0" /><span className="text-brand-ink">Kode dikirim ke email <b>admin@yababerma.org</b></span></div>
              <Button onClick={requestReset} disabled={resetLoading} className="w-full rounded-xl mt-4 h-11">{resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Mail className="w-4 h-4 mr-2" />Kirim Kode Verifikasi</>)}</Button>
              <button type="button" onClick={() => setAuthMode('login')} className="w-full text-center text-sm text-muted-foreground hover:text-brand-ink mt-4 inline-flex items-center justify-center gap-1"><ArrowLeft className="w-4 h-4" />Kembali ke Masuk</button>
            </>
          )}

          {authMode === 'reset' && (
            <>
              <p className="text-muted-foreground mt-2 text-center">Masukkan kode 6 digit yang dikirim ke {resetEmail || 'email admin'} lalu buat password baru.</p>
              <div className="mt-6 text-left space-y-3">
                <div>
                  <Label className="text-sm">Kode Verifikasi (OTP)</Label>
                  <Input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={6} className="rounded-xl mt-1 tracking-[0.4em] text-center text-lg" placeholder="000000" />
                </div>
                <div>
                  <Label className="text-sm">Password Admin Baru</Label>
                  <div className="relative mt-1">
                    <Input type={showNewPass ? 'text' : 'password'} value={newPass} onChange={(e) => setNewPass(e.target.value)} className="rounded-xl pr-11" placeholder="Minimal 6 karakter" />
                    <button type="button" onClick={() => setShowNewPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-ink">{showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>
              </div>
              <Button onClick={submitReset} disabled={resetLoading || !otp || newPass.length < 6} className="w-full rounded-xl mt-4 h-11">{resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><KeyRound className="w-4 h-4 mr-2" />Simpan Password Baru</>)}</Button>
              <div className="flex items-center justify-between mt-4 text-sm">
                <button type="button" onClick={() => setAuthMode('login')} className="text-muted-foreground hover:text-brand-ink inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" />Batal</button>
                <button type="button" onClick={requestReset} disabled={resetLoading} className="text-brand-blue hover:underline">Kirim ulang kode</button>
              </div>
            </>
          )}
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

  const NAV_GROUPS = [
    { label: 'Transaksi', items: [
      { value: 'donasi', label: 'Donasi', icon: Wallet, badge: donations.length },
      { value: 'konfirmasi', label: 'Konfirmasi Transfer', icon: FileCheck2, badge: confs.length },
    ] },
    { label: 'Konten Website', items: [
      { value: 'program', label: 'Program & Donasi', icon: LayoutGrid },
    ] },
    { label: 'Pengaturan', items: [
      { value: 'kurban', label: 'Kuota Kurban', icon: PawPrint },
      { value: 'wa', label: 'Pengaturan WA', icon: MessageSquare },
    ] },
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
            <Button variant="outline" className="rounded-xl" onClick={() => setChangeOpen(true)}><KeyRound className="w-4 h-4 mr-2" />Ganti Password</Button>
            <Button variant="outline" className="rounded-xl" onClick={logout}><LogOut className="w-4 h-4 mr-2" />Keluar</Button>
          </div>
        </div>

        <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-brand-green" />Ganti Password Admin</DialogTitle>
              <DialogDescription>Buat password admin baru. Anda akan tetap masuk dengan password baru ini.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Password Baru</Label>
                <div className="relative mt-1">
                  <Input type={showChange ? 'text' : 'password'} value={changeNew} onChange={(e) => setChangeNew(e.target.value)} className="rounded-xl pr-11" placeholder="Minimal 6 karakter" />
                  <button type="button" onClick={() => setShowChange((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-ink">{showChange ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div>
                <Label className="text-sm">Konfirmasi Password Baru</Label>
                <Input type={showChange ? 'text' : 'password'} value={changeConfirm} onChange={(e) => setChangeConfirm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && changePassword()} className="rounded-xl mt-1" placeholder="Ulangi password baru" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setChangeOpen(false)}>Batal</Button>
              <Button className="rounded-xl" disabled={changeBusy || changeNew.length < 6 || changeNew !== changeConfirm} onClick={changePassword}>{changeBusy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}Simpan Password Baru</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col lg:flex-row gap-6 items-start">
          <nav className="w-full lg:w-60 shrink-0 bg-white rounded-2xl border border-border p-3 lg:sticky lg:top-6 space-y-4">
            {NAV_GROUPS.map((grp) => (
              <div key={grp.label}>
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{grp.label}</p>
                <div className="space-y-1">
                  {grp.items.map((it) => {
                    const Icon = it.icon;
                    const active = tab === it.value;
                    return (
                      <button key={it.value} onClick={() => setTab(it.value)} className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition ${active ? 'bg-brand-green text-white shadow-sm' : 'text-brand-ink hover:bg-muted'}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex-1 text-left">{it.label}</span>
                        {it.badge != null && <span className={`text-xs ${active ? 'text-white/80' : 'text-muted-foreground'}`}>{it.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="flex-1 min-w-0 w-full">
          <TabsContent value="donasi" className="mt-0 space-y-4">
            <Card className="rounded-2xl border-border bg-white p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, program, atau WA..." className="pl-9 rounded-xl" />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[165px] rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Terbaru</SelectItem>
                      <SelectItem value="oldest">Terlama</SelectItem>
                      <SelectItem value="amount_desc">Nominal Tertinggi</SelectItem>
                      <SelectItem value="amount_asc">Nominal Terendah</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Waktu</SelectItem>
                      <SelectItem value="week">7 Hari</SelectItem>
                      <SelectItem value="month">30 Hari</SelectItem>
                      <SelectItem value="year">1 Tahun</SelectItem>
                      <SelectItem value="custom">Kustom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[145px] rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="verified">Terverifikasi</SelectItem>
                      <SelectItem value="pending">Menunggu</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    <button onClick={() => setDonView('table')} className={`px-3 h-9 flex items-center ${donView === 'table' ? 'bg-brand-green text-white' : 'text-muted-foreground hover:bg-brand-slatebg'}`} title="Tabel"><ListIcon className="w-4 h-4" /></button>
                    <button onClick={() => setDonView('gallery')} className={`px-3 h-9 flex items-center ${donView === 'gallery' ? 'bg-brand-green text-white' : 'text-muted-foreground hover:bg-brand-slatebg'}`} title="Galeri"><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => setDonView('chart')} className={`px-3 h-9 flex items-center ${donView === 'chart' ? 'bg-brand-green text-white' : 'text-muted-foreground hover:bg-brand-slatebg'}`} title="Infografis"><BarChart3 className="w-4 h-4" /></button>
                  </div>
                </div>
                {timeFilter === 'custom' && (
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-muted-foreground">Dari</span>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl w-auto" />
                    <span className="text-muted-foreground">s/d</span>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl w-auto" />
                  </div>
                )}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Menampilkan {filteredDon.length} dari {donations.length} donasi{selDon.length > 0 ? ` • ${selDon.length} dipilih` : ''}</span>
                  {selDon.length > 0 && donView !== 'chart' && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => exportCsv(donations.filter((d) => selDon.includes(d.id)))}><Download className="w-4 h-4 mr-1" />Unduh CSV ({selDon.length})</Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-red-600 border-red-200 hover:bg-red-50" disabled={bulkBusy} onClick={() => bulkDelete('donations', selDon, setSelDon)}>{bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}Hapus ({selDon.length})</Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {donView === 'chart' ? (
              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="rounded-2xl border-border bg-white p-6">
                  <h3 className="font-bold text-brand-ink mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-brand-green" />Dana per Program</h3>
                  {progData.length === 0 ? <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">Tidak ada data</div> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={progData} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                        <XAxis type="number" tickFormatter={shortRp} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => formatRupiah(v)} />
                        <Bar dataKey="amount" name="Nominal" fill="#00A651" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
                <Card className="rounded-2xl border-border bg-white p-6">
                  <h3 className="font-bold text-brand-ink mb-4 flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-brand-green" />Status Donasi</h3>
                  {statusData.length === 0 ? <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">Tidak ada data</div> : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>
                          {statusData.map((e, i) => (<Cell key={i} fill={i === 0 ? '#00A651' : '#F59E0B'} />))}
                        </Pie>
                        <Tooltip /><Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>
            ) : donView === 'gallery' ? (
              filteredDon.length === 0 ? <Card className="rounded-2xl border-border bg-white p-10 text-center text-muted-foreground">Tidak ada donasi sesuai filter.</Card> : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDon.map((d) => (
                    <Card key={d.id} className={`rounded-2xl border bg-white p-4 ${selDon.includes(d.id) ? 'border-brand-green ring-1 ring-brand-green' : 'border-border'}`}>
                      <div className="flex items-start justify-between">
                        <Checkbox checked={selDon.includes(d.id)} onCheckedChange={() => toggleSel('don', d.id)} />
                        {d.status === 'verified' ? <Badge className="bg-brand-greenlight text-brand-green border-0 hover:bg-brand-greenlight">Terverifikasi</Badge> : <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 hover:bg-amber-100">Menunggu</Badge>}
                      </div>
                      <div className="mt-3 flex items-center justify-between"><span className="font-semibold text-brand-ink">{d.is_anonymous ? 'Hamba Allah' : d.donor_name}</span><span className="font-bold text-brand-green">{formatRupiah(d.amount)}</span></div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{d.campaign_title}</p>
                      <p className="text-xs text-muted-foreground truncate">WA: {d.donor_whatsapp}{d.donor_email ? ` • ${d.donor_email}` : ''}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{new Date(d.created_at).toLocaleString('id-ID')}</p>
                      <div className="mt-3">
                        {d.status === 'verified' ? <Button size="sm" variant="ghost" className="rounded-lg text-muted-foreground w-full" disabled={busy === d.id} onClick={() => verify(d.id, 'pending')}><RotateCcw className="w-4 h-4 mr-1" />Batalkan</Button> : <Button size="sm" className="rounded-lg w-full" disabled={busy === d.id} onClick={() => verify(d.id, 'verified')}>{busy === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><CheckCircle2 className="w-4 h-4 mr-1" />Verifikasi</>)}</Button>}
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <Card className="rounded-2xl border-border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"><Checkbox checked={filteredDon.length > 0 && selDon.length === filteredDon.length} onCheckedChange={() => toggleAll('don', filteredDon)} /></TableHead>
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
                      {filteredDon.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">Tidak ada donasi sesuai filter.</TableCell></TableRow>
                      ) : filteredDon.map((d) => (
                        <TableRow key={d.id} className={selDon.includes(d.id) ? 'bg-brand-greenlight/40' : ''}>
                          <TableCell><Checkbox checked={selDon.includes(d.id)} onCheckedChange={() => toggleSel('don', d.id)} /></TableCell>
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
            )}
          </TabsContent>

          <TabsContent value="konfirmasi" className="mt-4 space-y-4">
            <Card className="rounded-2xl border-border bg-white p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, program, atau WA..." className="pl-9 rounded-xl" />
                  </div>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[165px] rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Terbaru</SelectItem>
                      <SelectItem value="oldest">Terlama</SelectItem>
                      <SelectItem value="amount_desc">Nominal Tertinggi</SelectItem>
                      <SelectItem value="amount_asc">Nominal Terendah</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Waktu</SelectItem>
                      <SelectItem value="week">7 Hari</SelectItem>
                      <SelectItem value="month">30 Hari</SelectItem>
                      <SelectItem value="year">1 Tahun</SelectItem>
                      <SelectItem value="custom">Kustom</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    <button onClick={() => setConfView('gallery')} className={`px-3 h-9 flex items-center ${confView === 'gallery' ? 'bg-brand-green text-white' : 'text-muted-foreground hover:bg-brand-slatebg'}`} title="Galeri"><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => setConfView('table')} className={`px-3 h-9 flex items-center ${confView === 'table' ? 'bg-brand-green text-white' : 'text-muted-foreground hover:bg-brand-slatebg'}`} title="Tabel"><ListIcon className="w-4 h-4" /></button>
                  </div>
                </div>
                {timeFilter === 'custom' && (
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className="text-muted-foreground">Dari</span>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl w-auto" />
                    <span className="text-muted-foreground">s/d</span>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-xl w-auto" />
                  </div>
                )}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground">Menampilkan {filteredConf.length} dari {confs.length} konfirmasi{selConf.length > 0 ? ` • ${selConf.length} dipilih` : ''}</span>
                  <div className="flex gap-2 items-center">
                    {filteredConf.length > 0 && <Button size="sm" variant="ghost" className="rounded-lg text-xs" onClick={() => toggleAll('conf', filteredConf)}>{selConf.length === filteredConf.length ? 'Batal pilih' : 'Pilih semua'}</Button>}
                    {selConf.length > 0 && (<>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => bulkDownloadProofs(selConf)}><ImageDown className="w-4 h-4 mr-1" />Unduh Resi ({selConf.length})</Button>
                      <Button size="sm" variant="outline" className="rounded-lg text-red-600 border-red-200 hover:bg-red-50" disabled={bulkBusy} onClick={() => bulkDelete('confirmations', selConf, setSelConf)}>{bulkBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}Hapus ({selConf.length})</Button>
                    </>)}
                  </div>
                </div>
              </div>
            </Card>

            {filteredConf.length === 0 ? (
              <Card className="rounded-2xl border-border bg-white p-10 text-center text-muted-foreground">Tidak ada konfirmasi sesuai filter.</Card>
            ) : confView === 'table' ? (
              <Card className="rounded-2xl border-border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="w-10"><Checkbox checked={selConf.length === filteredConf.length} onCheckedChange={() => toggleAll('conf', filteredConf)} /></TableHead>
                      <TableHead>Tanggal</TableHead><TableHead>Nama</TableHead><TableHead>Program</TableHead><TableHead className="text-right">Nominal</TableHead><TableHead>Lampiran</TableHead><TableHead className="text-right">Aksi</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filteredConf.map((cf) => (
                        <TableRow key={cf.id} className={selConf.includes(cf.id) ? 'bg-brand-greenlight/40' : ''}>
                          <TableCell><Checkbox checked={selConf.includes(cf.id)} onCheckedChange={() => toggleSel('conf', cf.id)} /></TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{new Date(cf.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</TableCell>
                          <TableCell className="text-sm"><div className="font-medium">{cf.name}</div><div className="text-xs text-muted-foreground">{cf.whatsapp}</div></TableCell>
                          <TableCell className="text-sm max-w-[160px] truncate">{cf.program || '-'}</TableCell>
                          <TableCell className="text-right text-sm font-semibold whitespace-nowrap">{formatRupiah(cf.amount)}</TableCell>
                          <TableCell>{cf.proof_image ? <a href={cf.proof_image} target="_blank" rel="noopener noreferrer"><img src={cf.proof_image} alt="resi" className="w-10 h-10 rounded object-cover" /></a> : <span className="text-xs text-muted-foreground">Tidak ada</span>}</TableCell>
                          <TableCell className="text-right"><Button size="sm" variant="ghost" className="rounded-lg" disabled={!cf.proof_image} onClick={() => downloadProof(cf)}><Download className="w-4 h-4" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConf.map((cf) => (
                  <Card key={cf.id} className={`rounded-2xl border bg-white overflow-hidden ${selConf.includes(cf.id) ? 'border-brand-green ring-1 ring-brand-green' : 'border-border'}`}>
                    <div className="relative">
                      <div className="absolute top-2 left-2 z-10 bg-white/90 rounded-md p-1"><Checkbox checked={selConf.includes(cf.id)} onCheckedChange={() => toggleSel('conf', cf.id)} /></div>
                      {cf.proof_image ? (
                        <a href={cf.proof_image} target="_blank" rel="noopener noreferrer"><img src={cf.proof_image} alt="bukti" className="w-full h-40 object-cover" /></a>
                      ) : (
                        <div className="w-full h-40 bg-brand-slatebg flex items-center justify-center text-muted-foreground text-sm"><FileCheck2 className="w-6 h-6 mr-2" />Tanpa lampiran</div>
                      )}
                      {cf.proof_image && <button onClick={() => downloadProof(cf)} className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-lg p-2 shadow-sm" title="Unduh resi"><Download className="w-4 h-4 text-brand-ink" /></button>}
                    </div>
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

          <TabsContent value="kurban" className="mt-4">
            <Card className="rounded-2xl border-border bg-white p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-brand-greenlight text-brand-green flex items-center justify-center shrink-0"><PawPrint className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-brand-ink">Kelola Kuota Kurban</h3>
                  <p className="text-sm text-muted-foreground">Atur target kuota tiap musim &amp; jumlah terisi awal (baseline). Sisa kuota di halaman Kurban otomatis dihitung dari baseline + donasi masuk.</p>
                </div>
              </div>
              {kurban.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">Memuat data kuota...</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-3 px-1 text-xs font-medium text-muted-foreground">
                    <div className="col-span-6 md:col-span-6">Jenis Hewan</div>
                    <div className="col-span-3 md:col-span-3">Target Kuota</div>
                    <div className="col-span-3 md:col-span-3">Terisi (Baseline)</div>
                  </div>
                  {kurban.map((o, idx) => (
                    <div key={o.key} className="grid grid-cols-12 gap-3 items-center rounded-xl border border-border p-3">
                      <div className="col-span-6 md:col-span-6">
                        <p className="font-semibold text-brand-ink text-sm">{o.name}</p>
                        <p className="text-xs text-muted-foreground">{formatRupiah(o.price)} / {o.unit}</p>
                      </div>
                      <div className="col-span-3 md:col-span-3">
                        <Input type="number" min="0" value={o.quota} onChange={(e) => setKurbanField(idx, 'quota', e.target.value)} className="rounded-lg" />
                      </div>
                      <div className="col-span-3 md:col-span-3">
                        <Input type="number" min="0" value={o.sold_base} onChange={(e) => setKurbanField(idx, 'sold_base', e.target.value)} className="rounded-lg" />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button onClick={saveKurban} disabled={kurbanSaving} className="rounded-xl">{kurbanSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Simpan Perubahan</Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="wa" className="mt-4">
            <Card className="rounded-2xl border-border bg-white p-6 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#25D366]/15 text-[#128C4B] flex items-center justify-center shrink-0"><MessageSquare className="w-6 h-6" /></div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-lg text-brand-ink">Pengaturan WhatsApp Otomatis</h3>
                  <p className="text-sm text-muted-foreground">Kelola pesan ucapan terima kasih &amp; notifikasi WhatsApp. {wa.token_configured ? <span className="text-brand-green font-medium">Terhubung ke Fonnte \u2713</span> : <span className="text-red-500 font-medium">Token Fonnte belum dikonfigurasi</span>}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Template Pesan Ucapan Terima Kasih (dikirim saat donasi diverifikasi)</Label>
                <Textarea value={wa.thank_you_template} onChange={(e) => setWa((w) => ({ ...w, thank_you_template: e.target.value }))} rows={9} className="rounded-xl mt-2 text-sm" placeholder="Tulis pesan ucapan terima kasih..." />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Klik untuk sisipkan:</span>
                  {['{name}', '{amount}', '{program}', '{total}'].map((p) => (
                    <button key={p} type="button" onClick={() => setWa((w) => ({ ...w, thank_you_template: (w.thank_you_template || '') + p }))} className="px-2 py-0.5 rounded bg-brand-greenlight text-brand-green font-mono hover:bg-brand-green hover:text-white transition">{p}</button>
                  ))}
                  <span className="text-muted-foreground">— apit teks dengan *bintang* untuk cetak tebal di WhatsApp</span>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-brand-green mt-0.5" />
                    <div>
                      <p className="font-semibold text-brand-ink text-sm">Notifikasi WhatsApp ke Admin</p>
                      <p className="text-xs text-muted-foreground">Kirim WA ke admin setiap ada donasi/konfirmasi baru agar verifikasi lebih cepat.</p>
                    </div>
                  </div>
                  <Switch checked={wa.admin_notify_enabled} onCheckedChange={(v) => setWa((w) => ({ ...w, admin_notify_enabled: v }))} />
                </div>
                {wa.admin_notify_enabled && (
                  <div className="mt-3">
                    <Label className="text-sm">Nomor WA Admin (penerima notifikasi)</Label>
                    <Input value={wa.admin_number} onChange={(e) => setWa((w) => ({ ...w, admin_number: e.target.value }))} className="rounded-xl mt-1 max-w-xs" placeholder="08xxxxxxxxxx" />
                    <p className="text-[11px] text-muted-foreground mt-1">Sebaiknya berbeda dari nomor perangkat Fonnte pengirim (WhatsApp tidak bisa mengirim ke nomor sendiri).</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={saveWaSettings} disabled={waSaving} className="rounded-xl">{waSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Simpan Pengaturan</Button>
              </div>

              <div className="rounded-xl bg-brand-slatebg p-4">
                <Label className="text-sm font-semibold">Kirim Pesan Tes</Label>
                <p className="text-xs text-muted-foreground mb-2">Pastikan integrasi berjalan dengan mengirim WA percobaan.</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={waTestNumber} onChange={(e) => setWaTestNumber(e.target.value)} className="rounded-xl bg-white" placeholder="Nomor tujuan tes, mis. 0851xxxxxxx" />
                  <Button variant="outline" onClick={testWa} disabled={waTestBusy || !wa.token_configured} className="rounded-xl shrink-0"><Send className="w-4 h-4 mr-2" />{waTestBusy ? 'Mengirim...' : 'Kirim Tes'}</Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="program" className="mt-0">
            <CampaignManager adminKey={key} />
          </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
