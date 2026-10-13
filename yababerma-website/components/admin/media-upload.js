'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, X, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

// Client-side downscale/compress for large images to avoid proxy limits & keep DB light.
async function compressImage(file, maxDim = 1920, quality = 0.85) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (file.size < 400 * 1024) return file;
  try {
    const dataUrl = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    const img = await new Promise((res, rej) => { const i = new window.Image(); i.onload = () => res(i); i.onerror = rej; i.src = dataUrl; });
    let width = img.width, height = img.height;
    if (width > maxDim || height > maxDim) { const s = maxDim / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s); }
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    if (blob && blob.size < file.size) return new File([blob], (file.name || 'image').replace(/\.(png|webp|jpeg|jpg)$/i, '') + '.jpg', { type: 'image/jpeg' });
    return file;
  } catch { return file; }
}

export default function MediaUpload({ adminKey, kind = 'image', value, fileName, onChange, label, compact }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const isImage = kind === 'image';
  const accept = isImage ? 'image/*' : 'application/pdf,image/*';

  const handle = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      let up = file;
      if (isImage) up = await compressImage(file);
      const fd = new FormData();
      fd.append('file', up);
      const r = await fetch('/api/admin/upload', { method: 'POST', headers: { 'x-admin-key': adminKey }, body: fd });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error || 'Gagal mengunggah file'); return; }
      onChange(d.url, d.filename);
      toast.success('File berhasil diunggah');
    } catch (err) {
      toast.error('Gagal mengunggah file');
    } finally { setBusy(false); }
  };

  return (
    <div>
      {label && <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handle} />

      {isImage ? (
        value ? (
          <div className="relative group w-full">
            <img src={value} alt="preview" className={`w-full ${compact ? 'h-24' : 'h-40'} object-cover rounded-xl border border-border`} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center gap-2">
              <Button type="button" size="sm" variant="secondary" className="rounded-lg" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ganti'}</Button>
              <Button type="button" size="sm" variant="destructive" className="rounded-lg" onClick={() => onChange('', '')}><X className="w-4 h-4" /></Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={`w-full ${compact ? 'h-24' : 'h-40'} rounded-xl border-2 border-dashed border-border hover:border-brand-green/60 bg-muted/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition`}>
            {busy ? <Loader2 className="w-6 h-6 animate-spin text-brand-green" /> : <UploadCloud className="w-6 h-6 text-brand-green" />}
            <span className="text-xs font-medium">{busy ? 'Mengunggah...' : 'Unggah gambar'}</span>
          </button>
        )
      ) : (
        value ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-2.5">
            <FileText className="w-5 h-5 text-brand-blue shrink-0" />
            <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-ink truncate flex-1 hover:text-brand-blue inline-flex items-center gap-1">{fileName || 'Lihat berkas'} <ExternalLink className="w-3 h-3" /></a>
            <Button type="button" size="sm" variant="outline" className="rounded-lg h-8" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ganti'}</Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-lg h-8 text-destructive" onClick={() => onChange('', '')}><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="w-full rounded-xl border-2 border-dashed border-border hover:border-brand-blue/60 bg-muted/40 flex items-center justify-center gap-2 py-3 text-muted-foreground transition">
            {busy ? <Loader2 className="w-5 h-5 animate-spin text-brand-blue" /> : <UploadCloud className="w-5 h-5 text-brand-blue" />}
            <span className="text-xs font-medium">{busy ? 'Mengunggah...' : 'Unggah PDF / gambar'}</span>
          </button>
        )
      )}
    </div>
  );
}
