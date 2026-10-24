'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Download, MessageCircle, Phone, XCircle } from 'lucide-react';
import { Button, Checkbox, Dialog, DialogContent, ErrorState, Field, Input, Skeleton, Textarea, useToast } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { publicSalesApi, type PublicQuote } from '@/lib/api/sales';
import { errorMessage, fieldErrors, fmtDate, inr } from '../sales/format';
import { initialSelection, QuoteBody, type Selection } from './QuoteBody';
import { PaymentPanel } from './PaymentPanel';
import { LinkProblem, PublicFooter, PublicShell, StudioHeader, telHref } from './PublicShell';
import { useReserveBottomSpace } from './useReserveBottomSpace';

type Studio = PublicQuote['studio'];

const waLink = (phone: string | null, text: string) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
};

function Banner({ tone, icon: Icon, title, children, bannerRef }: { tone: 'ok' | 'warn' | 'bad' | 'neutral'; icon: React.ComponentType<{ className?: string }>; title: string; children?: React.ReactNode; bannerRef?: React.Ref<HTMLDivElement> }) {
  const style = { ok: 'bg-ok-bg text-ok', warn: 'bg-warn-bg text-warn', bad: 'bg-bad-bg text-bad', neutral: 'bg-surface-sunken text-fg-muted' }[tone];
  return (
    <div ref={bannerRef} tabIndex={-1} role="status" className={`flex items-start gap-3 rounded-[var(--radius-lg)] p-4 outline-none ${style}`}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0"><p className="text-sm font-semibold">{title}</p>{children && <div className="mt-1 text-sm leading-relaxed text-fg">{children}</div>}</div>
    </div>
  );
}

function ContactStudio({ studio, quoteNumber }: { studio: Studio; quoteNumber: string }) {
  const wa = waLink(studio.phone, `Hi ${studio.name}, I have a question about quotation ${quoteNumber}.`);
  if (!studio.phone && !studio.email) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {studio.phone && <Button variant="secondary" asChild><a href={telHref(studio.phone)}><Phone />Call {studio.name}</a></Button>}
      {wa && <Button variant="secondary" asChild><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle />WhatsApp</a></Button>}
    </div>
  );
}

