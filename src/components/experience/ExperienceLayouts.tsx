import type { ReactNode } from 'react';
import Link from 'next/link';
import { Camera, Heart, LayoutDashboard, Menu, Sparkles, UserRound } from 'lucide-react';
import { motion } from '@/lib/animations/motion';
import { BRAND } from '@/config/brand';

type NavItem = { href: string; label: string };

const PUBLIC_NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/services/wedding-films', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

const FREELANCER_NAV: NavItem[] = [
  { href: '/freelancer/dashboard', label: 'Dashboard' },
  { href: '/freelancer/assignments', label: 'Assignments' },
  { href: '/freelancer/payments', label: 'Payments' },
  { href: '/freelancer/profile', label: 'Profile' },
];

const CLIENT_NAV: NavItem[] = [
  { href: '/client/projects', label: 'Projects' },
  { href: '/client/galleries/sample', label: 'Galleries' },
];

function Brand({ label = `${BRAND.name}` }: { label?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-sm font-black tracking-tight text-[#302C2E]">
      <span className="grid size-9 place-items-center rounded-xl bg-[#31342F] text-[#CCEB8E] shadow-sm">
        <Camera className="size-4" />
      </span>
      <span>{label}</span>
    </Link>
  );
}

function TopNav({ nav, action }: { nav: NavItem[]; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#DFD9D2]/80 bg-[#F7FCEE]/92 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-xs font-bold text-[#686164] transition hover:bg-white hover:text-[#31342F]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {action}
          <button type="button" className="grid size-10 place-items-center rounded-xl border border-[#DFD9D2] bg-white text-[#31342F] md:hidden" aria-label="Open navigation">
            <Menu className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Shell({ nav, action, children }: { nav: NavItem[]; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7FCEE] text-[#302C2E]">
      <TopNav nav={nav} action={action} />
      <main className={`${motion.page} mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8`}>
        {children}
      </main>
    </div>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <Shell nav={PUBLIC_NAV} action={<Link href="/login" className="rounded-xl bg-[#4F554C] px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#42473F]">Admin Login</Link>}>
      {children}
    </Shell>
  );
}

export function FreelancerLayout({ children }: { children: ReactNode }) {
  return (
    <Shell nav={FREELANCER_NAV} action={<Link href="/login?returnTo=/freelancer/dashboard" className="rounded-xl border border-[#DFD9D2] bg-white px-4 py-2 text-xs font-extrabold text-[#31342F]">Freelancer Login</Link>}>
      {children}
    </Shell>
  );
}

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Shell nav={CLIENT_NAV} action={<Link href="/client/login" className="rounded-xl border border-[#DFD9D2] bg-white px-4 py-2 text-xs font-extrabold text-[#31342F]">Client Login</Link>}>
      {children}
    </Shell>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function FoundationPage({
  eyebrow,
  title,
  description,
  audience,
}: {
  eyebrow: string;
  title: string;
  description: string;
  audience: 'public' | 'freelancer' | 'client';
}) {
  const Icon = audience === 'client' ? Heart : audience === 'freelancer' ? UserRound : Sparkles;
  return (
    <section className="grid min-h-[60vh] place-items-center">
      <div className="max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#DFD9D2] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#4F554C]">
          <Icon className="size-3.5" />
          {eyebrow}
        </span>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-[#302C2E] sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-[#686164] sm:text-base">{description}</p>
        <div className="mx-auto mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
          {['Responsive layout', 'Shared theme', 'Portal-ready'].map((item) => (
            <div key={item} className="rounded-2xl border border-[#DFD9D2] bg-white p-4 text-xs font-bold text-[#686164] shadow-sm">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminRedirectNotice() {
  return (
    <section className="grid min-h-screen place-items-center bg-[#F7FCEE] px-4 text-center text-[#302C2E]">
      <div>
        <LayoutDashboard className="mx-auto size-10 text-[#4F554C]" />
        <p className="mt-3 text-sm font-bold">Opening the existing CRM workspace…</p>
      </div>
    </section>
  );
}
