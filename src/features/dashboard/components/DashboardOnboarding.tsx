'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Rocket, X } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { cn } from '@/lib/cn';

const KEY = `${BRAND.cookiePrefix}-onboarding-dismissed`;

export interface OnboardingState {
  emailVerified: boolean;
  hasProjects: boolean;
  hasTeam: boolean;
}

/** First-run checklist for new studios. Hides itself once everything is done or the owner dismisses it. */
export function DashboardOnboarding({ state }: { state: OnboardingState }) {
  const [dismissed, setDismissed] = React.useState(true); // start hidden to avoid a flash before storage is read
  React.useEffect(() => { try { setDismissed(localStorage.getItem(KEY) === '1'); } catch { setDismissed(false); } }, []);

  const steps = [
    { id: 'account', title: 'Create your workspace', body: 'Your studio is set up and ready.', done: true },
    { id: 'verify', title: 'Verify your email', body: 'Confirm your address to secure your account.', done: state.emailVerified, href: '/settings', cta: 'Open settings' },
    { id: 'project', title: 'Add your first project', body: 'Capture a client, event dates and a payment schedule.', done: state.hasProjects, href: '/projects/new', cta: 'New project' },
    { id: 'team', title: 'Invite your team', body: 'Add teammates and give each the access they need.', done: state.hasTeam, href: '/team', cta: 'Add team' },
    { id: 'plan', title: 'Choose a plan', body: 'Pick what fits before your 14-day trial ends.', done: false, href: '/settings', cta: 'See plans', optional: true },
  ];
  const required = steps.filter((s) => !s.optional);
  const doneCount = required.filter((s) => s.done).length;
  if (dismissed || doneCount === required.length) return null;

  const dismiss = () => { setDismissed(true); try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ } };

  return (
    <section aria-labelledby="onboarding-title" className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-surface p-5 shadow-[var(--elev-1)] sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-[radial-gradient(circle,rgba(180,240,60,.2),transparent_65%)]" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-lime text-on-lime"><Rocket className="size-5" aria-hidden="true" /></span>
          <div>
            <h3 id="onboarding-title" className="font-display text-lg font-semibold tracking-tight">Get started with {BRAND.name}</h3>
            <p className="mt-0.5 text-[13px] text-fg-muted">{doneCount} of {required.length} steps done</p>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss getting started" className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-fg-subtle hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--ring)]"><X className="size-4" /></button>
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={required.length} aria-label="Setup progress">
        <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${(doneCount / required.length) * 100}%` }} />
      </div>
      <ol className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.filter((s) => s.id !== 'account').map((s) => (
          <li key={s.id} className={cn('flex flex-col rounded-[var(--radius-lg)] border p-4', s.done ? 'border-line-soft bg-surface-sunken' : 'border-line bg-surface')}>
            <span className={cn('grid size-6 place-items-center rounded-full text-xs', s.done ? 'bg-lime text-on-lime' : 'border border-line text-fg-subtle')} aria-hidden="true">{s.done ? <Check className="size-3.5" /> : steps.indexOf(s)}</span>
            <p className={cn('mt-3 text-sm font-medium', s.done && 'text-fg-muted line-through decoration-line')}>{s.title}{s.done && <span className="sr-only"> (done)</span>}</p>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-fg-subtle">{s.body}</p>
            {!s.done && s.href && <Link href={s.href} className="mt-3 text-[13px] font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]">{s.cta} →</Link>}
          </li>
        ))}
      </ol>
    </section>
  );
}
