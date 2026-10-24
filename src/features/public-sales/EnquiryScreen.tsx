'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, CheckCircle2, Sparkles, Star } from 'lucide-react';
import { Badge, Button, Card, CardContent, Checkbox, ErrorState, Field, Input, Select, Skeleton, Textarea, useToast } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ApiError } from '@/lib/api/client';
import { EVENT_TYPE_LABELS, publicSalesApi, type CalendarDay, type EnquiryResult, type EventType, type PublicCatalogItem, type PublicDay, type PublicEnquiryPage } from '@/lib/api/sales';
import { errorMessage, fieldErrors, fmtDateLong, inr, isValidEmail, isValidMobile, normalizeMobile } from '../sales/format';
import { MonthCalendar, monthOf, monthRange, type CalendarCell, type CalendarMonth } from '../sales/MonthCalendar';
import { addDays, documentTotals, quantityFor } from '../sales/pricing';
import { NumberInput } from '../sales/ui';
import { LinkProblem, PublicFooter, PublicShell, StudioHeader } from './PublicShell';
import { useReserveBottomSpace } from './useReserveBottomSpace';

const suffix = (i: PublicCatalogItem) => (i.pricingType === 'PER_DAY' ? 'per day' : i.pricingType === 'PER_PERSON' ? 'per guest' : i.unitLabel ? `per ${i.unitLabel}` : '');

function Step({ n, title, children, hint }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-semibold text-on-brand" aria-hidden="true">{n}</span>
          <div><h2 id={id} className="text-base font-semibold leading-7 tracking-tight text-fg">{title}</h2>{hint && <p className="text-[13px] text-fg-muted">{hint}</p>}</div>
        </div>
        <div role="group" aria-labelledby={id}>{children}</div>
      </CardContent>
    </Card>
  );
}

function PackageCard({ item, checked, onChange, showPrices }: { item: PublicCatalogItem; checked: boolean; onChange: () => void; showPrices: boolean }) {
  const [open, setOpen] = React.useState(false);
  const shown = open ? item.inclusions : item.inclusions.slice(0, 4);
  return (
    <label className={cn('block cursor-pointer rounded-[var(--radius-lg)] border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]', checked ? 'border-brand bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-line bg-surface hover:bg-[var(--hover)]')}>
      <div className="flex items-start gap-3">
        <input type="radio" name="package" value={item.id} checked={checked} onChange={onChange} className="mt-1 size-5 shrink-0 accent-[var(--primary)]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <div className="flex flex-wrap items-center gap-2"><span className="text-[15px] font-semibold text-fg">{item.name}</span>{item.isPopular && <Badge tone="accent"><Star className="size-3" aria-hidden="true" />Most popular</Badge>}</div>
            {showPrices && item.unitPrice !== null && <p className="text-sm tabular-nums"><span className="font-semibold text-fg">{inr(item.unitPrice)}</span> <span className="text-fg-muted">{suffix(item)}</span></p>}
          </div>
          {item.description && <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{item.description}</p>}
          {shown.length > 0 && (
            <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
              {shown.map((line) => <li key={line} className="flex items-start gap-2 text-[13px] text-fg"><Check className="mt-0.5 size-3.5 shrink-0 text-ok" aria-hidden="true" /><span>{line}</span></li>)}
            </ul>
          )}
          {item.inclusions.length > 4 && (
            <button type="button" onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }} className="mt-2 min-h-8 cursor-pointer text-[13px] font-medium text-[var(--brand-text,var(--primary))] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">
              {open ? 'Show less' : `Show all ${item.inclusions.length} inclusions`}
            </button>
          )}
        </div>
      </div>
    </label>
  );
}

interface FormState {
  eventType: EventType | '';
  eventDate: string;
  eventDays: string;
  guestCount: string;
  venueName: string;
  venueCity: string;
  packageId: string; // '' = not chosen yet, 'none' = not sure
  addonIds: string[];
  name: string;
  phone: string;
  email: string;
  notes: string;
  consent: boolean;
  website: string;
}

