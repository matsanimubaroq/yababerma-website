'use client';

import Link from 'next/link';
import { Instagram, Facebook, Youtube, MapPin, Mail, Phone, ShieldCheck } from 'lucide-react';
import { ORG, NAV_ITEMS, SOCIALS } from '@/lib/site-data';

export default function Footer() {
  return (
    <footer className="bg-brand-ink text-slate-300">
      <div className="container py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <img src={ORG.logo} alt="logo" className="w-12 h-12 rounded-full bg-white p-1 object-contain" />
            <div>
              <p className="font-heading font-bold text-white leading-tight">Yayasan Banua</p>
              <p className="font-heading font-bold text-white leading-tight">Berkah Mandiri</p>
            </div>
          </div>
          <p className="text-sm mt-4 text-slate-400">{ORG.tagline}. Lembaga filantropi Islam &amp; kemanusiaan yang amanah di Banjarmasin.</p>
          <div className="flex gap-2 mt-5">
            {[{i:Instagram,h:SOCIALS.instagram},{i:Facebook,h:SOCIALS.facebook},{i:Youtube,h:SOCIALS.youtube}].map((s,idx)=>{
              const Icon = s.i;
              return <a key={idx} href={s.h} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 hover:bg-brand-green flex items-center justify-center transition"><Icon className="w-4 h-4 text-white" /></a>;
            })}
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Navigasi</h4>
          <ul className="space-y-2.5 text-sm">
            {NAV_ITEMS.map((n) => (<li key={n.href}><Link href={n.href} className="text-slate-400 hover:text-brand-green transition">{n.label}</Link></li>))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Program Unggulan</h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li><Link href="/donasi/operasional-panti-asuhan-banua-berkah" className="hover:text-brand-green">Panti Asuhan Banua Berkah</Link></li>
            <li><Link href="/donasi/wakaf-al-quran-santri-pelosok" className="hover:text-brand-green">Wakaf Al-Qur'an Pelosok</Link></li>
            <li><Link href="/donasi/beasiswa-santri-tpq-banua-berkah" className="hover:text-brand-green">Beasiswa TPQ</Link></li>
            <li><Link href="/donasi/paket-sembako-dhuafa-banjarmasin" className="hover:text-brand-green">Bantuan Dhuafa</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Kantor &amp; Kontak</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex gap-2"><MapPin className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />{ORG.address}</li>
            <li className="flex gap-2"><Phone className="w-4 h-4 text-brand-green shrink-0" />{ORG.phone}</li>
            <li className="flex gap-2"><Mail className="w-4 h-4 text-brand-green shrink-0" />{ORG.email}</li>
          </ul>
          <div className="flex items-start gap-2 text-xs mt-4 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
            <span>Terdaftar &amp; Sah — Akta Kemenkumham<br /><span className="text-slate-300 font-medium">{ORG.ahu}</span></span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container py-5 text-center text-sm text-slate-400">© 2026 Yayasan Banua Berkah Mandiri. Seluruh hak cipta dilindungi.</div>
      </div>
    </footer>
  );
}