function AcceptDialog({ data, token, selection, onClose, onAccepted, onProblem }: { data: PublicQuote; token: string; selection: Selection; onClose: () => void; onAccepted: (result: Awaited<ReturnType<typeof publicSalesApi.accept>>) => void; onProblem: () => void }) {
  const { toast } = useToast();
  const [name, setName] = React.useState('');
  const [agree, setAgree] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const advance = data.quote.paymentPlan[0];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Type your full name to accept.';
    if (!agree) e.agree = 'Please confirm that you agree to the quotation and its terms.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const result = await publicSalesApi.accept(token, {
        name: name.trim(), agree: true,
        selection: Object.entries(selection).map(([itemId, s]) => ({ itemId, selected: s.selected, quantity: s.quantity })),
      });
      onAccepted(result);
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      if (status === 409 || status === 400) onProblem();
      setErrors(fieldErrors(error));
      toast({ tone: 'error', title: 'We couldn’t confirm your booking', description: errorMessage(error, 'Please try again.') });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent
        title="Accept this quotation"
        description="Typing your name and ticking the box confirms your booking."
        footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Not yet</Button><Button type="submit" form="accept-form" size="lg" loading={busy}>Confirm booking</Button></>}
      >
        <form id="accept-form" onSubmit={submit} noValidate className="space-y-5">
          <div className="rounded-[var(--radius-lg)] bg-surface-sunken p-4 text-sm">
            <div className="flex justify-between gap-4"><span className="text-fg-muted">Quotation total</span><span className="font-semibold tabular-nums">{inr(data.quote.totals.total)}</span></div>
            {advance && <div className="mt-1.5 flex justify-between gap-4"><span className="text-fg-muted">Advance to pay now</span><span className="font-semibold tabular-nums">{inr(advance.amount)}</span></div>}
          </div>
          <Field label="Your full name" required error={errors.name}>{(a) => <Input id={a.id} value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: '' })); }} autoComplete="name" invalid={a.invalid} aria-describedby={a.describedBy} placeholder={data.quote.customerName ?? ''} maxLength={160} autoFocus className="h-12 text-base" />}</Field>
          <div>
            <Checkbox label="I agree to this quotation and its terms and conditions." checked={agree} onChange={(e) => { setAgree(e.target.checked); setErrors((x) => ({ ...x, agree: '' })); }} aria-invalid={errors.agree ? true : undefined} />
            {errors.agree && <p role="alert" className="mt-1.5 text-xs font-medium text-bad">{errors.agree}</p>}
          </div>
          <p className="text-xs leading-relaxed text-fg-subtle">Your name, the time and your device details are recorded with this acceptance.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeclineDialog({ token, onClose, onDone }: { token: string; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try { await publicSalesApi.decline(token, reason); onDone(); }
    catch (error) { toast({ tone: 'error', title: 'Couldn’t send that', description: errorMessage(error, 'Please try again.') }); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent title="Decline this quotation?" description="The studio is told, and you will not be asked to pay anything."
        footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Keep it</Button><Button type="submit" form="decline-form" variant="danger" loading={busy}>Decline</Button></>}>
        <form id="decline-form" onSubmit={submit} className="space-y-4">
          <Field label="Anything you would like to tell the studio? (optional)" hint="For example, the price, the date, or what you were hoping for.">{(a) => <Textarea id={a.id} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} aria-describedby={a.describedBy} />}</Field>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AskDialog({ data, token, onClose }: { data: PublicQuote; token: string; onClose: () => void }) {
  const { toast } = useToast();
  const [message, setMessage] = React.useState('');
  const [name, setName] = React.useState(data.quote.customerName ?? '');
  const [phone, setPhone] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim().length < 3) { setErrors({ message: 'Write your question (at least a few words).' }); return; }
    setBusy(true);
    try {
      await publicSalesApi.message(token, { message: message.trim(), name: name.trim() || null, phone: phone.trim() || null });
      toast({ tone: 'success', title: 'Message sent', description: `${data.studio.name} will get back to you soon.` });
      onClose();
    } catch (error) {
      setErrors(fieldErrors(error));
      toast({ tone: 'error', title: 'Couldn’t send your message', description: errorMessage(error, 'Please try again.') });
    } finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent title="Ask the studio a question" description="They see it straight away, together with this quotation."
        footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" form="ask-form" loading={busy}>Send message</Button></>}>
        <form id="ask-form" onSubmit={submit} noValidate className="space-y-4">
          <Field label="Your question" required error={errors.message}>{(a) => <Textarea id={a.id} rows={4} value={message} onChange={(e) => { setMessage(e.target.value); setErrors((x) => ({ ...x, message: '' })); }} maxLength={1000} invalid={a.invalid} aria-describedby={a.describedBy} autoFocus />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name">{(a) => <Input id={a.id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={160} />}</Field>
            <Field label="Phone (so they can call)">{(a) => <Input id={a.id} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={32} />}</Field>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function QuoteScreen({ token }: { token: string }) {
  useReserveBottomSpace();
  const { toast } = useToast();
  const [data, setData] = React.useState<PublicQuote | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'missing' | 'failed'>('loading');
  const [selection, setSelection] = React.useState<Selection>({});
  const [pending, setPending] = React.useState(false);
  const [dialog, setDialog] = React.useState<'accept' | 'decline' | 'ask' | null>(null);
  const [declined, setDeclined] = React.useState(false);
  const bannerRef = React.useRef<HTMLDivElement>(null);
  const latest = React.useRef(0);

  const load = React.useCallback(async () => {
    setState('loading');
    try {
      const result = await publicSalesApi.quote(token);
      setData(result);
      setSelection(initialSelection(result.quote.items));
      setState('ready');
    } catch (error) {
      setState(error instanceof ApiError && error.status === 404 ? 'missing' : 'failed');
    }
  }, [token]);

  React.useEffect(() => { void load(); }, [load]);

  // The server owns the price: every change is sent, and only the newest answer is applied.
  const reprice = React.useCallback(async (next: Selection, previous: Selection) => {
    const id = ++latest.current;
    setPending(true);
    try {
      const priced = await publicSalesApi.price(token, Object.entries(next).map(([itemId, s]) => ({ itemId, selected: s.selected, quantity: s.quantity })));
      if (id !== latest.current) return;
      setData(priced);
      setSelection(initialSelection(priced.quote.items));
    } catch (error) {
      if (id !== latest.current) return;
      setSelection(previous);
      toast({ tone: 'error', title: 'Couldn’t update the price', description: errorMessage(error, 'Please try again.') });
    } finally {
      if (id === latest.current) setPending(false);
    }
  }, [token, toast]);

  const change = (id: string, patch: Partial<Selection[string]>) => {
    const previous = selection;
    const next = { ...selection, [id]: { ...selection[id], ...patch } };
    setSelection(next);
    void reprice(next, previous);
  };

  if (state === 'loading') {
    return (
      <PublicShell>
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6" aria-busy="true">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Your quotation</h1>
          <Skeleton className="h-40" /><Skeleton className="h-56" /><Skeleton className="h-32" />
        </main>
      </PublicShell>
    );
  }
  if (state === 'missing') return <LinkProblem title="This link isn’t working" body="The quotation could not be found. Please check that you opened the full link, or ask the studio to send it again." />;
  if (state === 'failed' || !data) {
    return (
      <PublicShell>
        <main className="mx-auto max-w-3xl px-4 py-16"><ErrorState title="We couldn’t load your quotation" description="Please check your connection and try again." action={{ label: 'Try again', onClick: () => void load() }} /></main>
      </PublicShell>
    );
  }

  const { quote, studio } = data;
  const status = declined ? 'REJECTED' : quote.status;
  const canAct = data.canAct && !declined;
  const dateGone = quote.status === 'SENT' && data.dateStatus && !data.dateStatus.sellable;

  return (
    <PublicShell brandColor={studio.brandColor}>
      <StudioHeader studio={studio} />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-32 pt-8 sm:px-6 sm:pb-10">
        {status === 'ACCEPTED' && (
          <Banner tone="ok" icon={CheckCircle2} title="You’re booked" bannerRef={bannerRef}>
            {quote.acceptedByName ? `Accepted by ${quote.acceptedByName}` : 'Accepted'}{quote.acceptedAt ? ` on ${new Date(quote.acceptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}. {studio.name} has reserved your date{quote.eventDate ? ` (${fmtDate(quote.eventDate)})` : ''}. Pay the advance below to confirm it.
          </Banner>
        )}
        {status === 'REJECTED' && <Banner tone="neutral" icon={XCircle} title="This quotation was declined">If you change your mind, ask {studio.name} to send a fresh one.<ContactStudio studio={studio} quoteNumber={quote.number} /></Banner>}
        {status === 'EXPIRED' && <Banner tone="warn" icon={Clock} title="This quotation has expired">{quote.validUntil ? `It was valid until ${fmtDate(quote.validUntil)}. ` : ''}Prices and dates may have changed. Ask {studio.name} for a fresh quote.<ContactStudio studio={studio} quoteNumber={quote.number} /></Banner>}
        {status === 'CANCELLED' && <Banner tone="neutral" icon={XCircle} title="This quotation is no longer valid">{studio.name} has withdrawn it. Please contact them for an updated one.<ContactStudio studio={studio} quoteNumber={quote.number} /></Banner>}
        {dateGone && <Banner tone="warn" icon={AlertTriangle} title="That date is no longer available">{quote.eventDate ? `${fmtDate(quote.eventDate)} has just been booked by someone else.` : 'The date has just been booked by someone else.'} Message {studio.name} and they will help you find another date.<ContactStudio studio={studio} quoteNumber={quote.number} /></Banner>}

        <QuoteBody
          data={data}
          selection={canAct ? selection : undefined}
          onSelect={(id, selected) => change(id, { selected })}
          onQuantity={(id, quantity) => change(id, { quantity })}
          pending={pending}
        />

        {status === 'ACCEPTED' && data.payment && <PaymentPanel payment={data.payment} studioName={studio.name} />}

        <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-6">
          {canAct && <Button size="lg" onClick={() => setDialog('accept')} disabled={pending} className="hidden sm:inline-flex">Accept quotation</Button>}
          {status !== 'CANCELLED' && <Button variant="secondary" size="lg" onClick={() => setDialog('ask')}><MessageCircle />Ask a question</Button>}
          <Button variant="ghost" size="lg" asChild><a href={publicSalesApi.pdfUrl(token)} target="_blank" rel="noopener noreferrer"><Download />Download PDF</a></Button>
          {canAct && <Button variant="ghost" size="lg" onClick={() => setDialog('decline')} className="text-fg-muted sm:ml-auto">Decline</Button>}
        </div>
        {studio.address && <p className="text-xs text-fg-subtle">{studio.name} · {studio.address}{studio.gstNumber ? ` · GSTIN ${studio.gstNumber}` : ''}</p>}
      </main>
      <PublicFooter />

      {canAct && (
        <div className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-line-soft bg-surface/95 px-4 py-3 shadow-[var(--elev-3)] backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div><p className="text-xs text-fg-subtle">Total</p><p className="font-display text-xl font-semibold tabular-nums">{inr(quote.totals.total)}</p></div>
            <Button size="lg" onClick={() => setDialog('accept')} disabled={pending}>Accept quotation</Button>
          </div>
        </div>
      )}

      {dialog === 'accept' && (
        <AcceptDialog
          data={data} token={token} selection={selection}
          onClose={() => setDialog(null)}
          onProblem={() => { setDialog(null); void load(); }}
          onAccepted={(result) => {
            setDialog(null);
            setData({ ...data, quote: result.quote, payment: result.payment, studio: result.studio ?? data.studio, canAct: false, dateStatus: null });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.setTimeout(() => bannerRef.current?.focus(), 350);
          }}
        />
      )}
      {dialog === 'decline' && <DeclineDialog token={token} onClose={() => setDialog(null)} onDone={() => { setDialog(null); setDeclined(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      {dialog === 'ask' && <AskDialog data={data} token={token} onClose={() => setDialog(null)} />}
    </PublicShell>
  );
}
