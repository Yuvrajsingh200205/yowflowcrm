import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, documentTotals, lineAmounts, paymentPlan, quantityFor, round2 } from './pricing';
import { fieldErrors, fmtDate, fmtDateLong, inr, inrFixed, isValidMobile, normalizeMobile, quoteStatusMeta, timeAgo } from './format';
import { brandStyle, contrast, readableOn } from '../public-sales/brandTheme';

describe('quantityFor', () => {
  const base = { allowQuantity: false, minQuantity: 1, maxQuantity: null };
  it('charges per day for the number of event days, at least one', () => {
    expect(quantityFor({ ...base, pricingType: 'PER_DAY' }, { eventDays: 3 })).toBe(3);
    expect(quantityFor({ ...base, pricingType: 'PER_DAY' }, { eventDays: 0 })).toBe(1);
  });
  it('charges per person for the guest count but never below the catalogue minimum', () => {
    const plates = { ...base, pricingType: 'PER_PERSON' as const, minQuantity: 100 };
    expect(quantityFor(plates, { eventDays: 1, guestCount: 250 })).toBe(250);
    expect(quantityFor(plates, { eventDays: 1, guestCount: 40 })).toBe(100);
    expect(quantityFor(plates, { eventDays: 1, guestCount: null })).toBe(100);
  });
  it('keeps a fixed item at one unless a quantity is allowed, then clamps to the range', () => {
    expect(quantityFor({ ...base, pricingType: 'FIXED' }, { eventDays: 1 }, 5)).toBe(1);
    const album = { ...base, pricingType: 'FIXED' as const, allowQuantity: true, minQuantity: 1, maxQuantity: 4 };
    expect(quantityFor(album, { eventDays: 1 }, 9)).toBe(4);
    expect(quantityFor(album, { eventDays: 1 }, 0)).toBe(1);
    expect(quantityFor(album, { eventDays: 1 })).toBe(1);
  });
});

describe('quote totals', () => {
  it('adds tax on top of each line and rounds half-up to paise', () => {
    expect(lineAmounts({ quantity: 2, unitPrice: 50000, taxRate: 18 })).toEqual({ gross: 100000, net: 100000, tax: 18000, total: 118000 });
    expect(lineAmounts({ quantity: 1, unitPrice: 99.99, taxRate: 18 }).tax).toBe(18);
    expect(round2(1.005)).toBe(1.01);
  });
  it('matches the server for the sample studio quote (₹1,35,700)', () => {
    const t = documentTotals([
      { quantity: 2, unitPrice: 50000, taxRate: 18 },
      { quantity: 1, unitPrice: 10000, taxRate: 18 },
      { quantity: 1, unitPrice: 5000, taxRate: 18 },
    ]);
    expect(t).toEqual({ subtotal: 115000, discount: 0, tax: 20700, total: 135700 });
  });
  it('ignores optional lines that are switched off and applies line and document discounts', () => {
    const t = documentTotals([
      { quantity: 1, unitPrice: 100000, taxRate: 18, discountAmount: 10000 },
      { quantity: 1, unitPrice: 20000, taxRate: 18, isSelected: false },
    ], 5000);
    expect(t.subtotal).toBe(100000);
    expect(t.discount).toBe(15000);
    expect(t.tax).toBe(16200);
    expect(t.total).toBe(101200);
  });
});

describe('payment plan', () => {
  it('takes the advance today and the balance days before the event', () => {
    const plan = paymentPlan(135700, 30, 7, '2027-01-21', '2026-10-24');
    expect(plan).toEqual([
      { title: 'Advance', amount: 40710, dueDate: '2026-10-24' },
      { title: 'Balance', amount: 94990, dueDate: '2027-01-14' },
    ]);
  });
  it('never puts the balance in the past, and collapses a 100% advance into one payment', () => {
    expect(paymentPlan(1000, 50, 7, '2026-10-26', '2026-10-24')[1].dueDate).toBe('2026-10-24');
    expect(paymentPlan(1000, 100, 7, '2027-01-01', '2026-10-24')).toEqual([{ title: 'Advance', amount: 1000, dueDate: '2026-10-24' }]);
    expect(paymentPlan(1000, 0, 7, '2027-01-01', '2026-10-24')).toEqual([{ title: 'Balance', amount: 1000, dueDate: '2026-12-25' }]);
  });
  it('does date maths without time zone drift', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(daysBetween('2026-10-24', '2027-01-21')).toBe(89);
  });
});

describe('formatting', () => {
  it('writes rupees the Indian way', () => {
    expect(inr(135700)).toBe('₹1,35,700');
    expect(inr(1234567.5)).toBe('₹12,34,567.5');
    expect(inrFixed(5000)).toBe('₹5,000.00');
    expect(inr(Number.NaN)).toBe('₹0');
  });
  it('reads a date string as a calendar date', () => {
    expect(fmtDate('2027-01-21')).toBe('21 Jan 2027');
    expect(fmtDate(null)).toBe('—');
    expect(fmtDateLong('2027-01-21')).toBe('Thursday, 21 January 2027');
  });
  it('describes recency', () => {
    const now = Date.parse('2026-10-24T12:00:00Z');
    expect(timeAgo('2026-10-24T11:59:40Z', now)).toBe('just now');
    expect(timeAgo('2026-10-24T11:15:00Z', now)).toBe('45 min ago');
    expect(timeAgo('2026-10-24T07:00:00Z', now)).toBe('5 hr ago');
    expect(timeAgo('2026-10-22T12:00:00Z', now)).toBe('2 days ago');
  });
  it('accepts the usual ways of writing an Indian mobile', () => {
    expect(normalizeMobile('+91 98123 45678')).toBe('9812345678');
    expect(normalizeMobile('09812345678')).toBe('9812345678');
    expect(isValidMobile('98123-45678')).toBe(true);
    expect(isValidMobile('5812345678')).toBe(false);
    expect(isValidMobile('98123')).toBe(false);
  });
  it('labels each quote state with words, not colour alone', () => {
    expect(quoteStatusMeta('DRAFT', 'NOT_SENT', true).label).toBe('Needs review');
    expect(quoteStatusMeta('SENT', 'OPENED').label).toBe('Opened');
    expect(quoteStatusMeta('SENT', 'NOT_OPENED').label).toBe('Sent');
    expect(quoteStatusMeta('REJECTED', 'OPENED').label).toBe('Declined');
  });
  it('maps API validation details to fields', () => {
    expect(fieldErrors({ details: [{ field: 'phone', message: 'Bad number' }, { field: 'phone', message: 'second' }, { message: 'no field' }] })).toEqual({ phone: 'Bad number' });
    expect(fieldErrors(new Error('x'))).toEqual({});
  });
});

describe('studio brand colours', () => {
  it('picks readable text for light and dark brand colours', () => {
    expect(readableOn('#B4F03C')).toBe('#11160F');
    expect(readableOn('#1F3A8A')).toBe('#FFFFFF');
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
  });
  it('only themes the page for a valid hex colour', () => {
    expect(brandStyle(null)).toEqual({});
    expect(brandStyle('red')).toEqual({});
    const s = brandStyle('#6aa900') as Record<string, string>;
    expect(s['--primary']).toBe('#6aa900');
    expect(s['--on-primary']).toMatch(/^#/);
  });
  it('keeps the focus ring visible when the brand colour is very light', () => {
    const s = brandStyle('#F8F4C8') as Record<string, string>;
    expect(contrast(s['--ring'], '#FFFFFF')).toBeGreaterThanOrEqual(3);
  });
});
