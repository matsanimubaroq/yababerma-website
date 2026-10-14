'use client';

const initials = (name) => String(name || '?').replace(/,.*$/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

/** Shows the image when there is one, otherwise the name's initials on a brand-colored tile. */
export default function InitialsAvatar({ src, name, className = 'w-11 h-11 rounded-full', imgClassName = 'object-cover', textClassName = 'text-sm' }) {
  if (src) return <img src={src} alt={name || ''} className={`${className} ${imgClassName} bg-white`} />;
  return (
    <div className={`${className} bg-brand-green text-white font-bold flex items-center justify-center shrink-0 ${textClassName}`} aria-label={name || ''}>
      {initials(name)}
    </div>
  );
}