export function EnquiryScreen({ slug }: { slug: string }) {
  const router = useRouter();
  useReserveBottomSpace();
  const { toast, dismiss } = useToast();
  const problemToast = React.useRef<number | null>(null);
  const clearProblem = React.useCallback(() => { if (problemToast.current !== null) { dismiss(problemToast.current); problemToast.current = null; } }, [dismiss]);
  const [page, setPage] = React.useState<PublicEnquiryPage | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'missing' | 'failed'>('loading');
  const [f, setF] = React.useState<FormState>({ eventType: '', eventDate: '', eventDays: '1', guestCount: '', venueName: '', venueCity: '', packageId: '', addonIds: [], name: '', phone: '', email: '', notes: '', consent: false, website: '' });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<EnquiryResult | null>(null);
  const [month, setMonth] = React.useState<CalendarMonth>({ year: new Date().getFullYear(), month0: new Date().getMonth() });
  const [days, setDays] = React.useState<Record<string, PublicDay>>({});
  const [calendarLoading, setCalendarLoading] = React.useState(false);
  const [calendarError, setCalendarError] = React.useState('');
  const requestId = React.useRef(0);
  const thanksRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    setState('loading');
    try {
      const result = await publicSalesApi.page(slug);
      setPage(result);
      const types = result.page.eventTypes;
      setF((s) => ({ ...s, eventType: s.eventType || (types.includes('WEDDING') ? 'WEDDING' : types[0] ?? '') }));
      setMonth(monthOf(addDays(result.rules.today, result.rules.minLeadDays)));
      setState('ready');
    } catch (error) {
      setState(error instanceof ApiError && error.status === 404 ? 'missing' : 'failed');
    }
  }, [slug]);
  React.useEffect(() => { void load(); }, [load]);

  const loadMonth = React.useCallback(async (m: CalendarMonth) => {
    const id = ++requestId.current;
    setCalendarLoading(true);
    setCalendarError('');
    try {
      const { from, to } = monthRange(m);
      const list = await publicSalesApi.availability(slug, from, to);
      if (id !== requestId.current) return;
      setDays((prev) => ({ ...prev, ...Object.fromEntries(list.map((d) => [d.date, d])) }));
    } catch (error) {
      if (id === requestId.current) setCalendarError(errorMessage(error, 'We couldn’t check which dates are free.'));
    } finally {
      if (id === requestId.current) setCalendarLoading(false);
    }
  }, [slug]);
  React.useEffect(() => { if (state === 'ready') void loadMonth(month); }, [state, month, loadMonth]);

  const cells = React.useMemo(() => {
    const out: Record<string, CalendarCell> = {};
    for (const d of Object.values(days)) out[d.date] = { status: d.status as CalendarDay['status'], bookable: d.bookable };
    return out;
  }, [days]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => { setF((s) => ({ ...s, [key]: value })); setErrors((e) => ({ ...e, [key]: '' })); };

  const estimate = React.useMemo(() => {
    if (!page || !page.page.showPrices) return null;
    const pkg = page.packages.find((p) => p.id === f.packageId);
    if (!pkg || pkg.unitPrice === null) return null;
    const ctx = { eventDays: Number(f.eventDays) || 1, guestCount: f.guestCount ? Number(f.guestCount) : null };
    const lines = [pkg, ...page.addons.filter((a) => f.addonIds.includes(a.id))].filter((i) => i.unitPrice !== null).map((i) => ({ quantity: quantityFor(i, ctx), unitPrice: i.unitPrice as number, taxRate: i.taxRate ?? 0 }));
    return documentTotals(lines);
  }, [page, f.packageId, f.addonIds, f.eventDays, f.guestCount]);

  if (state === 'loading') {
    return (
      <PublicShell>
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6" aria-busy="true">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Plan your day</h1>
          <Skeleton className="h-64" /><Skeleton className="h-48" />
        </main>
      </PublicShell>
    );
  }
  if (state === 'missing') return <LinkProblem title="This booking page isn’t available" body="The link may be mistyped, or the studio has switched its booking page off. Please contact the studio directly." />;
  if (state === 'failed' || !page) {
    return <PublicShell><main className="mx-auto max-w-3xl px-4 py-16"><ErrorState title="We couldn’t load this page" description="Please check your connection and try again." action={{ label: 'Try again', onClick: () => void load() }} /></main></PublicShell>;
  }

  const { studio, rules } = page;
  const askVenue = page.page.askVenue;
  const mode = page.page.quoteMode;
  const lastMonth = monthOf(addDays(rules.today, rules.maxAdvanceDays));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!f.eventType) e.eventType = 'Choose the kind of event.';
    if (!f.eventDate) e.eventDate = 'Pick your date from the calendar.';
    const days = Number(f.eventDays);
    if (!days || days < 1 || days > 14) e.eventDays = 'Choose between 1 and 14 days.';
    if (page.page.askGuestCount && f.guestCount && Number(f.guestCount) < 1) e.guestCount = 'Enter a number of guests.';
    if (page.packages.length > 0 && !f.packageId) e.packageId = 'Choose a package, or “Not sure yet”.';
    if (f.name.trim().length < 2) e.name = 'Enter your name.';
    if (!isValidMobile(f.phone)) e.phone = 'Enter a valid 10-digit mobile number.';
    if (f.email && !isValidEmail(f.email)) e.email = 'Enter a valid email, or leave it empty.';
    if (!f.consent) e.consent = 'Please agree to be contacted so we can reply to you.';
    return e;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearProblem();
    const found = validate();
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      problemToast.current = toast({ tone: 'error', title: 'A few details need attention', description: Object.values(found)[0] });
      window.requestAnimationFrame(() => (document.querySelector(`[data-field="${first}"]`) as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    setBusy(true);
    try {
      const result = await publicSalesApi.submit(slug, {
        name: f.name.trim(), phone: normalizeMobile(f.phone), email: f.email.trim() || null, eventType: f.eventType as EventType, eventDate: f.eventDate,
        eventDays: Number(f.eventDays), guestCount: f.guestCount ? Number(f.guestCount) : null,
        venueName: f.venueName.trim() || null, venueCity: f.venueCity.trim() || null,
        packageId: f.packageId && f.packageId !== 'none' ? f.packageId : null, addonIds: f.packageId && f.packageId !== 'none' ? f.addonIds : [],
        notes: f.notes.trim() || null, consent: true, website: f.website,
      });
      clearProblem();
      if (result.quoteToken) { setDone(result); router.push(`/quote/${result.quoteToken}`); return; }
      setDone(result);
      window.setTimeout(() => thanksRef.current?.focus(), 100);
    } catch (error) {
      const server = fieldErrors(error);
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ eventDate: error.message || 'That date is no longer available. Please choose another.' });
        set('eventDate', '');
        setDays({});
        void loadMonth(month);
      } else if (Object.keys(server).length) setErrors(server);
      problemToast.current = toast({ tone: 'error', title: 'We couldn’t send your enquiry', description: errorMessage(error, 'Please try again in a moment.') });
    } finally { setBusy(false); }
  };

  if (done) {
    const instant = Boolean(done.quoteToken);
    return (
      <PublicShell brandColor={studio.brandColor}>
        <StudioHeader studio={studio} />
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div ref={thanksRef} tabIndex={-1} role="status" className="rounded-[var(--radius-xl)] border border-line-soft bg-surface p-8 text-center outline-none">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok-bg text-ok" aria-hidden="true"><CheckCircle2 className="size-7" /></span>
            <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">{instant ? 'Your quote is ready' : 'Thank you!'}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fg-muted">{instant ? 'Taking you to your quotation…' : done.message}</p>
            {!instant && f.eventDate && <p className="mt-4 text-sm text-fg">We have noted <strong>{fmtDateLong(f.eventDate)}</strong> and will contact you on <strong>{normalizeMobile(f.phone)}</strong>{f.email ? ` or ${f.email}` : ''}.</p>}
          </div>
        </main>
        <PublicFooter />
      </PublicShell>
    );
  }

  const heroCta = mode === 'AUTO' ? 'Get my quote now' : 'Send enquiry';

  return (
    <PublicShell brandColor={studio.brandColor}>
      <StudioHeader studio={studio} />
      <main className="mx-auto w-full max-w-3xl px-4 pb-36 pt-8 sm:px-6 sm:pb-12">
        <section className="mb-6">
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-fg sm:text-4xl">{page.page.headline}</h1>
          {page.page.intro && <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">{page.page.intro}</p>}
          {mode === 'AUTO' && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-3 py-1.5 text-[13px] font-medium text-fg"><Sparkles className="size-4 text-brand" aria-hidden="true" />Fill this in and your quotation appears in seconds.</p>}
        </section>

        <form id="enquiry-form" onSubmit={submit} noValidate className="space-y-5">
          <Step n={1} title="Your event">
            <div className="grid gap-5">
              <div data-field="eventType"><Field label="What are we celebrating?" required error={errors.eventType}>{(a) => (
                <Select id={a.id} value={f.eventType} onChange={(e) => set('eventType', e.target.value as EventType)} invalid={a.invalid} aria-describedby={a.describedBy} className="h-12 text-base">
                  {page.page.eventTypes.map((t) => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
                </Select>
              )}</Field></div>

              <div data-field="eventDate">
                <p id="date-label" className="mb-1.5 text-[13px] font-medium text-fg">Event date <span className="text-bad" aria-hidden="true">*</span></p>
                <div className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-3 sm:p-4" aria-labelledby="date-label">
                  <MonthCalendar
                    month={month} onMonthChange={setMonth} cells={cells} today={rules.today} selected={f.eventDate || null}
                    onSelect={(d) => set('eventDate', d)} requireData loading={calendarLoading} minMonth={monthOf(rules.today)} maxMonth={lastMonth} label="Choose your event date"
                  />
                  {calendarError && <p role="alert" className="mt-3 text-[13px] text-bad">{calendarError} <button type="button" className="cursor-pointer font-semibold underline" onClick={() => void loadMonth(month)}>Try again</button></p>}
                </div>
                <p aria-live="polite" className={cn('mt-2 text-sm', errors.eventDate ? 'font-medium text-bad' : f.eventDate ? 'font-medium text-ok' : 'text-fg-subtle')} role={errors.eventDate ? 'alert' : undefined}>
                  {errors.eventDate || (f.eventDate ? `${fmtDateLong(f.eventDate)} is available` : rules.minLeadDays > 0 ? `Dates need at least ${rules.minLeadDays} days’ notice.` : 'Pick a date that works for you.')}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="How many days?" error={errors.eventDays} hint="A 2-day wedding with a haldi and a ceremony is 2.">{(a) => (
                  <Select id={a.id} value={f.eventDays} onChange={(e) => set('eventDays', e.target.value)} invalid={a.invalid} aria-describedby={a.describedBy} className="h-12 text-base">
                    {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'day' : 'days'}</option>)}
                  </Select>
                )}</Field>
                {page.page.askGuestCount && <Field label="About how many guests?" error={errors.guestCount}>{(a) => <NumberInput id={a.id} value={f.guestCount} onChange={(v) => set('guestCount', v)} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={6} className="h-12 text-base" />}</Field>}
              </div>
              {askVenue && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Venue name" error={errors.venueName}>{(a) => <Input id={a.id} value={f.venueName} onChange={(e) => set('venueName', e.target.value)} maxLength={200} autoComplete="off" className="h-12 text-base" invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
                <Field label="City" error={errors.venueCity}>{(a) => <Input id={a.id} value={f.venueCity} onChange={(e) => set('venueCity', e.target.value)} maxLength={80} autoComplete="address-level2" className="h-12 text-base" invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              </div>
              )}
            </div>
          </Step>

          {page.packages.length > 0 && (
            <Step n={2} title="Choose a package" hint="You can fine-tune everything on your quote.">
              <div data-field="packageId" className="space-y-3">
                <div role="radiogroup" aria-label="Packages" className="space-y-3">
                  {page.packages.filter((p) => p.eventTypes.length === 0 || !f.eventType || p.eventTypes.includes(f.eventType as EventType)).map((p) => (
                    <PackageCard key={p.id} item={p} checked={f.packageId === p.id} onChange={() => set('packageId', p.id)} showPrices={page.page.showPrices} />
                  ))}
                  <label className={cn('flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-4 text-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]', f.packageId === 'none' ? 'border-brand bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-line bg-surface hover:bg-[var(--hover)]')}>
                    <input type="radio" name="package" value="none" checked={f.packageId === 'none'} onChange={() => set('packageId', 'none')} className="size-5 shrink-0 accent-[var(--primary)]" />
                    <span><span className="font-semibold text-fg">Not sure yet</span><span className="block text-[13px] text-fg-muted">We will call you and suggest what suits you.</span></span>
                  </label>
                </div>
                {errors.packageId && <p role="alert" className="text-sm font-medium text-bad">{errors.packageId}</p>}
              </div>
            </Step>
          )}

          {page.addons.length > 0 && f.packageId && f.packageId !== 'none' && (
            <Step n={3} title="Add extras" hint="Optional. You can change these on your quote too.">
              <ul className="space-y-2">
                {page.addons.filter((a) => a.eventTypes.length === 0 || !f.eventType || a.eventTypes.includes(f.eventType as EventType)).map((a) => {
                  const on = f.addonIds.includes(a.id);
                  return (
                    <li key={a.id}>
                      <label className={cn('flex cursor-pointer items-start gap-3 rounded-[var(--radius-lg)] border p-3.5 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]', on ? 'border-brand bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-line bg-surface hover:bg-[var(--hover)]')}>
                        <input type="checkbox" checked={on} onChange={() => set('addonIds', on ? f.addonIds.filter((x) => x !== a.id) : [...f.addonIds, a.id])} className="mt-0.5 size-5 shrink-0 accent-[var(--primary)]" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-baseline justify-between gap-x-3"><span className="text-sm font-semibold text-fg">{a.name}</span>{page.page.showPrices && a.unitPrice !== null && <span className="text-sm tabular-nums text-fg-muted">{inr(a.unitPrice)} {suffix(a)}</span>}</span>
                          {a.description && <span className="mt-0.5 block text-[13px] leading-relaxed text-fg-muted">{a.description}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Step>
          )}

          <Step n={page.packages.length > 0 ? (page.addons.length > 0 && f.packageId && f.packageId !== 'none' ? 4 : 3) : 2} title="Your details" hint="So we know who to send your quote to.">
            <div className="grid gap-5 sm:grid-cols-2">
              <div data-field="name" className="sm:col-span-2"><Field label="Your name" required error={errors.name}>{(a) => <Input id={a.id} value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" maxLength={160} invalid={a.invalid} aria-describedby={a.describedBy} className="h-12 text-base" />}</Field></div>
              <div data-field="phone"><Field label="Mobile number" required error={errors.phone} hint="We may call or WhatsApp you.">{(a) => <Input id={a.id} type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} maxLength={24} invalid={a.invalid} aria-describedby={a.describedBy} className="h-12 text-base" />}</Field></div>
              <div data-field="email"><Field label="Email (optional)" error={errors.email} hint={mode === 'AUTO' ? 'We will email you a copy of your quote.' : undefined}>{(a) => <Input id={a.id} type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} maxLength={160} invalid={a.invalid} aria-describedby={a.describedBy} className="h-12 text-base" />}</Field></div>
              <div className="sm:col-span-2"><Field label="Anything else we should know? (optional)">{(a) => <Textarea id={a.id} rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} maxLength={1000} aria-describedby={a.describedBy} className="text-base" />}</Field></div>
              {/* A trap for bots: people never see it, so only automated form fillers ever put something here. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Website<input tabIndex={-1} autoComplete="off" name="website" value={f.website} onChange={(e) => set('website', e.target.value)} /></label></div>
              <div data-field="consent" className="sm:col-span-2">
                <Checkbox label={`I agree that ${studio.name} may contact me about this enquiry.`} checked={f.consent} onChange={(e) => set('consent', e.target.checked)} aria-invalid={errors.consent ? true : undefined} />
                {errors.consent && <p role="alert" className="mt-1.5 text-xs font-medium text-bad">{errors.consent}</p>}
              </div>
            </div>
          </Step>
        </form>

      <div className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-line-soft bg-surface/95 px-4 py-3 shadow-[var(--elev-3)] backdrop-blur sm:static sm:z-auto sm:mt-6 sm:rounded-[var(--radius-lg)] sm:border sm:bg-surface sm:p-4 sm:shadow-[var(--elev-1)] sm:backdrop-blur-none">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <div className="min-w-0" aria-live="polite">
            {estimate ? (<><p className="text-xs text-fg-subtle">Estimated total</p><p className="font-display text-xl font-semibold tabular-nums text-fg">{inr(estimate.total)}</p><p className="hidden text-[11px] text-fg-subtle sm:block">Includes GST. Your quote has the exact figure.</p></>) : <p className="text-[13px] text-fg-muted">{mode === 'AUTO' ? 'Your quote appears right after you submit.' : 'We reply within a day.'}</p>}
          </div>
          <Button type="submit" form="enquiry-form" size="lg" loading={busy} className="shrink-0">{heroCta}</Button>
        </div>
      </div>
      </main>
      <PublicFooter />

    </PublicShell>
  );
}
