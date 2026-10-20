'use client';

/**
 * Team & Attendance — the studio's workforce management module.
 *
 * This component is the shell: KPI header, quick actions, tab routing and the
 * shared modals. Every tab reads through `../teamDomain`, which derives its
 * answers from the CRM's existing records — the roster (`TeamMember[]`), the
 * attendance ledger (`AttendanceRecord[]`), shoots and crew inside
 * `Project.shoots[]`, leave requests, and the freelancer assignment/payment
 * records. No parallel employee, attendance or assignment store is created.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  Camera,
  CheckCircle2,
  FileText,
  Home,
  IndianRupee,
  Plane,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  AttendanceRecord,
  Freelancer,
  FreelancerAssignment,
  FreelancerPayment,
  LeaveRequest,
  Project,
  TeamMember,
  TeamTask,
} from '@/types';
import { useToast } from '@/components/common';
import { usePermission } from '@/features/access';
import { MemberDashboardModal } from './MemberDashboardModal';
import { TeamDailyReportingWidget } from './TeamDailyReportingWidget';
import { TeamMonitoringPanel } from './TeamMonitoringPanel';
import { TeamDirectory } from './TeamDirectory';
import { TeamMemberFormModal } from './TeamMemberFormModal';
import { TeamMemberProfileDrawer } from './TeamMemberProfileDrawer';
import { MarkAttendanceModal } from './MarkAttendanceModal';
import { AttendanceDashboard } from './AttendanceDashboard';
import { TeamScheduleView } from './TeamScheduleView';
import { TeamAvailabilityView } from './TeamAvailabilityView';
import { LeaveManagementView } from './LeaveManagementView';
import { ShootAssignmentView } from './ShootAssignmentView';
import { TeamPerformanceView } from './TeamPerformanceView';
import { attendanceApi } from '@/lib/api/attendance';
import { AttendanceReportsView } from './AttendanceReportsView';
import {
  BTN_CREAM,
  BTN_GHOST,
  Badge,
  CARD,
  EmptyState,
  KpiCard,
  ScrollArea,
  TD,
  TH,
  TOGGLE_ACTIVE,
  TOGGLE_IDLE,
} from './TeamUiKit';
import {
  formatCurrency,
  formatDayLabel,
  getTeamKpis,
  getTodayDateString,
} from '../teamDomain';

/** Studio-approved editing software presets (also used by MemberDashboardModal). */
export const SOFTWARE_OPTIONS = [
  'Adobe Premiere Pro CC (Video Editing)',
  'DaVinci Resolve Studio (Color Grading)',
  'Adobe Photoshop CC (Photo Retouching)',
  'Adobe Lightroom Classic (Coloring & Culling)',
  'Final Cut Pro X (Mac Video Editing)',
  'After Effects CC (VFX & Motion Graphics)',
  'Canvera Album Design Software',
];

export { UNAUTHORIZED_APPS_SIMULATION } from './TeamMonitoringPanel';

type TeamTabId =
  | 'team'
  | 'attendance'
  | 'schedule'
  | 'availability'
  | 'leave'
  | 'assignments'
  | 'performance'
  | 'reports';

