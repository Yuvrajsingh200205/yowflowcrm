'use client';

import * as React from 'react';
import { CalendarDays, Copy, Link2, Plus, Send, Trash2, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { portalApi, errorMessage, fmtDate, inr, type GalleryOverview, type PortalRequest, type PortalShareLink, type ProjectDetail } from './api';

const tone = (s: string) => (['COMPLETED', 'PAID', 'DELIVERED', 'CLOSED', 'ACTIVE'].includes(s) ? 'success' : ['OVERDUE', 'CANCELLED', 'REVOKED'].includes(s) ? 'danger' : ['PENDING', 'OPEN', 'PARTIAL', 'PARTIALLY_PAID', 'SENT', 'IN_PROGRESS', 'WAITING_FOR_CLIENT'].includes(s) ? 'warning' : 'neutral') as 'success' | 'danger' | 'warning' | 'neutral';
const label = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export function OverviewTab({ d }: { d: ProjectDetail }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Events</CardTitle></CardHeader>
        <CardContent>
          {d.events.length === 0 ? <p className="text-sm text-fg-muted">Your event schedule will appear here.</p> : (
            <ol className="space-y-3">
              {d.events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-surface-sunken text-brand"><CalendarDays className="size-4" aria-hidden="true" /></span>
                  <div className="min-w-0"><p className="text-sm font-medium text-fg">{e.name}</p><p className="text-[13px] text-fg-muted">{fmtDate(e.eventDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}{e.startTime ? ` · ${e.startTime.slice(0, 5)}` : ''}{e.venueName ? ` · ${e.venueName}` : ''}</p></div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Deliverables</CardTitle></CardHeader>
        <CardContent>
          {d.deliveries.length === 0 ? <p className="text-sm text-fg-muted">We’ll list what’s on its way to you here.</p> : (
            <ul className="space-y-3">
              {d.deliveries.map((x) => (
                <li key={x.id} className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-sunken text-brand"><Truck className="size-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-fg">{x.title}</p><p className="text-[13px] text-fg-muted">{x.deliveredDate ? `Delivered ${fmtDate(x.deliveredDate)}` : x.expectedDate ? `Expected ${fmtDate(x.expectedDate)}` : 'Date to be confirmed'}</p></div>
                  <Badge tone={tone(x.status)}>{label(x.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {d.studio && (
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Your studio</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-fg-muted">
            <span className="font-medium text-fg">{d.studio.name}</span>
            {d.studio.phone && <a className="hover:text-fg" href={`tel:${d.studio.phone}`}>{d.studio.phone}</a>}
            {d.studio.email && <a className="hover:text-fg" href={`mailto:${d.studio.email}`}>{d.studio.email}</a>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PaymentsTab({ d }: { d: ProjectDetail }) {
  const p = d.payments;
  const pct = p.total > 0 ? Math.min(100, Math.round((p.received / p.total) * 100)) : 0;
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="grid gap-5 pt-6 sm:grid-cols-3">
          {[['Total', inr(p.total)], ['Paid', inr(p.received)], ['Balance', inr(p.balance)]].map(([k, v]) => <div key={k}><p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{k}</p><p className="mt-1 font-display text-2xl font-semibold tabular-nums text-fg">{v}</p></div>)}
          <div className="sm:col-span-3"><div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Paid" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} /></div></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Payment schedule</CardTitle></CardHeader>
        <CardContent>
          {p.milestones.length === 0 ? <p className="text-sm text-fg-muted">No schedule has been set yet.</p> : (
            <ul className="divide-y divide-line-soft">
              {p.milestones.map((m) => <li key={m.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-fg">{m.title}</p><p className="text-[13px] text-fg-muted">{m.dueDate ? `Due ${fmtDate(m.dueDate)}` : 'No due date'}</p></div><div className="flex items-center gap-3"><span className="text-sm font-medium tabular-nums">{inr(m.amount)}</span><Badge tone={tone(m.status)}>{label(m.status)}</Badge></div></li>)}
            </ul>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
          <CardContent>
            {p.invoices.length === 0 ? <p className="text-sm text-fg-muted">No invoices yet.</p> : <ul className="divide-y divide-line-soft">{p.invoices.map((i) => <li key={i.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-fg">{i.invoiceNumber}</p><p className="text-[13px] text-fg-muted">Issued {fmtDate(i.issueDate)}{i.amountDue > 0 && i.dueDate ? ` · due ${fmtDate(i.dueDate)}` : ''}</p></div><div className="text-right"><p className="text-sm font-medium tabular-nums">{inr(i.total)}</p><Badge tone={tone(i.status)}>{label(i.status)}</Badge></div></li>)}</ul>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payments received</CardTitle></CardHeader>
          <CardContent>
            {p.history.length === 0 ? <p className="text-sm text-fg-muted">No payments recorded yet.</p> : <ul className="divide-y divide-line-soft">{p.history.map((x) => <li key={x.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-fg">{x.paymentNumber}</p><p className="text-[13px] text-fg-muted">{fmtDate(x.paymentDate)} · {label(x.paymentMethod)}</p></div><span className="text-sm font-medium tabular-nums text-ok">{inr(x.amount)}</span></li>)}</ul>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const REQUEST_TYPES = [
  ['PHOTO_RETOUCH', 'Photo retouching'], ['VIDEO_CHANGE', 'Video change'], ['ALBUM_CHANGE', 'Album change'], ['SONG_CHANGE', 'Song change'], ['NAME_CORRECTION', 'Name correction'], ['DELIVERY_REQUEST', 'Delivery question'], ['OTHER', 'Something else'],
] as const;

export function RequestsTab({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [list, setList] = React.useState<PortalRequest[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ type: 'PHOTO_RETOUCH', title: '', description: '' });
  const [errs, setErrs] = React.useState<{ title?: string; description?: string }>({});
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(() => { setError(null); portalApi.requests(projectId).then(setList).catch((e) => setError(errorMessage(e))); }, [projectId]);
  React.useEffect(load, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { title: f.title.trim().length >= 3 ? undefined : 'Give your request a short title.', description: f.description.trim().length >= 5 ? undefined : 'Tell us a little more.' };
    setErrs(next);
    if (next.title || next.description) return;
    setBusy(true);
    try {
      await portalApi.createRequest(projectId, { type: f.type, title: f.title.trim(), description: f.description.trim() });
      setOpen(false); setF({ type: 'PHOTO_RETOUCH', title: '', description: '' });
      toast({ tone: 'success', title: 'Request sent', description: 'Your studio has been notified.' });
      load();
    } catch (err) { toast({ tone: 'error', title: 'Couldn’t send your request', description: errorMessage(err) }); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">Ask for edits, changes or anything else. Replies appear here.</p>
        <Button size="sm" onClick={() => setOpen(true)}><Plus />New request</Button>
      </div>
      {error && <ErrorState title="Couldn’t load requests" description={error} action={{ label: 'Try again', onClick: load }} />}
      {!error && !list && <Skeleton className="h-28 w-full" />}
      {list?.length === 0 && <EmptyState icon={<Send />} title="No requests yet" description="Need a retouch or a change? Send a request and your studio will respond here." action={{ label: 'New request', onClick: () => setOpen(true) }} />}
      <ul className="space-y-3">
        {list?.map((r) => (
          <li key={r.id}>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs text-fg-subtle">{label(REQUEST_TYPES.find((t) => t[0] === r.type)?.[1] ?? r.type)} · {fmtDate(r.createdAt)}</p><h3 className="mt-0.5 text-[15px] font-semibold text-fg">{r.title}</h3></div><Badge tone={tone(r.status)} dot>{label(r.status)}</Badge></div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-fg-muted">{r.description}</p>
              {r.adminResponse && <div className="mt-3 rounded-lg bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] p-3 text-sm"><p className="mb-0.5 text-xs font-medium text-fg-muted">Studio reply</p><p className="whitespace-pre-wrap text-fg">{r.adminResponse}</p></div>}
            </Card>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="New request" description="Your studio gets a notification straight away." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="req-form" loading={busy}>Send request</Button></>}>
          <form id="req-form" onSubmit={submit} noValidate className="space-y-4">
            <Field label="What is this about?" required>{(a) => <Select id={a.id} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{REQUEST_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
            <Field label="Title" error={errs.title} required>{(a) => <Input id={a.id} value={f.title} maxLength={200} onChange={(e) => { setF({ ...f, title: e.target.value }); setErrs((s) => ({ ...s, title: undefined })); }} aria-describedby={a.describedBy} invalid={a.invalid} />}</Field>
            <Field label="Details" error={errs.description} required>{(a) => <Textarea id={a.id} rows={5} value={f.description} maxLength={4000} onChange={(e) => { setF({ ...f, description: e.target.value }); setErrs((s) => ({ ...s, description: undefined })); }} aria-describedby={a.describedBy} invalid={a.invalid} />}</Field>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ACCESS = [['VIEW_ONLY', 'Whole gallery — view only'], ['SECTION_ONLY', 'One section — view only'], ['VIEW_DOWNLOAD', 'Whole gallery — can download']] as const;

export function SharingTab({ projectId, gallery }: { projectId: string; gallery: GalleryOverview | null }) {
  const { toast } = useToast();
  const [links, setLinks] = React.useState<PortalShareLink[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ title: '', accessType: 'VIEW_ONLY', sectionId: '', password: '', expiresInDays: '30' });
  const [titleErr, setTitleErr] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(() => { setError(null); portalApi.shareLinks(projectId).then(setLinks).catch((e) => setError(errorMessage(e))); }, [projectId]);
  React.useEffect(load, [load]);

  const shareable = gallery?.sections.filter((s) => s.shareAllowed) ?? [];
  const url = (t: string) => `${location.origin}/share/${t}`;
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(url(t)); toast({ tone: 'success', title: 'Link copied' }); } catch { toast({ tone: 'error', title: 'Couldn’t copy', description: url(t) }); } };

  if (gallery && !gallery.available) return <EmptyState icon={<Link2 />} title="Sharing opens with your gallery" description="Once your gallery is published you can share it with family and friends." />;
  if (gallery && shareable.length === 0) return <EmptyState icon={<Link2 />} title="Sharing isn’t enabled" description="Your studio hasn’t turned on sharing for this gallery. Ask them if you’d like to share it with family." />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.title.trim().length < 2) { setTitleErr('Give the link a name, like “For the family”.'); return; }
    if (f.accessType === 'SECTION_ONLY' && !f.sectionId) { toast({ tone: 'warning', title: 'Choose a section to share' }); return; }
    setBusy(true);
    try {
      const l = await portalApi.createShareLink(projectId, { title: f.title.trim(), accessType: f.accessType, ...(f.accessType === 'SECTION_ONLY' ? { sectionId: f.sectionId } : {}), ...(f.password ? { password: f.password } : {}), ...(f.expiresInDays ? { expiresInDays: Number(f.expiresInDays) } : {}) });
      setOpen(false); setF({ title: '', accessType: 'VIEW_ONLY', sectionId: '', password: '', expiresInDays: '30' });
      await copy(l.token); load();
    } catch (err) { toast({ tone: 'error', title: 'Couldn’t create the link', description: errorMessage(err) }); }
    finally { setBusy(false); }
  };
  const revoke = async (l: PortalShareLink) => {
    try { await portalApi.revokeShareLink(projectId, l.id); toast({ tone: 'success', title: 'Link turned off' }); load(); }
    catch (err) { toast({ tone: 'error', title: 'Couldn’t turn off the link', description: errorMessage(err) }); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm text-fg-muted">Share your gallery with family and friends. You can turn a link off at any time.</p><Button size="sm" onClick={() => setOpen(true)}><Plus />New link</Button></div>
      {error && <ErrorState title="Couldn’t load your links" description={error} action={{ label: 'Try again', onClick: load }} />}
      {!error && !links && <Skeleton className="h-24 w-full" />}
      {links?.length === 0 && <EmptyState icon={<Link2 />} title="No links yet" description="Create a private link to send to family and friends." action={{ label: 'Create a link', onClick: () => setOpen(true) }} />}
      <ul className="space-y-3">
        {links?.map((l) => (
          <li key={l.id}><Card className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-fg">{l.title}</p><p className="text-[13px] text-fg-muted">{label(l.accessType)} · {l.viewsCount} view{l.viewsCount === 1 ? '' : 's'}{l.expiresAt ? ` · expires ${fmtDate(l.expiresAt)}` : ''}{l.passwordProtected ? ' · password' : ''}</p></div>
            <Badge tone={tone(l.status)}>{label(l.status)}</Badge>
            <Button size="sm" variant="secondary" onClick={() => copy(l.token)} aria-label={`Copy link ${l.title}`}><Copy />Copy</Button>
            <Button size="sm" variant="ghost" onClick={() => revoke(l)} aria-label={`Turn off ${l.title}`}><Trash2 /></Button>
          </Card></li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="New share link" description="Anyone with the link can view — add a password if you’d like." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="share-form" loading={busy}>Create and copy</Button></>}>
          <form id="share-form" onSubmit={submit} noValidate className="space-y-4">
            <Field label="Name" error={titleErr} required>{(a) => <Input id={a.id} value={f.title} maxLength={200} onChange={(e) => { setF({ ...f, title: e.target.value }); setTitleErr(undefined); }} aria-describedby={a.describedBy} invalid={a.invalid} placeholder="For the family" />}</Field>
            <Field label="Access">{(a) => <Select id={a.id} value={f.accessType} onChange={(e) => setF({ ...f, accessType: e.target.value })}>{ACCESS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
            {f.accessType === 'SECTION_ONLY' && <Field label="Section" required>{(a) => <Select id={a.id} value={f.sectionId} onChange={(e) => setF({ ...f, sectionId: e.target.value })}><option value="">Choose a section…</option>{shareable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>}</Field>}
            <Field label="Password (optional)" hint="At least 6 characters.">{(a) => <Input id={a.id} type="text" autoComplete="off" value={f.password} minLength={6} maxLength={64} onChange={(e) => setF({ ...f, password: e.target.value })} aria-describedby={a.describedBy} />}</Field>
            <Field label="Expires">{(a) => <Select id={a.id} value={f.expiresInDays} onChange={(e) => setF({ ...f, expiresInDays: e.target.value })}><option value="7">In 7 days</option><option value="30">In 30 days</option><option value="90">In 90 days</option><option value="365">In a year</option></Select>}</Field>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
