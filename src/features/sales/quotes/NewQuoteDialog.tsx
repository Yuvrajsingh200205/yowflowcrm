'use client';

import * as React from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { Button, Checkbox, Dialog, DialogContent, Field, Input, Select, Skeleton, useToast } from '@/components/ui';
import { leadsApi, type BackendLead } from '@/lib/api/leads';
import { catalogApi, EVENT_TYPE_LABELS, quotesApi, salesSetupApi, type CatalogItem, type DateCheck } from '@/lib/api/sales';
import { errorMessage, fieldErrors, fmtDate, inr } from '../format';
import { MoneyInput, NumberInput, useLoad } from '../ui';

const CUSTOM = 'custom';

export function NewQuoteDialog({ initialLeadId, onClose, onCreated }: { initialLeadId: string | null; onClose: () => void; onCreated: (id: string) => void }) {
  const { toast } = useToast();
  const catalog = useLoad(() => catalogApi.list({ active: true }), []);
  const defaults = useLoad(() => salesSetupApi.settings(), []);
  const [lead, setLead] = React.useState<BackendLead | null>(null);
  const [leadLoading, setLeadLoading] = React.useState(Boolean(initialLeadId));
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<BackendLead[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [packageId, setPackageId] = React.useState('');
  const [addonIds, setAddonIds] = React.useState<string[]>([]);
  const [custom, setCustom] = React.useState({ name: 'Photography & videography', price: '', tax: '18' });
  const [f, setF] = React.useState({ eventDate: '', eventDays: '1', guestCount: '', venueName: '', venueCity: '', discount: '', validDays: '', advancePercent: '' });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [check, setCheck] = React.useState<DateCheck | null>(null);
  const [busy, setBusy] = React.useState(false);

  const packages = (catalog.data ?? []).filter((i) => i.kind === 'PACKAGE');
  const addons = (catalog.data ?? []).filter((i) => i.kind === 'ADDON');
  const pick = (l: BackendLead) => {
    setLead(l);
    setF((s) => ({ ...s, eventDate: l.eventDate ? l.eventDate.slice(0, 10) : s.eventDate, venueCity: l.venueCity ?? s.venueCity }));
    setErrors((e) => ({ ...e, lead: '' }));
  };

  React.useEffect(() => {
    if (!initialLeadId) return;
    let cancelled = false;
    leadsApi.get(initialLeadId).then((l) => { if (!cancelled) pick(l); }).catch((e) => { if (!cancelled) toast({ tone: 'error', title: 'Couldn’t load that lead', description: errorMessage(e, 'Search for it below instead.') }); }).finally(() => { if (!cancelled) setLeadLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLeadId]);

  // Lead search waits for a pause in typing, and ignores answers to older searches.
  React.useEffect(() => {
    const term = search.trim();
    if (!term) { setResults([]); return; }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      setSearching(true);
      try { const r = await leadsApi.list({ search: term, limit: 6 }); if (!cancelled) setResults(r.data.filter((l) => l.status !== 'LOST')); }
      catch { if (!cancelled) setResults([]); }
      finally { if (!cancelled) setSearching(false); }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [search]);

  // Warn (never block) when the date cannot be sold: staff may know better than the calendar.
  React.useEffect(() => {
    if (!f.eventDate) { setCheck(null); return; }
    let cancelled = false;
    salesSetupApi.checkDate(f.eventDate).then((c) => { if (!cancelled) setCheck(c); }).catch(() => { if (!cancelled) setCheck(null); });
    return () => { cancelled = true; };
  }, [f.eventDate]);

  const set = (key: keyof typeof f) => (v: string) => { setF((s) => ({ ...s, [key]: v })); setErrors((e) => ({ ...e, [key]: '' })); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const e: Record<string, string> = {};
    if (!lead) e.lead = 'Choose the lead this quote is for.';
    if (!packageId) e.package = 'Choose a package, or “Custom quote”.';
    if (packageId === CUSTOM) {
      if (!custom.name.trim()) e.customName = 'Describe what you are charging for.';
      if (custom.price === '' || Number.isNaN(Number(custom.price))) e.customPrice = 'Enter the price.';
      if (Number(custom.tax) < 0 || Number(custom.tax) > 100) e.customTax = 'Enter 0 to 100.';
    }
    const days = Number(f.eventDays);
    if (!days || days < 1 || days > 60) e.eventDays = 'Enter 1 to 60 days.';
    if (f.validDays && (Number(f.validDays) < 1 || Number(f.validDays) > 365)) e.validDays = 'Enter 1 to 365 days.';
    if (f.advancePercent && Number(f.advancePercent) > 100) e.advancePercent = 'Enter 0 to 100.';
    setErrors(e);
    if (Object.keys(e).length || !lead) return;
    setBusy(true);
    try {
      const created = await quotesApi.fromLead({
        leadId: lead.id,
        packageId: packageId === CUSTOM ? null : packageId,
        addons: packageId === CUSTOM ? [] : addonIds.map((id) => ({ id })),
        customLines: packageId === CUSTOM ? [{ service: custom.name.trim(), kind: 'CUSTOM', quantity: 1, unitPrice: Number(custom.price), taxRate: Number(custom.tax || 0) }] : undefined,
        eventDate: f.eventDate || null, eventDays: days, guestCount: f.guestCount ? Number(f.guestCount) : null,
        venueName: f.venueName.trim() || null, venueCity: f.venueCity.trim() || null,
        discountAmount: f.discount ? Number(f.discount) : undefined, validDays: f.validDays ? Number(f.validDays) : undefined, advancePercent: f.advancePercent ? Number(f.advancePercent) : undefined,
      });
      toast({ tone: 'success', title: `Quote ${created.quotationNumber} created`, description: 'Review it, then send it.' });
      onCreated(created.id);
    } catch (error) {
      setErrors(fieldErrors(error));
      toast({ tone: 'error', title: 'Couldn’t create the quote', description: errorMessage(error, 'Please check the details and try again.') });
    } finally { setBusy(false); }
  };

  const itemLine = (i: CatalogItem) => `${i.name} · ${inr(i.unitPrice)}${i.pricingType === 'PER_DAY' ? ' per day' : i.pricingType === 'PER_PERSON' ? ' per guest' : ''}`;

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent
        size="lg"
        title="New quote"
        description="Pick a lead and a package. Prices, GST and the payment plan fill in from your price list."
        footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" form="new-quote-form" loading={busy}>Create quote</Button></>}
      >
        <form id="new-quote-form" onSubmit={submit} noValidate className="grid gap-6">
          <section aria-labelledby="nq-lead" className="grid gap-3">
            <h3 id="nq-lead" className="text-sm font-semibold text-fg">Who is it for?</h3>
            {leadLoading ? <Skeleton className="h-14" /> : lead ? (
              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-line bg-surface-sunken p-3">
                <div className="min-w-0"><p className="truncate text-sm font-medium text-fg">{lead.name}</p><p className="text-[13px] text-fg-muted">{lead.phone}{lead.eventType ? ` · ${EVENT_TYPE_LABELS[lead.eventType]}` : ''}{lead.eventDate ? ` · ${fmtDate(lead.eventDate.slice(0, 10))}` : ''}</p></div>
                {!initialLeadId && <Button variant="ghost" size="sm" onClick={() => { setLead(null); setSearch(''); }}>Change</Button>}
              </div>
            ) : (
              <div data-field="lead">
                <div className="relative"><label htmlFor="nq-search" className="sr-only">Search leads</label><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden="true" /><Input id="nq-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads by name or phone" className="pl-9" autoComplete="off" autoFocus /></div>
                {searching && <p className="mt-2 text-[13px] text-fg-muted" role="status">Searching…</p>}
                {results.length > 0 && (
                  <ul className="mt-2 divide-y divide-line-soft overflow-hidden rounded-[var(--radius-lg)] border border-line-soft">
                    {results.map((l) => <li key={l.id}><button type="button" onClick={() => pick(l)} className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[var(--hover)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)]"><span className="min-w-0"><span className="block truncate text-sm font-medium text-fg">{l.name}</span><span className="block text-[13px] text-fg-muted">{l.phone}{l.eventDate ? ` · ${fmtDate(l.eventDate.slice(0, 10))}` : ''}</span></span></button></li>)}
                  </ul>
                )}
                {search.trim() && !searching && results.length === 0 && <p className="mt-2 text-[13px] text-fg-muted">No lead found. Add the enquiry in Leads first, then come back here.</p>}
                {errors.lead && <p role="alert" className="mt-2 text-xs font-medium text-bad">{errors.lead}</p>}
              </div>
            )}
          </section>

          <section aria-labelledby="nq-pkg" className="grid gap-4">
            <h3 id="nq-pkg" className="text-sm font-semibold text-fg">What are they buying?</h3>
            <Field label="Package" required error={errors.package}>{(a) => (
              catalog.loading && !catalog.data ? <Skeleton className="h-10" /> : (
                <Select id={a.id} value={packageId} onChange={(e) => { setPackageId(e.target.value); setErrors((x) => ({ ...x, package: '' })); }} invalid={a.invalid} aria-describedby={a.describedBy}>
                  <option value="">Choose…</option>
                  {packages.map((p) => <option key={p.id} value={p.id}>{itemLine(p)}</option>)}
                  <option value={CUSTOM}>Custom quote (no package)</option>
                </Select>
              )
            )}</Field>
            {packageId === CUSTOM && (
              <div className="grid gap-4 sm:grid-cols-[1fr_9rem_6rem]">
                <Field label="What are you charging for?" required error={errors.customName}>{(a) => <Input id={a.id} value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} maxLength={200} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
                <Field label="Price" required error={errors.customPrice}>{(a) => <MoneyInput id={a.id} value={custom.price} onChange={(v) => setCustom({ ...custom, price: v })} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
                <Field label="GST %" error={errors.customTax}>{(a) => <NumberInput id={a.id} value={custom.tax} onChange={(v) => setCustom({ ...custom, tax: v })} maxLength={3} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              </div>
            )}
            {packageId && packageId !== CUSTOM && addons.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-fg">Include these add-ons now <span className="font-normal text-fg-subtle">(the others are still offered as optional extras)</span></legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {addons.map((a) => <Checkbox key={a.id} label={itemLine(a)} checked={addonIds.includes(a.id)} onChange={() => setAddonIds((ids) => (ids.includes(a.id) ? ids.filter((x) => x !== a.id) : [...ids, a.id]))} />)}
                </div>
              </fieldset>
            )}
          </section>

          <section aria-labelledby="nq-event" className="grid gap-4">
            <h3 id="nq-event" className="text-sm font-semibold text-fg">The event</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Event date" className="sm:col-span-1">{(a) => <Input id={a.id} type="date" value={f.eventDate} onChange={(e) => set('eventDate')(e.target.value)} aria-describedby={a.describedBy} />}</Field>
              <Field label="Days" hint="Per-day prices are multiplied by this." error={errors.eventDays}>{(a) => <NumberInput id={a.id} value={f.eventDays} onChange={set('eventDays')} maxLength={2} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              <Field label="Guests" hint="Needed for per-guest prices.">{(a) => <NumberInput id={a.id} value={f.guestCount} onChange={set('guestCount')} maxLength={6} aria-describedby={a.describedBy} />}</Field>
              <Field label="Venue" className="sm:col-span-2">{(a) => <Input id={a.id} value={f.venueName} onChange={(e) => set('venueName')(e.target.value)} maxLength={200} />}</Field>
              <Field label="City">{(a) => <Input id={a.id} value={f.venueCity} onChange={(e) => set('venueCity')(e.target.value)} maxLength={80} />}</Field>
            </div>
            {check && !check.sellable && (
              <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-warn"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span><strong>{fmtDate(f.eventDate)}:</strong> {check.reason} You can still make the quote, but the customer will not be able to accept it online.</span></p>
            )}
            {check?.sellable && <p className="text-[13px] text-ok" role="status">{fmtDate(f.eventDate)} is open for booking.</p>}
          </section>

          <section aria-labelledby="nq-terms" className="grid gap-4">
            <h3 id="nq-terms" className="text-sm font-semibold text-fg">Terms <span className="font-normal text-fg-subtle">(leave blank to use your defaults)</span></h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Discount" hint="Taken off the final total.">{(a) => <MoneyInput id={a.id} value={f.discount} onChange={set('discount')} aria-describedby={a.describedBy} />}</Field>
              <Field label="Valid for (days)" hint={defaults.data ? `Default ${defaults.data.quoteValidDays}` : undefined} error={errors.validDays}>{(a) => <NumberInput id={a.id} value={f.validDays} onChange={set('validDays')} maxLength={3} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              <Field label="Advance (%)" hint={defaults.data ? `Default ${defaults.data.advancePercent}%` : undefined} error={errors.advancePercent}>{(a) => <NumberInput id={a.id} value={f.advancePercent} onChange={set('advancePercent')} maxLength={3} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
            </div>
          </section>
        </form>
      </DialogContent>
    </Dialog>
  );
}
