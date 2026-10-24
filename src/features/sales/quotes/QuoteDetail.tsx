'use client';

import * as React from 'react';
import { AlertTriangle, Ban, CalendarCheck2, Check, Copy, Download, Eye, FileCheck2, FolderOpen, MoreHorizontal, Pencil, Receipt, Send, Sparkles } from 'lucide-react';
import { Badge, Button, Dialog, DialogContent, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, ErrorState, Skeleton, useToast } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { EVENT_TYPE_LABELS, invoicesApi, num, quotesApi, salesSetupApi, type DateCheck, type InvoiceRow, type QuoteEvent } from '@/lib/api/sales';
import { errorMessage, fmtDate, fmtDateLong, fmtDateTime, inr, inrFixed, localToday, quoteStatusMeta, timeAgo } from '../format';
import { lineAmounts, paymentPlan } from '../pricing';
import { ConfirmDialog, copyText, openBlob, useLoad } from '../ui';
import { PreviewDialog } from './PreviewDialog';
import { QuoteBuilder } from './QuoteBuilder';
import { SendDialog } from './SendDialog';

function describe(e: QuoteEvent): string {
  const m = (e.meta ?? {}) as Record<string, unknown>;
  const money = typeof m.total === 'number' ? ` (${inr(m.total)})` : '';
  switch (e.type) {
    case 'CREATED': return m.auto ? 'Prepared automatically from a customer’s enquiry' : `Quote created${money}`;
    case 'APPROVED': return 'Reviewed and approved';
    case 'SENT': return m.channel === 'AUTO' ? 'Sent to the customer instantly' : `Sent by ${String(m.channel ?? 'link').toLowerCase()}`;
    case 'VIEWED': return m.first ? 'Opened by the customer for the first time' : 'Opened again by the customer';
    case 'REVISED': return `Edited after sending${money}`;
    case 'ACCEPTED': return `Accepted by ${String(m.name ?? 'the customer')}${money}`;
    case 'DECLINED': return m.reason ? `Declined: “${String(m.reason)}”` : 'Declined by the customer';
    case 'MESSAGE_RECEIVED': return `Question from the customer: “${String(m.message ?? '')}”`;
    case 'REMINDER_SENT': return 'Reminder sent to the customer';
    case 'EXPIRED': return 'Expired';
    case 'BOOKED': return `Booked as project ${String(m.projectNumber ?? '')}`;
    default: return e.type;
  }
}

const isDateTaken = (error: unknown) =>
  error instanceof ApiError && error.status === 409 && Array.isArray(error.details) && error.details.some((d) => (d as { message?: string }).message === 'DATE_UNAVAILABLE');

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-xs text-fg-subtle">{label}</dt><dd className="mt-0.5 text-sm font-medium text-fg">{children || '—'}</dd></div>;
}

