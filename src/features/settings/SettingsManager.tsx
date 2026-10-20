'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Check, CreditCard, KeyRound, Settings as SettingsIcon, ShieldCheck, UserCog, Users } from 'lucide-react';
import { settingsApi, type ModuleAccessRequest, type SettingsWorkspace } from '@/lib/api/settings';
import { apiKeysApi, billingApi, loadRazorpay, type ApiKeyRow, type BillingState, type Interval, type PlanId } from '@/lib/api/billing';
import { apiRequest, ApiError } from '@/lib/api/client';
import { BRAND } from '@/config/brand';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Dialog, DialogContent, EmptyState, ErrorState, Field, Input, Select, Skeleton, Table, TBody, TD, TH, THead, TR, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, useToast } from '@/components/ui';
import { PasswordField, isStrongPassword } from '@/components/auth/PasswordField';

type Viewer = { id: string; fullName: string; email: string; permissions: string[]; organization: { name: string; timezone: string; currency: string } };
type Save = (action: () => Promise<unknown>, success: string, opts?: { reload?: boolean }) => Promise<boolean>;

const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const errMsg = (e: unknown, fb: string) => (e instanceof Error && e.message ? e.message : fb);
const REQUEST_TONE = { APPROVED: 'success', REJECTED: 'danger', PENDING: 'warning' } as const;
const label = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const immediateWorkspace = (v: Viewer): SettingsWorkspace => ({
  viewer: { id: v.id, fullName: v.fullName, email: v.email, isAdmin: v.permissions.includes('SETTING_UPDATE') || v.permissions.includes('ORG_UPDATE') },
  organization: v.organization, notifications: {}, security: {},
  grantedModules: [...new Set(v.permissions.map((k) => k.split('_')[0]))].map((k) => ({ key: k, label: k.replace(/_/g, ' ') })), availableModules: [], requests: [],
});

