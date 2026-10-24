'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, ExternalLink, Globe } from 'lucide-react';
import { Badge, Button, ErrorState, Field, Input, Skeleton, Textarea, useToast } from '@/components/ui';
import { catalogApi, EVENT_TYPE_LABELS, EVENT_TYPES, salesSetupApi, type AutoQuoteMode, type EnquiryPageSettings, type EventType } from '@/lib/api/sales';
import { errorMessage, fieldErrors } from '../format';
import { copyText, Panel, Toggle, useLoad } from '../ui';

const MODES: Array<{ id: AutoQuoteMode; title: string; body: string; tag?: string }> = [
  { id: 'APPROVAL', title: 'Prepare a draft, I send it', body: 'The quote is ready the moment someone enquires. You check it, adjust if needed, and send it with one click.', tag: 'Recommended' },
  { id: 'AUTO', title: 'Send the quote instantly', body: 'The customer sees their priced quote on screen within seconds, and gets the link by email if they gave one. Best when your prices are fixed.' },
  { id: 'OFF', title: 'Only collect enquiries', body: 'No quote is made automatically. The enquiry lands in Leads and you take it from there.' },
];

type Form = Omit<EnquiryPageSettings, 'slug'>;
const toForm = (p: EnquiryPageSettings): Form => ({ isEnabled: p.isEnabled, headline: p.headline, intro: p.intro, thankYouMessage: p.thankYouMessage, autoQuoteMode: p.autoQuoteMode, showPrices: p.showPrices, askGuestCount: p.askGuestCount, askVenue: p.askVenue, eventTypes: p.eventTypes });
const same = (a: Form, b: Form) => JSON.stringify({ ...a, eventTypes: [...a.eventTypes].sort() }) === JSON.stringify({ ...b, eventTypes: [...b.eventTypes].sort() });

