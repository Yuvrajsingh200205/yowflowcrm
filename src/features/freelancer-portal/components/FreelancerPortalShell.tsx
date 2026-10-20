'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, BriefcaseBusiness, CalendarDays, ClipboardList, CreditCard, Image, LayoutDashboard, LogOut, Menu, Search, UserRound, Video, WalletCards } from 'lucide-react';
import { freelancerPortalApi } from '@/lib/api/freelancerPortal';
import { useAuthSession } from '@/components/auth/AuthSessionProvider';
import { BRAND } from '@/config/brand';

const nav = [
  { href: '/freelancer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/freelancer/profile', label: 'My Profile', icon: UserRound },
  { href: '/freelancer/connections', label: 'My Vendors', icon: BriefcaseBusiness },
  { href: '/freelancer/find-vendor', label: 'Find Vendor', icon: Search },
  { href: '/freelancer/projects', label: 'Projects', icon: BriefcaseBusiness },
  { href: '/freelancer/shoots', label: 'Shoots', icon: Video },
  { href: '/freelancer/payments', label: 'Finance', icon: WalletCards },
  { href: '/freelancer/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/freelancer/portfolio', label: 'Portfolio', icon: Image },
  { href: '/freelancer/availability', label: 'Availability', icon: CalendarDays },
  { href: '/freelancer/subscription', label: 'Plan', icon: CreditCard },
  { href: '/freelancer/assignments', label: 'Assignments', icon: BriefcaseBusiness },
  { href: '/freelancer/notifications', label: 'Notifications', icon: Bell },
];

export function FreelancerPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout: logoutAuthSession } = useAuthSession();
  if (pathname === '/freelancer/login' || pathname === '/freelancer/join') {
    return <>{children}</>;
  }
  const logout = async () => {
    await Promise.allSettled([
      freelancerPortalApi.logout(),
      logoutAuthSession(),
    ]);
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#0D1816] md:grid md:grid-cols-[320px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-80 flex-col overflow-hidden bg-[#101E1B] text-white md:flex">
        <div className="flex h-full min-h-0 flex-col p-4 lg:p-5">
          <Link href="/freelancer/dashboard" className="shrink-0 font-[var(--font-display)] text-2xl font-black leading-tight text-[#D8BE93] lg:text-3xl">Wedding<br />Photo Planet</Link>
          <p className="mt-3 shrink-0 border-b border-[#C9A876]/35 pb-4 text-[10px] font-black uppercase tracking-[.18em] text-white/45 lg:mt-4 lg:pb-5 lg:text-[11px]">Freelancer Panel</p>
          <div className="mt-4 shrink-0 rounded-2xl bg-white/8 p-3 lg:mt-5 lg:p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-[#C9A876] text-lg font-black text-[#101E1B] lg:size-14">F</span>
              <div><p className="text-base font-black">Freelancer</p><p className="text-sm text-white/50">Active Panel</p></div>
            </div>
          </div>
          <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 pb-4 lg:mt-6" aria-label="Freelancer panel">
            {nav.slice(0, 7).map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/freelancer/dashboard' && pathname.startsWith(href));
              return (
                <Link key={`${href}-${label}`} href={href} className={`flex min-h-11 items-center gap-3 rounded-xl border-l-3 px-4 text-sm font-bold transition lg:min-h-12 lg:text-base ${active ? 'border-[#C9A876] bg-white/10 text-white' : 'border-transparent text-white/62 hover:bg-white/8 hover:text-white'}`}>
                  <Icon className="size-5" />{label}
                </Link>
              );
            })}
          </nav>
          <div className="shrink-0 space-y-3 border-t border-white/10 pt-4 lg:space-y-4 lg:pt-5">
            <div className="flex items-center justify-between text-sm text-white/55"><span>Access</span><span className="flex items-center gap-1 text-[#D8BE93]"><span className="size-2 rounded-full bg-emerald-400" />Active</span></div>
            <button onClick={logout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/8 text-base font-bold text-white/75 transition hover:bg-white/12"><LogOut className="size-5" />Logout</button>
          </div>
        </div>
      </aside>
      <div className="md:col-start-2">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[#EDE8E2] bg-[#F7F6F3]/95 px-4 backdrop-blur-xl md:px-7">
          <button className="grid size-11 place-items-center rounded-xl border border-[#EDE8E2] bg-white text-[#22413A] md:hidden" aria-label="Open navigation"><Menu className="size-5" /></button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#C9A876]">Freelancer Panel</p>
            <h1 className="text-lg font-black">{BRAND.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/freelancer/find-vendor" className="hidden min-h-10 items-center gap-2 rounded-full border border-[#EDE8E2] bg-white px-4 text-sm font-bold sm:inline-flex"><Search className="size-4 text-[#3B665C]" />Find Vendor</Link>
            <Link href="/freelancer/notifications" className="grid size-11 place-items-center rounded-full border border-[#EDE8E2] bg-white" aria-label="Notifications"><Bell className="size-4" /></Link>
          </div>
        </header>
        <main className="px-4 py-6 pb-24 md:px-8 md:pb-6">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#DFD9D2] bg-white md:hidden">
        {nav.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={`${href}-${label}`} href={href} className={`grid min-h-16 place-items-center text-[10px] font-extrabold ${active ? 'text-[#3B665C]' : 'text-[#686164]'}`}>
              <Icon className="size-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PortalCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#DFD9D2] bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>;
}

export function PortalState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#DFD9D2] bg-white p-6 text-center">
      <h2 className="text-base font-black text-[#302C2E]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-[#686164]">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
