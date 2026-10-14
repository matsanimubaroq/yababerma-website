'use client';

// Admin managers for Testimoni, Komunitas, Partner Kebaikan and Penulis, built on CollectionManager.

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Instagram, ExternalLink, CalendarDays, GraduationCap } from 'lucide-react';
import CollectionManager from '@/components/admin/collection-manager';
import { adminFetch } from '@/components/admin/cms-common';
import Stars from '@/components/site/stars';
import InitialsAvatar from '@/components/site/initials-avatar';
import { PARTNER_TYPES, PARTNER_TYPE_LABEL } from '@/lib/content-types';

export function TestimonialManager({ adminKey }) {
  return (
    <CollectionManager
      adminKey={adminKey}
      endpoint="testimonials"
      title="Testimoni"
      description="Tampil di beranda, bagian “Cerita & Kepercayaan”, sesuai urutan di sini."
      addLabel="Tambah Testimoni"
      emptyText="Belum ada testimoni."
      searchKeys={['name', 'role', 'quote']}
      defaults={{ name: '', role: '', quote: '', avatar: '' }}
      fields={[
        { key: 'name', label: 'Nama', required: true, placeholder: 'mis. Siti Aminah' },
        { key: 'role', label: 'Peran / Keterangan', placeholder: 'mis. Donatur Rutin, Penerima Manfaat' },
        { key: 'quote', label: 'Isi Testimoni', type: 'textarea', required: true, rows: 4, help: 'Maksimal 600 karakter.' },
        { key: 'avatar', label: 'Foto (opsional)', type: 'image', help: 'Tanpa foto, inisial nama yang ditampilkan.' },
      ]}
      renderCard={(t) => (
        <>
          <div className="flex items-center gap-3">
            <InitialsAvatar src={t.avatar} name={t.name} className="w-10 h-10 rounded-full" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-brand-ink truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground truncate">{t.role || '—'}</p>
            </div>
          </div>
          <p className="text-sm text-brand-ink/80 mt-3 line-clamp-4">&ldquo;{t.quote}&rdquo;</p>
        </>
      )}
    />
  );
}

