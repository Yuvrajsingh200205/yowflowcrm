import { BRAND } from '@/config/brand';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function DashboardHeader({ currentUserName }: { currentUserName?: string }) {
  const first = (currentUserName || '').split(' ')[0];
  return (
    <div data-theme="dark" className="relative isolate overflow-hidden rounded-[var(--radius-xl)] border border-line bg-canvas p-6 text-fg shadow-[var(--elev-2)] sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-32 -z-10 size-[26rem] rounded-full bg-[radial-gradient(circle,rgba(180,240,60,.28),transparent_62%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-10 top-1/2 -z-10 size-80 -translate-y-1/2 rounded-full border border-[rgba(180,240,60,.16)] shadow-[0_0_0_48px_rgba(180,240,60,.04),0_0_0_104px_rgba(180,240,60,.025)]" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">{BRAND.name} · Studio overview</p>
      <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
        {greeting()}{first ? `, ${first}` : ''}.
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-fg-muted">Revenue, deliveries, upcoming shoots and client balances, live from your studio.</p>
    </div>
  );
}
