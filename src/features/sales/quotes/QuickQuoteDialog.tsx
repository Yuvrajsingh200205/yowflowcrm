'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, Download, FileText, Library, MessageCircle, Phone, Star, TriangleAlert, User } from 'lucide-react';
import { Badge, Button, Dialog, DialogContent, Field, Input, Select, Skeleton, useToast } from '@/components/ui';
import { leadsApi, type BackendLead } from '@/lib/api/leads';
import { catalogApi, quotesApi, templatesApi, type CatalogItem, type QuickQuoteResult } from '@/lib/api/sales';
import { cn } from '@/lib/cn';
import { DateAvailabilityHint } from '../DateAvailabilityHint';
import { errorMessage, fieldErrors, inr, isValidMobile, normalizeMobile } from '../format';
import { OccasionIcon } from '../OccasionIcon';
import { eventTypeFor, occasionChips, occasionOf, unitSuffix } from '../occasions';
import { documentTotals, quantityFor } from '../pricing';
import { MoneyInput, NumberInput, copyText, openBlob, useLoad } from '../ui';

const CUSTOM = 'custom';
type Step = 1 | 2 | 3 | 'done';

/**
 * Make a quote in a minute: who it is for, which package, a few optional details, and it is ready to send.
 * Written for someone who is not comfortable with software: one question at a time, big buttons, plain words.
 */