const TEAM_TABS: Array<{ id: TeamTabId; label: string; icon: typeof Users }> = [
  { id: 'team', label: 'Team', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'availability', label: 'Availability', icon: UserCheck },
  { id: 'leave', label: 'Leave', icon: Plane },
  { id: 'assignments', label: 'Shoot Assignments', icon: Camera },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

interface TeamAttendanceProps {
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  tasks?: TeamTask[];
  onAddTeamMember: (member: TeamMember, password?: string) => Promise<void>;
  onUpdateTeamMember: (member: TeamMember) => Promise<void>;
  onDeleteTeamMember?: (memberId: string) => void;
  onReorderTeam?: (newTeam: TeamMember[]) => void;
  onRecordAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onAddTask?: (task: TeamTask) => void;
  onUpdateTask?: (task: TeamTask) => void;
  onDeleteTask?: (taskId: string) => void;

  // ---- Wired in by CrmApplication; each degrades gracefully when absent ----
  leaves?: LeaveRequest[];
  onSaveLeave?: (leave: LeaveRequest) => void;
  onUpdateProject?: (project: Project) => void;
  freelancers?: Freelancer[];
  freelancerAssignments?: FreelancerAssignment[];
  freelancerPayments?: FreelancerPayment[];
  currentUser?: { id: string; name: string; role: string } | null;
  onNavigateToFreelancers?: () => void;
  accessRoles?: import('@/features/access').AccessRole[];
  accessPermissions?: import('@/features/access/accessTypes').PermissionModule[];
}

export const TeamAttendance: React.FC<TeamAttendanceProps> = ({
  team,
  attendance,
  projects,
  tasks = [],
  onAddTeamMember,
  onUpdateTeamMember,
  onDeleteTeamMember,
  onReorderTeam,
  onRecordAttendance,
  onUpdateAttendance,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  leaves = [],
  onSaveLeave,
  onUpdateProject,
  freelancers = [],
  freelancerAssignments = [],
  freelancerPayments = [],
  currentUser,
  onNavigateToFreelancers,
  accessRoles = [],
  accessPermissions = [],
}) => {
  const { can } = usePermission();
  const canViewTeam = can('employees.view') || can('employees.view_self') || can('employees.view_profile');
  const canViewAllTeam = can('employees.view');
  const canViewOwnTeam = can('employees.view_self') || can('employees.view_profile');
  const canViewEmployeeProfiles = can('employees.view_profile');
  const canCreateMember = can('employees.create');
  const canEditMember = can('employees.edit');
  const canDeleteMember = can('employees.delete');
  const canViewAttendance = can('attendance.view') || can('attendance.view_self');
  const canViewAllAttendance = can('attendance.view');
  const canManageAttendance =
    can('attendance.manage') ||
    can('employees.manage_attendance') ||
    can('attendance.mark') ||
    can('attendance.create') ||
    can('attendance.update');
  const canViewSalary = can('employees.view_salary') || can('employees.manage_salary');
  const canViewContact = can('employees.view_contact') || can('employees.view');
  const canViewLeave = can('leave.view') || can('leave.request') || can('leave.approve');
  const canRequestLeave = can('leave.request');
  const canApproveLeave = can('leave.approve');
  const canApplyLeave = canViewLeave;
  const canAssignShoot =
    can('shoots.assign_photographer') ||
    can('shoots.assign_cinematographer') ||
    can('shoots.assign_freelancer');
  const allowedTabs = useMemo(() => {
    const ids: TeamTabId[] = [];
    if (canViewTeam) ids.push('team', 'schedule', 'availability');
    if (canViewTeam && canViewAttendance && canViewSalary) ids.push('performance');
    if (canViewAttendance) ids.push('attendance');
    if (canViewAttendance && !ids.includes('schedule')) ids.push('schedule');
    if (canViewLeave) ids.push('leave');
    if (canAssignShoot) ids.push('assignments');
    if (canViewAttendance || canViewTeam) ids.push('reports');
    return [...new Set(ids)];
  }, [canViewTeam, canViewAttendance, canViewLeave, canAssignShoot, canViewSalary]);

  const { showToast } = useToast();
  const today = getTodayDateString();
  const [activeTab, setActiveTab] = useState<TeamTabId>('team');
  const currentUserId = currentUser?.id;
  const canOnlySeeSelf = Boolean(currentUserId) && !canViewAllTeam && canViewOwnTeam;

  // The studio owner administers the roster; they are not themselves a team
  // member. Keep that account out of the Team directory without hiding a
  // different employee who happens to have an Admin role.
  const scopedTeam = useMemo(() => (
    canOnlySeeSelf ? team.filter((member) => member.id === currentUserId) : team
  ), [canOnlySeeSelf, team, currentUserId]);
  const scopedAttendance = useMemo(() => (
    canViewAllAttendance || canManageAttendance
      ? attendance
      : attendance.filter((record) => record.teamMemberId === currentUserId)
  ), [attendance, canManageAttendance, canViewAllAttendance, currentUserId]);
  const scopedLeaves = useMemo(() => (
    can('leave.view') || canApproveLeave
      ? leaves
      : leaves.filter((leave) => leave.teamMemberId === currentUserId)
  ), [can, canApproveLeave, currentUserId, leaves]);
  const rosterMembers = useMemo(
    () => (canOnlySeeSelf ? scopedTeam : scopedTeam.filter((member) => member.id !== currentUserId)),
    [canOnlySeeSelf, scopedTeam, currentUserId]
  );

  // Modal / drawer state
  const [profileMember, setProfileMember] = useState<TeamMember | null>(null);
  const [formMember, setFormMember] = useState<TeamMember | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<'Freelancer' | undefined>(undefined);
  const [attendanceTarget, setAttendanceTarget] = useState<{ member: TeamMember; date: string } | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<TeamMember | null>(null);
  const [assignFocusMember, setAssignFocusMember] = useState<TeamMember | null>(null);
  const [dashboardMember, setDashboardMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!allowedTabs.includes(activeTab) && allowedTabs[0]) setActiveTab(allowedTabs[0]);
  }, [allowedTabs, activeTab]);

  /** Keep an open profile in sync when its member record changes elsewhere. */
  useEffect(() => {
    if (!profileMember) return;
    const fresh = scopedTeam.find((m) => m.id === profileMember.id);
    if (fresh && fresh !== profileMember) setProfileMember(fresh);
    if (!fresh) setProfileMember(null);
  }, [scopedTeam, profileMember]);

  const kpis = useMemo(
    () => getTeamKpis(scopedTeam, scopedAttendance, projects, scopedLeaves, freelancers.length, today),
    [scopedTeam, scopedAttendance, projects, scopedLeaves, freelancers.length, today]
  );

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const openAddMember = () => {
    if (!canCreateMember) return;
    setFormMember(null);
    setFormDefaultType(undefined);
    setIsFormOpen(true);
  };

  const openEditMember = (member: TeamMember) => {
    if (!canEditMember) return;
    setFormMember(member);
    setFormDefaultType(undefined);
    setIsFormOpen(true);
  };

  const handleSaveMember = async (member: TeamMember, mode: 'create' | 'update', password?: string) => {
    if (mode === 'create') {
      if (!canCreateMember) return;
      await onAddTeamMember(member, password);
      showToast(`${member.name} was added to the team and can now sign in with the temporary password you set.`);
    } else {
      if (!canEditMember) return;
      await onUpdateTeamMember(member);
      showToast(`${member.name}'s profile updated.`);
      if (profileMember?.id === member.id) setProfileMember(member);
    }
    setIsFormOpen(false);
    setFormMember(null);
  };

  const handleToggleActive = (member: TeamMember) => {
    if (!canDeleteMember || !onDeleteTeamMember) return;
    onDeleteTeamMember(member.id);
    setProfileMember(null);
    showToast(`${member.name} deleted.`);
  };

  /** Upsert one attendance row without disturbing the rest of the ledger. */
  const handleSaveAttendance = async (record: AttendanceRecord) => {
    if (!canManageAttendance) return;
    const statusMap: Record<AttendanceRecord['status'], 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE' | 'WEEKLY_OFF' | 'HOLIDAY'> = {
      present: 'PRESENT', present_office: 'PRESENT', present_wfh: 'PRESENT', present_shoot: 'PRESENT', half_day: 'HALF_DAY', absent: 'ABSENT', leave: 'ON_LEAVE', weekly_off: 'WEEKLY_OFF', holiday: 'HOLIDAY',
    };
    const toIso = (time?: string) => {
      if (!time) return undefined;
      const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!match) return undefined;
      let hour = Number(match[1]) % 12;
      if (match[3].toUpperCase() === 'PM') hour += 12;
      return `${record.date}T${String(hour).padStart(2, '0')}:${match[2]}:00.000Z`;
    };
    await attendanceApi.mark({
      userId: record.teamMemberId,
      date: record.date,
      checkIn: toIso(record.inTime),
      checkOut: toIso(record.outTime),
      status: statusMap[record.status],
      source: 'ADMIN',
      workLocation: record.status === 'present_wfh' ? 'WFH' : record.status === 'present_shoot' ? 'ON_SHOOT' : 'OFFICE',
      notes: record.notes,
    });
    const exists = attendance.some((a) => a.id === record.id);
    if (exists) {
      onUpdateAttendance(attendance.map((a) => (a.id === record.id ? record : a)));
    } else {
      onRecordAttendance(record);
    }
  };

  const handleSaveLeave = (leave: LeaveRequest) => {
    const isDecision = leave.status === 'approved' || leave.status === 'rejected';
    if (isDecision ? !canApproveLeave : !canApplyLeave) return;
    if (onSaveLeave) {
      onSaveLeave(leave);
      return;
    }
    showToast('Leave storage is not wired up in this workspace yet.', { variant: 'error' });
  };

  const goTab = (id: TeamTabId) => {
    if (allowedTabs.includes(id)) setActiveTab(id);
  };

  const openMarkAttendance = (member: TeamMember, date: string = today) => {
    if (!canManageAttendance) return;
    setAttendanceTarget({ member, date });
  };

  const openAssignShoot = (member: TeamMember) => {
    if (!canAssignShoot) return;
    setAssignFocusMember(member);
    setActiveTab('assignments');
    setProfileMember(null);
  };

  const openApplyLeave = (member?: TeamMember) => {
    if (!canApplyLeave) return;
    setLeaveTarget(member || ({ id: '__any__' } as TeamMember));
    setActiveTab('leave');
    // The apply-leave form renders inside the Leave tab, so the drawer has to
    // step out of the way for it to be reachable.
    setProfileMember(null);
  };

  const canOpenMemberProfile = (member: TeamMember) =>
    member.id === currentUserId ? canViewOwnTeam || canViewEmployeeProfiles : canViewEmployeeProfiles;
  const openProfileIfAllowed = (member: TeamMember) => {
    if (canOpenMemberProfile(member)) setProfileMember(member);
  };

  const togglePayStatus = (recordId: string) => {
    if (!canManageAttendance) return;
    onUpdateAttendance(
      attendance.map((a) =>
        a.id === recordId ? { ...a, paidStatus: a.paidStatus === 'paid' ? ('pending' as const) : ('paid' as const) } : a
      )
    );
  };

  const totalPendingPayout = useMemo(
    () => scopedAttendance.filter((a) => a.paidStatus === 'pending').reduce((sum, a) => sum + (a.payAmount || 0), 0),
    [scopedAttendance]
  );

  // --------------------------------------------------------------------------

  const pendingLeaveCount = scopedLeaves.filter((l) => l.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-[#CCEB8E]/35 bg-[radial-gradient(circle_at_88%_8%,rgba(204,235,142,.2),transparent_30%),linear-gradient(125deg,#41463E,#55333f_50%,#21241F)] p-5 text-white shadow-xl sm:p-7">
        <div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[34px] border-white/[.04]" />
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#E6E8E4]">
                <ShieldCheck className="size-4 text-emerald-300" />
                Studio Team CRM
              </span>
              {currentUser && (
                <span className="rounded-lg border border-white/15 bg-black/10 px-3 py-1 text-sm font-semibold text-[#dfeae7]">
                  {currentUser.name} · {currentUser.role}
                </span>
              )}
            </div>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
                <Users className="size-6 text-[#DCDFDA]" />
              </span>
              Team & Attendance
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#dfeae7] sm:text-base">
              Who works for us, who is available, who is on a shoot, and who still needs to be paid — one workforce view for the whole studio.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canCreateMember && (
            <button type="button" onClick={() => openAddMember()} className={BTN_CREAM}>
              <span className="grid size-8 place-items-center rounded-xl bg-[#3F443D] text-white transition group-hover:rotate-6">
                <Plus className="size-5" />
              </span>
              <span>Add Team Member</span>
              <Sparkles className="size-4 text-[#aa7251]" />
            </button>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Team" value={kpis.totalMembers} hint="All studio staff on roster" icon={Users} tone="rose" onClick={() => goTab('team')} />
        <KpiCard label="Active" value={kpis.activeMembers} hint={`${kpis.inactiveMembers} inactive`} icon={ShieldCheck} tone="emerald" />
        <KpiCard label="Available Today" value={kpis.availableToday} hint="Ready for assignment" icon={UserCheck} tone="emerald" onClick={() => goTab('availability')} />
        <KpiCard label="On Shoot Today" value={kpis.onShootToday} hint="Booked on a wedding / event" icon={Camera} tone="violet" onClick={() => goTab('assignments')} />
        <KpiCard label="On Leave Today" value={kpis.onLeaveToday} hint="Approved leave" icon={Plane} tone="amber" onClick={() => goTab('leave')} />
        <KpiCard label="Present Today" value={kpis.presentToday} hint="Office, WFH or shoot" icon={CalendarCheck} tone="emerald" onClick={() => goTab('attendance')} />
        <KpiCard label="Absent Today" value={kpis.absentToday} hint="Not marked present" icon={FileText} tone="red" onClick={() => goTab('attendance')} />
        <KpiCard label="WFH Today" value={kpis.wfhToday} hint="Working from home" icon={Home} tone="blue" />
      </section>

      <section className={`${CARD} p-3 sm:p-4`}>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-[#e2d9d3] bg-[#f6f1ee] p-1.5" aria-label="Team sections">
          {TEAM_TABS.filter((tab) => allowedTabs.includes(tab.id)).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2.5 text-xs font-extrabold transition sm:flex-none ${
                activeTab === id ? TOGGLE_ACTIVE : TOGGLE_IDLE
              }`}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon className="size-3.5" />
              {label}
              {id === 'team' && <span className="text-[10px] font-black opacity-60">({rosterMembers.length})</span>}
              {id === 'leave' && pendingLeaveCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">{pendingLeaveCount}</span>
              )}
              {activeTab === id && <CheckCircle2 className="size-3.5 text-emerald-700" />}
            </button>
          ))}
        </nav>
      </section>

      {/* Software-guard alert banners stay visible across the module */}
      <TeamMonitoringPanel
        team={scopedTeam}
        softwareOptions={SOFTWARE_OPTIONS}
        onUpdateTeamMember={canEditMember ? onUpdateTeamMember : undefined}
        onOpenMember={canEditMember ? setDashboardMember : openProfileIfAllowed}
        onEditMember={canEditMember ? openEditMember : undefined}
        bannersOnly
      />

      {/* ---------------- Tabs ---------------- */}
      {activeTab === 'team' && canViewTeam && (
        <TeamDirectory
          team={rosterMembers}
          attendance={scopedAttendance}
          projects={projects}
          leaves={scopedLeaves}
          today={today}
          onOpenProfile={canViewEmployeeProfiles || canOnlySeeSelf ? openProfileIfAllowed : undefined}
          onEditMember={canEditMember ? openEditMember : undefined}
          onToggleActive={canEditMember || canDeleteMember ? handleToggleActive : undefined}
          onMarkAttendance={canManageAttendance ? (member) => openMarkAttendance(member) : undefined}
          onAssignShoot={canAssignShoot ? openAssignShoot : undefined}
          onApplyLeave={canApplyLeave ? openApplyLeave : undefined}
          onAddMember={canCreateMember ? () => openAddMember() : undefined}
          canViewSalary={canViewSalary}
          canViewContact={canViewContact}
          monitoringSlot={
            canEditMember ? (
            <details className={`${CARD} group`}>
              <summary className="flex items-center justify-between gap-2 px-5 py-3 cursor-pointer list-none">
                <span className="text-xs font-extrabold uppercase tracking-tight text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#464B43]" /> Software guard &amp; workstation monitoring
                </span>
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 group-open:hidden">Show</Badge>
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 hidden group-open:inline-flex">Hide</Badge>
              </summary>
              <div className="px-5 pb-5 space-y-4">
                <TeamMonitoringPanel
                  team={scopedTeam}
                  softwareOptions={SOFTWARE_OPTIONS}
                  onUpdateTeamMember={onUpdateTeamMember}
                  onOpenMember={setDashboardMember}
                  onEditMember={openEditMember}
                />
                <TeamMonitoringPanel
                  team={scopedTeam}
                  softwareOptions={SOFTWARE_OPTIONS}
                  onUpdateTeamMember={onUpdateTeamMember}
                  onReorderTeam={onReorderTeam}
                  onDeleteTeamMember={canDeleteMember ? onDeleteTeamMember : undefined}
                  onOpenMember={setDashboardMember}
                  onEditMember={openEditMember}
                  cardsOnly
                />
              </div>
            </details>
            ) : undefined
          }
        />
      )}

      {activeTab === 'attendance' && canViewAttendance && (
        <AttendanceDashboard
          team={scopedTeam}
          attendance={scopedAttendance}
          projects={projects}
          leaves={scopedLeaves}
          onSaveAttendance={handleSaveAttendance}
          onOpenMarkAttendance={openMarkAttendance}
          onOpenProfile={openProfileIfAllowed}
          canManage={canManageAttendance}
        />
      )}

      {activeTab === 'schedule' && (canViewTeam || canViewAttendance) && (
        <TeamScheduleView
          team={scopedTeam}
          attendance={scopedAttendance}
          projects={projects}
          leaves={scopedLeaves}
          onOpenProfile={openProfileIfAllowed}
        />
      )}

      {activeTab === 'availability' && canViewTeam && (
        <TeamAvailabilityView
          team={scopedTeam}
          attendance={scopedAttendance}
          projects={projects}
          leaves={scopedLeaves}
          onUpdateMember={canEditMember ? onUpdateTeamMember : undefined}
          onAssignShoot={canAssignShoot ? openAssignShoot : undefined}
          onOpenProfile={openProfileIfAllowed}
        />
      )}

      {activeTab === 'leave' && canViewLeave && (
        <LeaveManagementView
          team={scopedTeam}
          leaves={scopedLeaves}
          projects={projects}
          currentUserName={currentUser?.name}
          onSaveLeave={handleSaveLeave}
          applyForMember={leaveTarget}
          onCloseApplyForm={() => setLeaveTarget(null)}
          onOpenApplyForm={(member) => openApplyLeave(member)}
          canRequest={canApplyLeave}
          canApprove={canApproveLeave}
        />
      )}

      {activeTab === 'assignments' && canAssignShoot && (
        onUpdateProject ? (
          <ShootAssignmentView
            team={scopedTeam}
            projects={projects}
            attendance={scopedAttendance}
            leaves={scopedLeaves}
            onUpdateProject={onUpdateProject}
            focusMember={assignFocusMember}
            onClearFocusMember={() => setAssignFocusMember(null)}
            onOpenProfile={openProfileIfAllowed}
          />
        ) : (
          <div className={CARD}>
            <EmptyState
              icon={Camera}
              title="Shoot assignment is unavailable here"
              message="This workspace was opened without project write access — open Team & Attendance from the main CRM to assign crew."
            />
          </div>
        )
      )}

      {activeTab === 'performance' && canViewTeam && canViewAttendance && canViewSalary && (
        <TeamPerformanceView
          team={scopedTeam}
          attendance={scopedAttendance}
          projects={projects}
          leaves={scopedLeaves}
          onOpenProfile={openProfileIfAllowed}
        />
      )}

      {activeTab === 'reports' && (canViewAttendance || canViewTeam) && (
        <div className="space-y-5">
          <AttendanceReportsView
            team={scopedTeam}
            attendance={scopedAttendance}
            projects={projects}
            leaves={scopedLeaves}
            dailyWidgetSlot={
              <TeamDailyReportingWidget
                team={scopedTeam}
                attendance={scopedAttendance}
                tasks={tasks}
                projects={projects}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onAddTask={onAddTask}
                onOpenMemberModal={canEditMember ? setDashboardMember : openProfileIfAllowed}
              />
            }
          />

          {/* Payout ledger — preserved from the original module */}
          {canViewSalary && <section className={`${CARD} p-5 space-y-3`}>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-[#464B43]" /> Team payout ledger
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Pending payouts: <strong className="text-slate-800">{formatCurrency(totalPendingPayout)}</strong>
                </p>
              </div>
            </header>

            {scopedAttendance.length === 0 ? (
              <EmptyState
                icon={IndianRupee}
                title="No payout entries yet"
                message="Mark attendance to start building the payout ledger — each duty day carries its own pay amount."
              />
            ) : (
              <ScrollArea>
                <table className="w-full min-w-[860px] border-collapse">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <TH>Crew member</TH>
                      <TH>Role</TH>
                      <TH>Duty date</TH>
                      <TH>In</TH>
                      <TH>Out</TH>
                      <TH>Project</TH>
                      <TH>Pay</TH>
                      <TH className="text-right">Status</TH>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scopedAttendance
                      .slice()
                      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
                      .slice(0, 200)
                      .map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50 transition">
                          <TD className="font-extrabold text-slate-900">{a.teamMemberName}</TD>
                          <TD className="text-slate-500">{a.role}</TD>
                          <TD className="font-mono text-[11px]">{formatDayLabel(a.date)}</TD>
                          <TD className="font-mono text-emerald-700 font-semibold">{a.inTime || '--'}</TD>
                          <TD className="font-mono text-red-700 font-semibold">{a.outTime || '--'}</TD>
                          <TD className="text-slate-600 max-w-[190px] truncate">{a.projectTitle || 'Studio duty'}</TD>
                          <TD className="font-mono font-bold text-[#373B35]">{formatCurrency(a.payAmount)}</TD>
                          <TD className="text-right">
                            {canManageAttendance ? (
                            <button
                              type="button"
                              onClick={() => togglePayStatus(a.id)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                                a.paidStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-gradient-to-r from-[#464B43] to-[#373B35] text-white hover:opacity-90'
                              }`}
                            >
                              {a.paidStatus === 'paid' ? 'Mark unpaid' : 'Clear payout'}
                            </button>
                            ) : (
                            <span
                              className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                a.paidStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {a.paidStatus === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                            )}
                          </TD>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </section>}
        </div>
      )}

      {/* ---------------- Shared modals ---------------- */}

      <TeamMemberFormModal
        isOpen={isFormOpen}
        member={formMember}
        team={scopedTeam}
        softwareOptions={SOFTWARE_OPTIONS}
        defaultEmploymentType={formDefaultType}
        accessRoles={accessRoles}
        accessPermissions={accessPermissions}
        onSave={handleSaveMember}
        onClose={() => {
          setIsFormOpen(false);
          setFormMember(null);
        }}
      />

      <TeamMemberProfileDrawer
        member={profileMember}
        team={scopedTeam}
        attendance={scopedAttendance}
        projects={projects}
        leaves={scopedLeaves}
        onClose={() => setProfileMember(null)}
        onEdit={canEditMember ? openEditMember : undefined}
        onUpdateMember={
          canEditMember
            ? (updated) => {
                onUpdateTeamMember(updated);
                setProfileMember(updated);
              }
            : undefined
        }
        onMarkAttendance={canManageAttendance ? (member) => openMarkAttendance(member) : undefined}
        onAssignShoot={canAssignShoot ? openAssignShoot : undefined}
        onApplyLeave={canApplyLeave ? (member) => openApplyLeave(member) : undefined}
        onToggleActive={canEditMember || canDeleteMember ? handleToggleActive : undefined}
        onOpenFullDashboard={
          canEditMember
            ? (member) => {
                setProfileMember(null);
                setDashboardMember(member);
              }
            : undefined
        }
      />

      {canManageAttendance && attendanceTarget && (
      <MarkAttendanceModal
        isOpen={!!attendanceTarget}
        member={attendanceTarget?.member || null}
        defaultDate={attendanceTarget?.date || today}
        team={scopedTeam}
        attendance={scopedAttendance}
        projects={projects}
        leaves={scopedLeaves}
        onSave={handleSaveAttendance}
        onClose={() => setAttendanceTarget(null)}
        onChangeMember={(member) => setAttendanceTarget((prev) => (prev ? { ...prev, member } : { member, date: today }))}
      />
      )}

      {/* The original per-member dashboard (tasks, salary slip, software) */}
      {canEditMember && dashboardMember && (
        <MemberDashboardModal
          member={dashboardMember}
          attendance={scopedAttendance}
          tasks={tasks}
          projects={projects}
          onClose={() => setDashboardMember(null)}
          onUpdateTeamMember={(updated) => {
            onUpdateTeamMember(updated);
            setDashboardMember(updated);
          }}
          onRecordAttendance={onRecordAttendance}
          onUpdateAttendance={onUpdateAttendance}
          onAddTask={(task) => onAddTask?.(task)}
          onUpdateTask={(task) => onUpdateTask?.(task)}
          onDeleteTask={onDeleteTask}
        />
      )}
    </div>
  );
};
