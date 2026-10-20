'use client';

import React, { useMemo, useState } from 'react';
import {
  Album,
  Banknote,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Film,
  FolderKanban,
  HardDrive,
  Heart,
  Image as ImageIcon,
  IndianRupee,
  LayoutDashboard,
  ShieldAlert,
  Target,
  UserCheck,
  Users,
  Video,
} from 'lucide-react';
import { AttendanceRecord, FreelancerPayment, LeadStatus, Project, TeamMember, TeamTask } from '@/types';
import { TabType } from '@/components/layout/Header';
import { Badge, BTN_GHOST, BTN_PRIMARY, CARD, EmptyState, KpiCard } from '@/features/team/components/TeamUiKit';
import { PermissionGuard, usePermission } from '@/features/access';
import { RoleDashboards } from './RoleDashboards';
import { MyAttendanceCard } from '@/features/attendance/MyAttendanceCard';
import { TaskWorkspacePanel } from '@/features/tasks/TaskWorkspacePanel';
import { PersonalTodoPanel } from '@/features/tasks/PersonalTodoPanel';
import { useLeads } from '@/hooks/useLeads';
import { WORKSPACE_COPY, workspaceKind } from '../workspaceKind';
import {
  myTasks,
  ownPayments,
  paymentPending,
  presentCount,
  projectHealth,
  teamBuckets,
  todayShoots,
  upcomingShoots,
  visibleProjects,
  visibleShoots,
} from '../workspaceScope';

type HubTab = 'desk' | 'classic';

interface Props {
  team: TeamMember[];
  projects: Project[];
  attendance: AttendanceRecord[];
  tasks: TeamTask[];
  payments?: FreelancerPayment[];
  onUpdateTeamMember: (member: TeamMember) => void;
  onRecordAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onAddTask: (task: TeamTask) => void;
  onUpdateTask: (task: TeamTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onSelectProject?: (project: Project, roleContext?: string) => void;
  onOpenNewProjectModal?: () => void;
  onSaveProject?: (project: Project) => void;
  onOpenAllPaymentsModal?: () => void;
  setActiveTab?: (tab: TabType) => void;
  currentUser?: TeamMember | { id: string; name: string; role: string; email: string } | null;
}

const Denied = () => (
  <div className={CARD}>
    <EmptyState icon={ShieldAlert} title="You don't have permission to access this section." message="Ask an Admin to update your role in Roles & Permissions." />
  </div>
);

const API_STATUS_TO_UI: Record<string, LeadStatus> = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'meeting_fixed',
  PROPOSAL_SENT: 'quotation_sent',
  NEGOTIATION: 'quotation_sent',
  WON: 'booked',
  LOST: 'lost',
};