const INVOICE_TONE = { DRAFT: 'neutral', SENT: 'brand', PARTIALLY_PAID: 'info', PAID: 'success', OVERDUE: 'danger', CANCELLED: 'neutral' } as const;
const INVOICE_LABEL = { DRAFT: 'Draft', SENT: 'Issued', PARTIALLY_PAID: 'Part paid', PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled' } as const;

/** The invoice a booking creates: a draft until the studio marks it issued. Download works at any stage. */
function InvoicePanel({ projectId, canUpdate }: { projectId: string; canUpdate: boolean }) {
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad(() => invoicesApi.forProject(projectId), [projectId]);
  const [issuing, setIssuing] = React.useState<InvoiceRow | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const download = async (inv: InvoiceRow) => {
    setBusy(inv.id);
    try { const { blob, filename } = await invoicesApi.pdf(inv.id); openBlob(blob, filename ?? `${inv.invoiceNumber}.pdf`); }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t create the PDF', description: errorMessage(e, 'Please try again.') }); }
    finally { setBusy(null); }
  };
  const issue = async () => {
    if (!issuing) return;
    setBusy(issuing.id);
    try { await invoicesApi.markIssued(issuing.id); toast({ tone: 'success', title: `${issuing.invoiceNumber} marked as issued` }); setIssuing(null); await reload(); }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t update the invoice', description: errorMessage(e, 'Please try again.') }); }
    finally { setBusy(null); }
  };

  if (loading && !data) return <Skeleton className="h-16" />;
  if (error && !data) return <p className="text-sm text-fg-muted">The invoice could not be loaded. {error}</p>;
  const rows = data ?? [];
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="qd-invoices">
      <h3 id="qd-invoices" className="mb-2 flex items-center gap-2 text-sm font-semibold text-fg"><Receipt className="size-4 text-brand" aria-hidden="true" />Invoice</h3>
      <ul className="divide-y divide-line-soft rounded-[var(--radius-lg)] border border-line-soft">
        {rows.map((inv) => (
          <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">{inv.invoiceNumber}<Badge tone={INVOICE_TONE[inv.status]} dot>{INVOICE_LABEL[inv.status]}</Badge></p>
              <p className="text-[13px] text-fg-muted">{inrFixed(num(inv.total))}{inv.dueDate ? ` · due ${fmtDate(inv.dueDate.slice(0, 10))}` : ''}{num(inv.amountPaid) > 0 ? ` · ${inrFixed(num(inv.amountPaid))} paid` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {canUpdate && inv.status === 'DRAFT' && <Button size="sm" onClick={() => setIssuing(inv)}><FileCheck2 />Mark as issued</Button>}
              <Button size="sm" variant="secondary" onClick={() => void download(inv)} loading={busy === inv.id && !issuing}><Download />PDF</Button>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={Boolean(issuing)} title={`Mark ${issuing?.invoiceNumber ?? 'invoice'} as issued?`} confirmLabel="Mark as issued" busy={busy !== null}
        description="This changes its status from draft to issued, so it counts as money you are owed. It does not send anything to the customer; download the PDF to share it."
        onConfirm={() => void issue()} onClose={() => setIssuing(null)}
      />
    </section>
  );
}

export function QuoteDetail({ id, permissions, onClose, onChanged, onOpenProject }: { id: string; permissions: string[]; onClose: () => void; onChanged: () => void; onOpenProject?: (projectId: string) => void }) {
  const { toast } = useToast();
  const quoteLoad = useLoad(() => quotesApi.get(id), [id]);
  const eventsLoad = useLoad(() => quotesApi.events(id), [id]);
  const settings = useLoad(() => salesSetupApi.settings(), []);
  const [check, setCheck] = React.useState<DateCheck | null>(null);
  const [mode, setMode] = React.useState<null | 'edit' | 'send' | 'preview' | 'book' | 'override' | 'cancel'>(null);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const q = quoteLoad.data;
  const can = (key: string) => permissions.includes(key);
  const canUpdate = can('QUOTATION_UPDATE');
  const canBook = canUpdate && can('PROJECT_CREATE');
  const canOverride = can('BOOKING_SETUP_MANAGE');
  const canInvoices = can('INVOICE_VIEW');

  const eventDate = q?.eventDate ? q.eventDate.slice(0, 10) : null;
  React.useEffect(() => {
    if (!eventDate) { setCheck(null); return; }
    let cancelled = false;
    salesSetupApi.checkDate(eventDate).then((c) => { if (!cancelled) setCheck(c); }).catch(() => { if (!cancelled) setCheck(null); });
    return () => { cancelled = true; };
  }, [eventDate]);

  const refresh = React.useCallback(() => { void quoteLoad.reload(); void eventsLoad.reload(); onChanged(); }, [quoteLoad, eventsLoad, onChanged]);

  if (quoteLoad.loading && !q) {
    return <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}><DialogContent size="lg" title="Quote" description="Loading…"><div className="space-y-4"><Skeleton className="h-24" /><Skeleton className="h-48" /></div></DialogContent></Dialog>;
  }
  if (!q) {
    return <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}><DialogContent size="lg" title="Quote"><ErrorState title="Couldn’t open this quote" description={quoteLoad.error} action={{ label: 'Try again', onClick: () => void quoteLoad.reload() }} /></DialogContent></Dialog>;
  }

  const status = quoteStatusMeta(q.effectiveStatus, q.viewState, q.needsReview);
  const openable = q.status === 'DRAFT' || q.status === 'SENT';
  const resendable = openable || q.status === 'REJECTED' || q.status === 'EXPIRED';
  const total = num(q.grandTotal);
  const selected = q.items.filter((i) => i.isSelected);
  const warning = check && !check.sellable && openable && eventDate ? `${fmtDate(eventDate)}: ${check.reason}` : null;
  const advancePercent = q.advancePercent ?? settings.data?.advancePercent ?? 30;
  const balanceDays = q.balanceDueDaysBefore ?? settings.data?.balanceDueDaysBefore ?? 7;
  const plan = paymentPlan(total, advancePercent, balanceDays, eventDate, localToday());

  const run = async (action: () => Promise<unknown>, ok: string, fail: string) => {
    setBusy(true);
    try { await action(); toast({ tone: 'success', title: ok }); refresh(); return true; }
    catch (error) { toast({ tone: 'error', title: fail, description: errorMessage(error, 'Please try again.') }); return false; }
    finally { setBusy(false); }
  };

  const book = async (override: boolean) => {
    setBusy(true);
    try {
      const r = await quotesApi.convert(q.id, override || undefined);
      toast({ tone: 'success', title: r.alreadyBooked ? 'Already booked' : `Booked as ${r.projectNumber}`, description: r.alreadyBooked ? undefined : `A payment schedule and a draft invoice were created. Advance: ${inr(r.advanceAmount)}.` });
      setMode(null);
      refresh();
    } catch (error) {
      if (isDateTaken(error) && !override) { setMode('override'); }
      else { setMode(null); toast({ tone: 'error', title: 'Couldn’t book this quote', description: errorMessage(error, 'Please try again.') }); }
    } finally { setBusy(false); }
  };

  const downloadPdf = async () => {
    setBusy(true);
    try { const { blob, filename } = await quotesApi.pdf(q.id); openBlob(blob, filename ?? `${q.quotationNumber}.pdf`); }
    catch (error) { toast({ tone: 'error', title: 'Couldn’t create the PDF', description: errorMessage(error, 'Please try again.') }); }
    finally { setBusy(false); }
  };

  const copyLink = async () => {
    if (!q.publicUrl) return;
    if (await copyText(q.publicUrl)) { setCopied(true); window.setTimeout(() => setCopied(false), 2000); } else toast({ tone: 'error', title: 'Couldn’t copy automatically' });
  };

  const customer = q.customerName ?? q.client?.displayName ?? q.lead?.name ?? 'Customer';

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open && !busy && !mode) onClose(); }}>
        <DialogContent size="lg" className="sm:max-w-4xl" title={`${q.quotationNumber} · ${customer}`} description={`Created ${fmtDate(q.issueDate)}${q.createdBy ? ` by ${q.createdBy.fullName}` : q.autoGenerated ? ' from an enquiry' : ''}`}>
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2"><Badge tone={status.tone} dot>{status.label}</Badge>{q.autoGenerated && <Badge tone="neutral"><Sparkles className="size-3" aria-hidden="true" />From enquiry</Badge>}</div>
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums text-fg">{inrFixed(total)}</p>
                <p className="text-[13px] text-fg-muted">
                  {q.effectiveStatus === 'SENT' && (q.viewCount > 0 ? `Opened ${q.viewCount} time${q.viewCount === 1 ? '' : 's'}${q.lastViewedAt ? `, last ${timeAgo(q.lastViewedAt)}` : ''}` : q.sentAt ? `Sent ${timeAgo(q.sentAt)}, not opened yet` : '')}
                  {q.validUntil && q.effectiveStatus === 'SENT' ? `${q.viewCount > 0 || q.sentAt ? ' · ' : ''}valid until ${fmtDate(q.validUntil)}` : ''}
                  {q.effectiveStatus === 'ACCEPTED' && q.acceptedAt ? `Accepted ${fmtDateTime(q.acceptedAt)}${q.acceptedByName ? ` by ${q.acceptedByName}` : ''}` : ''}
                  {q.effectiveStatus === 'EXPIRED' && q.validUntil ? `Expired ${fmtDate(q.validUntil)}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canUpdate && resendable && <Button onClick={() => setMode('send')}><Send />{q.status === 'DRAFT' ? (q.needsReview ? 'Approve & send' : 'Send') : 'Send again'}</Button>}
                {canUpdate && openable && <Button variant="secondary" onClick={() => setMode('edit')}><Pencil />Edit</Button>}
                {canBook && openable && eventDate && <Button variant="secondary" onClick={() => setMode('book')}><CalendarCheck2 />Book now</Button>}
                <Button variant="secondary" onClick={() => setMode('preview')}><Eye />Preview</Button>
                <Button variant="secondary" onClick={() => void downloadPdf()} loading={busy && mode === null}><Download />PDF</Button>
                {canUpdate && q.status !== 'ACCEPTED' && q.status !== 'CANCELLED' && (
                  <Dropdown>
                    <DropdownTrigger asChild><Button variant="ghost" size="icon" aria-label="More actions"><MoreHorizontal /></Button></DropdownTrigger>
                    <DropdownContent align="end"><DropdownItem destructive onSelect={() => setMode('cancel')}><Ban />Cancel this quote</DropdownItem></DropdownContent>
                  </Dropdown>
                )}
              </div>
            </div>

            {q.needsReview && q.status === 'DRAFT' && <p role="status" className="rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-warn">This quote was prepared automatically from an enquiry and has not reached the customer. Check the items and prices, then send it.</p>}
            {warning && <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] bg-warn-bg px-3 py-2 text-[13px] text-warn"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{warning} The customer will not be able to accept this online.</span></p>}
            {q.status === 'REJECTED' && q.declineReason && <p className="rounded-[var(--radius-md)] bg-surface-sunken px-3 py-2 text-[13px] text-fg-muted">Declined{q.declinedAt ? ` ${fmtDate(q.declinedAt.slice(0, 10))}` : ''}: “{q.declineReason}”</p>}
            {q.status === 'ACCEPTED' && q.project && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-ok-bg p-4">
                <p className="text-sm text-fg"><strong>Booked as {q.project.projectNumber}.</strong> The project, its payment schedule and a draft invoice are ready. Check the invoice below before you issue it.</p>
                {onOpenProject && <Button variant="secondary" onClick={() => onOpenProject(q.project!.id)}><FolderOpen />Open project</Button>}
              </div>
            )}

            <dl className="grid gap-x-6 gap-y-4 rounded-[var(--radius-lg)] border border-line-soft p-4 sm:grid-cols-3">
              <Info label="Customer">{customer}</Info>
              <Info label="Phone">{q.customerPhone}</Info>
              <Info label="Email">{q.customerEmail}</Info>
              <Info label="Occasion">{q.eventType ? EVENT_TYPE_LABELS[q.eventType] : ''}</Info>
              <Info label="Event date">{eventDate ? `${fmtDateLong(eventDate)}${q.eventDays > 1 ? ` · ${q.eventDays} days` : ''}` : ''}</Info>
              <Info label="Venue">{[q.venueName, q.venueCity].filter(Boolean).join(', ')}{q.guestCount ? ` · ${q.guestCount} guests` : ''}</Info>
            </dl>

            <section aria-labelledby="qd-items">
              <h3 id="qd-items" className="mb-2 text-sm font-semibold text-fg">Items</h3>
              <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-line-soft">
                <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
                  <thead className="bg-surface-sunken"><tr>{['Item', 'Qty', 'Rate', 'GST', 'Amount'].map((h, i) => <th key={h} scope="col" className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle ${i > 0 ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
                  <tbody>
                    {q.items.map((i) => {
                      const a = lineAmounts({ quantity: num(i.quantity), unitPrice: num(i.unitPrice), discountAmount: num(i.discountAmount), taxRate: num(i.taxRate) });
                      return (
                        <tr key={i.id} className={`border-t border-line-soft ${i.isSelected ? '' : 'text-fg-subtle'}`}>
                          <td className="px-4 py-2.5"><p className={`font-medium ${i.isSelected ? 'text-fg' : ''}`}>{i.service}</p>{i.isOptional && <p className="text-xs">{i.isSelected ? 'Optional · switched on' : 'Optional · not chosen yet'}</p>}{i.inclusions.length > 0 && <p className="text-xs text-fg-subtle">{i.inclusions.slice(0, 3).join(' · ')}{i.inclusions.length > 3 ? ` · +${i.inclusions.length - 3} more` : ''}</p>}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{num(i.quantity)}{i.pricingType === 'PER_DAY' ? ' day' : i.pricingType === 'PER_PERSON' ? ' guests' : ''}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{inrFixed(num(i.unitPrice))}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{num(i.taxRate)}%</td>
                          <td className="px-4 py-2.5 text-right font-medium tabular-nums">{i.isSelected ? inrFixed(a.total) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {selected.length === 0 && <p className="mt-2 text-[13px] text-bad">Nothing is switched on in this quote.</p>}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section aria-labelledby="qd-plan">
                <h3 id="qd-plan" className="mb-2 text-sm font-semibold text-fg">Payment plan</h3>
                <ol className="divide-y divide-line-soft rounded-[var(--radius-lg)] border border-line-soft">
                  {plan.map((s) => <li key={s.title} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"><span><span className="font-medium text-fg">{s.title}</span><span className="text-fg-muted"> · {s.title === 'Advance' ? 'on acceptance' : fmtDate(s.dueDate)}</span></span><span className="font-medium tabular-nums">{inrFixed(s.amount)}</span></li>)}
                </ol>
              </section>
              <dl className="space-y-2 self-start rounded-[var(--radius-lg)] border border-line-soft p-4 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-fg-muted">Subtotal</dt><dd className="tabular-nums">{inrFixed(num(q.subtotal))}</dd></div>
                {num(q.discountAmount) > 0 && <div className="flex justify-between gap-4"><dt className="text-fg-muted">Discount</dt><dd className="tabular-nums text-ok">− {inrFixed(num(q.discountAmount))}</dd></div>}
                <div className="flex justify-between gap-4"><dt className="text-fg-muted">GST</dt><dd className="tabular-nums">{inrFixed(num(q.taxAmount))}</dd></div>
                <div className="flex items-baseline justify-between gap-4 border-t border-line-soft pt-2"><dt className="font-semibold">Total</dt><dd className="font-display text-xl font-semibold tabular-nums">{inrFixed(total)}</dd></div>
              </dl>
            </div>

            {canInvoices && q.status === 'ACCEPTED' && q.project && <InvoicePanel projectId={q.project.id} canUpdate={can('INVOICE_UPDATE')} />}

            {q.publicUrl && (
              <section aria-labelledby="qd-link">
                <h3 id="qd-link" className="mb-2 text-sm font-semibold text-fg">Customer link</h3>
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-surface-sunken p-2">
                  <input readOnly aria-label="Customer link" value={q.publicUrl} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent px-2 font-mono text-[13px] text-fg outline-none" />
                  <Button variant="secondary" size="sm" onClick={() => void copyLink()}>{copied ? <Check /> : <Copy />}{copied ? 'Copied' : 'Copy'}</Button>
                </div>
              </section>
            )}

            <section aria-labelledby="qd-activity">
              <h3 id="qd-activity" className="mb-2 text-sm font-semibold text-fg">Activity</h3>
              {eventsLoad.loading && !eventsLoad.data ? <Skeleton className="h-20" /> : (eventsLoad.data ?? []).length === 0 ? <p className="text-sm text-fg-muted">Nothing has happened yet.</p> : (
                <ol className="space-y-3 border-l border-line pl-4">
                  {(eventsLoad.data ?? []).map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-brand ring-4 ring-surface-raised" aria-hidden="true" />
                      <p className="text-sm text-fg">{describe(e)}</p>
                      <p className="text-xs text-fg-subtle">{e.actorType === 'CLIENT' ? 'Customer' : e.actorType === 'STAFF' ? 'Your team' : 'Automatic'} · {fmtDateTime(e.createdAt)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {mode === 'edit' && <QuoteBuilder quote={q} onClose={() => setMode(null)} onSaved={() => { setMode(null); refresh(); }} />}
      {mode === 'send' && <SendDialog quote={q} total={total} dateWarning={warning} onClose={() => setMode(null)} onSent={refresh} />}
      {mode === 'preview' && <PreviewDialog id={q.id} onClose={() => setMode(null)} />}
      <ConfirmDialog
        open={mode === 'book'} title="Book this quote now?" confirmLabel="Book it" busy={busy}
        description={`This creates a project for ${customer}${eventDate ? ` on ${fmtDate(eventDate)}` : ''}, a payment schedule and a draft invoice, and marks the quote accepted.`}
        onConfirm={() => void book(false)} onClose={() => setMode(null)}
      />
      <ConfirmDialog
        open={mode === 'override'} title="That date is already taken" confirmLabel={canOverride ? 'Book anyway' : 'OK'} destructive={canOverride} busy={busy}
        description={canOverride ? `${eventDate ? fmtDate(eventDate) : 'The date'} is full or closed. You can book over it if you know there is room, for example a second crew.` : `${eventDate ? fmtDate(eventDate) : 'The date'} is full or closed. Ask someone who manages bookings to book over it, or change the date first.`}
        onConfirm={() => { if (canOverride) void book(true); else setMode(null); }} onClose={() => setMode(null)}
      />
      <ConfirmDialog
        open={mode === 'cancel'} title="Cancel this quote?" confirmLabel="Cancel quote" destructive busy={busy}
        description="The customer’s link stops accepting it. You can still see it here, and you can make a new quote for the same lead."
        onConfirm={() => void run(async () => { await quotesApi.cancel(q.id); setMode(null); }, 'Quote cancelled', 'Couldn’t cancel the quote')} onClose={() => setMode(null)}
      />
    </>
  );
}