export function QuickQuoteDialog({ initialLeadId, canAddTemplates, onClose, onCreated, onOpenPrices }: {
  initialLeadId: string | null;
  /** Whether this person may add ready-made packages when the price list is empty. */
  canAddTemplates: boolean;
  onClose: () => void;
  onCreated: (quoteId: string) => void;
  onOpenPrices: () => void;
}) {
  const { toast } = useToast();
  const catalog = useLoad(() => catalogApi.list({ active: true }), []);
  const [lead, setLead] = React.useState<BackendLead | null>(null);
  const [leadLoading, setLeadLoading] = React.useState(Boolean(initialLeadId));
  const [step, setStep] = React.useState<Step>(initialLeadId ? 2 : 1);
  const [f, setF] = React.useState({ name: '', phone: '', occasion: 'all', packageId: '', customName: '', customPrice: '', customTax: '18', eventDate: '', eventDays: '1', guests: '', city: '' });
  const [addonIds, setAddonIds] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [result, setResult] = React.useState<QuickQuoteResult | null>(null);
  const [shared, setShared] = React.useState<'' | 'WHATSAPP' | 'LINK'>('');
  const [waUrl, setWaUrl] = React.useState<string | null>(null);
  const [sharing, setSharing] = React.useState<'' | 'WHATSAPP' | 'LINK' | 'PDF'>('');
  const heading = React.useRef<HTMLHeadingElement>(null);

  const set = (key: keyof typeof f) => (value: string) => { setF((s) => ({ ...s, [key]: value })); setErrors((e) => ({ ...e, [key]: '' })); };

  React.useEffect(() => {
    if (!initialLeadId) return;
    let cancelled = false;
    leadsApi.get(initialLeadId).then((l) => {
      if (cancelled) return;
      setLead(l);
      setF((s) => ({ ...s, name: l.name, phone: l.phone, eventDate: l.eventDate ? l.eventDate.slice(0, 10) : '', city: l.venueCity ?? '' }));
    }).catch((e) => { if (!cancelled) { toast({ tone: 'error', title: 'Couldn’t open that customer', description: errorMessage(e, 'Please try again.') }); setStep(1); } })
      .finally(() => { if (!cancelled) setLeadLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLeadId]);

  React.useEffect(() => { heading.current?.focus(); }, [step]);

  const packages = (catalog.data ?? []).filter((i) => i.kind === 'PACKAGE');
  const addons = (catalog.data ?? []).filter((i) => i.kind === 'ADDON');
  const chips = occasionChips(packages);
  const shown = packages.filter((p) => f.occasion === 'all' || occasionOf(p) === f.occasion);
  const chosen = packages.find((p) => p.id === f.packageId) ?? null;
  const custom = f.packageId === CUSTOM;

  // What the customer will see, worked out as they choose so there are no surprises.
  const estimate = React.useMemo(() => {
    const ctx = { eventDays: Math.max(1, Number(f.eventDays) || 1), guestCount: f.guests ? Number(f.guests) : null };
    if (custom) return Number(f.customPrice) > 0 ? documentTotals([{ quantity: 1, unitPrice: Number(f.customPrice), taxRate: Number(f.customTax) || 0 }]).total : null;
    if (!chosen) return null;
    const lines = [chosen, ...addons.filter((a) => addonIds.includes(a.id))].map((i) => ({ quantity: quantityFor(i, ctx), unitPrice: i.unitPrice, taxRate: i.taxRate }));
    return documentTotals(lines).total;
  }, [chosen, custom, addons, addonIds, f.eventDays, f.guests, f.customPrice, f.customTax]);

  const nextFromWho = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = 'Write the customer’s name.';
    if (!isValidMobile(f.phone)) e.phone = 'Write a 10-digit mobile number, for example 98123 45678.';
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  };
  const nextFromPackage = () => {
    const e: Record<string, string> = {};
    if (!f.packageId) e.packageId = 'Tap a package, or choose “Something else”.';
    if (custom) {
      if (f.customName.trim().length < 2) e.customName = 'Say what the price is for.';
      if (!(Number(f.customPrice) > 0)) e.customPrice = 'Write the price.';
    }
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(3);
  };

  const addReadyMade = async () => {
    setAdding(true);
    try {
      const lib = await templatesApi.list();
      await templatesApi.add(lib.items.filter((i) => i.inDefaultKit).map((i) => i.key));
      await catalog.reload();
      toast({ tone: 'success', title: 'Packages added', description: 'The prices are examples. Change them to your own in Sales setup.' });
    } catch (e) { toast({ tone: 'error', title: 'Couldn’t add the packages', description: errorMessage(e, 'Please try again.') }); }
    finally { setAdding(false); }
  };

  const make = async () => {
    setBusy(true);
    try {
      const days = Math.max(1, Number(f.eventDays) || 1);
      const eventType = eventTypeFor(f.occasion === 'all' && chosen ? occasionOf(chosen) : f.occasion, chosen ?? undefined);
      const base = { eventDate: f.eventDate || null, eventDays: days, guestCount: f.guests ? Number(f.guests) : null, venueCity: f.city.trim() || null };
      const customLine = custom ? { service: f.customName.trim(), unitPrice: Number(f.customPrice), taxRate: Number(f.customTax) || 0 } : undefined;
      let made: QuickQuoteResult;
      if (lead) {
        // An enquiry that is already in Leads gets its quote; no second lead is made.
        const r = await quotesApi.fromLead({
          leadId: lead.id, packageId: custom ? null : f.packageId, addons: custom ? [] : addonIds.map((id) => ({ id })), eventDate: base.eventDate, eventDays: days, guestCount: base.guestCount, venueCity: base.venueCity,
          customLines: customLine ? [{ service: customLine.service, kind: 'CUSTOM', quantity: 1, unitPrice: customLine.unitPrice, taxRate: customLine.taxRate }] : undefined,
        });
        made = { id: r.id, quotationNumber: r.quotationNumber, grandTotal: Number(r.grandTotal), status: r.status, leadId: lead.id, reusedLead: true };
      } else {
        made = await quotesApi.quick({ name: f.name.trim(), phone: normalizeMobile(f.phone), eventType, ...base, packageId: custom ? null : f.packageId, addonIds: custom ? [] : addonIds, custom: customLine });
      }
      setResult(made);
      setStep('done');
    } catch (e) {
      setErrors(fieldErrors(e));
      toast({ tone: 'error', title: 'Couldn’t make the quote', description: errorMessage(e, 'Please check the details and try again.') });
    } finally { setBusy(false); }
  };

  // Sharing marks the quote as sent. The WhatsApp tab is opened first, inside the tap, so the browser does not block it.
  const share = async (channel: 'WHATSAPP' | 'LINK') => {
    if (!result) return;
    const tab = channel === 'WHATSAPP' ? window.open('about:blank', '_blank') : null;
    setSharing(channel);
    try {
      const sent = await quotesApi.send(result.id, channel);
      if (channel === 'LINK') {
        if (await copyText(sent.publicUrl)) toast({ tone: 'success', title: 'Link copied', description: 'Paste it in WhatsApp, SMS or anywhere.' });
        else toast({ tone: 'info', title: 'Your link', description: sent.publicUrl, duration: 15000 });
      } else if (sent.whatsappUrl) {
        setWaUrl(sent.whatsappUrl);
        if (tab) tab.location.href = sent.whatsappUrl;
      } else {
        tab?.close();
        toast({ tone: 'error', title: 'This number can’t be used on WhatsApp', description: 'Copy the link instead and send it yourself.' });
        return;
      }
      setShared(channel);
    } catch (e) {
      tab?.close();
      toast({ tone: 'error', title: 'Couldn’t send it', description: errorMessage(e, 'Please try again.') });
    } finally { setSharing(''); }
  };

  const pdf = async () => {
    if (!result) return;
    setSharing('PDF');
    try { const { blob, filename } = await quotesApi.pdf(result.id); openBlob(blob, filename ?? `${result.quotationNumber}.pdf`); }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t make the PDF', description: errorMessage(e, 'Please try again.') }); }
    finally { setSharing(''); }
  };

  const again = () => {
    setResult(null); setShared(''); setWaUrl(null); setAddonIds([]);
    setF({ name: '', phone: '', occasion: 'all', packageId: '', customName: '', customPrice: '', customTax: '18', eventDate: '', eventDays: '1', guests: '', city: '' });
    setLead(null); setStep(1);
  };

  const title = step === 'done' ? 'Quote is ready' : 'Make a quote';
  // A customer picked from Leads skips the first question, so their steps are numbered 1 and 2.
  const sub = step === 'done' ? undefined : `Step ${initialLeadId ? Number(step) - 1 : step} of ${initialLeadId ? 2 : 3}`;
  const examplePrice = Boolean(chosen?.isExample);
  const big = 'h-12 text-base';

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent
        size="lg"
        className="sm:max-w-2xl"
        title={title}
        description={sub}
        footer={step === 'done' ? (
          <><Button variant="secondary" onClick={again}>Make another quote</Button><Button variant="secondary" onClick={() => result && onCreated(result.id)}><FileText />See full quote</Button><Button onClick={onClose}>Done</Button></>
        ) : (
          <>
            {estimate !== null && step === 3 && <p className="mr-auto text-sm text-fg-muted">Total <strong className="font-display text-xl tabular-nums text-fg">{inr(estimate)}</strong></p>}
            {(step === 3 || (step === 2 && !initialLeadId)) && <Button variant="secondary" size="lg" onClick={() => setStep(step === 3 ? 2 : 1)} disabled={busy}><ArrowLeft />Back</Button>}
            {step === 1 && <Button size="lg" onClick={nextFromWho}>Next<ArrowRight /></Button>}
            {step === 2 && <Button size="lg" onClick={nextFromPackage} disabled={packages.length === 0 && !custom}>Next<ArrowRight /></Button>}
            {step === 3 && <Button size="lg" onClick={() => void make()} loading={busy}>Make the quote</Button>}
          </>
        )}
      >
        {step === 'done' && result ? (
          <div className="space-y-5 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok-bg text-ok" aria-hidden="true"><CheckCircle2 className="size-7" /></span>
            <div>
              <h3 ref={heading} tabIndex={-1} className="font-display text-3xl font-semibold tabular-nums text-fg outline-none">{inr(result.grandTotal)}</h3>
              <p className="mt-1 text-sm text-fg-muted">Quote {result.quotationNumber} for <strong className="text-fg">{f.name}</strong></p>
            </div>
            {examplePrice && (
              <p role="status" className="mx-auto flex max-w-md items-start gap-2 rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-left text-[13px] text-fg"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" /><span>This package still has an <strong>example price</strong>. Check it before you send. <button type="button" className="cursor-pointer font-semibold underline" onClick={onOpenPrices}>Check my prices</button></span></p>
            )}
            <div className="mx-auto grid max-w-md gap-3">
              <Button size="lg" className="h-14 text-base" onClick={() => void share('WHATSAPP')} loading={sharing === 'WHATSAPP'}><MessageCircle />Send on WhatsApp</Button>
              <Button size="lg" variant="secondary" className="h-14 text-base" onClick={() => void share('LINK')} loading={sharing === 'LINK'}><Copy />Copy link</Button>
              <Button size="lg" variant="secondary" className="h-14 text-base" onClick={() => void pdf()} loading={sharing === 'PDF'}><Download />Download PDF</Button>
            </div>
            {shared === 'WHATSAPP' && waUrl && <p role="status" className="text-sm text-ok"><Check className="mr-1 inline size-4" aria-hidden="true" />Sent. If WhatsApp did not open, <a className="font-semibold underline" href={waUrl} target="_blank" rel="noopener noreferrer">tap here</a>.</p>}
            {shared === 'LINK' && <p role="status" className="text-sm text-ok"><Check className="mr-1 inline size-4" aria-hidden="true" />Link copied. The customer can open it, add extras and accept.</p>}
          </div>
        ) : leadLoading ? <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-40" /></div> : step === 1 ? (
          <div className="space-y-6">
            <h3 ref={heading} tabIndex={-1} className="flex items-center gap-2 text-lg font-semibold text-fg outline-none"><User className="size-5 text-brand" aria-hidden="true" />Who is this quote for?</h3>
            <Field label="Customer name" required error={errors.name}>{(a) => <Input id={a.id} value={f.name} onChange={(e) => set('name')(e.target.value)} autoComplete="off" maxLength={160} invalid={a.invalid} aria-describedby={a.describedBy} className={big} autoFocus />}</Field>
            <Field label="Mobile number" required error={errors.phone} hint="The WhatsApp number of the customer.">{(a) => <Input id={a.id} type="tel" inputMode="tel" value={f.phone} onChange={(e) => set('phone')(e.target.value)} autoComplete="off" maxLength={24} invalid={a.invalid} aria-describedby={a.describedBy} className={big} />}</Field>
          </div>
        ) : step === 2 ? (
          <div className="space-y-5">
            <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold text-fg outline-none">What is the function?</h3>
            {lead && <p className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-sunken px-3 py-2 text-sm text-fg"><User className="size-4 text-brand" aria-hidden="true" /><strong>{lead.name}</strong><span className="text-fg-muted"><Phone className="mr-1 inline size-3" aria-hidden="true" />{lead.phone}</span></p>}
            {catalog.loading && !catalog.data ? <Skeleton className="h-40" /> : packages.length === 0 && !custom ? (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-line p-6 text-center">
                <p className="text-base font-semibold text-fg">Your price list is empty</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-fg-muted">{canAddTemplates ? 'Add our ready-made packages (wedding, birthday, pre-wedding and more) in one tap. You can change the prices later.' : 'Ask the owner to add packages in Sales setup.'}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {canAddTemplates && <Button size="lg" onClick={() => void addReadyMade()} loading={adding}><Library />Add ready-made packages</Button>}
                  <Button size="lg" variant="secondary" onClick={() => set('packageId')(CUSTOM)}>I will type my own price</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                  <div role="group" aria-label="Function" className="flex w-max gap-2">
                    {[{ label: 'all', count: packages.length }, ...chips].map((c) => {
                      const on = f.occasion === c.label;
                      return (
                        <button key={c.label} type="button" aria-pressed={on} onClick={() => set('occasion')(c.label)} className={cn('flex h-12 cursor-pointer items-center gap-2 rounded-full border px-4 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]', on ? 'border-transparent bg-brand text-on-brand' : 'border-line bg-surface text-fg hover:bg-[var(--hover)]')}>
                          {c.label === 'all' ? 'All packages' : <><OccasionIcon occasion={c.label} className="size-4" />{c.label}</>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-fg">Choose a package</legend>
                  <div role="radiogroup" className="grid gap-3" data-field="packageId">
                    {shown.map((p) => <PackageChoice key={p.id} item={p} on={f.packageId === p.id} onPick={() => set('packageId')(p.id)} />)}
                    <label className={cn('flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]', custom ? 'border-brand bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-line bg-surface hover:bg-[var(--hover)]')}>
                      <input type="radio" name="quick-package" checked={custom} onChange={() => set('packageId')(CUSTOM)} className="size-5 shrink-0 accent-[var(--primary)]" />
                      <span><span className="block text-[15px] font-semibold text-fg">Something else</span><span className="block text-[13px] text-fg-muted">Type your own price for this customer.</span></span>
                    </label>
                  </div>
                  {errors.packageId && <p role="alert" className="mt-2 text-sm font-medium text-bad">{errors.packageId}</p>}
                </fieldset>
                {custom && (
                  <div className="grid gap-4 rounded-[var(--radius-lg)] bg-surface-sunken p-4 sm:grid-cols-[1fr_9rem_6rem]">
                    <Field label="What is the price for?" required error={errors.customName}>{(a) => <Input id={a.id} value={f.customName} onChange={(e) => set('customName')(e.target.value)} maxLength={200} placeholder="Birthday shoot, 2 hours" invalid={a.invalid} aria-describedby={a.describedBy} className={big} />}</Field>
                    <Field label="Price" required error={errors.customPrice}>{(a) => <MoneyInput id={a.id} value={f.customPrice} onChange={set('customPrice')} invalid={a.invalid} aria-describedby={a.describedBy} className={big} />}</Field>
                    <Field label="GST %">{(a) => <NumberInput id={a.id} value={f.customTax} onChange={set('customTax')} maxLength={3} className={big} />}</Field>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold text-fg outline-none">A few details <span className="text-sm font-normal text-fg-muted">(you can skip these)</span></h3>
            {examplePrice && <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-fg"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />The price of this package is only an example. You can fix it in Sales setup after making the quote.</p>}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Field label="Date of the function">{(a) => <Input id={a.id} type="date" value={f.eventDate} onChange={(e) => set('eventDate')(e.target.value)} className={big} aria-describedby={a.describedBy} />}</Field>
                <DateAvailabilityHint date={f.eventDate} />
              </div>
              <Field label="How many days?">{(a) => <Select id={a.id} value={f.eventDays} onChange={(e) => set('eventDays')(e.target.value)} className={big}>{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'}</option>)}</Select>}</Field>
              <Field label="Number of guests">{(a) => <NumberInput id={a.id} value={f.guests} onChange={set('guests')} maxLength={6} className={big} />}</Field>
              <Field label="City">{(a) => <Input id={a.id} value={f.city} onChange={(e) => set('city')(e.target.value)} maxLength={80} autoComplete="off" className={big} />}</Field>
            </div>
            {!custom && addons.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-fg">Add extras? <span className="font-normal text-fg-muted">(optional)</span></legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {addons.slice(0, 12).map((a) => {
                    const on = addonIds.includes(a.id);
                    return (
                      <label key={a.id} className={cn('flex min-h-14 cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-3 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]', on ? 'border-brand bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-line bg-surface hover:bg-[var(--hover)]')}>
                        <input type="checkbox" checked={on} onChange={() => setAddonIds((ids) => (ids.includes(a.id) ? ids.filter((x) => x !== a.id) : [...ids, a.id]))} className="size-5 shrink-0 accent-[var(--primary)]" />
                        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-fg">{a.name}</span><span className="block text-[13px] tabular-nums text-fg-muted">{inr(a.unitPrice)} {unitSuffix(a)}</span></span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-2 text-[13px] text-fg-subtle">The customer can switch other extras on later from their quote.</p>
              </fieldset>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PackageChoice({ item, on, onPick }: { item: CatalogItem; on: boolean; onPick: () => void }) {
  return (
    <label className={cn('flex cursor-pointer gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]', on ? 'border-brand bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-line bg-surface hover:bg-[var(--hover)]')}>
      <input type="radio" name="quick-package" checked={on} onChange={onPick} className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-fg">{item.name}{item.isPopular && <Badge tone="accent"><Star className="size-3" aria-hidden="true" />Popular</Badge>}{item.isExample && <Badge tone="warning">Example price</Badge>}</span>
          <span className="text-sm tabular-nums"><strong className="text-fg">{inr(item.unitPrice)}</strong> <span className="text-fg-muted">{unitSuffix(item)}</span></span>
        </span>
        {item.inclusions.length > 0 && <span className="mt-1 block text-[13px] text-fg-muted">{item.inclusions.slice(0, 3).join(' · ')}{item.inclusions.length > 3 ? ` · +${item.inclusions.length - 3} more` : ''}</span>}
      </span>
    </label>
  );
}
