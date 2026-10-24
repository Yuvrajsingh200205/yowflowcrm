'use client';

import * as React from 'react';
import { AlertTriangle, ListPlus, PencilLine, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Dialog, DialogContent, Field, Input, Select, Textarea, useToast } from '@/components/ui';
import { catalogApi, EVENT_TYPE_LABELS, EVENT_TYPES, num, quotesApi, salesSetupApi, type CatalogItem, type DateCheck, type EventType, type PricingType, type QuoteDetail, type QuoteItem, type QuoteLineInput, type SalesSettings } from '@/lib/api/sales';
import { errorMessage, fieldErrors, fmtDate, inr, inrFixed, localToday } from '../format';
import { documentTotals, lineAmounts, paymentPlan, quantityFor, round2 } from '../pricing';
import { MoneyInput, NumberInput, Toggle, useLoad } from '../ui';

interface Line {
  key: string;
  catalogItemId: string | null;
  kind: 'PACKAGE' | 'ADDON' | 'CUSTOM';
  service: string;
  description: string;
  inclusions: string[];
  isOptional: boolean;
  isSelected: boolean;
  pricingType: PricingType;
  unitLabel: string | null;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number | null;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
}

let seq = 0;
const nextKey = () => `line-${++seq}`;

const fromItem = (i: QuoteItem): Line => ({
  key: nextKey(), catalogItemId: i.catalogItemId, kind: i.kind, service: i.service, description: i.description ?? '', inclusions: i.inclusions, isOptional: i.isOptional, isSelected: i.isSelected,
  pricingType: i.pricingType, unitLabel: i.unitLabel, allowQuantity: i.allowQuantity, minQuantity: i.minQuantity, maxQuantity: i.maxQuantity,
  quantity: String(num(i.quantity)), unitPrice: String(num(i.unitPrice)), discount: num(i.discountAmount) ? String(num(i.discountAmount)) : '', taxRate: String(num(i.taxRate)),
});

const fromCatalog = (c: CatalogItem, ctx: { eventDays: number; guestCount: number | null }, optional: boolean): Line => ({
  key: nextKey(), catalogItemId: c.id, kind: c.kind, service: c.name, description: c.description ?? '', inclusions: c.inclusions, isOptional: optional, isSelected: true,
  pricingType: c.pricingType, unitLabel: c.unitLabel, allowQuantity: c.allowQuantity, minQuantity: c.minQuantity, maxQuantity: c.maxQuantity,
  quantity: String(quantityFor(c, ctx)), unitPrice: String(c.unitPrice), discount: '', taxRate: String(c.taxRate),
});

const customLine = (): Line => ({
  key: nextKey(), catalogItemId: null, kind: 'CUSTOM', service: '', description: '', inclusions: [], isOptional: false, isSelected: true, pricingType: 'FIXED', unitLabel: null,
  allowQuantity: false, minQuantity: 1, maxQuantity: null, quantity: '1', unitPrice: '', discount: '', taxRate: '18',
});

const priced = (l: Line) => ({ quantity: Number(l.quantity) || 0, unitPrice: Number(l.unitPrice) || 0, discountAmount: Number(l.discount) || 0, taxRate: Number(l.taxRate) || 0, isSelected: l.isSelected });
const derives = (l: Line) => l.catalogItemId !== null && (l.pricingType === 'PER_DAY' || l.pricingType === 'PER_PERSON');

