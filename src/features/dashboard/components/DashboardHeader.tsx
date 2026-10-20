import { User } from 'lucide-react';
import { BRAND } from '@/config/brand';

export function DashboardHeader({ currentUserName }: { currentUserName?: string }) {
  return <div className="relative overflow-hidden rounded-3xl border border-[#ddc89c]/35 bg-[radial-gradient(circle_at_88%_20%,rgba(221,200,156,.24),transparent_25%),radial-gradient(circle_at_8%_130%,rgba(179,124,142,.34),transparent_38%),linear-gradient(125deg,#704758,#55333f_48%,#38262d)] p-5 text-white shadow-[0_18px_42px_rgba(54,37,44,.17)] sm:p-7 lg:p-8">
    <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10 shadow-[0_0_0_56px_rgba(255,255,255,.025),0_0_0_112px_rgba(255,255,255,.018)]" />
    <div className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#e8c9d3]"><span className="grid size-7 place-items-center rounded-full border border-white/15 bg-white/10"><User className="size-3.5" /></span>Studio Dashboard Overview • {BRAND.name}</div>
    <h2 className="relative mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Welcome Back, {currentUserName || 'Manager'}</h2>
    <p className="relative mt-2 max-w-3xl text-sm leading-relaxed text-[#eadfe2] sm:text-base">Live studio status: Total revenue, pending deliverables, upcoming shoots, and client balances.</p>
  </div>;
}
