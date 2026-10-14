'use client';

// Shared bits for the CMS managers (Program, Berita & Artikel, Slider).

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Database } from 'lucide-react';

export const STATUS_OPTIONS = [
  ['Active', 'Aktif — tampil di web'],
  ['Inactive', 'Nonaktif — sembunyikan'],
  ['Draft', 'Draf — belum diterbitkan'],
];
export const STATUS_LABEL = { Active: 'Aktif', Inactive: 'Nonaktif', Draft: 'Draf' };
const STATUS_CLASS = { Active: 'bg-brand-green', Inactive: 'bg-slate-500', Draft: 'bg-amber-500' };

export const SORT_OPTIONS = [['newest', 'Terbaru'], ['oldest', 'Terlama']];

/** Active but its publishedAt is still in the future. */
export const isScheduled = (item) => item.status === 'Active' && !!item.publishedAt && new Date(item.publishedAt).getTime() > Date.now();

export function StatusBadge({ item }) {
  const scheduled = isScheduled(item);
  return (
    <Badge className={`${scheduled ? 'bg-brand-blue' : STATUS_CLASS[item.status] || 'bg-slate-500'} text-white border-0`}>
      {scheduled ? 'Terjadwal' : STATUS_LABEL[item.status] || item.status}
    </Badge>
  );
}

/** Shown when the API runs without a database: the panel mirrors the public demo content, read-only. */
export function DbBanner({ db }) {
  if (db !== false) return null;
  return (
    <Card className="rounded-2xl p-4 border-amber-300 bg-amber-50 text-amber-900 flex gap-3 items-start">
      <Database className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold">Mode demo: database belum terhubung</p>
        <p className="mt-0.5">Data di bawah sama dengan yang tampil di website, tetapi perubahan <b>tidak dapat disimpan</b>. Isi <code className="px-1 rounded bg-amber-100">MONGO_URL</code> di pengaturan server (Vercel) lalu deploy ulang agar menambah, mengedit, dan menghapus bisa tersimpan.</p>
      </div>
    </Card>
  );
}

// <input type="datetime-local"> works in local time without a zone; the API stores ISO (UTC).
const pad = (n) => String(n).padStart(2, '0');
export function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fromLocalInput(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const timeOf = (item) => (item.publishedAt ? new Date(item.publishedAt).getTime() : 0);
export const sortByTime = (list, order) => [...list].sort((a, b) => (order === 'oldest' ? 1 : -1) * (timeOf(a) - timeOf(b)));

/** fetch wrapper for the admin API: returns { ok, data } and never throws. */
export async function adminFetch(url, adminKey, { method = 'GET', body } = {}) {
  try {
    const r = await fetch(url, {
      method,
      headers: { 'x-admin-key': adminKey, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.' } };
  }
}