export function QuoteBuilder({ quote, onClose, onSaved }: { quote: QuoteDetail; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const catalog = useLoad(() => catalogApi.list({ active: true }), []);
  const settings = useLoad<SalesSettings>(() => salesSetupApi.settings(), []);

  const [h, setH] = React.useState({
    customerName: quote.customerName ?? '', customerPhone: quote.customerPhone ?? '', customerEmail: quote.customerEmail ?? '', eventType: (quote.eventType ?? '') as EventType | '',
    eventDate: quote.eventDate ? quote.eventDate.slice(0, 10) : '', eventDays: String(quote.eventDays), guestCount: quote.guestCount ? String(quote.guestCount) : '',
    venueName: quote.venueName ?? '', venueCity: quote.venueCity ?? '', advancePercent: quote.advancePercent === null ? '' : String(quote.advancePercent),
    balanceDays: quote.balanceDueDaysBefore === null ? '' : String(quote.balanceDueDaysBefore), validUntil: quote.validUntil ? quote.validUntil.slice(0, 10) : '',
    notes: quote.notes ?? '', terms: quote.termsAndConditions ?? '', discount: num(quote.discountAmount) ? String(Math.max(0, round2(num(quote.discountAmount) - quote.items.filter((i) => i.isSelected).reduce((a, i) => a + num(i.discountAmount), 0)))) : '',
  });
  const [lines, setLines] = React.useState<Line[]>(() => quote.items.map(fromItem));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [check, setCheck] = React.useState<DateCheck | null>(null);
  const [pickKey, setPickKey] = React.useState('');

  const ctxOf = (x: { eventDays: string; guestCount: string }) => ({ eventDays: Math.max(1, Number(x.eventDays) || 1), guestCount: x.guestCount ? Number(x.guestCount) : null });
  const ctx = ctxOf(h);

  const setHeader = (key: keyof typeof h, value: string) => {
    setErrors((e) => ({ ...e, [key]: '' }));
    // Lines priced per day or per guest follow the event, unless someone typed their own quantity.
    if (key === 'eventDays' || key === 'guestCount') {
      const before = ctxOf(h);
      const after = ctxOf({ ...h, [key]: value });
      setLines((ls) => ls.map((l) => (derives(l) && Number(l.quantity) === quantityFor(l, before) ? { ...l, quantity: String(quantityFor(l, after)) } : l)));
    }
    setH((prev) => ({ ...prev, [key]: value }));
  };

  const patch = (key: string, p: Partial<Line>) => { setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l))); setErrors((e) => ({ ...e, [`line-${key}`]: '' })); };
  const remove = (key: string) => setLines((ls) => ls.filter((l) => l.key !== key));

  React.useEffect(() => {
    if (!h.eventDate) { setCheck(null); return; }
    let cancelled = false;
    salesSetupApi.checkDate(h.eventDate).then((c) => { if (!cancelled) setCheck(c); }).catch(() => { if (!cancelled) setCheck(null); });
    return () => { cancelled = true; };
  }, [h.eventDate]);

  const addFromCatalog = () => {
    const item = (catalog.data ?? []).find((c) => c.id === pickKey);
    if (!item) return;
    setLines((ls) => [...ls, fromCatalog(item, ctx, item.kind === 'ADDON')]);
    setPickKey('');
  };

  const discount = Number(h.discount) || 0;
  const totals = documentTotals(lines.map(priced), discount);
  const advancePercent = h.advancePercent === '' ? (settings.data?.advancePercent ?? 30) : Number(h.advancePercent);
  const balanceDays = h.balanceDays === '' ? (settings.data?.balanceDueDaysBefore ?? 7) : Number(h.balanceDays);
  const plan = paymentPlan(totals.total, advancePercent, balanceDays, h.eventDate || null, localToday());
  const taken = lines.map((l) => l.catalogItemId).filter(Boolean);
  const available = (catalog.data ?? []).filter((c) => !taken.includes(c.id));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!h.customerName.trim()) e.customerName = 'Enter the customer’s name.';
    if (h.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(h.customerEmail.trim())) e.customerEmail = 'Enter a valid email, or leave it empty.';
    if (!Number(h.eventDays) || Number(h.eventDays) < 1) e.eventDays = 'At least 1 day.';
    if (h.advancePercent !== '' && Number(h.advancePercent) > 100) e.advancePercent = 'Enter 0 to 100.';
    if (h.validUntil && h.validUntil < localToday() && quote.status === 'DRAFT') e.validUntil = 'Choose a date that has not passed.';
    if (!lines.some((l) => l.isSelected)) e.lines = 'Add at least one item that is switched on.';
    lines.forEach((l) => {
      const q = Number(l.quantity);
      if (!l.service.trim()) e[`line-${l.key}`] = 'Name this item.';
      else if (!(q > 0)) e[`line-${l.key}`] = 'Quantity must be more than 0.';
      else if (l.unitPrice === '' || Number.isNaN(Number(l.unitPrice))) e[`line-${l.key}`] = 'Enter a price.';
      else if (Number(l.discount) > round2(q * Number(l.unitPrice))) e[`line-${l.key}`] = 'The discount is more than the item costs.';
    });
    if (round2(totals.subtotal - totals.discount) < 0) e.discount = 'The discounts add up to more than the quote.';
    return e;
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) { toast({ tone: 'error', title: 'Some details need a look', description: Object.values(found)[0] }); return; }
    setBusy(true);
    try {
      const items: QuoteLineInput[] = lines.map((l) => ({
        service: l.service.trim(), description: l.description.trim() || null, inclusions: l.inclusions, kind: l.kind, catalogItemId: l.catalogItemId, isOptional: l.isOptional, isSelected: l.isSelected,
        pricingType: l.pricingType, unitLabel: l.unitLabel, allowQuantity: l.allowQuantity, minQuantity: l.minQuantity, maxQuantity: l.maxQuantity,
        quantity: Number(l.quantity), unitPrice: Number(l.unitPrice), discountAmount: Number(l.discount) || 0, taxRate: Number(l.taxRate) || 0,
      }));
      await quotesApi.update(quote.id, {
        customerName: h.customerName.trim(), customerPhone: h.customerPhone.trim() || null, customerEmail: h.customerEmail.trim() || null, eventType: h.eventType || null,
        eventDate: h.eventDate || null, eventDays: Number(h.eventDays), guestCount: h.guestCount ? Number(h.guestCount) : null, venueName: h.venueName.trim() || null, venueCity: h.venueCity.trim() || null,
        advancePercent: h.advancePercent === '' ? null : Number(h.advancePercent), balanceDueDaysBefore: h.balanceDays === '' ? null : Number(h.balanceDays),
        validUntil: h.validUntil || null, notes: h.notes.trim() || null, termsAndConditions: h.terms.trim() || null, items, discountAmount: discount,
      });
      toast({ tone: 'success', title: 'Quote saved', description: quote.status === 'SENT' ? 'The customer sees the new version when they open their link.' : undefined });
      onSaved();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast({ tone: 'error', title: 'Couldn’t save the quote', description: errorMessage(error, 'Please try again.') });
    } finally { setBusy(false); }
  };

  const unitHint = (l: Line) => (l.pricingType === 'PER_DAY' ? 'per day' : l.pricingType === 'PER_PERSON' ? 'per guest' : l.unitLabel ? `per ${l.unitLabel}` : '');

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent
        size="lg"
        className="sm:max-w-4xl"
        title={`Edit ${quote.quotationNumber}`}
        description={quote.status === 'SENT' ? 'This quote has been sent. Changes show up when the customer next opens their link.' : 'Adjust the items, prices and details before you send it.'}
        footer={
          <>
            <p className="mr-auto hidden text-sm text-fg-muted sm:block">Total <strong className="font-display text-lg tabular-nums text-fg">{inrFixed(totals.total)}</strong></p>
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" form="quote-builder" loading={busy}>Save quote</Button>
          </>
        }
      >
        <form id="quote-builder" onSubmit={save} noValidate className="grid gap-8">
          <section aria-labelledby="qb-customer" className="grid gap-4">
            <h3 id="qb-customer" className="text-sm font-semibold text-fg">Customer and event</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Customer name" required error={errors.customerName}>{(a) => <Input id={a.id} value={h.customerName} onChange={(e) => setHeader('customerName', e.target.value)} maxLength={160} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              <Field label="Phone" error={errors.customerPhone}>{(a) => <Input id={a.id} type="tel" inputMode="tel" value={h.customerPhone} onChange={(e) => setHeader('customerPhone', e.target.value)} maxLength={32} />}</Field>
              <Field label="Email" error={errors.customerEmail}>{(a) => <Input id={a.id} type="email" value={h.customerEmail} onChange={(e) => setHeader('customerEmail', e.target.value)} maxLength={160} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              <Field label="Occasion">{(a) => (
                <Select id={a.id} value={h.eventType} onChange={(e) => setHeader('eventType', e.target.value)}>
                  <option value="">Not set</option>{EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
                </Select>
              )}</Field>
              <Field label="Event date">{(a) => <Input id={a.id} type="date" value={h.eventDate} onChange={(e) => setHeader('eventDate', e.target.value)} />}</Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Days" error={errors.eventDays}>{(a) => <NumberInput id={a.id} value={h.eventDays} onChange={(v) => setHeader('eventDays', v)} maxLength={2} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
                <Field label="Guests">{(a) => <NumberInput id={a.id} value={h.guestCount} onChange={(v) => setHeader('guestCount', v)} maxLength={6} />}</Field>
              </div>
              <Field label="Venue" className="sm:col-span-2">{(a) => <Input id={a.id} value={h.venueName} onChange={(e) => setHeader('venueName', e.target.value)} maxLength={200} />}</Field>
              <Field label="City">{(a) => <Input id={a.id} value={h.venueCity} onChange={(e) => setHeader('venueCity', e.target.value)} maxLength={80} />}</Field>
            </div>
            {check && !check.sellable && h.eventDate && (
              <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-warn"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span><strong>{fmtDate(h.eventDate)}:</strong> {check.reason} The customer will not be able to accept this online.</span></p>
            )}
          </section>

          <section aria-labelledby="qb-items" className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="qb-items" className="text-sm font-semibold text-fg">Items</h3>
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-56"><label htmlFor="qb-pick" className="sr-only">Add from your price list</label>
                  <Select id="qb-pick" value={pickKey} onChange={(e) => setPickKey(e.target.value)}><option value="">Add from price list…</option>{available.map((c) => <option key={c.id} value={c.id}>{c.kind === 'PACKAGE' ? 'Package' : 'Add-on'}: {c.name} · {inr(c.unitPrice)}</option>)}</Select>
                </div>
                <Button type="button" variant="secondary" onClick={addFromCatalog} disabled={!pickKey}><ListPlus />Add</Button>
                <Button type="button" variant="secondary" onClick={() => setLines((ls) => [...ls, customLine()])}><Plus />Custom item</Button>
              </div>
            </div>
            {errors.lines && <p role="alert" className="text-sm font-medium text-bad">{errors.lines}</p>}

            <ul className="grid gap-3">
              {lines.map((l, index) => {
                const amounts = lineAmounts(priced(l));
                const err = errors[`line-${l.key}`];
                const derived = derives(l);
                return (
                  <li key={l.key} className={`rounded-[var(--radius-lg)] border p-4 ${l.isSelected ? 'border-line bg-surface' : 'border-line-soft bg-surface-sunken'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Badge tone={l.kind === 'PACKAGE' ? 'brand' : l.kind === 'ADDON' ? 'info' : 'neutral'}>{l.kind === 'PACKAGE' ? 'Package' : l.kind === 'ADDON' ? 'Add-on' : 'Custom'}</Badge>
                        <span className="text-xs text-fg-subtle">Item {index + 1}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="text-bad hover:text-bad" onClick={() => remove(l.key)} aria-label={`Remove ${l.service || `item ${index + 1}`}`}><Trash2 />Remove</Button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-12">
                      <Field label="Name" className="sm:col-span-6" error={err}>{(a) => <Input id={a.id} value={l.service} onChange={(e) => patch(l.key, { service: e.target.value })} maxLength={200} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
                      <Field label={derived ? `Qty (${unitHint(l)})` : 'Qty'} className="sm:col-span-2">{(a) => <Input id={a.id} inputMode="decimal" value={l.quantity} onChange={(e) => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) patch(l.key, { quantity: e.target.value }); }} className="tabular-nums" />}</Field>
                      <Field label="Price" className="sm:col-span-2">{(a) => <MoneyInput id={a.id} value={l.unitPrice} onChange={(v) => patch(l.key, { unitPrice: v })} />}</Field>
                      <Field label="GST %" className="sm:col-span-2">{(a) => <NumberInput id={a.id} value={l.taxRate} onChange={(v) => patch(l.key, { taxRate: v })} maxLength={3} />}</Field>
                      <Field label="Description (optional)" className="sm:col-span-8">{(a) => <Input id={a.id} value={l.description} onChange={(e) => patch(l.key, { description: e.target.value })} maxLength={2000} />}</Field>
                      <Field label="Item discount" className="sm:col-span-2">{(a) => <MoneyInput id={a.id} value={l.discount} onChange={(v) => patch(l.key, { discount: v })} />}</Field>
                      <div className="flex items-end justify-end text-right sm:col-span-2"><p className="text-sm"><span className="block text-xs text-fg-subtle">Amount</span><span className="font-semibold tabular-nums">{inrFixed(amounts.total)}</span></p></div>
                    </div>
                    <div className="mt-3 grid gap-3 border-t border-line-soft pt-3 sm:grid-cols-2">
                      <Toggle checked={l.isOptional} onChange={(v) => patch(l.key, { isOptional: v })} label="Optional for the customer" description="They can switch it on or off on their quote page." />
                      {l.isOptional && <Toggle checked={l.isSelected} onChange={(v) => patch(l.key, { isSelected: v })} label="Switched on in this quote" description="Off means it is offered but not counted until they choose it." />}
                    </div>
                  </li>
                );
              })}
              {lines.length === 0 && <li className="rounded-[var(--radius-lg)] border border-dashed border-line px-4 py-8 text-center text-sm text-fg-muted">No items yet. Add one from your price list or make a custom item.</li>}
            </ul>
          </section>

          <section aria-labelledby="qb-total" className="grid gap-4 lg:grid-cols-2">
            <div className="grid content-start gap-4">
              <h3 id="qb-total" className="text-sm font-semibold text-fg">Payment and validity</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Advance (%)" hint={settings.data ? `Default ${settings.data.advancePercent}%.` : undefined} error={errors.advancePercent}>{(a) => <NumberInput id={a.id} value={h.advancePercent} onChange={(v) => setHeader('advancePercent', v)} maxLength={3} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
                <Field label="Balance due" hint={settings.data ? `Days before the event. Default ${settings.data.balanceDueDaysBefore}.` : 'Days before the event.'}>{(a) => <NumberInput id={a.id} value={h.balanceDays} onChange={(v) => setHeader('balanceDays', v)} maxLength={3} aria-describedby={a.describedBy} />}</Field>
                <Field label="Valid until" error={errors.validUntil}>{(a) => <Input id={a.id} type="date" value={h.validUntil} onChange={(e) => setHeader('validUntil', e.target.value)} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              </div>
              <Field label="Overall discount" hint="Taken off the final total. To reduce the GST as well, give the discount on an item instead." error={errors.discount}>{(a) => <MoneyInput id={a.id} value={h.discount} onChange={(v) => setHeader('discount', v)} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              <Field label="Note for the customer (optional)">{(a) => <Textarea id={a.id} rows={3} value={h.notes} onChange={(e) => setHeader('notes', e.target.value)} maxLength={5000} />}</Field>
              <Field label="Terms for this quote" hint="Leave empty to use your default terms.">{(a) => <Textarea id={a.id} rows={4} value={h.terms} onChange={(e) => setHeader('terms', e.target.value)} maxLength={10000} aria-describedby={a.describedBy} />}</Field>
            </div>
            <aside aria-label="Quote summary" className="h-fit rounded-[var(--radius-lg)] border border-line-soft bg-surface-sunken p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg"><PencilLine className="size-4 text-brand" aria-hidden="true" />Summary</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-fg-muted">Subtotal</dt><dd className="tabular-nums">{inrFixed(totals.subtotal)}</dd></div>
                {totals.discount > 0 && <div className="flex justify-between gap-4"><dt className="text-fg-muted">Discount</dt><dd className="tabular-nums text-ok">− {inrFixed(totals.discount)}</dd></div>}
                <div className="flex justify-between gap-4"><dt className="text-fg-muted">GST</dt><dd className="tabular-nums">{inrFixed(totals.tax)}</dd></div>
                <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2"><dt className="font-semibold">Total</dt><dd className="font-display text-xl font-semibold tabular-nums">{inrFixed(totals.total)}</dd></div>
              </dl>
              <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-fg-subtle">Payment plan</p>
              <ol className="space-y-1.5 text-sm">
                {plan.map((s) => <li key={s.title} className="flex justify-between gap-4"><span className="text-fg-muted">{s.title} · {s.title === 'Advance' ? 'on acceptance' : fmtDate(s.dueDate)}</span><span className="font-medium tabular-nums">{inrFixed(s.amount)}</span></li>)}
              </ol>
            </aside>
          </section>
        </form>
      </DialogContent>
    </Dialog>
  );
}