export const RoleWorkspaceHub: React.FC<Props> = (props) => {
  const { currentUser, projects, tasks, attendance, team, setActiveTab, onSelectProject, payments = [] } = props;
  const { can, role, roles } = usePermission();
  const [hubTab, setHubTab] = useState<HubTab>('desk');
  const user = currentUser;
  const userRoles = user && 'roles' in user && Array.isArray((user as { roles?: string[] }).roles)
    ? (user as { roles: string[] }).roles
    : undefined;
  const kind = workspaceKind(role, user && 'role' in user ? user.role : undefined, userRoles);
  const copy = WORKSPACE_COPY[kind];

  const weddingRows = useMemo(() => visibleProjects(projects, user, roles, 'weddings.view'), [projects, user, roles]);
  const shootRows = useMemo(() => visibleShoots(projects, user, roles), [projects, user, roles]);
  const assignedTasks = useMemo(() => myTasks(tasks, user), [tasks, user]);
  const todays = useMemo(() => todayShoots(shootRows), [shootRows]);
  const upcoming = useMemo(() => upcomingShoots(shootRows), [shootRows]);
  const minePay = useMemo(() => ownPayments(payments, user), [payments, user]);
  const health = projectHealth(weddingRows);
  const crew = teamBuckets(team);
  const today = new Date().toISOString().slice(0, 10);
  const canManageTeam = can('employees.view') || can('attendance.manage');
  const canManageTaskWorkspace = can('tasks.create');
  const isEmployeeAttendanceUser = !/(^|\W)(admin|owner)(\W|$)/i.test(String(user?.role || ''));
  const leadQuery = useLeads({ limit: 100 }, can('leads.view'));
  const leads = useMemo(() => leadQuery.data.map((lead) => ({
    id: lead.id,
    status: API_STATUS_TO_UI[lead.status] || 'new',
    assignedTo: lead.owner?.fullName,
    createdBy: lead.createdBy?.fullName,
  })).filter((lead) => {
    const scope = role?.grants['leads.view']?.scope || 'all';
    if (scope === 'all') return true;
    return (lead.assignedTo && user?.name && lead.assignedTo.toLowerCase().includes(user.name.toLowerCase())) ||
      (lead.createdBy && user?.name && lead.createdBy.toLowerCase().includes(user.name.toLowerCase()));
  }), [leadQuery.data, role, user]);

  const shortcuts = [
    { label: 'Dashboard', tab: 'dashboard' as TabType, icon: LayoutDashboard, key: 'dashboard.view' },
    { label: 'Weddings', tab: 'projects' as TabType, icon: FolderKanban, key: 'weddings.view' },
    { label: 'Shoots', tab: 'shoots' as TabType, icon: Film, key: 'shoots.view' },
    { label: 'Clients', tab: 'clients' as TabType, icon: Heart, key: 'clients.view' },
    { label: 'Leads', tab: 'leads' as TabType, icon: Target, key: 'leads.view' },
    { label: 'Media', tab: 'deliveries' as TabType, icon: ImageIcon, key: 'media.view_photos' },
    { label: 'Gallery', tab: 'deliveries' as TabType, icon: Album, key: 'gallery.view' },
    { label: 'Finance', tab: 'expenses' as TabType, icon: IndianRupee, key: 'finance.view_payments' },
    { label: 'Expenses', tab: 'expenses' as TabType, icon: Banknote, key: 'finance.manage_expenses' },
    { label: 'Reports', tab: 'dashboard' as TabType, icon: FolderKanban, key: 'reports.view' },
    { label: 'Data Management', tab: 'data' as TabType, icon: HardDrive, key: 'data.view' },
    { label: 'Team', tab: 'team' as TabType, icon: Users, key: 'employees.view' },
    { label: 'Freelancers', tab: 'freelancers' as TabType, icon: UserCheck, key: 'freelancers.view' },
  ].filter((item) => can(item.key));

  if (!can('dashboard.view') && kind !== 'client') {
    return <Denied />;
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#ddc89c]/35 bg-[radial-gradient(circle_at_88%_8%,rgba(221,200,156,.2),transparent_30%),linear-gradient(125deg,#33514A,#55333f_50%,#1b2825)] p-5 text-white shadow-xl sm:p-7">
        <div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[34px] border-white/[.04]" />
        <div className="relative">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#e0ece9]">
            {copy.eyebrow}
          </span>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl">
            {kind === 'client' ? `Welcome, ${user?.name || 'Guest'}` : copy.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-[#dfeae7]">{copy.blurb}</p>
          <p className="mt-2 text-xs font-bold text-[#ddc89c]">Access from Admin · {role?.name || 'Employee'} · records follow your scope</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={hubTab === 'desk' ? BTN_PRIMARY : BTN_GHOST} onClick={() => setHubTab('desk')}>
          <LayoutDashboard className="size-3.5" /> My Desk
        </button>
        {kind !== 'client' && (
          <button type="button" className={hubTab === 'classic' ? BTN_PRIMARY : BTN_GHOST} onClick={() => setHubTab('classic')}>
            Classic workspace
          </button>
        )}
      </div>

      {hubTab === 'classic' ? (
        <RoleDashboards {...props} />
      ) : (
        <>
          {shortcuts.length > 0 && kind !== 'client' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
              {shortcuts.map((item) => (
                <button key={item.label} type="button" onClick={() => setActiveTab?.(item.tab)} className={`${CARD} p-3 text-left hover:border-rose-200`}>
                  <item.icon className="mb-2 size-4 text-[#2f5f54]" />
                  <p className="text-xs font-extrabold text-slate-800">{item.label}</p>
                </button>
              ))}
            </div>
          )}

          {user?.id && isEmployeeAttendanceUser && can('attendance.mark') && can('dashboard.view_attendance') && <MyAttendanceCard userId={user.id} canView={can('attendance.view')} />}

          {kind !== 'client' && (
            <div className="grid gap-5 lg:grid-cols-2">
              {can('tasks.view') && can('dashboard.view_tasks') && (
                <TaskWorkspacePanel
                  tasks={canManageTaskWorkspace ? tasks : assignedTasks}
                  title={canManageTaskWorkspace ? 'Team task progress' : "Today's assigned tasks"}
                  description={canManageTaskWorkspace ? 'Assignments and employee progress update from the same task records.' : 'Keep your assigned work up to date so your manager can track progress.'}
                  showAssignee={canManageTaskWorkspace}
                  canUpdate={can('tasks.change_status')}
                  onUpdate={props.onUpdateTask}
                />
              )}
              {can('dashboard.view_todos') && <PersonalTodoPanel />}
            </div>
          )}

          {kind === 'manager' && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Today's Shoots" value={todays.length} hint="On the floor today" icon={Camera} tone="rose" onClick={() => setActiveTab?.('shoots')} />
                <KpiCard label="Active Weddings" value={weddingRows.filter((p) => p.status === 'running' || p.status === 'urgent').length} hint="Work in progress" icon={FolderKanban} tone="amber" onClick={() => setActiveTab?.('projects')} />
                <KpiCard label="Pending Tasks" value={assignedTasks.filter((t) => t.status !== 'completed').length} hint="Team follow-ups" icon={Clock3} tone="blue" />
                {canManageTeam && <KpiCard label="Team In Today" value={presentCount(attendance, team)} hint="Present / on shoot" icon={Users} tone="emerald" onClick={() => setActiveTab?.('team')} />}
              </div>
              <PipelineCard projects={weddingRows} onOpen={onSelectProject} />
              <div className="grid gap-4 lg:grid-cols-2">
                {canManageTeam && <section className={`${CARD} p-5`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Team status</h3>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {[
                      ['Available', crew.available],
                      ['Working', crew.working],
                      ['Assigned', crew.assigned],
                      ['On Leave', crew.leave],
                      ['Freelance', crew.freelancer],
                    ].map(([label, n]) => (
                      <div key={String(label)} className="rounded-2xl bg-[#fbfaf8] p-2 text-center">
                        <p className="text-lg font-black">{n}</p>
                        <p className="text-[9px] font-extrabold uppercase text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </section>}
                <section className={`${CARD} p-5`}>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Project health</h3>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-[10px] font-extrabold uppercase text-emerald-700">On Track</p><p className="text-xl font-black">{health.onTrack}</p></div>
                    <div className="rounded-2xl bg-amber-50 p-3"><p className="text-[10px] font-extrabold uppercase text-amber-700">At Risk</p><p className="text-xl font-black">{health.atRisk}</p></div>
                    <div className="rounded-2xl bg-rose-50 p-3"><p className="text-[10px] font-extrabold uppercase text-rose-700">Delayed</p><p className="text-xl font-black">{health.delayed}</p></div>
                  </div>
                </section>
              </div>
              <ScheduleCard rows={upcoming} onOpen={onSelectProject} />
            </>
          )}

          {kind === 'employee' && (
            <>
              <p className="text-lg font-black text-slate-900">Good {greeting()}, {user?.name || 'teammate'}</p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Today's Tasks" value={assignedTasks.filter((t) => t.dueDate === today).length} icon={CheckCircle2} tone="rose" />
                <KpiCard label="Today's Shoots" value={todays.length} icon={Camera} tone="amber" />
                <KpiCard label="Open Tasks" value={assignedTasks.filter((t) => t.status !== 'completed').length} icon={Clock3} tone="blue" />
                <KpiCard label="Attendance" value={can('attendance.mark') ? 'My Attendance' : 'Unavailable'} icon={UserCheck} tone="emerald" />
              </div>
              <ScheduleCard rows={upcoming} onOpen={onSelectProject} />
            </>
          )}

          {kind === 'freelancer' && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Upcoming Shoots" value={upcoming.length} icon={CalendarDays} tone="rose" />
                <KpiCard label="Active Jobs" value={shootRows.filter((r) => r.shoot.status === 'scheduled').length} icon={Film} tone="amber" />
                <KpiCard label="Deliverables" value={assignedTasks.filter((t) => t.status !== 'completed').length} icon={Clock3} tone="blue" />
                <KpiCard label="Pending Pay" value={minePay.filter(paymentPending).length} icon={IndianRupee} tone="red" />
              </div>
              <ScheduleCard rows={upcoming} onOpen={onSelectProject} empty="No assigned shoots." />
              <PayCard rows={minePay} />
            </>
          )}

          {(kind === 'photographer' || kind === 'cinematographer') && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Today's Shoot" value={todays.length} icon={kind === 'photographer' ? Camera : Video} tone="rose" />
                <KpiCard label="Upcoming" value={upcoming.length} icon={CalendarDays} tone="amber" />
                <KpiCard label="Assigned Weddings" value={weddingRows.length} icon={Heart} tone="violet" />
                <KpiCard label="Uploads" value={can('media.upload_photos') || can('media.upload_videos') ? 'Allowed' : 'Off'} hint="From Admin permissions" icon={ImageIcon} tone="stone" />
              </div>
              <ShootBoard rows={upcoming} kind={kind} onOpen={onSelectProject} />
            </>
          )}

          {(kind === 'photo_editor' || kind === 'video_editor') && (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Assigned Jobs" value={assignedTasks.length} icon={Film} tone="rose" />
                <KpiCard label="In Progress" value={assignedTasks.filter((t) => t.status === 'in_progress').length} icon={Clock3} tone="amber" />
                <KpiCard label="In Review" value={assignedTasks.filter((t) => t.status === 'review').length} icon={CheckCircle2} tone="blue" />
                <KpiCard label="Completed" value={assignedTasks.filter((t) => t.status === 'completed').length} icon={Album} tone="emerald" />
              </div>
              <EditPipeline tasks={assignedTasks} video={kind === 'video_editor'} />
            </>
          )}

          {kind === 'sales' && (
            <PermissionGuard permission="leads.view" fallback={<Denied />}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="New Leads" value={leads.filter((l) => l.status === 'new').length} icon={Target} tone="rose" onClick={() => setActiveTab?.('leads')} />
                <KpiCard label="Follow-ups" value={leads.filter((l) => l.status === 'contacted' || l.status === 'meeting_fixed').length} icon={Clock3} tone="amber" />
                <KpiCard label="Quotations" value={leads.filter((l) => l.status === 'quotation_sent').length} icon={FolderKanban} tone="blue" />
                <KpiCard label="Won" value={leads.filter((l) => l.status === 'booked').length} icon={CheckCircle2} tone="emerald" />
              </div>
              <section className={`${CARD} p-5`}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Lead pipeline</h3>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
                  {[
                    ['New', 'new'],
                    ['Contacted', 'contacted'],
                    ['Meeting', 'meeting_fixed'],
                    ['Quotation', 'quotation_sent'],
                    ['Won', 'booked'],
                    ['Lost', 'lost'],
                  ].map(([label, status]) => (
                    <div key={status} className="rounded-2xl bg-[#fbfaf8] p-3">
                      <p className="text-[10px] font-extrabold uppercase text-slate-400">{label}</p>
                      <p className="mt-1 text-xl font-black">{leads.filter((l) => l.status === status).length}</p>
                    </div>
                  ))}
                </div>
                <button type="button" className={`${BTN_PRIMARY} mt-4`} onClick={() => setActiveTab?.('leads')}>Open Leads</button>
              </section>
            </PermissionGuard>
          )}

          {kind === 'finance' && (
            <PermissionGuard permission="finance.view_payments" fallback={<Denied />}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Package Value" value={money(weddingRows.reduce((s, p) => s + (p.totalBudget || 0), 0))} icon={IndianRupee} tone="rose" />
                <KpiCard label="Collected" value={money(weddingRows.reduce((s, p) => s + (p.advanceReceived || 0), 0))} icon={CheckCircle2} tone="emerald" />
                <KpiCard label="Outstanding" value={money(weddingRows.reduce((s, p) => s + (p.balanceDue || 0), 0))} icon={Clock3} tone="red" />
                <KpiCard label="Freelancer Pay" value={payments.filter(paymentPending).length} hint="Pending payouts" icon={Banknote} tone="amber" onClick={() => can('freelancers.manage_payments') && setActiveTab?.('freelancers')} />
              </div>
              <div className="flex flex-wrap gap-2">
                <PermissionGuard permission="finance.manage_expenses">
                  <button type="button" className={BTN_PRIMARY} onClick={() => setActiveTab?.('expenses')}>Expenses</button>
                </PermissionGuard>
                <PermissionGuard permission="finance.view_payments">
                  <button type="button" className={BTN_GHOST} onClick={() => props.onOpenAllPaymentsModal?.()}>Client payments</button>
                </PermissionGuard>
              </div>
            </PermissionGuard>
          )}

          {kind === 'hr' && (
            <PermissionGuard permission="employees.view" fallback={<Denied />}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard label="Employees" value={team.length} icon={Users} tone="rose" onClick={() => setActiveTab?.('team')} />
                <KpiCard label="Present Today" value={presentCount(attendance, team)} icon={UserCheck} tone="emerald" />
                <KpiCard label="On Leave" value={crew.leave} icon={CalendarDays} tone="amber" />
                <KpiCard label="WFH" value={team.filter((m) => m.availabilityStatus === 'WFH' || m.attendanceMode === 'WFH').length} icon={Heart} tone="violet" />
              </div>
            </PermissionGuard>
          )}

          {kind === 'client' && <ClientHome projects={weddingRows} userName={user?.name} onOpen={onSelectProject} />}

          {kind === 'admin' && (
            <div className={`${CARD} p-5`}>
              <p className="text-sm font-extrabold text-slate-900">Admin Panel is the main workspace.</p>
              <p className="mt-1 text-xs text-slate-500">Use Dashboard, Projects, Roles & Permissions from the sidebar. This desk is for other studio roles.</p>
              <button type="button" className={`${BTN_PRIMARY} mt-3`} onClick={() => setActiveTab?.('dashboard')}>Open Admin Dashboard</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function money(n: number) {
  return `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
}

function PipelineCard({ projects, onOpen }: { projects: Project[]; onOpen?: (p: Project) => void }) {
  const buckets = [
    { label: 'Upcoming', items: projects.filter((p) => p.status === 'new_project' || p.status === 'pending') },
    { label: 'Active', items: projects.filter((p) => p.status === 'running' || p.status === 'urgent') },
    { label: 'Editing', items: projects.filter((p) => p.photoPipeline?.colorGradingRetouching === 'in_progress' || p.videoPipeline?.highlights === 'in_progress') },
    { label: 'Review', items: projects.filter((p) => p.photoPipeline?.cullingSelection === 'client_review' || p.videoPipeline?.teaser === 'client_review') },
    { label: 'Completed', items: projects.filter((p) => p.status === 'completed' || p.status === 'ready_to_deliver') },
  ];
  return (
    <section className={`${CARD} p-5`}>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Wedding pipeline</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {buckets.map((b) => (
          <div key={b.label} className="rounded-2xl bg-[#fbfaf8] p-3">
            <p className="text-[10px] font-extrabold uppercase text-slate-400">{b.label}</p>
            <p className="mt-1 text-xl font-black">{b.items.length}</p>
            <div className="mt-2 space-y-1">
              {b.items.slice(0, 2).map((p) => (
                <button key={p.id} type="button" onClick={() => onOpen?.(p)} className="block w-full truncate text-left text-[11px] font-bold text-[#2f5f54]">
                  {p.clientWeddingTitle}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScheduleCard({
  rows,
  onOpen,
  empty = 'No upcoming assigned shoots.',
}: {
  rows: { project: Project; shoot: import('@/types').ShootEvent }[];
  onOpen?: (p: Project) => void;
  empty?: string;
}) {
  return (
    <section className={`${CARD} p-5`}>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">Today's schedule</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="mt-3 space-y-2">
          {rows.slice(0, 6).map(({ project, shoot }) => (
            <button key={`${project.id}-${shoot.id}`} type="button" onClick={() => onOpen?.(project)} className="flex w-full items-center justify-between rounded-2xl border border-[#eee7e2] bg-[#fbfaf8] px-3 py-2.5 text-left">
              <span>
                <span className="block text-xs font-extrabold text-slate-900">{shoot.title}</span>
                <span className="text-[11px] text-slate-500">{project.clientWeddingTitle} · {shoot.location || shoot.venue || project.venueLocation} · {shoot.time || shoot.startTime || 'TBC'}</span>
              </span>
              <Badge>{shoot.date}</Badge>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function TaskCard({
  tasks,
  canEdit,
  onUpdate,
}: {
  tasks: TeamTask[];
  canEdit?: boolean;
  onUpdate?: (task: TeamTask) => void;
}) {
  return (
    <section className={`${CARD} p-5`}>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">My tasks</h3>
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No assigned tasks.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {tasks.slice(0, 8).map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#eee7e2] px-3 py-2.5">
              <div>
                <p className="text-xs font-extrabold text-slate-900">{task.title}</p>
                <p className="text-[11px] text-slate-500">{task.projectTitle || 'Studio'} · {task.dueDate} · {task.priority}</p>
              </div>
              {canEdit && onUpdate ? (
                <select
                  className="rounded-lg border border-[#ded5cf] bg-white px-2 py-1 text-[11px] font-bold"
                  value={task.status}
                  onChange={(e) => onUpdate({ ...task, status: e.target.value as TeamTask['status'] })}
                >
                  <option value="not_started">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              ) : (
                <Badge>{task.status.replaceAll('_', ' ')}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function PayCard({ rows }: { rows: FreelancerPayment[] }) {
  if (rows.length === 0) return null;
  return (
    <section className={`${CARD} p-5`}>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">My payments</h3>
      <div className="mt-3 space-y-2">
        {rows.slice(0, 5).map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-2xl bg-[#fbfaf8] px-3 py-2">
            <p className="text-xs font-bold">{row.projectName || row.paymentType || 'Payout'} · {row.paymentDate}</p>
            <Badge>{row.ledgerStatus || (paymentPending(row) ? 'pending' : 'paid')}</Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShootBoard({
  rows,
  kind,
  onOpen,
}: {
  rows: { project: Project; shoot: import('@/types').ShootEvent }[];
  kind: 'photographer' | 'cinematographer';
  onOpen?: (p: Project) => void;
}) {
  return (
    <section className={`${CARD} p-5`}>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{kind === 'photographer' ? 'Photo shoots' : 'Video shoots'}</h3>
      {rows.length === 0 ? (
        <EmptyState icon={Camera} title="No assigned shoots" message="When production assigns you, they appear here." />
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {rows.slice(0, 6).map(({ project, shoot }) => (
            <button key={`${project.id}-${shoot.id}`} type="button" onClick={() => onOpen?.(project)} className="rounded-2xl border border-[#eee7e2] bg-[#fbfaf8] p-4 text-left">
              <p className="text-sm font-extrabold">{shoot.title}</p>
              <p className="mt-1 text-xs text-slate-500">{project.clientWeddingTitle}</p>
              <p className="mt-2 text-[11px] font-bold text-[#2f5f54]">{shoot.date} · {shoot.time || shoot.startTime || 'Time TBC'}</p>
              <p className="mt-1 text-[11px] text-slate-500">{shoot.location || shoot.venue || project.venueLocation}</p>
              <p className="mt-1 text-[11px] text-slate-400">Crew · {[shoot.leadPhotographer, shoot.cinematographer].filter(Boolean).join(' · ') || 'Assigned'}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function EditPipeline({ tasks, video }: { tasks: TeamTask[]; video?: boolean }) {
  const stages = ['not_started', 'in_progress', 'review', 'completed'] as const;
  return (
    <section className={`${CARD} p-5`}>
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{video ? 'Video pipeline' : 'Photo edit pipeline'}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {stages.map((stage) => {
          const items = tasks.filter((t) => t.status === stage);
          return (
            <div key={stage} className="rounded-2xl bg-[#fbfaf8] p-3">
              <p className="text-[10px] font-extrabold uppercase text-slate-400">{stage.replaceAll('_', ' ')}</p>
              <p className="mt-1 text-xl font-black">{items.length}</p>
              {items.slice(0, 3).map((t) => (
                <p key={t.id} className="mt-1 truncate text-[11px] font-bold text-slate-700">{t.title}</p>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ClientHome({
  projects,
  userName,
  onOpen,
}: {
  projects: Project[];
  userName?: string;
  onOpen?: (p: Project) => void;
}) {
  const wedding = projects[0];
  if (!wedding) {
    return <EmptyState icon={Heart} title="Your wedding file is not linked yet" message="The studio will attach your project to this login." />;
  }
  const next = [...(wedding.shoots || [])].filter((s) => s.date >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.date.localeCompare(b.date))[0];
  const events = wedding.shoots || [];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className={`${CARD} p-5 lg:col-span-2`}>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#2f5f54]">Your wedding</p>
        <h2 className="mt-1 text-2xl font-black">{wedding.clientWeddingTitle}</h2>
        <p className="mt-2 text-sm text-slate-600">{wedding.venueLocation || 'Venue to be confirmed'} · {wedding.weddingFunctionDates || 'Date TBC'}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#fbfaf8] p-3">
            <p className="text-[10px] font-extrabold uppercase text-slate-400">Next event</p>
            <p className="mt-1 text-sm font-black">{next ? `${next.title} · ${next.date}` : 'We will update you soon'}</p>
          </div>
          <PermissionGuard permission="finance.view_payments" fallback={<div className="rounded-2xl bg-[#fbfaf8] p-3"><p className="text-[10px] font-extrabold uppercase text-slate-400">Payments</p><p className="mt-1 text-sm font-black">Shared by studio</p></div>}>
            <div className="rounded-2xl bg-[#fbfaf8] p-3">
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Balance</p>
              <p className="mt-1 text-sm font-black">{money(wedding.balanceDue)}</p>
              <p className="text-[10px] text-slate-500">Paid {money(wedding.advanceReceived)} of {money(wedding.totalBudget)}</p>
            </div>
          </PermissionGuard>
        </div>
        <h3 className="mt-5 text-xs font-extrabold uppercase tracking-wider text-slate-600">Events</h3>
        <div className="mt-2 space-y-2">
          {events.length === 0 ? <p className="text-sm text-slate-500">Events will appear after the studio publishes them.</p> : events.map((shoot) => (
            <div key={shoot.id} className="flex items-center justify-between rounded-2xl bg-[#fbfaf8] px-3 py-2">
              <div>
                <p className="text-xs font-extrabold">{shoot.title}</p>
                <p className="text-[11px] text-slate-500">{shoot.date} · {shoot.venue || shoot.location || wedding.venueLocation}</p>
              </div>
              <PermissionGuard permission="gallery.view">
                <Badge>Gallery</Badge>
              </PermissionGuard>
            </div>
          ))}
        </div>
        <button type="button" className={`${BTN_PRIMARY} mt-4`} onClick={() => onOpen?.(wedding)}>Open wedding details</button>
      </section>
      <section className={`${CARD} p-5`}>
        <p className="text-xs font-extrabold uppercase text-slate-600">Hello {userName}</p>
        <p className="mt-2 text-sm text-slate-500">Photos, films and album approvals appear here as the studio publishes them. Internal studio notes stay hidden.</p>
        <div className="mt-4 space-y-2 text-[11px] font-bold text-slate-600">
          <p>Teaser · {wedding.deliveryStatus?.teaserLinkSent ? 'Ready' : 'In production'}</p>
          <p>Film · {wedding.deliveryStatus?.fullFilmSent ? 'Ready' : 'In production'}</p>
          <p>Photos · {wedding.deliveryStatus?.highResPhotosSent ? 'Ready' : 'In production'}</p>
          <p>Album · {wedding.deliveryStatus?.albumPrintedAndDelivered ? 'Delivered' : 'In design'}</p>
        </div>
      </section>
    </div>
  );
}
