'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, BriefcaseBusiness, CalendarDays, ClipboardList, CreditCard, Image as ImageIcon, LayoutDashboard, LogOut, Menu, Search, UserRound, Video, WalletCards, X } from 'lucide-react';
import { freelancerPortalApi } from '@/lib/api/freelancerPortal';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/freelancer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/freelancer/profile', label: 'My profile', icon: UserRound },
  { href: '/freelancer/assignments', label: 'Assignments', icon: BriefcaseBusiness },
  { href: '/freelancer/projects', label: 'Projects', icon: BriefcaseBusiness },
  { href: '/freelancer/shoots', label: 'Shoots', icon: Video },
  { href: '/freelancer/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/freelancer/payments', label: 'Finance', icon: WalletCards },
  { href: '/freelancer/availability', label: 'Availability', icon: CalendarDays },
  { href: '/freelancer/portfolio', label: 'Portfolio', icon: ImageIcon },
  { href: '/freelancer/connections', label: 'My vendors', icon: BriefcaseBusiness },
  { href: '/freelancer/find-vendor', label: 'Find vendor', icon: Search },
  { href: '/freelancer/subscription', label: 'Plan', icon: CreditCard },
  { href: '/freelancer/notifications', label: 'Notifications', icon: Bell },
] as const;
const TABS = [NAV[0], NAV[2], NAV[4], NAV[6], NAV[12]] as const;

const isActive = (pathname: string, href: string) => pathname === href || (href !== '/freelancer/dashboard' && pathname.startsWith(href));

export function FreelancerPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout: logoutAuthSession } = useAuthSession();
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => { setOpen(false); }, [pathname]);

  if (pathname === '/freelancer/login' || pathname === '/freelancer/join' || pathname.startsWith('/freelancer/onboarding')) return <>{children}</>;

  const logout = async () => {
    await Promise.allSettled([freelancerPortalApi.logout(), logoutAuthSession()]);
    router.replace('/freelancer/login');
  };
  const current = NAV.find((n) => isActive(pathname, n.href))?.label ?? 'Freelancer portal';

  const sidebar = (
    <aside data-theme="dark" aria-label="Freelancer portal" className="flex h-full w-72 flex-col border-r border-line-soft bg-canvas text-fg">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Logo priority />
        <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="grid size-9 cursor-pointer place-items-center rounded-md text-fg-muted hover:bg-[var(--hover)] md:hidden"><X className="size-5" /></button>
      </div>
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-fg-subtle">Freelancer portal</p>
      <nav aria-label="Freelancer navigation" className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={`${href}-${label}`} href={href} aria-current={active ? 'page' : undefined} className={cn('relative flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-[13.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)]', active ? 'bg-[var(--hover)] text-fg' : 'text-fg-muted hover:bg-[color-mix(in_srgb,var(--hover)_60%,transparent)] hover:text-fg')}>
              {active && <span className="absolute -left-3 top-2 h-6 w-[3px] rounded-r-full bg-lime shadow-[0_0_12px_var(--accent)]" aria-hidden="true" />}
              <Icon className={cn('size-[18px] shrink-0', active ? 'text-brand' : 'text-fg-subtle')} aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-line-soft p-3"><Button variant="ghost" className="w-full justify-start" onClick={() => void logout()}><LogOut />Log out</Button></div>
    </aside>
  );

  return (
    <div className="min-h-dvh bg-canvas text-fg md:grid md:grid-cols-[18rem_1fr]">
      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">{sidebar}</div>
      {open && <div className="fixed inset-0 z-50 md:hidden"><div className="absolute inset-0 bg-[var(--scrim)]" onClick={() => setOpen(false)} aria-hidden="true" /><div className="absolute inset-y-0 left-0">{sidebar}</div></div>}
      <div className="md:col-start-2">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line-soft bg-[color-mix(in_srgb,var(--background)_86%,transparent)] px-4 backdrop-blur-md md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></Button>
            <h1 className="truncate font-display text-lg font-semibold tracking-tight sm:text-xl">{current}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex"><Link href="/freelancer/find-vendor"><Search />Find vendor</Link></Button>
            <Button asChild variant="ghost" size="icon"><Link href="/freelancer/notifications" aria-label="Notifications"><Bell /></Link></Button>
          </div>
        </header>
        <main className="px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
      </div>
      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line-soft bg-surface md:hidden">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={`${href}-${label}`} href={href} aria-current={active ? 'page' : undefined} className={cn('grid min-h-16 place-items-center gap-0.5 py-2 text-[10.5px] font-medium', active ? 'text-fg' : 'text-fg-subtle')}>
              <Icon className={cn('size-[18px]', active && 'text-brand')} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PortalCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={cn('rounded-[var(--radius-lg)] border border-line-soft bg-surface p-4 shadow-[var(--elev-1)] sm:p-5', className)}>{children}</section>;
}

export function PortalState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-surface p-8 text-center">
      <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-fg-muted">{text}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
