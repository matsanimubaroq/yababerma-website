'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Menu, LogOut, LayoutDashboard, Heart, LogIn } from 'lucide-react';
import { NAV_ITEMS, ORG } from '@/lib/site-data';
import { useAuth } from '@/app/providers';

export default function Navbar() {
  const pathname = usePathname();
  const { user, loading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center gap-2.5">
          <img src={ORG.logo} alt="YABABERMA" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
          <div className="leading-tight hidden sm:block">
            <p className="font-heading font-extrabold text-brand-ink text-sm md:text-base">Banua Berkah Mandiri</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Filantropi Islam &amp; Kemanusiaan</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((n) => (
            <Link key={n.href} href={n.href} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${isActive(n.href) ? 'text-brand-green bg-brand-greenlight' : 'text-brand-ink hover:text-brand-green hover:bg-muted'}`}>{n.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/donasi" className="hidden md:block"><Button className="rounded-xl"><Heart className="w-4 h-4 mr-1.5" />Donasi</Button></Link>

          {!loading && (user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="outline-none">
                  <Avatar className="w-9 h-9 border-2 border-brand-green">
                    <AvatarImage src={user.picture} />
                    <AvatarFallback className="bg-brand-greenlight text-brand-green font-semibold">{(user.name || 'U')[0]}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user.name}
                  <div className="text-xs font-normal text-muted-foreground truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard Donatur</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive"><LogOut className="w-4 h-4 mr-2" />Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" className="rounded-xl hidden md:flex" onClick={login}><LogIn className="w-4 h-4 mr-1.5" />Masuk</Button>
          ))}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden rounded-xl"><Menu className="w-5 h-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              <div className="flex items-center gap-2 mb-6">
                <img src={ORG.logo} className="w-10 h-10 object-contain" alt="logo" />
                <span className="font-heading font-bold text-brand-ink">YABABERMA</span>
              </div>
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((n) => (
                  <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`px-3 py-2.5 rounded-lg font-medium ${isActive(n.href) ? 'text-brand-green bg-brand-greenlight' : 'text-brand-ink'}`}>{n.label}</Link>
                ))}
              </nav>
              <div className="mt-6 space-y-2">
                <Link href="/donasi" onClick={() => setOpen(false)}><Button className="w-full rounded-xl"><Heart className="w-4 h-4 mr-1.5" />Donasi Sekarang</Button></Link>
                {!user && <Button variant="outline" className="w-full rounded-xl" onClick={login}><LogIn className="w-4 h-4 mr-1.5" />Masuk dengan Google</Button>}
                {user && <Link href="/dashboard" onClick={() => setOpen(false)}><Button variant="outline" className="w-full rounded-xl">Dashboard Donatur</Button></Link>}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