export function CommunityManager({ adminKey }) {
  const [programs, setPrograms] = useState([]);
  useEffect(() => {
    adminFetch('/api/admin/campaigns', adminKey).then(({ data }) => {
      setPrograms(Array.isArray(data?.items) ? data.items.filter((c) => c.status === 'Active').map((c) => [c.slug, c.title]) : []);
    });
  }, [adminKey]);
  const programTitle = Object.fromEntries(programs);

  return (
    <CollectionManager
      adminKey={adminKey}
      endpoint="communities"
      title="Komunitas"
      description="Komunitas relawan yang tampil di halaman Komunitas dan bisa diikuti pengunjung."
      addLabel="Tambah Komunitas"
      emptyText="Belum ada komunitas. Klik “Tambah Komunitas” untuk menambahkan yang pertama."
      searchKeys={['name', 'description', 'instagram']}
      defaults={{ name: '', logo: '', instagram: '', rating: 3, description: '', program_slug: '' }}
      fields={[
        { key: 'name', label: 'Nama Komunitas', required: true, full: true },
        { key: 'logo', label: 'Logo', type: 'image' },
        { key: 'instagram', label: 'Instagram', placeholder: '@username atau https://instagram.com/...', full: true },
        { key: 'rating', label: 'Badge Komunitas (peringkat)', type: 'stars' },
        { key: 'program_slug', label: 'Program terkait (opsional)', type: 'select', options: programs, allowEmpty: true, emptyLabel: '— Tidak ada —', full: true },
        { key: 'description', label: 'Deskripsi singkat', type: 'textarea', rows: 2, help: 'Maksimal 300 karakter.' },
      ]}
      filters={[{ key: 'rating', label: 'Semua peringkat', options: [5, 4, 3, 2, 1].map((n) => [n, `${n} bintang`]) }]}
      renderCard={(c) => (
        <>
          <div className="flex items-center gap-3">
            <InitialsAvatar src={c.logo} name={c.name} className="w-12 h-12 rounded-xl" imgClassName="object-contain p-1 border border-border" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-brand-ink line-clamp-2">{c.name}</p>
              <Stars value={c.rating} className="w-3.5 h-3.5" />
            </div>
          </div>
          {c.description && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{c.description}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
            {c.instagram && <a href={c.instagram} target="_blank" rel="noopener noreferrer" className="text-brand-blue flex items-center gap-1 hover:underline"><Instagram className="w-3.5 h-3.5" />Instagram</a>}
            {c.program_slug && <span className="text-muted-foreground">Program: {programTitle[c.program_slug] || c.program_slug}</span>}
          </div>
        </>
      )}
    />
  );
}

export function PartnerManager({ adminKey }) {
  return (
    <CollectionManager
      adminKey={adminKey}
      endpoint="partners"
      title="Partner Kebaikan"
      description="Logo partner yang bergerak di halaman Tentang Kami."
      addLabel="Tambah Partner"
      emptyText="Belum ada partner."
      searchKeys={['name', 'type_label']}
      defaults={{ name: '', logo: '', type: 'kebaikan', url: '' }}
      fields={[
        { key: 'name', label: 'Nama Partner', required: true },
        { key: 'type', label: 'Tipe Partner', type: 'select', options: PARTNER_TYPES },
        { key: 'logo', label: 'Logo', type: 'image', help: 'Tanpa logo, nama partner yang ditampilkan.' },
        { key: 'url', label: 'Website (opsional)', type: 'url', placeholder: 'https://...', full: true },
      ]}
      filters={[{ key: 'type', label: 'Semua tipe', options: PARTNER_TYPES }]}
      renderCard={(p) => (
        <div className="flex items-center gap-3">
          <InitialsAvatar src={p.logo} name={p.name} className="w-14 h-14 rounded-xl" imgClassName="object-contain p-1 border border-border" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-brand-ink line-clamp-2">{p.name}</p>
            <Badge variant="secondary" className="mt-1 text-brand-blue bg-brand-bluelight border-0">{PARTNER_TYPE_LABEL[p.type] || p.type}</Badge>
            {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-brand-blue mt-1 truncate hover:underline">{p.url}</a>}
          </div>
        </div>
      )}
    />
  );
}

export function AuthorManager({ adminKey, onChanged }) {
  const year = new Date().getFullYear();
  return (
    <CollectionManager
      adminKey={adminKey}
      endpoint="authors"
      title="Penulis"
      description="Profil penulis artikel. Nama penulis di artikel tertaut ke halaman profilnya."
      addLabel="Tambah Penulis"
      emptyText="Belum ada penulis."
      searchKeys={['name', 'degree', 'role', 'education', 'expertise']}
      onChanged={onChanged}
      defaults={{ name: '', degree: '', photo: '', role: 'Penulis Tamu', since_year: '', education: '', expertise: '', bio: '', instagram: '' }}
      fields={[
        { key: 'name', label: 'Nama Lengkap', required: true, placeholder: 'mis. Matsani Mubaroq' },
        { key: 'degree', label: 'Gelar', placeholder: 'mis. S.Sos.' },
        { key: 'role', label: 'Peran', placeholder: 'Penulis Tetap / Penulis Tamu' },
        { key: 'since_year', label: 'Mulai menulis (tahun)', type: 'number', placeholder: String(year) },
        { key: 'education', label: 'Pendidikan / Basic keilmuan', placeholder: 'mis. S1 Komunikasi & Penyiaran Islam, IAI Al-Azis', full: true },
        { key: 'expertise', label: 'Ranah keilmuan', type: 'tags', placeholder: 'pisahkan dengan koma, mis. Sosial, Komunikasi', full: true },
        { key: 'bio', label: 'Latar belakang', type: 'textarea', rows: 4 },
        { key: 'photo', label: 'Foto (opsional)', type: 'image' },
        { key: 'instagram', label: 'Instagram (opsional)', placeholder: '@username', full: true },
      ]}
      renderCard={(a) => (
        <>
          <div className="flex items-center gap-3">
            <InitialsAvatar src={a.photo} name={a.name} className="w-12 h-12 rounded-full" />
            <div className="min-w-0">
              <p className="font-semibold text-sm text-brand-ink line-clamp-2">{a.display_name}</p>
              <p className="text-xs text-muted-foreground">{a.role || 'Penulis'}</p>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
            {a.since_year && <p className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />Menulis sejak {a.since_year}</p>}
            {a.education && <p className="flex items-center gap-1.5 line-clamp-1"><GraduationCap className="w-3.5 h-3.5 shrink-0" />{a.education}</p>}
          </div>
          {a.expertise?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{a.expertise.map((x) => <span key={x} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{x}</span>)}</div>}
          {a.status === 'Active' && a.slug && <a href={`/penulis/${a.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-blue mt-2 hover:underline"><ExternalLink className="w-3 h-3" />Lihat profil</a>}
        </>
      )}
    />
  );
}
