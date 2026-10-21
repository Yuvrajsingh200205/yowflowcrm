'use client';

import * as React from 'react';
import { CheckCircle2, Copy, ImagePlus, Mail, MessageSquare, Plus, Send, ShieldOff, Trash2, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api/client';
import { GALLERY_ACCEPT, galleryApi } from '@/lib/api/gallery';
import { portalAdminApi, type AdminSection, type ClientActivity, type GallerySettings, type PortalAccessUser } from '@/lib/api/portalAdmin';

const msg = (e: unknown, f = 'Something went wrong. Please try again.') => (e instanceof ApiError ? e.message : f);
const when = (d: string | null) => (d ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(d)) : '—');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const statusTone = (s: string) => (s === 'ACTIVE' || s === 'COMPLETED' || s === 'PUBLISHED' ? 'success' : s === 'SUSPENDED' || s === 'CLOSED' ? 'danger' : 'warning') as 'success' | 'danger' | 'warning';

/* ───────────────────────────── Access ───────────────────────────── */
function AccessPanel({ clientId, defaultEmail, defaultName }: { clientId: string; defaultEmail: string; defaultName: string }) {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<PortalAccessUser[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [f, setF] = React.useState({ fullName: defaultName, email: defaultEmail });
  const [errs, setErrs] = React.useState<{ fullName?: string; email?: string }>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const load = React.useCallback(() => { setError(null); portalAdminApi.access.list(clientId).then(setUsers).catch((e) => setError(msg(e))); }, [clientId]);
  React.useEffect(load, [load]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = { fullName: f.fullName.trim().length >= 2 ? undefined : 'Enter their name.', email: EMAIL_RE.test(f.email.trim()) ? undefined : 'Enter a valid email address.' };
    setErrs(next);
    if (next.fullName || next.email) return;
    setBusy('invite');
    try { await portalAdminApi.access.invite(clientId, { fullName: f.fullName.trim(), email: f.email.trim() }); toast({ tone: 'success', title: 'Invitation sent', description: `We emailed ${f.email.trim()} a link to set their password.` }); setF({ fullName: '', email: '' }); load(); }
    catch (err) { toast({ tone: 'error', title: 'Couldn’t send the invitation', description: msg(err) }); }
    finally { setBusy(null); }
  };
  const act = async (id: string, run: () => Promise<unknown>, done: string) => {
    setBusy(id);
    try { await run(); toast({ tone: 'success', title: done }); load(); }
    catch (err) { toast({ tone: 'error', title: 'That didn’t work', description: msg(err) }); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={invite} noValidate className="grid gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-surface-sunken p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
        <Field label="Name" error={errs.fullName} required>{(a) => <Input id={a.id} value={f.fullName} onChange={(e) => { setF({ ...f, fullName: e.target.value }); setErrs((s) => ({ ...s, fullName: undefined })); }} aria-describedby={a.describedBy} invalid={a.invalid} autoComplete="off" />}</Field>
        <Field label="Email" error={errs.email} required>{(a) => <Input id={a.id} type="email" value={f.email} onChange={(e) => { setF({ ...f, email: e.target.value }); setErrs((s) => ({ ...s, email: undefined })); }} aria-describedby={a.describedBy} invalid={a.invalid} autoComplete="off" />}</Field>
        <Button type="submit" className="sm:mt-6" loading={busy === 'invite'}><UserPlus />Send invite</Button>
      </form>
      {error && <ErrorState title="Couldn’t load portal access" description={error} action={{ label: 'Try again', onClick: load }} />}
      {!error && !users && <Skeleton className="h-20 w-full" />}
      {users?.length === 0 && <EmptyState icon={<Mail />} title="Nobody invited yet" description="Invite the couple. They’ll set their own password and see only their wedding." />}
      <ul className="space-y-2">
        {users?.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-surface p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-fg">{u.fullName}</p><p className="truncate text-[13px] text-fg-muted">{u.email} · {u.lastLoginAt ? `last seen ${when(u.lastLoginAt)}` : u.status === 'INVITED' ? `invited ${when(u.invitedAt)}` : 'never signed in'}</p></div>
            <Badge tone={statusTone(u.status)} dot>{u.status.charAt(0) + u.status.slice(1).toLowerCase()}</Badge>
            {u.status === 'INVITED' && <Button size="sm" variant="secondary" loading={busy === u.id} onClick={() => act(u.id, () => portalAdminApi.access.invite(clientId, { fullName: u.fullName, email: u.email }), 'Invitation re-sent')}><Send />Resend</Button>}
            {u.status === 'ACTIVE' && <Button size="sm" variant="ghost" loading={busy === u.id} onClick={() => act(u.id, () => portalAdminApi.access.setStatus(clientId, u.id, 'SUSPENDED'), 'Access suspended')}><ShieldOff />Suspend</Button>}
            {u.status === 'SUSPENDED' && <Button size="sm" variant="secondary" loading={busy === u.id} onClick={() => act(u.id, () => portalAdminApi.access.setStatus(clientId, u.id, 'ACTIVE'), 'Access restored')}>Restore</Button>}
            <Button size="sm" variant="ghost" aria-label={`Remove ${u.fullName}`} disabled={busy === u.id} onClick={() => { if (window.confirm(`Remove ${u.fullName}'s portal access? They will be signed out immediately.`)) void act(u.id, () => portalAdminApi.access.remove(clientId, u.id), 'Access removed'); }}><Trash2 /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────────────────────── Gallery ───────────────────────────── */
function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-fg-muted">
      <input type="checkbox" className="size-4 cursor-pointer accent-[var(--primary)]" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />{label}
    </label>
  );
}

function GalleryPanel({ projectId, clientName }: { projectId: string; clientName: string }) {
  const { toast } = useToast();
  const [s, setS] = React.useState<GallerySettings | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ welcomeMessage: '', albumSelectionTarget: '0', expectedDeliveryDate: '' });
  const [busy, setBusy] = React.useState<string | null>(null);
  const [newSection, setNewSection] = React.useState('');
  const [uploadSection, setUploadSection] = React.useState('');
  const [progress, setProgress] = React.useState<string | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    try {
      const d = await portalAdminApi.gallery.settings(projectId);
      setS(d);
      setForm({ welcomeMessage: d.gallery.welcomeMessage ?? '', albumSelectionTarget: String(d.gallery.albumSelectionTarget), expectedDeliveryDate: d.gallery.expectedDeliveryDate?.slice(0, 10) ?? '' });
      setUploadSection((cur) => cur || d.sections[0]?.name || '');
      setError(null);
    } catch (e) { setError(msg(e)); }
  }, [projectId]);
  React.useEffect(() => { void load(); }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try { await fn(); if (ok) toast({ tone: 'success', title: ok }); await load(); }
    catch (e) { toast({ tone: 'error', title: 'That didn’t work', description: msg(e) }); }
    finally { setBusy(null); }
  };

  const save = () => run('save', () => portalAdminApi.gallery.update(projectId, { welcomeMessage: form.welcomeMessage.trim() || null, albumSelectionTarget: Math.max(0, Math.min(5000, Number(form.albumSelectionTarget) || 0)), expectedDeliveryDate: form.expectedDeliveryDate || null }), 'Gallery settings saved');
  /** Optimistic: the switch moves at once and snaps back with a message if the server refuses. */
  const toggleSection = async (sec: AdminSection, patch: Partial<AdminSection>) => {
    const apply = (p: Partial<AdminSection>) => setS((cur) => (cur ? { ...cur, sections: cur.sections.map((x) => (x.id === sec.id ? { ...x, ...p } : x)) } : cur));
    apply(patch);
    try { await portalAdminApi.gallery.updateSection(projectId, sec.id, patch); }
    catch (e) { apply(Object.fromEntries(Object.keys(patch).map((k) => [k, sec[k as keyof AdminSection]]))); toast({ tone: 'error', title: 'Couldn’t update the section', description: msg(e) }); }
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const chosen = Array.from(files);
    const failures: string[] = [];
    const section = uploadSection.trim() || 'Gallery';
    for (const [i, file] of chosen.entries()) {
      setProgress(`Uploading ${i + 1} of ${chosen.length}…`);
      try { await galleryApi.upload(projectId, file, section); } catch (e) { failures.push(e instanceof Error ? e.message : `${file.name}: upload failed.`); }
    }
    setProgress(null);
    if (fileInput.current) fileInput.current.value = '';
    await load();
    if (failures.length) toast({ tone: 'error', title: `${failures.length} file${failures.length > 1 ? 's' : ''} didn’t upload`, description: failures.slice(0, 2).join(' ') });
    else toast({ tone: 'success', title: `${chosen.length} file${chosen.length > 1 ? 's' : ''} uploaded` });
  };

  const optimise = async () => {
    setBusy('optimise');
    try {
      for (let guard = 0; guard < 200; guard++) { const r = await portalAdminApi.gallery.backfill(projectId); if (!r.remaining) break; setProgress(`Optimising… ${r.remaining} left`); }
      toast({ tone: 'success', title: 'Photographs optimised for fast viewing' });
    } catch (e) { toast({ tone: 'error', title: 'Couldn’t optimise', description: msg(e) }); }
    finally { setProgress(null); setBusy(null); await load(); }
  };

  if (error) return <ErrorState title="Couldn’t load the gallery" description={error} action={{ label: 'Try again', onClick: () => void load() }} />;
  if (!s) return <Skeleton className="h-40 w-full" />;
  const published = s.gallery.status === 'PUBLISHED';
  const total = s.sections.reduce((a, x) => a + x.mediaCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-surface-sunken p-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-fg">{published ? 'Published to the portal' : 'Not published yet'}<Badge tone={published ? 'success' : 'warning'} dot>{published ? 'Live' : 'Draft'}</Badge></p>
          <p className="mt-0.5 text-[13px] text-fg-muted">{published ? `${clientName} can see every section marked visible.` : `${clientName} sees “gallery coming soon” until you publish.`}</p>
        </div>
        {published
          ? <Button variant="secondary" loading={busy === 'pub'} onClick={() => run('pub', () => portalAdminApi.gallery.update(projectId, { status: 'DRAFT' }), 'Gallery hidden from the portal')}>Unpublish</Button>
          : <Button loading={busy === 'pub'} disabled={total === 0} onClick={() => { if (window.confirm(`Publish the gallery? ${clientName} will be emailed right away.`)) void run('pub', () => portalAdminApi.gallery.update(projectId, { status: 'PUBLISHED' }), 'Published — the couple has been notified'); }}>Publish and notify</Button>}
      </div>

      <section aria-labelledby="g-upload" className="space-y-3">
        <h3 id="g-upload" className="text-sm font-semibold text-fg">Add photographs and films</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Section" hint="Pick an existing section or type a new name, like Haldi or Reception.">{(a) => <Input id={a.id} list="g-sections" value={uploadSection} onChange={(e) => setUploadSection(e.target.value)} aria-describedby={a.describedBy} />}</Field>
          <datalist id="g-sections">{s.sections.map((x) => <option key={x.id} value={x.name} />)}</datalist>
          <Button onClick={() => fileInput.current?.click()} disabled={Boolean(progress)}><ImagePlus />{progress ?? 'Choose files'}</Button>
          <input ref={fileInput} type="file" multiple accept={GALLERY_ACCEPT.join(',')} className="hidden" aria-label="Choose photographs or films to upload" onChange={(e) => void upload(e.target.files)} />
        </div>
        {s.pendingDerivatives > 0 && <p className="flex flex-wrap items-center gap-3 text-[13px] text-fg-muted">{s.pendingDerivatives} photograph{s.pendingDerivatives > 1 ? 's are' : ' is'} not optimised yet — the portal will load them slowly. <Button size="sm" variant="secondary" loading={busy === 'optimise'} onClick={optimise}>Optimise now</Button></p>}
      </section>

      <section aria-labelledby="g-sections" className="space-y-3">
        <h3 id="g-sections" className="text-sm font-semibold text-fg">Sections and what the couple can do</h3>
        {s.sections.length === 0 && <p className="text-sm text-fg-muted">Sections appear here after your first upload.</p>}
        <ul className="space-y-2">
          {s.sections.map((sec) => (
            <li key={sec.id} className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-fg">{sec.name} <span className="font-normal text-fg-subtle">· {sec.mediaCount} file{sec.mediaCount === 1 ? '' : 's'}</span></p>
                <Button size="sm" variant="ghost" aria-label={`Delete section ${sec.name}`} disabled={busy === sec.id || sec.mediaCount > 0} title={sec.mediaCount > 0 ? 'Remove its photographs first' : 'Delete section'} onClick={() => { if (window.confirm(`Delete the empty section “${sec.name}”?`)) void run(sec.id, () => portalAdminApi.gallery.deleteSection(projectId, sec.id), 'Section deleted'); }}><Trash2 /></Button></div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
                <Toggle label="Visible to client" checked={sec.isVisibleToClient} onChange={(v) => toggleSection(sec, { isVisibleToClient: v })} />
                <Toggle label="Allow downloads" checked={sec.isDownloadAllowed} onChange={(v) => toggleSection(sec, { isDownloadAllowed: v })} />
                <Toggle label="Allow sharing" checked={sec.isShareAllowed} onChange={(v) => toggleSection(sec, { isShareAllowed: v })} />
                <Toggle label="Watermark" checked={sec.hasWatermark} onChange={(v) => toggleSection(sec, { hasWatermark: v })} />
              </div>
            </li>
          ))}
        </ul>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newSection.trim()) void run('sec', () => portalAdminApi.gallery.createSection(projectId, newSection.trim()), 'Section created').then(() => setNewSection('')); }}>
          <div className="flex-1"><label htmlFor="new-sec" className="sr-only">New section name</label><Input id="new-sec" value={newSection} maxLength={120} onChange={(e) => setNewSection(e.target.value)} placeholder="New section, e.g. Sangeet" /></div>
          <Button type="submit" variant="secondary" loading={busy === 'sec'} disabled={!newSection.trim()}><Plus />Add</Button>
        </form>
      </section>

      <section aria-labelledby="g-settings" className="space-y-3">
        <h3 id="g-settings" className="text-sm font-semibold text-fg">Welcome and album settings</h3>
        <Field label="Welcome message">{(a) => <Textarea id={a.id} rows={3} maxLength={1000} value={form.welcomeMessage} onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })} placeholder="A short note the couple sees at the top of their gallery" />}</Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Album photographs to choose" hint="0 turns album selection off.">{(a) => <Input id={a.id} type="number" min={0} max={5000} inputMode="numeric" value={form.albumSelectionTarget} onChange={(e) => setForm({ ...form, albumSelectionTarget: e.target.value })} aria-describedby={a.describedBy} />}</Field>
          <Field label="Expected delivery">{(a) => <Input id={a.id} type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} />}</Field>
        </div>
        <Button onClick={save} loading={busy === 'save'}>Save settings</Button>
      </section>
    </div>
  );
}

