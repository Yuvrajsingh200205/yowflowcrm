'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLANS, YEARLY_MONTHS_CHARGED } from '@/config/marketing';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function PricingSection({ compact }: { compact?: boolean }) {
  const [yearly, setYearly] = React.useState(true);
  return (
    <div>
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-line bg-surface p-1">
          {([['monthly', 'Monthly'], ['yearly', 'Yearly']] as const).map(([k, label]) => {
            const on = (k === 'yearly') === yearly;
            return (
              <button key={k} type="button" role="radio" aria-checked={on} onClick={() => setYearly(k === 'yearly')} className={cn('h-9 cursor-pointer rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]', on ? 'bg-lime text-on-lime' : 'text-fg-muted hover:text-fg')}>
                {label}{k === 'yearly' && <span className={cn('ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', on ? 'bg-black/15' : 'bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-brand')}>2 months free</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn('mt-12 grid gap-5 lg:grid-cols-3', compact && 'mt-10')}>
        {PLANS.map((p) => {
          const price = yearly ? Math.round((p.monthly * YEARLY_MONTHS_CHARGED) / 12) : p.monthly;
          return (
            <article key={p.id} className={cn('relative flex flex-col rounded-[var(--radius-xl)] border bg-surface p-7', p.highlight ? 'border-[color-mix(in_srgb,var(--accent)_60%,var(--border))] shadow-[0_0_80px_-24px_rgba(180,240,60,.45)]' : 'border-line-soft')}>
              {p.highlight && <span className="absolute -top-3 left-7 rounded-full bg-lime px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-on-lime">Most popular</span>}
              <h3 className="font-display text-xl font-semibold tracking-tight">{p.name}</h3>
              <p className="mt-1 text-sm text-fg-muted">{p.tagline}</p>
              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-5xl font-semibold tracking-tight tabular">{inr(price)}</span>
                <span className="text-sm text-fg-subtle">/ month</span>
              </p>
              <p className="mt-1 h-5 text-xs text-fg-subtle">{yearly ? `Billed ${inr(p.monthly * YEARLY_MONTHS_CHARGED)} yearly` : 'Billed monthly'}</p>
              <Button asChild variant={p.highlight ? 'accent' : 'secondary'} size="lg" className="mt-6 w-full"><Link href={p.id === 'scale' ? '/contact' : `/signup?plan=${p.id}`}>{p.cta}</Link></Button>
              <ul className="mt-7 space-y-3 border-t border-line-soft pt-6">
                {p.features.map((f) => <li key={f} className="flex gap-3 text-sm text-fg-muted"><Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />{f}</li>)}
              </ul>
            </article>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs text-fg-subtle">Prices in INR, excluding GST. 14-day free trial on every plan, no credit card required.</p>
    </div>
  );
}
