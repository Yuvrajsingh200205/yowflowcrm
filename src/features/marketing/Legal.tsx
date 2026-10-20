import type { ReactNode } from 'react';

export function LegalPage({ updated, children }: { updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
      <p className="text-sm text-fg-subtle">Last updated {updated}</p>
      <div className="mt-8 space-y-10">{children}</div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-fg-muted [&_li]:ml-5 [&_li]:list-disc [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2">{children}</div>
    </section>
  );
}
