'use client';

import { Star } from 'lucide-react';

/** Read-only 1–5 star badge (community rating). */
export default function Stars({ value = 0, className = 'w-4 h-4' }) {
  const n = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} dari 5 bintang`} title={`${n} dari 5 bintang`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${className} ${i < n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
      ))}
    </span>
  );
}

/** Clickable 1–5 star input for the admin forms. */
export function StarInput({ value, onChange }) {
  const n = Math.round(Number(value) || 0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} bintang`} className="p-0.5 rounded hover:scale-110 transition">
          <Star className={`w-6 h-6 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
        </button>
      ))}
      <span className="text-sm text-muted-foreground ml-2">{n ? `${n} bintang` : 'Pilih peringkat'}</span>
    </div>
  );
}