export function SettingsManager({ viewer }: { viewer?: Viewer }) {
  const { toast } = useToast();
  const [data, setData] = useState<SettingsWorkspace | null>(() => (viewer ? immediateWorkspace(viewer) : null));
  const [loading, setLoading] = useState(!viewer);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('profile');

  const load = useCallback(async () => {
    setError('');
    try { setData(await settingsApi.workspace()); } catch (e) { setError(errMsg(e, 'Unable to load settings.')); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const save: Save = useCallback(async (action, success, opts) => {
    try { await action(); toast({ tone: 'success', title: success }); if (opts?.reload !== false) await load(); return true; }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t save changes', description: errMsg(e, 'Please try again.') }); return false; }
  }, [load, toast]);

  if (loading && !data) return <div className="space-y-4 p-1"><Skeleton className="h-24" /><Skeleton className="h-72" /></div>;
  if (error || !data) return <Card><ErrorState title="Settings unavailable" description={error || 'Try again in a moment.'} action={{ label: 'Retry', onClick: () => void load() }} /></Card>;

  const admin = data.viewer.isAdmin;
  return (
    <div className="space-y-6 pb-8">
      <header>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-fg-muted">Manage your profile, workspace, plan and access.</p>
      </header>
      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList aria-label="Settings sections" className="w-max">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            {admin && <TabsTrigger value="workspace">Workspace</TabsTrigger>}
            {admin && <TabsTrigger value="team">Team</TabsTrigger>}
            {admin && <TabsTrigger value="billing">Billing</TabsTrigger>}
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            {admin && <TabsTrigger value="api">API keys</TabsTrigger>}
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="profile"><ProfileTab data={data} save={save} /></TabsContent>
        {admin && <TabsContent value="workspace"><WorkspaceTab data={data} save={save} /></TabsContent>}
        {admin && <TabsContent value="team"><TeamTab /></TabsContent>}
        {admin && <TabsContent value="billing"><BillingTab /></TabsContent>}
        <TabsContent value="notifications"><NotificationsTab data={data} save={save} /></TabsContent>
        <TabsContent value="security"><SecurityTab save={save} /></TabsContent>
        {admin && <TabsContent value="api"><ApiKeysTab /></TabsContent>}
        <TabsContent value="access"><AccessTab data={data} admin={admin} save={save} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Panel({ title, description, icon: Icon, actions, children }: { title: string; description?: string; icon: React.ComponentType<{ className?: string }>; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-brand"><Icon className="size-4" /></span>
          <div><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</div>
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/* ── Profile ── */
function ProfileTab({ data, save }: { data: SettingsWorkspace; save: Save }) {
  const [name, setName] = useState(data.viewer.fullName);
  const [phone, setPhone] = useState(data.viewer.phone || '');
  const [busy, setBusy] = useState(false);
  return (
    <Panel title="My profile" description="Your account details" icon={UserCog} actions={<Button loading={busy} onClick={async () => { setBusy(true); await save(() => settingsApi.updateProfile({ fullName: name, phone }), 'Profile updated'); setBusy(false); }}>Save profile</Button>}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required>{(a) => <Input id={a.id} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}</Field>
        <Field label="Email" hint="Contact support to change your sign-in email.">{(a) => <Input id={a.id} value={data.viewer.email} readOnly aria-describedby={a.describedBy} />}</Field>
        <Field label="Phone">{(a) => <Input id={a.id} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />}</Field>
      </div>
    </Panel>
  );
}

/* ── Workspace ── */
function WorkspaceTab({ data, save }: { data: SettingsWorkspace; save: Save }) {
  const [f, setF] = useState(data.organization ?? { name: '', timezone: '', currency: '', dateFormat: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Panel title="Workspace" description="Studio identity and regional preferences" icon={SettingsIcon} actions={<Button loading={busy} onClick={async () => { setBusy(true); await save(() => settingsApi.updateOrganization(f), 'Workspace updated'); setBusy(false); }}>Save workspace</Button>}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Studio name" required>{(a) => <Input id={a.id} value={f.name} onChange={set('name')} autoComplete="organization" />}</Field>
        <Field label="Contact email">{(a) => <Input id={a.id} type="email" value={f.contactEmail || ''} onChange={set('contactEmail')} />}</Field>
        <Field label="Timezone">{(a) => <Input id={a.id} value={f.timezone || ''} onChange={set('timezone')} placeholder="Asia/Kolkata" />}</Field>
        <Field label="Currency">{(a) => <Select id={a.id} value={f.currency || 'INR'} onChange={set('currency')}><option value="INR">INR — Indian rupee</option><option value="USD">USD — US dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound sterling</option><option value="AED">AED — UAE dirham</option></Select>}</Field>
        <Field label="Date format">{(a) => <Input id={a.id} value={f.dateFormat || ''} onChange={set('dateFormat')} placeholder="DD/MM/YYYY" />}</Field>
      </div>
    </Panel>
  );
}

/* ── Team ── */
type Member = { id: string; fullName: string; email: string; status: string; roles: string[]; emailVerified: boolean; lastLoginAt: string | null };
function TeamTab() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try { setMembers((await apiRequest<Member[]>('/settings/members', { fresh: true })).data); } catch (e) { setError(errMsg(e, 'Unable to load team members.')); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return (
    <Panel title="Team" description="Everyone with access to this workspace" icon={Users} actions={<Button asChild variant="secondary" size="sm"><a href="/roles-permissions">Manage roles</a></Button>}>
      {error ? <ErrorState title="Couldn’t load the team" description={error} action={{ label: 'Retry', onClick: () => void load() }} />
        : !members ? <div className="space-y-2"><Skeleton className="h-11" /><Skeleton className="h-11" /><Skeleton className="h-11" /></div>
        : members.length === 0 ? <EmptyState icon={<Users />} title="No team members yet" description="Add people from the Team & Attendance page." action={{ label: 'Open Team', href: '/team' }} />
        : (
          <Table>
            <THead><tr><TH>Name</TH><TH>Role</TH><TH>Status</TH><TH>Last sign-in</TH></tr></THead>
            <TBody>
              {members.map((m) => (
                <TR key={m.id}>
                  <TD><span className="font-medium">{m.fullName}</span><span className="block text-xs text-fg-subtle">{m.email}</span></TD>
                  <TD>{m.roles.join(', ') || '—'}</TD>
                  <TD><div className="flex flex-wrap gap-1.5"><Badge tone={m.status === 'ACTIVE' ? 'success' : 'neutral'} dot>{m.status.toLowerCase()}</Badge>{!m.emailVerified && <Badge tone="warning">Unverified</Badge>}</div></TD>
                  <TD className="text-fg-muted">{fmtDate(m.lastLoginAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
    </Panel>
  );
}

/* ── Billing ── */
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void } } }

function BillingTab() {
  const { toast } = useToast();
  const [b, setB] = useState<BillingState | null>(null);
  const [error, setError] = useState('');
  const [interval, setInterval_] = useState<Interval>('yearly');
  const [busy, setBusy] = useState<PlanId | null>(null);
  const load = useCallback(async () => { setError(''); try { setB(await billingApi.get()); } catch (e) { setError(errMsg(e, 'Unable to load billing.')); } }, []);
  useEffect(() => { void load(); }, [load]);

  const subscribe = async (plan: PlanId) => {
    setBusy(plan);
    try {
      const c = await billingApi.checkout(plan, interval);
      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Payment window unavailable');
      const rz = new window.Razorpay({
        key: c.keyId, amount: c.amount, currency: c.currency, order_id: c.orderId, name: c.name, description: c.description, prefill: { email: '' },
        theme: { color: '#B4F03C' },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try { setB(await billingApi.verify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature })); toast({ tone: 'success', title: 'Plan activated', description: 'Thanks — your subscription is live.' }); }
          catch (e) { toast({ tone: 'error', title: 'Payment could not be confirmed', description: errMsg(e, 'If you were charged, contact support with your payment id.') }); }
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rz.on('payment.failed', (r) => toast({ tone: 'error', title: 'Payment failed', description: r.error?.description ?? 'Please try again.' }));
      rz.open();
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t start checkout', description: e instanceof ApiError && e.status === 503 ? 'Online payments are not enabled for this deployment yet.' : errMsg(e, 'Please try again.') });
    } finally { setBusy(null); }
  };

  if (error) return <Card><ErrorState title="Billing unavailable" description={error} action={{ label: 'Retry', onClick: () => void load() }} /></Card>;
  if (!b) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-64" /></div>;

  const statusBadge = b.status === 'active' ? <Badge tone="success" dot>Active</Badge> : b.status === 'trialing' ? <Badge tone="accent" dot>Free trial</Badge> : <Badge tone="danger" dot>{b.status === 'trial_expired' ? 'Trial ended' : b.status.replace('_', ' ')}</Badge>;
  return (
    <div className="space-y-5">
      <Panel title="Current plan" description={b.status === 'trialing' ? `${b.trialDaysLeft ?? 0} days left in your trial (ends ${fmtDate(b.trialEndsAt)})` : b.status === 'active' ? (b.currentPeriodEnd ? `Renews ${fmtDate(b.currentPeriodEnd)}` : 'Your plan is active.') : 'Choose a plan to keep your workspace running.'} icon={CreditCard} actions={statusBadge}>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div><dt className="text-xs text-fg-subtle">Plan</dt><dd className="mt-1 font-display text-xl font-semibold capitalize">{b.plan}</dd></div>
          <div><dt className="text-xs text-fg-subtle">Billing</dt><dd className="mt-1 font-display text-xl font-semibold capitalize">{b.interval ?? '—'}</dd></div>
          <div><dt className="text-xs text-fg-subtle">Seats in use</dt><dd className="mt-1 font-display text-xl font-semibold tabular">{b.seatsUsed}</dd></div>
        </dl>
        {b.mode === 'test' && <p className="mt-4 rounded-[var(--radius-md)] border border-warn/30 bg-warn-bg px-3 py-2 text-xs text-fg">Test mode — no real money is charged. Use Razorpay’s test cards.</p>}
        {!b.configured && <p className="mt-4 rounded-[var(--radius-md)] border border-line bg-surface-sunken px-3 py-2 text-xs text-fg-muted">Online payments are not enabled for this deployment. Contact {BRAND.supportEmail} to activate your plan.</p>}
      </Panel>

      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-line bg-surface p-1">
          {(['monthly', 'yearly'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={interval === k} onClick={() => setInterval_(k)} className={`h-8 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)] ${interval === k ? 'bg-lime text-on-lime' : 'text-fg-muted hover:text-fg'}`}>{k === 'yearly' ? 'Yearly · 2 months free' : 'Monthly'}</button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {b.plans.map((p) => {
          const current = b.status === 'active' && b.plan === p.id && b.interval === interval;
          return (
            <Card key={p.id} className={p.id === 'studio' ? 'border-[color-mix(in_srgb,var(--accent)_55%,var(--border))]' : ''}>
              <CardContent>
                <p className="font-display text-lg font-semibold">{p.name}</p>
                <p className="mt-3"><span className="font-display text-3xl font-semibold tabular">{inr(interval === 'yearly' ? Math.round(p.yearly / 12) : p.monthly)}</span><span className="text-sm text-fg-subtle"> / month</span></p>
                <p className="mt-1 text-xs text-fg-subtle">{interval === 'yearly' ? `Billed ${inr(p.yearly)} yearly` : 'Billed monthly'} · {p.seats ? `${p.seats} seats` : 'Unlimited seats'}</p>
                <Button className="mt-5 w-full" variant={p.id === 'studio' ? 'accent' : 'secondary'} loading={busy === p.id} disabled={current || !b.configured} onClick={() => void subscribe(p.id)}>{current ? <><Check />Current plan</> : 'Choose plan'}</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── Notifications ── */
function NotificationsTab({ data, save }: { data: SettingsWorkspace; save: Save }) {
  const [n, setN] = useState(data.notifications);
  const [busy, setBusy] = useState(false);
  const keys = Object.keys(n);
  return (
    <Panel title="Notifications" description="Choose what you want to be told about" icon={Bell} actions={<Button loading={busy} onClick={async () => { setBusy(true); await save(() => settingsApi.updatePreferences({ notifications: n }), 'Notification preferences saved'); setBusy(false); }}>Save preferences</Button>}>
      {keys.length === 0 ? <EmptyState icon={<Bell />} title="No notification options yet" description="Options appear here as soon as your workspace has activity to report." />
        : <ul className="divide-y divide-line-soft">{keys.map((k) => <li key={k} className="py-3"><Checkbox label={label(k)} checked={!!n[k]} onChange={(e) => setN({ ...n, [k]: e.target.checked })} /></li>)}</ul>}
    </Panel>
  );
}

/* ── Security ── */
function SecurityTab({ save }: { save: Save }) {
  const [cur, setCur] = useState(''); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<{ cur?: string; pw?: string }>({});
  const submit = async () => {
    const next = { cur: cur ? undefined : 'Enter your current password.', pw: isStrongPassword(pw) ? undefined : 'Use at least 10 characters with upper and lower case letters and a number.' };
    setErr(next); if (next.cur || next.pw) return;
    setBusy(true);
    const ok = await save(() => settingsApi.changePassword({ currentPassword: cur, newPassword: pw }), 'Password changed — please sign in again', { reload: false });
    setBusy(false);
    if (ok) { setCur(''); setPw(''); window.location.assign('/login'); }
  };
  return (
    <Panel title="Password" description="You’ll be signed out everywhere once it changes." icon={KeyRound}>
      <div className="grid max-w-lg gap-5">
        <PasswordField label="Current password" name="current-password" value={cur} onChange={(v) => { setCur(v); setErr((e) => ({ ...e, cur: undefined })); }} error={err.cur} autoComplete="current-password" />
        <PasswordField label="New password" name="new-password" value={pw} onChange={(v) => { setPw(v); setErr((e) => ({ ...e, pw: undefined })); }} error={err.pw} autoComplete="new-password" showRules />
        <div><Button loading={busy} onClick={() => void submit()}>Change password</Button></div>
      </div>
    </Panel>
  );
}

/* ── API keys ── */
function ApiKeysTab() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKeyRow[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(''); const [scope, setScope] = useState<ApiKeyRow['scope']>('READ_ONLY'); const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const load = useCallback(async () => { setError(''); try { setKeys(await apiKeysApi.list()); } catch (e) { setError(errMsg(e, 'Unable to load API keys.')); } }, []);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (name.trim().length < 2) { toast({ tone: 'error', title: 'Give the key a name' }); return; }
    setCreating(true);
    try { const k = await apiKeysApi.create({ name: name.trim(), scope }); setCreated(k.key); setName(''); await load(); }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t create the key', description: errMsg(e, 'Please try again.') }); }
    finally { setCreating(false); }
  };
  const revoke = async (k: ApiKeyRow) => {
    if (!window.confirm(`Revoke “${k.name}”? Anything using it will stop working immediately.`)) return;
    try { await apiKeysApi.revoke(k.id); toast({ tone: 'success', title: 'Key revoked' }); await load(); } catch (e) { toast({ tone: 'error', title: 'Couldn’t revoke the key', description: errMsg(e, '') }); }
  };
  const close = (o: boolean) => { setOpen(o); if (!o) setCreated(null); };

  return (
    <Panel title="API keys" description="Programmatic access to your workspace data. Keys act as you and can be read-only." icon={KeyRound} actions={<Button onClick={() => setOpen(true)}>Create key</Button>}>
      {error ? <ErrorState title="Couldn’t load API keys" description={error} action={{ label: 'Retry', onClick: () => void load() }} />
        : !keys ? <Skeleton className="h-24" />
        : keys.length === 0 ? <EmptyState icon={<KeyRound />} title="No API keys yet" description="Create a key to connect Zapier, your website or your own scripts. Send it as a Bearer token." action={{ label: 'Create your first key', onClick: () => setOpen(true) }} />
        : (
          <Table>
            <THead><tr><TH>Name</TH><TH>Key</TH><TH>Access</TH><TH>Last used</TH><TH><span className="sr-only">Actions</span></TH></tr></THead>
            <TBody>
              {keys.map((k) => (
                <TR key={k.id}>
                  <TD><span className="font-medium">{k.name}</span><span className="block text-xs text-fg-subtle">Created {fmtDate(k.createdAt)}{k.createdBy ? ` by ${k.createdBy}` : ''}</span></TD>
                  <TD className="font-mono text-[13px] text-fg-muted">{k.prefix}…</TD>
                  <TD><Badge tone={k.revokedAt ? 'danger' : k.scope === 'FULL' ? 'warning' : 'neutral'}>{k.revokedAt ? 'Revoked' : k.scope === 'FULL' ? 'Read & write' : 'Read-only'}</Badge></TD>
                  <TD className="text-fg-muted">{fmtDate(k.lastUsedAt)}</TD>
                  <TD className="text-right">{!k.revokedAt && <Button size="sm" variant="ghost" onClick={() => void revoke(k)}>Revoke</Button>}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      <Dialog open={open} onOpenChange={close}>
        <DialogContent title={created ? 'Copy your key now' : 'Create API key'} description={created ? 'This is the only time it will be shown.' : 'Name it after what will use it.'}
          footer={created ? <Button onClick={() => close(false)}>Done</Button> : <><Button variant="ghost" onClick={() => close(false)}>Cancel</Button><Button loading={creating} onClick={() => void create()}>Create key</Button></>}>
          {created ? (
            <div className="space-y-3">
              <code className="block break-all rounded-[var(--radius-md)] border border-line bg-surface-sunken p-3 font-mono text-[13px]">{created}</code>
              <Button variant="secondary" size="sm" onClick={() => { void navigator.clipboard?.writeText(created); toast({ tone: 'success', title: 'Copied to clipboard' }); }}>Copy key</Button>
              <p className="text-xs text-fg-subtle">Store it somewhere safe. Use it as: <code className="font-mono">Authorization: Bearer {created.slice(0, 8)}…</code></p>
            </div>
          ) : (
            <div className="space-y-5">
              <Field label="Name" required>{(a) => <Input id={a.id} value={name} onChange={(e) => setName(e.target.value)} placeholder="Website enquiry sync" autoFocus />}</Field>
              <Field label="Access" hint="Read-only keys can fetch data but never change it.">{(a) => <Select id={a.id} value={scope} onChange={(e) => setScope(e.target.value as ApiKeyRow['scope'])}><option value="READ_ONLY">Read-only</option><option value="FULL">Read &amp; write</option></Select>}</Field>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

/* ── Access (module requests) ── */
function AccessTab({ data, admin, save }: { data: SettingsWorkspace; admin: boolean; save: Save }) {
  const [requesting, setRequesting] = useState<SettingsWorkspace['availableModules'][number] | null>(null);
  const [reviewing, setReviewing] = useState<ModuleAccessRequest | null>(null);
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const pending = useMemo(() => new Set(data.requests.filter((r) => r.status === 'PENDING').map((r) => r.moduleKey)), [data.requests]);
  const done = () => { setRequesting(null); setReviewing(null); setReason(''); };

  return (
    <div className="space-y-5">
      {admin ? (
        <Panel title="Module access requests" description="Review requests for additional modules" icon={ShieldCheck}>
          {data.requests.length === 0 ? <EmptyState icon={<ShieldCheck />} title="No requests yet" description="Employee access requests will appear here." /> : (
            <Table>
              <THead><tr><TH>Employee</TH><TH>Module</TH><TH>Reason</TH><TH>Status</TH><TH><span className="sr-only">Review</span></TH></tr></THead>
              <TBody>{data.requests.map((r) => (
                <TR key={r.id}><TD><span className="font-medium">{r.employeeName}</span><span className="block text-xs text-fg-subtle">{r.employeeEmail}</span></TD><TD>{r.moduleLabel}</TD><TD className="max-w-56 truncate text-fg-muted">{r.reason}</TD><TD><Badge tone={REQUEST_TONE[r.status]} dot>{r.status.toLowerCase()}</Badge></TD><TD className="text-right"><Button size="sm" variant="ghost" onClick={() => setReviewing(r)}>View</Button></TD></TR>
              ))}</TBody>
            </Table>
          )}
        </Panel>
      ) : (
        <Panel title="My module access" description="What you can use, and what you can ask for" icon={ShieldCheck}>
          <div className="grid gap-6 md:grid-cols-2">
            <div><h4 className="mb-3 text-sm font-medium">Access granted</h4>{data.grantedModules.length ? <ul className="flex flex-wrap gap-2">{data.grantedModules.map((m) => <li key={m.key}><Badge tone="success">{m.label}</Badge></li>)}</ul> : <p className="text-sm text-fg-muted">Nothing granted yet.</p>}</div>
            <div><h4 className="mb-3 text-sm font-medium">Available to request</h4>
              {data.availableModules.length ? <ul className="space-y-2">{data.availableModules.map((m) => <li key={m.key} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line-soft p-3"><div><p className="text-sm font-medium">{m.label}</p>{m.description && <p className="text-xs text-fg-subtle">{m.description}</p>}</div>{pending.has(m.key) ? <Badge tone="warning">Pending</Badge> : <Button size="sm" variant="secondary" onClick={() => setRequesting(m)}>Request</Button>}</li>)}</ul> : <p className="text-sm text-fg-muted">You already have everything available.</p>}
            </div>
          </div>
          {data.requests.length > 0 && <div className="mt-6 border-t border-line-soft pt-5"><h4 className="mb-3 text-sm font-medium">My requests</h4><ul className="space-y-2">{data.requests.map((r) => <li key={r.id} className="text-sm"><span className="font-medium">{r.moduleLabel}</span> <Badge tone={REQUEST_TONE[r.status]}>{r.status.toLowerCase()}</Badge><span className="ml-2 text-xs text-fg-subtle">{fmtDate(r.createdAt)}</span>{r.reviewReason && <p className="mt-0.5 text-xs text-fg-muted">{r.reviewerName ?? 'Reviewer'}: {r.reviewReason}</p>}</li>)}</ul></div>}
        </Panel>
      )}

      <Dialog open={!!requesting} onOpenChange={(o) => { if (!o) done(); }}>
        <DialogContent title={`Request ${requesting?.label ?? 'access'}`} description="Tell your administrator why you need it."
          footer={<><Button variant="ghost" onClick={done}>Cancel</Button><Button loading={busy} onClick={async () => { if (!requesting) return; setBusy(true); const ok = await save(async () => { if (!reason.trim()) throw new Error('Please enter a reason.'); await settingsApi.requestModule({ moduleKey: requesting.key, reason }); }, 'Access request submitted'); setBusy(false); if (ok) done(); }}>Send request</Button></>}>
          <Field label="Reason" required>{(a) => <Textarea id={a.id} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="I need this to…" />}</Field>
        </DialogContent>
      </Dialog>
      <Dialog open={!!reviewing} onOpenChange={(o) => { if (!o) done(); }}>
        <DialogContent title={reviewing ? `${reviewing.employeeName} · ${reviewing.moduleLabel}` : 'Request'} description={reviewing?.status === 'PENDING' ? 'Approving grants the permissions for this module.' : `Already ${reviewing?.status.toLowerCase()}`}
          footer={reviewing?.status === 'PENDING' ? <><Button variant="danger" loading={busy} onClick={async () => { setBusy(true); const ok = await save(() => settingsApi.reviewModuleRequest(reviewing.id, { status: 'REJECTED', reviewReason: reason }), 'Request rejected'); setBusy(false); if (ok) done(); }}>Reject</Button><Button loading={busy} onClick={async () => { setBusy(true); const ok = await save(() => settingsApi.reviewModuleRequest(reviewing.id, { status: 'APPROVED', reviewReason: reason }), 'Request approved'); setBusy(false); if (ok) done(); }}>Approve</Button></> : <Button onClick={done}>Close</Button>}>
          <p className="rounded-[var(--radius-md)] bg-surface-sunken p-3 text-sm text-fg-muted">“{reviewing?.reason}”</p>
          {reviewing?.status === 'PENDING' && <Field className="mt-4" label="Note to employee (optional)">{(a) => <Textarea id={a.id} value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />}</Field>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
