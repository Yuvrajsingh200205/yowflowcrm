'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { portalApi } from './api';
import { PortalGate, usePortal } from './PortalProvider';

function Header() {
  const { me, unread, setUnread, logout } = usePortal();
  const pathname = usePathname();
  React.useEffect(() => {
    let live = true;
    const load = () => portalApi.notifications().then((n) => live && setUnread(n.unread)).catch(() => undefined);
    load();
    const t = setInterval(load, 60_000);
    return () => { live = false; clearInterval(t); };
  }, [setUnread, pathname]);

  const nav = [{ href: '/client', label: 'My projects', active: pathname === '/client' || pathname.startsWith('/client/projects') }];
  return (
    <header className="sticky top-0 z-[var(--z-sticky,30)] border-b border-line-soft bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/client" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]">
          <Logo showName={false} markClassName="size-8" />
          <span className="truncate font-display text-[15px] font-semibold text-fg">{me.studio.name}</span>
        </Link>
        <nav aria-label="Portal" className="ml-2 hidden sm:flex">
          {nav.map((n) => <Link key={n.href} href={n.href} aria-current={n.active ? 'page' : undefined} className={cn('rounded-md px-3 py-1.5 text-sm font-medium', n.active ? 'bg-[var(--hover)] text-fg' : 'text-fg-muted hover:text-fg')}>{n.label}</Link>)}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/client/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative grid size-10 place-items-center rounded-md text-fg-muted hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
            <Bell className="size-[18px]" aria-hidden="true" />
            {unread > 0 && <span aria-hidden="true" className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-lime px-1 text-[10px] font-bold leading-4 text-on-lime">{unread > 9 ? '9+' : unread}</span>}
          </Link>
          <span className="hidden max-w-40 truncate text-sm text-fg-muted md:block">{me.user.fullName}</span>
          <button type="button" onClick={logout} aria-label="Sign out" className="grid size-10 cursor-pointer place-items-center rounded-md text-fg-muted hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--ring)]"><LogOut className="size-[18px]" aria-hidden="true" /></button>
        </div>
      </div>
    </header>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <PortalGate>
      <div className="min-h-dvh bg-canvas text-fg">
        <a href="#portal-main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
        <Header />
        <main id="portal-main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        <PortalFooter />
      </div>
    </PortalGate>
  );
}

function PortalFooter() {
  const { me } = usePortal();
  const s = me.studio;
  return (
    <footer className="border-t border-line-soft py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-fg-subtle sm:px-6">
        <span>© {new Date().getFullYear()} {s.name}</span>
        <span className="flex flex-wrap gap-x-4">{s.phone && <a className="hover:text-fg" href={`tel:${s.phone}`}>{s.phone}</a>}{s.email && <a className="hover:text-fg" href={`mailto:${s.email}`}>{s.email}</a>}</span>
      </div>
    </footer>
  );
}
