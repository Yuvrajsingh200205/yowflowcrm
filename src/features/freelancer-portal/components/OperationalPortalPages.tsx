'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CalendarDays, CheckCircle2, Loader2, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { freelancerPortalApi, PortalDashboard, PortalList, PortalNotification, PortalPayout, PortalProjectSummary, PortalShootSummary, PortalTaskSummary } from '@/lib/api/freelancerPortal';
import { getFreelancerProfileCompletion } from '../profileCompletion';
import { PortalCard, PortalState } from './FreelancerPortalShell';
import { BRAND } from '@/config/brand';

const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl bg-[#4F554C] px-4 py-2 text-sm font-black text-white transition hover:bg-[#42473F] disabled:opacity-60';
const muted = 'text-sm font-semibold leading-6 text-[#686164]';

function usePortalData<T>(load: () => Promise<T>) {
  const router = useRouter();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await load());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to load portal data.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); }, []);
  return { data, setData, loading, error, reload };
}

function PageChrome({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        {kicker ? <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#4F554C]">{kicker}</p> : null}
        <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function LoadingState() {
  return <PortalState title="Loading portal" text="Fetching the latest operational records." action={<Loader2 className="mx-auto size-5 animate-spin text-[#4F554C]" />} />;
}

function ErrorState({ text, retry }: { text: string; retry: () => void }) {
  return <PortalState title="Could not load this page" text={text} action={<button className={btn} onClick={retry}>Retry</button>} />;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <PortalState title={title} text={text} />;
}

function fmtDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';
}

function fmtTime(value?: string | null) {
  return value ? new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Not set';
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full bg-[#F0EDE9] px-2.5 py-1 text-xs font-black text-[#31342F]">{children}</span>;
}

function ShootCard({ shoot }: { shoot: PortalShootSummary }) {
  return (
    <PortalCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href={`/freelancer/shoots/${shoot.id}`} className="font-black text-[#302C2E] hover:text-[#4F554C]">{shoot.title}</Link>
          <p className={muted}>{shoot.project?.name ?? 'Project'} · {fmtDate(shoot.shootDate)}</p>
        </div>
        <Pill>{shoot.assignment?.role?.replaceAll('_', ' ') ?? shoot.status}</Pill>
      </div>
      <p className="mt-3 text-sm font-bold text-[#686164]">{fmtTime(shoot.startTime)} - {fmtTime(shoot.endTime)} · {shoot.location || shoot.city || 'Location pending'}</p>
    </PortalCard>
  );
}

function TaskCard({ task, onUpdated }: { task: PortalTaskSummary; onUpdated?: (task: PortalTaskSummary) => void }) {
  const [saving, setSaving] = useState(false);
  const update = async (status: string) => {
    setSaving(true);
    try {
      onUpdated?.(await freelancerPortalApi.updateTaskStatus(task.id, status));
    } finally {
      setSaving(false);
    }
  };
  return (
    <PortalCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black">{task.title}</p>
          <p className={muted}>{task.project?.name ?? 'Project'}{task.shoot ? ` · ${task.shoot.title}` : ''}</p>
        </div>
        <Pill>{task.status.replaceAll('_', ' ')}</Pill>
      </div>
      {task.description ? <p className="mt-3 text-sm leading-6 text-[#686164]">{task.description}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[#686164]">
        <span>Priority: {task.priority}</span>
        <span>Due: {fmtDate(task.dueDate)}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button disabled={saving} onClick={() => update('IN_PROGRESS')} className="rounded-xl border border-[#DFD9D2] bg-white px-3 py-2 text-xs font-black text-[#31342F] disabled:opacity-60">Start</button>
        <button disabled={saving} onClick={() => update('IN_REVIEW')} className="rounded-xl border border-[#DFD9D2] bg-white px-3 py-2 text-xs font-black text-[#31342F] disabled:opacity-60">Review</button>
        <button disabled={saving} onClick={() => update('COMPLETED')} className="rounded-xl bg-[#527A68] px-3 py-2 text-xs font-black text-white disabled:opacity-60">Done</button>
      </div>
    </PortalCard>
  );
}

export function OperationalDashboardPage() {
  const { data, loading, error, reload } = usePortalData<PortalDashboard>(() => freelancerPortalApi.dashboard());
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No dashboard data available.'} retry={reload} />;
  const profile = data.profile.freelancer;
  const completion = getFreelancerProfileCompletion(profile);
  return (
    <PageChrome title={`Welcome, ${profile.fullName}`} kicker="Freelancer Portal">
      <div className="grid gap-4 md:grid-cols-3">
        <PortalCard><p className="text-sm font-black">Profile</p><p className="mt-2 text-2xl font-black">{completion.percentage}%</p><p className={muted}>{profile.status} · {data.profile.searchable ? 'Searchable' : 'Not searchable'}</p></PortalCard>
        <PortalCard><p className="text-sm font-black">Subscription</p><p className="mt-2 text-2xl font-black">{data.subscription?.plan.name ?? 'No plan'}</p><p className={muted}>{data.subscription?.status ?? 'No active subscription'}</p></PortalCard>
        <PortalCard><p className="text-sm font-black">Payments</p><p className="mt-2 text-2xl font-black">{data.payments.summary.currency} {data.payments.summary.paidAmount.toLocaleString('en-IN')}</p><p className={muted}>Actual recorded payouts only</p></PortalCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <PortalCard>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-black">Today's work</h2><CalendarDays className="size-4 text-[#4F554C]" /></div>
          {data.todaysWork.shoots.length || data.todaysWork.tasks.length ? <div className="space-y-3">{data.todaysWork.shoots.map((shoot) => <ShootCard key={shoot.id} shoot={shoot} />)}{data.todaysWork.tasks.map((task) => <p key={task.id} className={muted}>{task.title}</p>)}</div> : <p className={muted}>No shoots or tasks scheduled for today.</p>}
        </PortalCard>
        <PortalCard>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-black">Notifications</h2><Bell className="size-4 text-[#4F554C]" /></div>
          {data.notifications.length ? <div className="space-y-3">{data.notifications.map((item) => <p key={item.id} className={muted}><span className="font-black text-[#302C2E]">{item.title}</span><br />{item.message}</p>)}</div> : <p className={muted}>No portal notifications yet.</p>}
        </PortalCard>
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-black">Upcoming shoots</h2><Link className="text-sm font-black text-[#4F554C]" href="/freelancer/shoots">View all</Link></div>
        {data.upcomingShoots.length ? data.upcomingShoots.map((shoot) => <ShootCard key={shoot.id} shoot={shoot} />) : <EmptyState title="No upcoming shoots" text="Assigned shoots will appear here after the studio schedules you." />}
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-black">Open tasks</h2><Link className="text-sm font-black text-[#4F554C]" href="/freelancer/tasks">View all</Link></div>
        {data.tasks.length ? data.tasks.map((task) => <TaskCard key={task.id} task={task} />) : <EmptyState title="No open tasks" text="Operational tasks linked to your assigned work will appear here." />}
      </section>
    </PageChrome>
  );
}

export function ProjectsPage() {
  const { data, loading, error, reload } = usePortalData<PortalList<PortalProjectSummary & { shoots?: Array<{ id: string; title: string; shootDate: string; status: string }> }>>(() => freelancerPortalApi.projects('?limit=20'));
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No project data available.'} retry={reload} />;
  return <PageChrome title="My projects">{data.items.length ? data.items.map((project) => <PortalCard key={project.id}><Link href={`/freelancer/projects/${project.id}`} className="font-black hover:text-[#4F554C]">{project.name}</Link><p className={muted}>{project.type} · {fmtDate(project.weddingDate)} · {project.venueCity || 'City pending'}</p><div className="mt-3 flex flex-wrap gap-2"><Pill>{project.status}</Pill><Pill>{project.shoots?.length ?? 0} assigned shoots</Pill></div></PortalCard>) : <EmptyState title="No projects yet" text="Projects appear only when you are connected or assigned to operational work." />}</PageChrome>;
}

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { data, loading, error, reload } = usePortalData(() => freelancerPortalApi.project(projectId));
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'Project unavailable.'} retry={reload} />;
  return <PageChrome title={data.name} kicker={data.projectNumber}><PortalCard><p className={muted}>{data.type} · {fmtDate(data.weddingDate)} · {data.venueName || data.venueCity || 'Location pending'}</p></PortalCard><section className="space-y-3"><h2 className="font-black">Assigned shoots</h2>{data.shoots.length ? data.shoots.map((shoot) => <ShootCard key={shoot.id} shoot={shoot} />) : <EmptyState title="No assigned shoots" text="You are connected to this project, but no shoot assignment is visible yet." />}</section><section className="space-y-3"><h2 className="font-black">Tasks</h2>{data.tasks.length ? data.tasks.map((task) => <TaskCard key={task.id} task={task} />) : <EmptyState title="No tasks" text="No visible tasks are linked to your project work." />}</section></PageChrome>;
}

export function ShootsPage() {
  const [view, setView] = useState('upcoming');
  const { data, loading, error, reload } = usePortalData<PortalList<PortalShootSummary>>(() => freelancerPortalApi.shoots(`?view=${view}&limit=20`));
  useEffect(() => { void reload(); }, [view]);
  if (loading && !data) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No shoot data available.'} retry={reload} />;
  return <PageChrome title="My shoots"><div className="flex flex-wrap gap-2">{['upcoming', 'today', 'completed', 'all'].map((item) => <button key={item} onClick={() => setView(item)} className={`rounded-xl px-3 py-2 text-xs font-black ${view === item ? 'bg-[#4F554C] text-white' : 'border border-[#DFD9D2] bg-white text-[#31342F]'}`}>{item}</button>)}</div>{data.items.length ? data.items.map((shoot) => <ShootCard key={shoot.id} shoot={shoot} />) : <EmptyState title="No shoots" text="Only shoots assigned to you through ShootAssignment are shown here." />}</PageChrome>;
}

export function ShootDetailPage({ shootId }: { shootId: string }) {
  const { data, loading, error, reload } = usePortalData(() => freelancerPortalApi.shoot(shootId));
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'Shoot unavailable.'} retry={reload} />;
  return <PageChrome title={data.title} kicker={data.project?.name}><PortalCard><div className="grid gap-2 text-sm font-bold text-[#686164] sm:grid-cols-2"><p>Date: {fmtDate(data.shootDate)}</p><p>Time: {fmtTime(data.startTime)} - {fmtTime(data.endTime)}</p><p>Location: {data.location || data.city || 'Pending'}</p><p>Status: {data.status}</p><p>Role: {data.assignment?.role?.replaceAll('_', ' ') ?? 'Assigned crew'}</p><p>Assignment: {data.assignment?.status ?? 'ASSIGNED'}</p></div></PortalCard><PortalCard><h2 className="font-black">Crew</h2><div className="mt-3 space-y-2">{data.crew?.map((member) => <p key={member.id} className={muted}>{member.displayName}{member.isSelf ? ' · You' : ''} · {member.role.replaceAll('_', ' ')}</p>)}</div></PortalCard>{data.notes ? <PortalCard><h2 className="font-black">Instructions</h2><p className={muted}>{data.notes}</p></PortalCard> : null}<section className="space-y-3"><h2 className="font-black">Tasks</h2>{data.tasks.length ? data.tasks.map((task) => <TaskCard key={task.id} task={task} />) : <EmptyState title="No shoot tasks" text="No visible tasks are linked to this shoot yet." />}</section></PageChrome>;
}

export function TasksPage() {
  const { data, setData, loading, error, reload } = usePortalData<PortalList<PortalTaskSummary>>(() => freelancerPortalApi.tasks('?limit=30'));
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No task data available.'} retry={reload} />;
  const update = (task: PortalTaskSummary) => setData({ ...data, items: data.items.map((item) => item.id === task.id ? task : item) });
  return <PageChrome title="My tasks">{data.items.length ? data.items.map((task) => <TaskCard key={task.id} task={task} onUpdated={update} />) : <EmptyState title="No tasks" text="Tasks linked to your assigned shoots or connected projects will appear here." />}</PageChrome>;
}

export function PaymentsPage() {
  const { data, loading, error, reload } = usePortalData<PortalList<PortalPayout>>(() => freelancerPortalApi.payments('?limit=30'));
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No payment data available.'} retry={reload} />;
  return <PageChrome title="Payments">{data.items.length ? data.items.map((payment) => <PortalCard key={payment.id}><div className="flex flex-wrap justify-between gap-3"><p className="font-black">INR {Number(payment.amount).toLocaleString('en-IN')}</p><Pill>{payment.paymentMethod}</Pill></div><p className={muted}>{fmtDate(payment.paymentDate)} · {payment.assignment?.shoot?.title ?? 'Freelancer payout'}</p>{payment.transactionRef ? <p className="mt-2 text-xs font-bold text-[#686164]">Reference: {payment.transactionRef}</p> : null}</PortalCard>) : <EmptyState title="No payouts" text="Actual freelancer payout records will appear here when the studio records them." />}</PageChrome>;
}

export function NotificationsPage() {
  const { data, loading, error, reload } = usePortalData<PortalList<PortalNotification>>(() => freelancerPortalApi.notifications('?limit=30'));
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState text={error || 'No notifications available.'} retry={reload} />;
  return <PageChrome title="Notifications">{data.items.length ? data.items.map((item) => <PortalCard key={item.id}><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#4F554C]/10 text-[#4F554C]">{item.isRead ? <CheckCircle2 className="size-4" /> : <Bell className="size-4" />}</span><div><p className="font-black">{item.title}</p><p className={muted}>{item.message}</p><p className="mt-1 text-xs font-bold text-[#686164]">{fmtDate(item.createdAt)}</p></div></div></PortalCard>) : <EmptyState title="No notifications" text="Freelancer-relevant notifications will appear here when the CRM creates them for your linked identity." />}</PageChrome>;
}

export function VendorSearchPage() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('all');
  const [searched, setSearched] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearched(true);
  };

  const reset = () => {
    setQuery('');
    setLocation('');
    setCategory('all');
    setSearched(false);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-[#1F211E] to-[#272A26] p-6 text-white shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.14em] text-[#B6E25D]">{BRAND.name}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Find Vendor</h1>
        <p className="mt-2 max-w-2xl text-base font-medium leading-6 text-white/65">Search vendors from your freelancer network.</p>
      </section>

      <PortalCard>
        <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]">
          <label>
            <span className="text-xs font-black uppercase tracking-[.14em] text-[#373B35]">Search</span>
            <span className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-[#DFD9D2] bg-white px-3 focus-within:border-[#4F554C]">
              <Search className="size-4 shrink-0 text-[#4F554C]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                placeholder="Name, email, phone or service"
              />
            </span>
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[.14em] text-[#373B35]">Location</span>
            <span className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-[#DFD9D2] bg-white px-3 focus-within:border-[#4F554C]">
              <MapPin className="size-4 shrink-0 text-[#4F554C]" />
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
                placeholder="City"
              />
            </span>
          </label>
          <label>
            <span className="text-xs font-black uppercase tracking-[.14em] text-[#373B35]">Category</span>
            <span className="mt-2 flex min-h-12 items-center gap-2 rounded-xl border border-[#DFD9D2] bg-white px-3 focus-within:border-[#4F554C]">
              <SlidersHorizontal className="size-4 shrink-0 text-[#4F554C]" />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold outline-none"
              >
                <option value="all">All categories</option>
                <option value="decorator">Decorator</option>
                <option value="makeup">Makeup Artist</option>
                <option value="venue">Venue</option>
                <option value="transport">Transport</option>
                <option value="catering">Catering</option>
                <option value="other">Other</option>
              </select>
            </span>
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className={`${btn} w-full lg:w-auto`}><Search className="mr-2 size-4" />Search</button>
            {(query || location || category !== 'all' || searched) ? <button type="button" onClick={reset} className="min-h-11 rounded-xl border border-[#DFD9D2] bg-white px-4 text-sm font-black text-[#31342F]">Clear</button> : null}
          </div>
        </form>
      </PortalCard>

      <PortalState
        title={searched ? 'No vendors match these filters' : 'Search vendors'}
        text={searched ? 'No vendor directory records are available for this search yet.' : 'Enter a name, service, email, phone or city to find vendors when studio vendor records are available.'}
      />
    </div>
  );
}
