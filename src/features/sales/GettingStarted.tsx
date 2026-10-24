'use client';

import * as React from 'react';
import { ArrowRight, Check, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { salesSetupApi, type Readiness } from '@/lib/api/sales';
import { cn } from '@/lib/cn';
import { useLoad } from './ui';

export type SetupTab = 'packages' | 'booking' | 'availability' | 'business' | 'reminders';

interface Step { id: string; title: string; hint: string; done: boolean; tab: SetupTab }

export const stepsFor = (r: Readiness): Step[] => [
  { id: 'packages', title: 'Add your packages', hint: 'Pick ready-made ones for weddings, birthdays and more.', done: r.packages > 0, tab: 'packages' },
  { id: 'prices', title: 'Put your own prices', hint: r.packages === 0 ? 'Add packages first.' : r.examplePrices > 0 ? `${r.examplePrices} ${r.examplePrices === 1 ? 'price is' : 'prices are'} still an example.` : 'All prices are yours.', done: r.packages > 0 && r.examplePrices === 0, tab: 'packages' },
  { id: 'pay', title: 'Add your phone and UPI', hint: 'They are printed on every quote so customers can pay you.', done: r.businessPhone && r.paymentDetails, tab: 'business' },
  { id: 'page', title: 'Switch on your booking page', hint: 'Customers pick a date and get a quote by themselves. Optional.', done: r.bookingPageOn, tab: 'booking' },
];

/**
 * A short list of what is left to do before quotes can go out, in plain words. It goes away once everything is done.
 */
export function GettingStarted({ canAct, onGo, version = 0 }: { canAct: boolean; onGo: (tab: SetupTab) => void; version?: number | string }) {
  const { data } = useLoad(() => salesSetupApi.readiness(), [version], canAct);
  if (!canAct || !data) return null;
  const steps = stepsFor(data);
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  const next = steps.find((s) => !s.done)!;

  return (
    <Card aria-labelledby="getting-started">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 id="getting-started" className="text-base font-semibold text-fg">Get ready to send quotes</h3>
            <p className="text-[13px] text-fg-muted">{done} of {steps.length} done. It takes about 5 minutes.</p>
          </div>
          <div className="h-2 w-40 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={done} aria-label="Steps done"><div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2">
          {steps.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onGo(s.tab)}
                className={cn('flex min-h-16 w-full cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]', s.done ? 'border-line-soft bg-surface-sunken' : s.id === next.id ? 'border-brand bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' : 'border-line bg-surface hover:bg-[var(--hover)]')}
              >
                {s.done ? <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ok text-white" aria-hidden="true"><Check className="size-3.5" /></span> : <Circle className="mt-0.5 size-6 shrink-0 text-fg-subtle" aria-hidden="true" />}
                <span className="min-w-0 flex-1"><span className={cn('block text-sm font-semibold', s.done ? 'text-fg-muted line-through decoration-fg-subtle' : 'text-fg')}>{s.title}<span className="sr-only">{s.done ? ' (done)' : ' (to do)'}</span></span><span className="block text-[13px] text-fg-muted">{s.hint}</span></span>
                {!s.done && <ArrowRight className="mt-1 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
