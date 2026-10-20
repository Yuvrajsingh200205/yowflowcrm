import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function PageHero({ eyebrow, title, lead }: { eyebrow: string; title: ReactNode; lead?: string }) {
  return (
    <header className="relative isolate overflow-hidden pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(ellipse_at_top,rgba(180,240,60,.16),transparent_62%)]" aria-hidden="true" />
      <div className="mx-auto max-w-4xl px-4 pb-14 text-center sm:px-6 sm:pb-20">
        <Reveal><p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">{eyebrow}</p></Reveal>
        <Reveal delay={0.06}><h1 className="mt-4 font-display text-4xl font-semibold leading-[1.06] tracking-tight text-balance sm:text-6xl">{title}</h1></Reveal>
        {lead && <Reveal delay={0.12}><p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">{lead}</p></Reveal>}
      </div>
    </header>
  );
}
