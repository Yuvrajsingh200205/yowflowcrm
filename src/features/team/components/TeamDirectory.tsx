'use client';

/**
 * Team roster — the "who is my team?" view.
 *
 * Every column is derived live: today's attendance comes from the attendance
 * ledger (with shoot bookings taking precedence), the current assignment and
 * upcoming shoot come from `Project.shoots[].crewAssignments`, and availability
 * from the combination of both plus approved leave.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarPlus,
  Camera,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  Mail,
  Pencil,
  Phone,
  Power,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest, Project, TeamMember } from '@/types';
import {
  Avatar,
  BTN_GHOST,
  BTN_PRIMARY,
  Badge,
  CARD,
  EmptyState,
  FIELD,
  LABEL,
  LINK,
  TOGGLE_ACTIVE,
  TOGGLE_IDLE,
  TOGGLE_WRAP,
} from './TeamUiKit';
import {
  EMPLOYMENT_TYPES,
  TeamSortKey,
  getAvailability,
  getEmployeeCode,
  getEmploymentType,
  getMemberDepartment,
  getMemberPhone,
  getMemberStatusBadge,
  getRoleOptions,
  getShootsOnDate,
  getTodayDateString,
  getUpcomingShoots,
  formatDayLabel,
  formatCurrency,
  memberMatchesSearch,
  resolveDayStatus,
  sortMembers,
} from '../teamDomain';

interface Props {
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  today: string;
  onOpenProfile?: (member: TeamMember) => void;
  onEditMember?: (member: TeamMember) => void;
  onToggleActive?: (member: TeamMember) => void;
  onMarkAttendance?: (member: TeamMember) => void;
  onAssignShoot?: (member: TeamMember) => void;
  onApplyLeave?: (member: TeamMember) => void;
  onAddMember?: () => void;
  canViewSalary?: boolean;
  canViewContact?: boolean;
  /** Rendered above the roster — keeps the existing software-guard panel in place. */
  monitoringSlot?: React.ReactNode;
}

const ALL = 'all';

/** Keep the roster's pay display honest: never substitute a placeholder salary. */
function PayStructure({ member }: { member: TeamMember }) {
  const isMonthly = member.payType !== 'daily';
  const amount = isMonthly ? member.monthlySalary : member.dailyRate;

  if (!amount) return <span className="text-xs font-medium text-slate-400">Not set</span>;

  return (
    <div>
      <p className="font-mono text-sm font-extrabold text-[#373B35]">{formatCurrency(amount)}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {isMonthly ? 'Monthly salary' : 'Daily rate'}
      </p>
    </div>
  );
}

