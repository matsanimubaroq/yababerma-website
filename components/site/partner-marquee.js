'use client';

import { useApi } from '@/components/site/use-api';
import InitialsAvatar from '@/components/site/initials-avatar';

function PartnerCard({ p }) {
  const body = (
    <div className="w-56 h-full rounded-2xl border border-border bg-white px-4 py-4 flex items-center gap-3 hover:border-brand-green/50 transition">
      <InitialsAvatar src={p.logo} name={p.name} className="w-14 h-14 rounded-xl" imgClassName="object-contain" textClassName="text-base" />
      <div className="min-w-0 text-left">
        <p className="font-heading font-bold text-brand-ink text-sm leading-snug line-clamp-2">{p.name}</p>
        <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-greenlight text-brand-green">{p.type_label}</span>
      </div>
    </div>
  );
  return p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="block h-full">{body}</a> : body;
}

/**
 * Partner logos scrolling sideways at a constant speed. The row holds two identical copies so the loop is
 * seamless; it pauses on hover and stays still (wrapped) for visitors who prefer reduced motion.
 */
export default function PartnerMarquee() {
  const { data } = useApi('/api/partners');
  const partners = Array.isArray(data) ? data : [];
  if (partners.length === 0) return null;

  // Repeat short lists so one copy is wider than the screen and no gap appears while scrolling.
  const copy = Array.from({ length: Math.ceil(8 / partners.length) }).flatMap(() => partners);
  const duration = `${Math.max(25, copy.length * 5)}s`;

  return (
    <>
      <div className="group overflow-hidden motion-reduce:hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]" style={{ animationDuration: duration }}>
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0" aria-hidden={half === 1}>
              {copy.map((p, i) => <div key={`${p.id}-${i}`} className="px-2"><PartnerCard p={half === 1 ? { ...p, url: '' } : p} /></div>)}
            </div>
          ))}
        </div>
      </div>
      <div className="hidden motion-reduce:flex flex-wrap justify-center gap-4">
        {partners.map((p) => <PartnerCard key={p.id} p={p} />)}
      </div>
    </>
  );
}