function SharePanel({ slug, live }: { slug: string; live: boolean }) {
  const { toast } = useToast();
  const [url, setUrl] = React.useState(`/enquire/${slug}`);
  const [qr, setQr] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const full = `${window.location.origin}/enquire/${slug}`;
    setUrl(full);
    let cancelled = false;
    // Rendered in the browser: the link never goes to a third-party QR service.
    QRCode.toDataURL(full, { width: 560, margin: 2, color: { dark: '#11160F', light: '#FFFFFF' } }).then((d) => { if (!cancelled) setQr(d); }).catch(() => { if (!cancelled) setQr(''); });
    return () => { cancelled = true; };
  }, [slug]);

  const copy = async () => {
    if (await copyText(url)) { setCopied(true); window.setTimeout(() => setCopied(false), 2000); toast({ tone: 'success', title: 'Link copied' }); }
    else toast({ tone: 'error', title: 'Couldn’t copy automatically', description: 'Select the link and copy it by hand.' });
  };

  return (
    <Panel title="Your booking page" description="Share this link or QR code on Instagram, WhatsApp, your website and printed material." icon={Globe} actions={<Badge tone={live ? 'success' : 'neutral'} dot>{live ? 'Live' : 'Switched off'}</Badge>}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          <Field label="Link customers open">{(a) => <Input id={a.id} readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-[13px]" />}</Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void copy()}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy link'}</Button>
            <Button variant="secondary" asChild><a href={`/enquire/${slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink />Open page</a></Button>
          </div>
          {!live && <p className="text-[13px] text-warn">The page is switched off, so customers who open this link will see “not found”. Switch it on below and save.</p>}
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- a locally generated data URL
            <img src={qr} alt={`QR code that opens ${url}`} width={160} height={160} className="size-40 rounded-[var(--radius-md)] border border-line-soft bg-white p-1" />
          ) : <Skeleton className="size-40" />}
          {qr && <Button variant="ghost" size="sm" asChild><a href={qr} download={`booking-page-qr-${slug}.png`}><Download />Download QR</a></Button>}
        </div>
      </div>
    </Panel>
  );
}

export function BookingPageTab({ onNavigate, onChanged }: { onNavigate: (tab: string) => void; onChanged?: () => void }) {
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad(async () => {
    const [page, packages] = await Promise.all([salesSetupApi.enquiryPage(), catalogApi.list({ kind: 'PACKAGE', active: true })]);
    const shown = packages.filter((p) => p.isPublic);
    return { page, packageCount: shown.length, exampleCount: shown.filter((p) => p.isExample).length };
  }, []);
  const [form, setForm] = React.useState<Form | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { if (data) setForm(toForm(data.page)); }, [data]);

  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-52" /><Skeleton className="h-96" /></div>;
  if ((error && !data) || !data || !form) return <ErrorState title="Couldn’t load your booking page" description={error || 'Try again in a moment.'} action={{ label: 'Try again', onClick: () => void reload() }} />;

  const dirty = !same(form, toForm(data.page));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => { setForm((f) => (f ? { ...f, [key]: value } : f)); setErrors((e) => ({ ...e, [key]: '' })); };
  const toggleType = (t: EventType) => set('eventTypes', form.eventTypes.includes(t) ? form.eventTypes.filter((x) => x !== t) : [...form.eventTypes, t]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.headline.trim().length > 160) { setErrors({ headline: 'Keep the headline under 160 characters.' }); return; }
    setBusy(true);
    try {
      await salesSetupApi.updateEnquiryPage({ ...form, headline: form.headline.trim(), intro: form.intro.trim(), thankYouMessage: form.thankYouMessage.trim() });
      toast({ tone: 'success', title: 'Booking page saved' });
      await reload();
      onChanged?.();
    } catch (e) {
      setErrors(fieldErrors(e));
      toast({ tone: 'error', title: 'Couldn’t save the booking page', description: errorMessage(e, 'Please try again.') });
    } finally { setBusy(false); }
  };

  const noPackages = data.packageCount === 0;
  const showExamples = data.exampleCount > 0 && form.isEnabled;

  return (
    <div className="space-y-6">
      <SharePanel slug={data.page.slug} live={data.page.isEnabled} />
      <form onSubmit={save} noValidate>
        <Panel
          title="What customers see"
          description="The words, the questions and what happens after someone submits."
          actions={<Button type="submit" loading={busy} disabled={!dirty}>{dirty ? 'Save changes' : 'Saved'}</Button>}
        >
          <div className="grid gap-6">
            <Toggle checked={form.isEnabled} onChange={(v) => set('isEnabled', v)} label="Booking page is on" description="When off, the link and QR code stop working and customers see “not found”." />
            <div className="grid gap-5">
              <Field label="Headline" error={errors.headline}>{(a) => <Input id={a.id} value={form.headline} onChange={(e) => set('headline', e.target.value)} maxLength={160} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              <Field label="Introduction" hint="One or two friendly lines under the headline." error={errors.intro}>{(a) => <Textarea id={a.id} rows={3} value={form.intro} onChange={(e) => set('intro', e.target.value)} maxLength={2000} aria-describedby={a.describedBy} />}</Field>
              <Field label="Thank-you message" hint="Shown after a submission when the customer does not get an instant quote." error={errors.thankYouMessage}>{(a) => <Textarea id={a.id} rows={2} value={form.thankYouMessage} onChange={(e) => set('thankYouMessage', e.target.value)} maxLength={1000} aria-describedby={a.describedBy} />}</Field>
            </div>

            {showExamples && (
              <p role="status" className="rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-fg">
                <strong>{data.exampleCount} {data.exampleCount === 1 ? 'package still has' : 'packages still have'} an example price.</strong> Customers would be quoted that price. <button type="button" className="cursor-pointer font-semibold underline" onClick={() => onNavigate('packages')}>Check your prices</button> before you share the page.
              </p>
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-fg">What happens when someone enquires?</legend>
              <div className="grid gap-3 lg:grid-cols-3">
                {MODES.map((m) => {
                  const on = form.autoQuoteMode === m.id;
                  return (
                    <label key={m.id} className={`flex cursor-pointer flex-col gap-1.5 rounded-[var(--radius-lg)] border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)] ${on ? 'border-brand bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]' : 'border-line bg-surface hover:bg-[var(--hover)]'}`}>
                      <span className="flex items-center gap-2">
                        <input type="radio" name="quote-mode" value={m.id} checked={on} onChange={() => set('autoQuoteMode', m.id)} className="size-4 accent-[var(--primary)]" />
                        <span className="text-sm font-semibold text-fg">{m.title}</span>
                        {m.tag && <Badge tone="brand">{m.tag}</Badge>}
                      </span>
                      <span className="pl-6 text-[13px] leading-relaxed text-fg-muted">{m.body}</span>
                    </label>
                  );
                })}
              </div>
              {form.autoQuoteMode !== 'OFF' && noPackages && (
                <p role="status" className="mt-3 rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-warn">
                  You have no packages on your booking page yet, so no quote can be made. <button type="button" className="cursor-pointer font-semibold underline" onClick={() => onNavigate('packages')}>Add a package</button> first.
                </p>
              )}
            </fieldset>

            <div className="grid gap-4 rounded-[var(--radius-lg)] border border-line-soft bg-surface-sunken p-4">
              <Toggle checked={form.showPrices} onChange={(v) => set('showPrices', v)} label="Show prices on the page" description="When off, customers pick a package without seeing its price and get the price on their quote." />
              <Toggle checked={form.askGuestCount} onChange={(v) => set('askGuestCount', v)} label="Ask for the guest count" description="Needed if you price anything per guest, such as albums or catering photography." />
              <Toggle checked={form.askVenue} onChange={(v) => set('askVenue', v)} label="Ask for the venue" description="Venue name and city, so you can plan travel before you call." />
            </div>

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-fg">Events customers can choose</legend>
              <p className="mb-2 text-xs text-fg-subtle">Leave all unselected to offer every type of event.</p>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((t) => {
                  const on = form.eventTypes.includes(t);
                  return (
                    <button key={t} type="button" aria-pressed={on} onClick={() => toggleType(t)} className={`h-8 cursor-pointer rounded-full border px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${on ? 'border-transparent bg-brand text-on-brand' : 'border-line bg-surface text-fg-muted hover:bg-[var(--hover)]'}`}>
                      {EVENT_TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </Panel>
      </form>
    </div>
  );
}
