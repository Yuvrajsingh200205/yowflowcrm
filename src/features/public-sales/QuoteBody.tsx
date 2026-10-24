'use client';

import * as React from 'react';
import { CalendarDays, Check, MapPin, Minus, Plus, Users } from 'lucide-react';
import { Badge, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/cn';
import { EVENT_TYPE_LABELS, type PublicQuote, type PublicQuoteItem } from '@/lib/api/sales';
import { fmtDate, fmtDateLong, inr } from '../sales/format';
import { lineAmounts } from '../sales/pricing';

export type Selection = Record<string, { selected: boolean; quantity: number }>;

/** What the customer currently has switched on, starting from what the studio prepared. */
export const initialSelection = (items: PublicQuoteItem[]): Selection =>
  Object.fromEntries(items.filter((i) => i.isOptional).map((i) => [i.id, { selected: i.isSelected, quantity: i.quantity }]));

const unitWord = (i: Pick<PublicQuoteItem, 'pricingType' | 'unitLabel'>, plural: boolean) =>
  i.pricingType === 'PER_DAY' ? (plural ? 'days' : 'day') : i.pricingType === 'PER_PERSON' ? (plural ? 'guests' : 'guest') : i.unitLabel ? (plural ? `${i.unitLabel}s` : i.unitLabel) : '';

/** "₹50,000 × 2 days" or just "₹10,000" when one fixed unit is bought. */
export function priceLine(i: PublicQuoteItem, quantity = i.quantity): string {
  const unit = unitWord(i, quantity !== 1);
  if (quantity === 1 && i.pricingType === 'FIXED') return inr(i.unitPrice);
  return `${inr(i.unitPrice)} × ${quantity}${unit ? ` ${unit}` : ''}`;
}

const lineNet = (i: PublicQuoteItem, quantity = i.quantity) => lineAmounts({ quantity, unitPrice: i.unitPrice, discountAmount: i.discountAmount, taxRate: 0 }).net;

function Stepper({ item, value, onChange, label }: { item: PublicQuoteItem; value: number; onChange: (n: number) => void; label: string }) {
  const min = item.minQuantity;
  const max = item.maxQuantity ?? 999;
  const btn = 'grid size-11 cursor-pointer place-items-center rounded-full border border-line bg-surface text-fg transition-colors hover:bg-[var(--hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div role="group" aria-label={`Quantity of ${label}`} className="flex items-center gap-2">
      <button type="button" className={btn} aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Minus className="size-4" aria-hidden="true" /></button>
      <output className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</output>
      <button type="button" className={btn} aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Plus className="size-4" aria-hidden="true" /></button>
    </div>
  );
}

function Fact({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-2 text-xs text-fg-subtle">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-brand" aria-hidden="true"><Icon className="size-3.5" /></span>
        {label}
      </dt>
      <dd className="mt-1 pl-8 text-sm font-medium text-fg">{children}</dd>
    </div>
  );
}

interface Props {
  data: PublicQuote;
  /** When given, optional items can be switched on and off by the customer. */
  selection?: Selection;
  onSelect?: (id: string, selected: boolean) => void;
  onQuantity?: (id: string, quantity: number) => void;
  /** The totals are being recalculated after a change. */
  pending?: boolean;
}

