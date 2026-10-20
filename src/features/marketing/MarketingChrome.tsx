'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { FOOTER_COLUMNS, NAV_LINKS } from '@/config/marketing';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export function MarketingNav() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  React.useEffect(() => { setOpen(false); }, [pathname]);
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <header className={cn('fixed inset-x-0 top-0 z-[var(--z-sticky)] transition-[background-color,border-color,backdrop-filter] duration-[var(--dur-slow)]', scrolled || open ? 'border-b border-line-soft bg-[color-mix(in_srgb,var(--background)_82%,transparent)] backdrop-blur-xl' : 'border-b border-transparent')}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label={`${BRAND.name} home`} className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]"><Logo priority /></Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const active = l.href === pathname;
            return (
              <Link key={l.href} href={l.href} aria-current={active ? 'page' : undefined} className={cn('rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]', active ? 'text-fg' : 'text-fg-muted hover:text-fg')}>
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
          <Button asChild variant="accent" size="sm"><Link href="/signup">Start free trial</Link></Button>
        </div>

        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} className="grid size-10 cursor-pointer place-items-center rounded-md text-fg hover:bg-[var(--hover)] md:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line-soft px-4 pb-6 pt-3 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV_LINKS.map((l) => <Link key={l.href} href={l.href} className="rounded-md px-3 py-3 text-base font-medium text-fg hover:bg-[var(--hover)]">{l.label}</Link>)}
          </nav>
          <div className="mt-4 grid gap-2">
            <Button asChild variant="secondary"><Link href="/login">Log in</Link></Button>
            <Button asChild variant="accent"><Link href="/signup">Start free trial</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line-soft">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">{BRAND.tagline}</p>
            <a href={`mailto:${BRAND.supportEmail}`} className="mt-4 inline-block text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">{BRAND.supportEmail}</a>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-fg-subtle">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => <li key={l.href}><Link href={l.href} className="text-sm text-fg-muted transition-colors hover:text-fg">{l.label}</Link></li>)}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-line-soft pt-6 text-xs text-fg-subtle sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p>Made for studios that run on deadlines.</p>
        </div>
      </div>
    </footer>
  );
}
