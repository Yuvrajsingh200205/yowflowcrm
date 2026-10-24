import type { PricingType } from '@/lib/api/sales';

/**
 * Quote arithmetic for live totals while a quote is being built. The server recomputes everything when it
 * saves, so these functions only have to agree with it, and they follow the same rules: tax is added on top of
 * the line (tax-exclusive), amounts round half-up to paise.
 */

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface PriceableItem {
  pricingType: PricingType;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number | null;
}

const clamp = (n: number, lo: number, hi: number | null) => Math.min(Math.max(n, lo), hi ?? Number.MAX_SAFE_INTEGER);

/** How many units a catalogue line is charged for, given the event. */
export function quantityFor(item: PriceableItem, ctx: { eventDays: number; guestCount?: number | null }, requested?: number): number {
  switch (item.pricingType) {
    case 'PER_DAY':
      return Math.max(1, Math.floor(ctx.eventDays) || 1);
    case 'PER_PERSON': {
      const guests = Math.max(0, Math.floor(ctx.guestCount ?? 0));
      return Math.max(item.minQuantity, guests || item.minQuantity);
    }
    default: {
      if (!item.allowQuantity) return 1;
      const wanted = Number.isFinite(requested) ? Math.floor(requested as number) : item.minQuantity;
      return clamp(wanted, item.minQuantity, item.maxQuantity);
    }
  }
}

export interface PricedLine {
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  isSelected?: boolean;
}

export interface LineAmounts { gross: number; net: number; tax: number; total: number }

export function lineAmounts(line: PricedLine): LineAmounts {
  const gross = round2(line.quantity * line.unitPrice);
  const net = round2(gross - round2(line.discountAmount ?? 0));
  const tax = round2((net * (line.taxRate ?? 0)) / 100);
  return { gross, net, tax, total: round2(net + tax) };
}

export interface Totals { subtotal: number; discount: number; tax: number; total: number }

/** Totals over the lines that are switched on; an optional line that is off costs nothing. */
export function documentTotals(lines: PricedLine[], documentDiscount = 0): Totals {
  const on = lines.filter((l) => l.isSelected !== false);
  const subtotal = round2(on.reduce((a, l) => a + l.quantity * l.unitPrice, 0));
  const lineDiscounts = round2(on.reduce((a, l) => a + round2(l.discountAmount ?? 0), 0));
  const tax = round2(on.reduce((a, l) => a + lineAmounts(l).tax, 0));
  const discount = round2(lineDiscounts + round2(documentDiscount));
  return { subtotal, discount, tax, total: round2(subtotal - discount + tax) };
}

// ── dates as YYYY-MM-DD, handled in UTC so no time zone can move them ───────
const DAY = 86_400_000;
const toUtc = (ymd: string) => Date.parse(`${ymd}T00:00:00Z`);
export const addDays = (ymd: string, days: number): string => new Date(toUtc(ymd) + days * DAY).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string): number => Math.round((toUtc(to) - toUtc(from)) / DAY);

export interface PaymentStep { title: string; amount: number; dueDate: string }

/** Advance on acceptance and the balance shortly before the event; a 100% advance or a missing date collapse sensibly. */
export function paymentPlan(total: number, advancePercent: number, balanceDueDaysBefore: number, eventDate: string | null, today: string): PaymentStep[] {
  const grand = round2(total);
  const pct = Math.min(100, Math.max(0, Math.round(advancePercent)));
  const advance = pct >= 100 ? grand : round2((grand * pct) / 100);
  const balance = round2(grand - advance);
  const steps: PaymentStep[] = [];
  if (advance > 0) steps.push({ title: 'Advance', amount: advance, dueDate: today });
  if (balance > 0) {
    const due = eventDate ? addDays(eventDate, -Math.max(0, balanceDueDaysBefore)) : addDays(today, 30);
    steps.push({ title: 'Balance', amount: balance, dueDate: due < today ? today : due });
  }
  if (steps.length === 0) steps.push({ title: 'Payment', amount: grand, dueDate: today });
  return steps;
}