function MemberActions({
  member,
  onOpenProfile,
  onEditMember,
  onMarkAttendance,
  onAssignShoot,
  onApplyLeave,
  onToggleActive,
}: {
  member: TeamMember;
  onOpenProfile?: (member: TeamMember) => void;
  onEditMember?: (member: TeamMember) => void;
  onMarkAttendance?: (member: TeamMember) => void;
  onAssignShoot?: (member: TeamMember) => void;
  onApplyLeave?: (member: TeamMember) => void;
  onToggleActive?: (member: TeamMember) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const isActive = (member.status || 'active') === 'active';

  const placeMenu = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const menuW = 220;
    const menuH = 216;
    const gap = 8;
    const left = Math.min(Math.max(12, r.right - menuW), window.innerWidth - menuW - 12);
    const openUp = window.innerHeight - r.bottom < menuH + 16;
    const top = openUp ? Math.max(12, r.top - menuH - gap) : r.bottom + gap;
    setPos({ top, left });
  };

  const toggle = () => {
    if (!open) placeMenu();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const reposition = () => placeMenu();
    document.addEventListener('mousedown', close);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  const items = [
    onMarkAttendance && { label: 'Mark attendance', icon: UserCheck, run: () => onMarkAttendance(member) },
    onAssignShoot && { label: 'Assign to shoot', icon: Camera, run: () => onAssignShoot(member) },
    onApplyLeave && { label: 'Apply leave', icon: CalendarPlus, run: () => onApplyLeave(member) },
    onToggleActive && { label: isActive ? 'Delete member' : 'Reactivate member', icon: Power, run: () => onToggleActive(member), tone: isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50' },
  ].filter(Boolean) as Array<{ label: string; icon: typeof Users; run: () => void; tone?: string }>;

  const btn = 'inline-flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold transition sm:flex-none';

  return (
    <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
      {onOpenProfile && (
      <button type="button" onClick={() => onOpenProfile(member)} className={`${btn} border border-[#ded5cf] bg-white text-slate-700 hover:border-rose-300 hover:bg-[#FBFDF6]`}>
        <Users className="size-3.5 text-[#464B43]" /> View
      </button>
      )}
      {onEditMember && (
      <button type="button" onClick={() => onEditMember(member)} className={`${btn} border border-[#ded5cf] bg-white text-slate-700 hover:border-rose-300 hover:bg-[#FBFDF6]`}>
        <Pencil className="size-3.5" /> Edit
      </button>
      )}
      {items.length > 0 && (
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`${btn} bg-gradient-to-r from-[#464B43] to-[#373B35] text-white shadow-sm hover:opacity-90`}
      >
        More <ChevronDown className={`size-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      )}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[90] w-[220px] overflow-hidden rounded-xl border border-[#e2d9d3] bg-white py-1 shadow-[0_16px_40px_rgba(48,44,46,.18)]"
        >
          {items.map(({ label, icon: Icon, run, tone }) => (
            <button
              key={label}
              type="button"
              onClick={() => { setOpen(false); run(); }}
              className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-xs font-bold transition ${tone || 'text-slate-700 hover:bg-rose-50 hover:text-[#373B35]'}`}
            >
              <Icon className="size-4 shrink-0" /> {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export const TeamDirectory: React.FC<Props> = ({
  team,
  attendance,
  projects,
  leaves,
  today,
  onOpenProfile,
  onEditMember,
  onToggleActive,
  onMarkAttendance,
  onAssignShoot,
  onApplyLeave,
  onAddMember,
  canViewSalary = false,
  canViewContact = false,
  monitoringSlot,
}) => {
  const [view, setView] = useState<'table' | 'cards'>('cards');
  const [isDesktop, setIsDesktop] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [availabilityFilter, setAvailabilityFilter] = useState(ALL);
  const [attendanceFilter, setAttendanceFilter] = useState(ALL);
  const [locationFilter, setLocationFilter] = useState(ALL);
  const [sortKey, setSortKey] = useState<TeamSortKey>('name');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => {
      setIsDesktop(mq.matches);
      setView(mq.matches ? 'table' : 'cards');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const roleOptions = useMemo(
    () => [...new Set(team.map((m) => String(m.role)).filter(Boolean))].sort(),
    [team]
  );

  /** One derived row per member so the table and the filters agree. */
  const rows = useMemo(() => {
    return team.map((member) => {
      const day = resolveDayStatus({ member, dateKey: today, attendance, projects, leaves, today });
      const availability = getAvailability(member, today, attendance, projects, leaves);
      const todayShoots = getShootsOnDate(member, projects, today);
      const upcoming = getUpcomingShoots(member, projects).filter((s) => s.date > today);
      return {
        member,
        day,
        availability,
        currentAssignment: todayShoots[0],
        upcomingShoot: upcoming[0],
      };
    });
  }, [team, attendance, projects, leaves, today]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const loc = r.currentAssignment?.location || r.day.location;
      if (loc) set.add(loc);
    });
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const list = rows.filter(({ member, day, availability, currentAssignment }) => {
      if (!memberMatchesSearch(member, search)) return false;
      if (roleFilter !== ALL && String(member.role) !== roleFilter) return false;
      if (typeFilter !== ALL && getEmploymentType(member) !== typeFilter) return false;
      if (statusFilter !== ALL && (member.status || 'active') !== statusFilter) return false;
      if (availabilityFilter !== ALL && availability.status !== availabilityFilter) return false;
      if (attendanceFilter !== ALL && day.kind !== attendanceFilter) return false;
      if (locationFilter !== ALL) {
        const loc = currentAssignment?.location || day.location;
        if (loc !== locationFilter) return false;
      }
      return true;
    });

    const sorted = sortMembers(
      list.map((r) => r.member),
      sortKey,
      { attendance, projects, leaves, rangeStart: today.slice(0, 8) + '01', rangeEnd: today }
    );
    const order = new Map(sorted.map((m, i) => [m.id, i]));
    return list.slice().sort((a, b) => (order.get(a.member.id) ?? 0) - (order.get(b.member.id) ?? 0));
  }, [
    rows,
    search,
    roleFilter,
    typeFilter,
    statusFilter,
    availabilityFilter,
    attendanceFilter,
    locationFilter,
    sortKey,
    attendance,
    projects,
    leaves,
    today,
  ]);

  const activeFilterCount = [roleFilter, typeFilter, statusFilter, availabilityFilter, attendanceFilter, locationFilter].filter(
    (v) => v !== ALL
  ).length;

  const resetFilters = () => {
    setRoleFilter(ALL);
    setTypeFilter(ALL);
    setStatusFilter(ALL);
    setAvailabilityFilter(ALL);
    setAttendanceFilter(ALL);
    setLocationFilter(ALL);
    setSearch('');
  };

  return (
    <div className="space-y-5">
      {monitoringSlot}

      <div className={`${CARD} space-y-3 p-3 sm:p-4`}>
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
          <Filter className="size-4 text-[#464B43]" />
          Search & Filter Team
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#50574D]" />
            <input
              className={`${FIELD} pl-10`}
              placeholder="Search by name, employee ID, phone or role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search team members"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`${BTN_GHOST} ${activeFilterCount ? 'border-rose-300 text-[#373B35] bg-rose-50' : ''}`}
              aria-expanded={showFilters}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 px-1.5 rounded-full bg-[#464B43] text-white text-[10px] font-black">{activeFilterCount}</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            <select
              className={`${FIELD} !w-auto`}
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as TeamSortKey)}
              aria-label="Sort team members"
            >
              <option value="name">Sort: Name</option>
              <option value="role">Sort: Role</option>
              <option value="attendance">Sort: Attendance %</option>
              <option value="upcoming_shoot">Sort: Next shoot</option>
              <option value="joining_date">Sort: Joining date</option>
            </select>

            {isDesktop && (
              <div className={TOGGLE_WRAP}>
                <button
                  type="button"
                  onClick={() => setView('table')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    view === 'table' ? TOGGLE_ACTIVE : TOGGLE_IDLE
                  }`}
                  aria-pressed={view === 'table'}
                >
                  <List className="size-3.5" /> Table
                </button>
                <button
                  type="button"
                  onClick={() => setView('cards')}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    view === 'cards' ? TOGGLE_ACTIVE : TOGGLE_IDLE
                  }`}
                  aria-pressed={view === 'cards'}
                >
                  <LayoutGrid className="size-3.5" /> Cards
                </button>
              </div>
            )}

            {onAddMember && (
            <button type="button" onClick={onAddMember} className={BTN_PRIMARY}>
              <UserPlus className="w-4 h-4" /> Add member
            </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className={LABEL} htmlFor="f-role">Role</label>
              <select id="f-role" className={FIELD} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value={ALL}>All roles</option>
                {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="f-type">Employment</label>
              <select id="f-type" className={FIELD} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value={ALL}>All types</option>
                {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="f-status">Status</label>
              <select id="f-status" className={FIELD} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value={ALL}>All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="f-avail">Availability</label>
              <select id="f-avail" className={FIELD} value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
                <option value={ALL}>Any availability</option>
                <option value="Available">Available</option>
                <option value="On Shoot">On Shoot</option>
                <option value="Busy">Busy</option>
                <option value="On Leave">On Leave</option>
                <option value="WFH">WFH</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="f-att">Today's attendance</label>
              <select id="f-att" className={FIELD} value={attendanceFilter} onChange={(e) => setAttendanceFilter(e.target.value)}>
                <option value={ALL}>Any</option>
                <option value="office">Office</option>
                <option value="wfh">WFH</option>
                <option value="on_shoot">On Shoot</option>
                <option value="leave">Leave</option>
                <option value="weekly_off">Weekly Off</option>
                <option value="absent">Absent</option>
                <option value="not_marked">Not marked</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="f-loc">Location</label>
              <select id="f-loc" className={FIELD} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                <option value={ALL}>All locations</option>
                {locationOptions.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="col-span-full flex justify-end">
              <button type="button" onClick={resetFilters} className={LINK}>
                Reset all filters
              </button>
            </div>
          </div>
        )}

        <p className="text-[11px] font-bold text-slate-500">
          Showing {filtered.length} of {team.length} team {team.length === 1 ? 'member' : 'members'}
        </p>
      </div>

      {/* Roster */}
      {team.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={Users}
            title="No team members yet"
            message="Add your photographers, cinematographers, editors and coordinators to start tracking attendance, availability and shoot assignments."
            action={
              onAddMember ? (
              <button type="button" onClick={onAddMember} className={BTN_PRIMARY}>
                <UserPlus className="w-4 h-4" /> Add your first team member
              </button>
              ) : undefined
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={Search}
            title="No members match these filters"
            message="Try clearing the search box or resetting the filters."
            action={
              <button type="button" onClick={resetFilters} className={BTN_GHOST}>Reset filters</button>
            }
          />
        </div>
      ) : !isDesktop || view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ member, day, availability, currentAssignment, upcomingShoot }) => {
            const statusBadge = getMemberStatusBadge(member);
            return (
              <article key={member.id} className={`${CARD} space-y-3 p-4 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md`}>
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(member)}
                  className="flex items-start gap-3 w-full text-left cursor-pointer group"
                >
                  <Avatar member={member} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-[#464B43] transition">{member.name}</h4>
                    <p className="text-xs font-bold text-[#464B43] truncate">{member.role}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-400">{getEmployeeCode(member)}</p>
                  </div>
                  <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                </button>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Today</span>
                    <Badge className={day.badgeClass}>{day.label}</Badge>
                  </div>
                  {currentAssignment && (
                    <p className="text-slate-700 font-semibold truncate">
                      {currentAssignment.shootTitle} · {currentAssignment.location || 'Location TBD'}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Availability</span>
                    <Badge className={availability.badgeClass}>{availability.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Next shoot</span>
                    <span className="font-bold text-slate-700 truncate max-w-[60%] text-right">
                      {upcomingShoot ? `${formatDayLabel(upcomingShoot.date)} · ${upcomingShoot.shootTitle}` : 'None booked'}
                    </span>
                  </div>
                  {canViewSalary && <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Pay structure</span>
                    <div className="text-right"><PayStructure member={member} /></div>
                  </div>}
                </div>

                {canViewContact && <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <Phone className="w-3 h-3" />
                  <span className="truncate">{getMemberPhone(member) || 'No phone'}</span>
                  <span className="text-slate-300">|</span>
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{member.email || 'No email'}</span>
                </div>}

                <MemberActions
                  member={member}
                  onOpenProfile={onOpenProfile}
                  onEditMember={onEditMember}
                  onMarkAttendance={onMarkAttendance}
                  onAssignShoot={onAssignShoot}
                  onApplyLeave={onApplyLeave}
                  onToggleActive={onToggleActive}
                />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#e2d9d3] bg-white shadow-[0_12px_34px_rgba(48,44,46,.07)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#4A5047] bg-[#2C2F2A] text-xs font-extrabold uppercase tracking-wider text-[#EEEFED]">
                  <th className="p-3.5">Member</th>
                  <th className="hidden p-3.5 xl:table-cell">Role / Department</th>
                  <th className="hidden p-3.5 2xl:table-cell">Employment</th>
                  {canViewContact && <th className="hidden p-3.5 2xl:table-cell">Contact</th>}
                  <th className="hidden p-3.5 lg:table-cell">Status</th>
                  <th className="p-3.5">Today</th>
                  <th className="hidden p-3.5 xl:table-cell">Assignment</th>
                  <th className="hidden p-3.5 xl:table-cell">Availability</th>
                  {canViewSalary && <th className="hidden p-3.5 xl:table-cell">Salary / Rate</th>}
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee7e2] bg-white align-middle">
                {filtered.map(({ member, day, availability, currentAssignment, upcomingShoot }) => {
                  const statusBadge = getMemberStatusBadge(member);
                  const phone = getMemberPhone(member);
                  return (
                    <tr key={member.id} className="transition hover:bg-[#FBFDF6]">
                      <td className="p-3.5">
                        <button type="button" onClick={() => onOpenProfile?.(member)} disabled={!onOpenProfile} className={`group flex items-center gap-2.5 text-left ${onOpenProfile ? 'cursor-pointer' : 'cursor-default'}`}>
                          <Avatar member={member} size="md" />
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-900 transition group-hover:text-[#464B43]">{member.name}</p>
                            <p className="truncate text-[11px] font-semibold text-[#464B43] xl:hidden">{member.role}</p>
                            <p className="font-mono text-[10px] font-bold text-slate-400">{getEmployeeCode(member)}</p>
                          </div>
                        </button>
                      </td>
                      <td className="hidden p-3.5 xl:table-cell">
                        <p className="font-bold text-slate-800">{member.role}</p>
                        <p className="text-[11px] font-semibold text-slate-500">{getMemberDepartment(member)}</p>
                      </td>
                      <td className="hidden p-3.5 2xl:table-cell">
                        <Badge className="border-[#ded5cf] bg-[#f6f1ee] text-slate-700">{getEmploymentType(member)}</Badge>
                      </td>
                      {canViewContact && <td className="hidden p-3.5 2xl:table-cell">
                        <p className="font-mono text-xs text-slate-700">{phone || '—'}</p>
                        <p className="max-w-[160px] truncate text-[11px] text-slate-500">{member.email || '—'}</p>
                      </td>}
                      <td className="hidden p-3.5 lg:table-cell"><Badge className={statusBadge.className}>{statusBadge.label}</Badge></td>
                      <td className="p-3.5">
                        <Badge className={day.badgeClass}>{day.label}</Badge>
                        {day.checkIn && (
                          <p className="mt-0.5 font-mono text-[10px] text-slate-500">{day.checkIn}{day.checkOut ? ` – ${day.checkOut}` : ' – …'}</p>
                        )}
                      </td>
                      <td className="hidden p-3.5 xl:table-cell">
                        {currentAssignment ? (
                          <div className="max-w-[190px]">
                            <p className="truncate font-bold text-slate-800">{currentAssignment.shootTitle}</p>
                            <p className="truncate text-[11px] text-slate-500">{currentAssignment.projectName}</p>
                          </div>
                        ) : upcomingShoot ? (
                          <div className="max-w-[190px]">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Next shoot</p>
                            <p className="truncate text-xs font-bold text-slate-800">{formatDayLabel(upcomingShoot.date)}</p>
                            <p className="truncate text-[11px] text-slate-500">{upcomingShoot.shootTitle}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No shoot booked</span>
                        )}
                      </td>
                      <td className="hidden p-3.5 xl:table-cell">
                        <Badge className={availability.badgeClass} title={availability.reason}>{availability.status}</Badge>
                      </td>
                      {canViewSalary && <td className="hidden p-3.5 xl:table-cell"><PayStructure member={member} /></td>}
                      <td className="p-3.5 text-right">
                        <MemberActions
                          member={member}
                          onOpenProfile={onOpenProfile}
                          onEditMember={onEditMember}
                          onMarkAttendance={onMarkAttendance}
                          onAssignShoot={onAssignShoot}
                          onApplyLeave={onApplyLeave}
                          onToggleActive={onToggleActive}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