/* ───────────────────────────── Activity ───────────────────────────── */
function ActivityPanel({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [a, setA] = React.useState<ClientActivity | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState<string | null>(null);
  const load = React.useCallback(() => { setError(null); portalAdminApi.activity.get(projectId).then(setA).catch((e) => setError(msg(e))); }, [projectId]);
  React.useEffect(load, [load]);

  const act = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try { await fn(); toast({ tone: 'success', title: ok }); setReply((r) => ({ ...r, [key]: '' })); load(); }
    catch (e) { toast({ tone: 'error', title: 'That didn’t work', description: msg(e) }); }
    finally { setBusy(null); }
  };

  if (error) return <ErrorState title="Couldn’t load activity" description={error} action={{ label: 'Try again', onClick: load }} />;
  if (!a) return <Skeleton className="h-40 w-full" />;
  const nothing = !a.requests.length && !a.comments.length && !a.albumSelection.length && !a.shareLinks.length;
  return (
    <div className="space-y-6">
      {nothing && <EmptyState icon={<MessageSquare />} title="No activity yet" description="Requests, notes, album picks and share links from the couple appear here." />}
      {a.portalUsers.length > 0 && <p className="text-[13px] text-fg-muted">{a.portalUsers.map((u) => `${u.fullName}: ${u.favorites} favourite${u.favorites === 1 ? '' : 's'}`).join(' · ')}</p>}

      {a.requests.length > 0 && (
        <section aria-labelledby="a-req" className="space-y-2"><h3 id="a-req" className="text-sm font-semibold text-fg">Requests</h3>
          <ul className="space-y-2">{a.requests.map((r) => (
            <li key={r.id} className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-3">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold text-fg">{r.title}</p><p className="text-xs text-fg-subtle">{r.from} · {when(r.createdAt)}</p></div><Badge tone={statusTone(r.status)} dot>{r.status.replace(/_/g, ' ').toLowerCase()}</Badge></div>
              <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-fg-muted">{r.description}</p>
              {r.adminResponse && <p className="mt-2 rounded-md bg-surface-sunken p-2 text-[13px] text-fg"><span className="font-medium">You:</span> {r.adminResponse}</p>}
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1"><label htmlFor={`rr-${r.id}`} className="sr-only">Reply to {r.title}</label><Input id={`rr-${r.id}`} value={reply[r.id] ?? ''} maxLength={2000} onChange={(e) => setReply({ ...reply, [r.id]: e.target.value })} placeholder="Write a reply…" /></div>
                <Button size="sm" variant="secondary" disabled={!(reply[r.id] ?? '').trim()} loading={busy === r.id} onClick={() => act(r.id, () => portalAdminApi.activity.respond(projectId, r.id, { adminResponse: reply[r.id].trim(), ...(r.status === 'OPEN' ? { status: 'IN_PROGRESS' } : {}) }), 'Reply sent')}><Send />Reply</Button>
                {r.status !== 'COMPLETED' && r.status !== 'CLOSED' && <Button size="sm" loading={busy === `${r.id}:done`} onClick={() => act(`${r.id}:done`, () => portalAdminApi.activity.respond(projectId, r.id, { status: 'COMPLETED' }), 'Marked complete')}><CheckCircle2 />Complete</Button>}
              </div>
            </li>))}</ul>
        </section>
      )}

      {a.comments.length > 0 && (
        <section aria-labelledby="a-com" className="space-y-2"><h3 id="a-com" className="text-sm font-semibold text-fg">Notes on photographs</h3>
          <ul className="space-y-2">{a.comments.filter((c) => !c.fromStudio).map((c) => (
            <li key={c.id} className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-3">
              <p className="text-xs text-fg-subtle">{c.from} · {c.mediaTitle ?? 'Gallery'} · {when(c.createdAt)} {c.isResolved && <Badge tone="success" className="ml-1">Replied</Badge>}</p>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-fg">{c.body}</p>
              {!c.isResolved && (
                <div className="mt-2 flex gap-2"><div className="flex-1"><label htmlFor={`cr-${c.id}`} className="sr-only">Reply to note</label><Input id={`cr-${c.id}`} value={reply[c.id] ?? ''} maxLength={2000} onChange={(e) => setReply({ ...reply, [c.id]: e.target.value })} placeholder="Reply to the couple…" /></div>
                  <Button size="sm" variant="secondary" disabled={!(reply[c.id] ?? '').trim()} loading={busy === c.id} onClick={() => act(c.id, () => portalAdminApi.activity.reply(projectId, c.id, reply[c.id].trim()), 'Reply sent')}><Send />Reply</Button></div>
              )}
            </li>))}</ul>
        </section>
      )}

      {a.albumSelection.length > 0 && (
        <section aria-labelledby="a-alb" className="space-y-2"><h3 id="a-alb" className="text-sm font-semibold text-fg">Album selection ({a.albumSelection.length})</h3>
          <div className="flex flex-wrap gap-1.5">{a.albumSelection.map((x) => <Badge key={x.mediaId} tone="neutral" title={x.section}>{x.title || x.fileName}</Badge>)}</div>
          <Button size="sm" variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(a.albumSelection.map((x) => x.fileName).join('\n')); toast({ tone: 'success', title: 'File names copied' }); } catch { toast({ tone: 'error', title: 'Couldn’t copy' }); } }}><Copy />Copy file names</Button>
        </section>
      )}

      {a.shareLinks.length > 0 && (
        <section aria-labelledby="a-sh" className="space-y-2"><h3 id="a-sh" className="text-sm font-semibold text-fg">Links the couple created</h3>
          <ul className="space-y-1.5 text-[13px] text-fg-muted">{a.shareLinks.map((l) => <li key={l.id} className="flex flex-wrap justify-between gap-2"><span className="text-fg">{l.title}</span><span>{l.status.toLowerCase()} · {l.viewsCount} views</span></li>)}</ul>
        </section>
      )}
    </div>
  );
}

/* ───────────────────────────── Dialog ───────────────────────────── */
export function ClientPortalManager({ project, onClose }: { project: { id: string; clientId?: string; clientWeddingTitle: string; clientContactMobile?: string; clientEmail?: string }; onClose: () => void }) {
  const clientName = project.clientWeddingTitle;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg" title={`Client portal — ${clientName}`} description="Invite the couple, control what they see, and respond to what they send.">
        <Tabs defaultValue="gallery">
          <TabsList aria-label="Portal management"><TabsTrigger value="gallery">Gallery</TabsTrigger><TabsTrigger value="access">Access</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList>
          <TabsContent value="gallery"><GalleryPanel projectId={project.id} clientName={clientName} /></TabsContent>
          <TabsContent value="access">{project.clientId ? <AccessPanel clientId={project.clientId} defaultEmail={project.clientEmail ?? ''} defaultName="" /> : <EmptyState title="No client record" description="This project isn’t linked to a client yet, so portal access can’t be set up." />}</TabsContent>
          <TabsContent value="activity"><ActivityPanel projectId={project.id} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
