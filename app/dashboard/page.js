'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatRupiah, ORG } from '@/lib/site-data';
import { isKurbanDonation, downloadKurbanCertificate, isWakafDonation, downloadWakafCertificate, isZakatDonation, downloadZakatReceipt } from '@/lib/receipts';
import { Wallet, HeartHandshake, Download, LogIn, Bell, HandCoins, Loader2, Award, BookOpen, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading, login, logout, refresh } = useAuth();
  const [donations, setDonations] = useState(null);
  const [savingNews, setSavingNews] = useState(false);

  const loadDonations = useCallback(async () => {
    try {
      const r = await fetch('/api/donations', { credentials: 'include' });
      const d = await r.json();
      setDonations(Array.isArray(d) ? d : []);
    } catch { setDonations([]); }
  }, []);

  useEffect(() => { if (user) loadDonations(); }, [user, loadDonations]);

  const toggleNewsletter = async (val) => {
    setSavingNews(true);
    try {
      await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ newsletter: val }) });
      await refresh();
      toast.success(val ? 'Berlangganan newsletter diaktifkan' : 'Berlangganan newsletter dinonaktifkan');
    } catch { toast.error('Gagal memperbarui'); }
    finally { setSavingNews(false); }
  };

  const total = (donations || []).reduce((s, d) => s + (d.amount || 0), 0);

  const downloadReceipt = (d) => {
    const w = window.open('', '_blank');
    if (!w) return toast.error('Popup diblokir browser');
    const date = new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    w.document.write(`
      <html><head><title>Kuitansi Donasi - ${ORG.short}</title>
      <style>
        body{font-family:Inter,Arial,sans-serif;color:#1E293B;padding:40px;max-width:640px;margin:auto}
        .head{display:flex;align-items:center;gap:12px;border-bottom:3px solid #00A651;padding-bottom:16px}
        .head img{width:56px;height:56px;object-fit:contain}
        h1{font-size:18px;margin:0;color:#00A651}
        .sub{font-size:12px;color:#64748b}
        .title{text-align:center;font-size:20px;font-weight:800;margin:28px 0 4px}
        table{width:100%;border-collapse:collapse;margin-top:20px}
        td{padding:10px 6px;border-bottom:1px solid #e2e8f0;font-size:14px}
        td:first-child{color:#64748b;width:42%}
        .amount{font-size:24px;font-weight:800;color:#00A651}
        .badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600}
        .verified{background:#e6f7ee;color:#00A651}.pending{background:#fef3c7;color:#b45309}
        .foot{margin-top:32px;text-align:center;font-size:12px;color:#94a3b8}
      </style></head><body>
      <div class="head"><img src="${ORG.logo}"/><div><h1>${ORG.name}</h1><div class="sub">${ORG.address}<br/>Akta Kemenkumham: ${ORG.ahu}</div></div></div>
      <div class="title">KUITANSI DONASI</div>
      <div style="text-align:center" class="sub">No. ${d.id}</div>
      <table>
        <tr><td>Tanggal</td><td>${date}</td></tr>
        <tr><td>Nama Donatur</td><td>${d.is_anonymous ? 'Hamba Allah' : d.donor_name}</td></tr>
        <tr><td>Program</td><td>${d.campaign_title}</td></tr>
        <tr><td>Nominal Donasi</td><td class="amount">${formatRupiah(d.amount)}</td></tr>
        <tr><td>Kode Unik</td><td>${d.unique_code}</td></tr>
        <tr><td>Total Transfer</td><td>${formatRupiah(d.total_amount)}</td></tr>
        <tr><td>Status</td><td><span class="badge ${d.status === 'verified' ? 'verified' : 'pending'}">${d.status === 'verified' ? 'Terverifikasi' : 'Menunggu Verifikasi'}</span></td></tr>
      </table>
      <div class="foot">Terima kasih atas kebaikan Anda. Semoga menjadi amal jariyah yang berkah.<br/>&copy; 2026 ${ORG.name}</div>
      </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  if (loading) {
    return <div className="container py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-green" /></div>;
  }

  if (!user) {
    return (
      <div className="container py-24">
        <Card className="max-w-md mx-auto rounded-2xl p-8 text-center border-border shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-greenlight flex items-center justify-center mx-auto mb-4"><HeartHandshake className="w-8 h-8 text-brand-green" /></div>
          <h1 className="text-2xl font-extrabold text-brand-ink">Portal Donatur</h1>
          <p className="text-muted-foreground mt-2">Masuk untuk melihat riwayat donasi, total kontribusi, dan mengunduh kuitansi resmi Anda.</p>
          <Button onClick={login} className="w-full rounded-xl mt-6 h-12"><LogIn className="w-5 h-5 mr-2" />Masuk dengan Google</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-brand-slatebg/40 min-h-screen">
      <div className="container py-10 md:py-14 space-y-6">
        {/* PROFILE HEADER */}
        <Card className="rounded-2xl p-6 border-border bg-white flex flex-col sm:flex-row items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-brand-green"><AvatarImage src={user.picture} /><AvatarFallback className="bg-brand-greenlight text-brand-green text-xl font-bold">{(user.name || 'U')[0]}</AvatarFallback></Avatar>
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl font-extrabold text-brand-ink">Assalamu'alaikum, {user.name} 👋</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
          <Button variant="outline" className="rounded-xl" onClick={logout}>Keluar</Button>
        </Card>

        {/* STATS */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl p-6 border-border bg-white">
            <div className="w-11 h-11 rounded-xl bg-brand-greenlight flex items-center justify-center mb-3"><Wallet className="w-5 h-5 text-brand-green" /></div>
            <p className="text-sm text-muted-foreground">Total Donasi</p>
            <p className="text-2xl font-extrabold text-brand-green mt-1">{formatRupiah(total)}</p>
          </Card>
          <Card className="rounded-2xl p-6 border-border bg-white">
            <div className="w-11 h-11 rounded-xl bg-brand-bluelight flex items-center justify-center mb-3"><HandCoins className="w-5 h-5 text-brand-blue" /></div>
            <p className="text-sm text-muted-foreground">Jumlah Transaksi</p>
            <p className="text-2xl font-extrabold text-brand-ink mt-1">{donations ? donations.length : 0}</p>
          </Card>
          <Card className="rounded-2xl p-6 border-border bg-white">
            <div className="w-11 h-11 rounded-xl bg-brand-greenlight flex items-center justify-center mb-3"><Bell className="w-5 h-5 text-brand-green" /></div>
            <p className="text-sm text-muted-foreground flex items-center justify-between">Newsletter <Switch checked={user.newsletter !== false} onCheckedChange={toggleNewsletter} disabled={savingNews} /></p>
            <p className="text-xs text-muted-foreground mt-2">Kabar kebaikan &amp; laporan penyaluran.</p>
          </Card>
        </div>

        {/* HISTORY */}
        <Card className="rounded-2xl border-border bg-white overflow-hidden">
          <div className="p-6 border-b border-border"><h2 className="font-heading font-bold text-lg text-brand-ink">Riwayat Donasi</h2></div>
          {donations === null ? (
            <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-green" /></div>
          ) : donations.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <p>Belum ada riwayat donasi.</p>
              <p className="text-sm mt-1">Donasi yang Anda buat dengan email <span className="font-medium text-brand-ink">{user.email}</span> akan muncul di sini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Kuitansi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(d.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell className="text-sm font-medium max-w-[200px] truncate">{d.campaign_title}</TableCell>
                      <TableCell className="text-right font-semibold text-brand-green whitespace-nowrap">{formatRupiah(d.amount)}</TableCell>
                      <TableCell>
                        {d.status === 'verified'
                          ? <Badge className="bg-brand-greenlight text-brand-green border-0 hover:bg-brand-greenlight">Terverifikasi</Badge>
                          : <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0 hover:bg-amber-100">Pending</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="rounded-lg text-brand-blue hover:text-brand-blue" onClick={() => downloadReceipt(d)}><Download className="w-4 h-4 mr-1" />PDF</Button>
                          {isKurbanDonation(d) && <Button variant="ghost" size="sm" className="rounded-lg text-brand-green hover:text-brand-green" onClick={() => downloadKurbanCertificate(d)}><Award className="w-4 h-4 mr-1" />Sertifikat</Button>}
                          {!isKurbanDonation(d) && isWakafDonation(d) && <Button variant="ghost" size="sm" className="rounded-lg text-brand-blue hover:text-brand-blue" onClick={() => downloadWakafCertificate(d)}><BookOpen className="w-4 h-4 mr-1" />Sertifikat</Button>}
                          {!isKurbanDonation(d) && !isWakafDonation(d) && isZakatDonation(d) && <Button variant="ghost" size="sm" className="rounded-lg text-brand-green hover:text-brand-green" onClick={() => downloadZakatReceipt(d)}><FileText className="w-4 h-4 mr-1" />BSZ</Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