export function QuoteBody({ data, selection, onSelect, onQuantity, pending }: Props) {
  const { quote } = data;
  const interactive = Boolean(selection && onSelect);
  const main = quote.items.filter((i) => !i.isOptional);
  const extras = quote.items.filter((i) => i.isOptional);
  const eventLabel = quote.eventType ? EVENT_TYPE_LABELS[quote.eventType] : null;
  const place = [quote.venueName, quote.venueCity].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <section aria-labelledby="quote-title">
        <p className="text-xs font-medium uppercase tracking-wider text-fg-subtle">Quotation {quote.number}</p>
        <h1 id="quote-title" className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{quote.customerName ? `Hello, ${quote.customerName.split(' ')[0]}` : 'Your quotation'}</h1>
        <p className="mt-2 text-sm text-fg-muted">
          {eventLabel ? `Here is the quote for your ${eventLabel.toLowerCase()}` : 'Here is your quote'}
          {quote.eventDate ? ` on ${fmtDate(quote.eventDate)}` : ''}. Issued {fmtDate(quote.issueDate)}
          {quote.validUntil && quote.status === 'SENT' ? `, valid until ${fmtDate(quote.validUntil)}${quote.daysLeft !== null ? ` (${quote.daysLeft === 0 ? 'last day' : `${quote.daysLeft} day${quote.daysLeft === 1 ? '' : 's'} left`})` : ''}` : ''}.
        </p>
      </section>

      {(eventLabel || quote.eventDate || place || quote.guestCount) && (
        <Card>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              {quote.eventDate && <Fact icon={CalendarDays} label="Event date">{fmtDateLong(quote.eventDate)}{quote.eventDays > 1 ? ` · ${quote.eventDays} days` : ''}</Fact>}
              {eventLabel && <Fact icon={CalendarDays} label="Occasion">{eventLabel}</Fact>}
              {place && <Fact icon={MapPin} label="Venue">{place}</Fact>}
              {quote.guestCount ? <Fact icon={Users} label="Guests">About {quote.guestCount.toLocaleString('en-IN')}</Fact> : null}
            </dl>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="included-title" className="space-y-3">
        <h2 id="included-title" className="text-lg font-semibold tracking-tight">What you get</h2>
        {main.map((item) => (
          <Card key={item.id}>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                <h3 className="text-base font-semibold text-fg">{item.service}</h3>
                <p className="text-right text-sm tabular-nums"><span className="font-semibold text-fg">{inr(lineNet(item))}</span><span className="block text-xs text-fg-subtle">{priceLine(item)}{item.taxRate > 0 ? ` + ${item.taxRate}% GST` : ''}</span></p>
              </div>
              {item.description && <p className="text-sm leading-relaxed text-fg-muted">{item.description}</p>}
              {item.inclusions.length > 0 && (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {item.inclusions.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-sm text-fg"><Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden="true" /><span>{line}</span></li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      {extras.length > 0 && (
        <section aria-labelledby="addons-title" className="space-y-3">
          <div>
            <h2 id="addons-title" className="text-lg font-semibold tracking-tight">Add-ons</h2>
            {interactive && <p className="mt-0.5 text-sm text-fg-muted">Switch on anything you would like. Your total updates straight away.</p>}
          </div>
          <ul className="space-y-2">
            {extras.map((item) => {
              const s = selection?.[item.id];
              const on = interactive ? Boolean(s?.selected) : item.isSelected;
              const qty = interactive ? (s?.quantity ?? item.quantity) : item.quantity;
              return (
                <li key={item.id} className={cn('rounded-[var(--radius-lg)] border bg-surface p-4 transition-colors', on ? 'border-brand' : 'border-line-soft')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-fg">{item.service}</p>
                      {item.description && <p className="mt-0.5 text-[13px] leading-relaxed text-fg-muted">{item.description}</p>}
                      <p className="mt-1 text-[13px] tabular-nums text-fg-muted">{priceLine(item, qty)}{item.taxRate > 0 ? ` + ${item.taxRate}% GST` : ''}</p>
                    </div>
                    {interactive ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`Include ${item.service}`}
                        onClick={() => onSelect?.(item.id, !on)}
                        className={cn('relative mt-0.5 h-8 w-14 shrink-0 cursor-pointer rounded-full border transition-colors duration-[var(--dur-base)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]', on ? 'border-transparent bg-brand' : 'border-line-strong bg-surface-sunken')}
                      >
                        <span className={cn('absolute left-1 top-1 grid size-6 place-items-center rounded-full shadow-sm transition-transform duration-[var(--dur-base)] motion-reduce:transition-none', on ? 'translate-x-6 bg-on-brand text-brand' : 'translate-x-0 bg-fg-subtle text-surface')} aria-hidden="true">{on ? <Check className="size-3.5" /> : null}</span>
                      </button>
                    ) : (
                      <Badge tone={on ? 'success' : 'neutral'}>{on ? 'Included' : 'Not included'}</Badge>
                    )}
                  </div>
                  {interactive && on && item.allowQuantity && (
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
                      <span className="text-[13px] text-fg-muted">How many?</span>
                      <Stepper item={item} value={qty} label={item.service} onChange={(n) => onQuantity?.(item.id, n)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Card className={cn('transition-opacity', pending && 'opacity-70')} aria-busy={pending || undefined}>
        <CardContent>
          <h2 className="sr-only">Price summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-fg-muted">Subtotal</dt><dd className="tabular-nums">{inr(quote.totals.subtotal)}</dd></div>
            {quote.totals.discount > 0 && <div className="flex justify-between gap-4"><dt className="text-fg-muted">Discount</dt><dd className="tabular-nums text-ok">− {inr(quote.totals.discount)}</dd></div>}
            {quote.totals.tax > 0 && <div className="flex justify-between gap-4"><dt className="text-fg-muted">GST</dt><dd className="tabular-nums">{inr(quote.totals.tax)}</dd></div>}
            <div className="flex items-baseline justify-between gap-4 border-t border-line-soft pt-3"><dt className="text-base font-semibold text-fg">Total</dt><dd className="font-display text-2xl font-semibold tabular-nums text-fg" aria-live="polite">{inr(quote.totals.total)}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {quote.paymentPlan.length > 0 && (
        <section aria-labelledby="plan-title">
          <h2 id="plan-title" className="mb-3 text-lg font-semibold tracking-tight">How payment works</h2>
          <ol className="divide-y divide-line-soft overflow-hidden rounded-[var(--radius-lg)] border border-line-soft bg-surface">
            {quote.paymentPlan.map((step, index) => (
              <li key={`${step.title}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-fg">{step.title}{step.title === 'Advance' && quote.advancePercent > 0 && quote.advancePercent < 100 ? ` (${quote.advancePercent}%)` : ''}</p>
                  <p className="text-[13px] text-fg-muted">{step.title === 'Advance' ? 'To confirm your booking' : `Due ${fmtDate(step.dueDate)}`}</p>
                </div>
                <p className="text-base font-semibold tabular-nums text-fg">{inr(step.amount)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {quote.notes && (
        <section aria-labelledby="notes-title">
          <h2 id="notes-title" className="mb-2 text-lg font-semibold tracking-tight">A note from the studio</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-fg-muted">{quote.notes}</p>
        </section>
      )}

      {quote.terms && (
        <details className="group rounded-[var(--radius-lg)] border border-line-soft bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] [&::-webkit-details-marker]:hidden">
            Terms and conditions
            <Plus className="size-4 transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" />
          </summary>
          <p className="whitespace-pre-line border-t border-line-soft px-4 py-3 text-sm leading-relaxed text-fg-muted">{quote.terms}</p>
        </details>
      )}
    </div>
  );
}
