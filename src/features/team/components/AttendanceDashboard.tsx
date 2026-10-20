'use client';

/**
 * Daily attendance desk.
 *
 * The day strip and the table both come from `resolveDayStatus`, which means a
 * photographer booked on a wedding shows as "On Shoot" with the shoot name and
 * venue instead of being counted absent from the studio.
 */

import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  Home,
  LogIn,
  LogOut,
  MapPin,
  Pencil,
  Plane,
  Users,
  XCircle,
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest, Project, TeamMember } from '@/types';
import { useToast } from '@/components/common';
import {
  Avatar,
  BTN_GHOST,
  BTN_PRIMARY,
  Badge,
  CARD,
  EmptyState,
  FIELD,
  LABEL,
  KpiCard,
  ScrollArea,
  TD,
  TH,
  TOGGLE_ACTIVE,
  TOGGLE_IDLE,
  TOGGLE_WRAP,
} from './TeamUiKit';
import { MonthNavigator, TeamAttendanceCalendarGrid } from './AttendanceCalendar';
import {
  buildAttendanceRecord,
  computeWorkingHours,
  formatHours,
  formatLongDate,
  getAttendanceOnDate,
  getCurrentTimeLabel,
  getDefaultStatusForMember,
  getTodayDateString,
  isActiveMember,
  memberMatchesSearch,
  resolveDayStatus,
} from '../teamDomain';

interface Props {
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  onSaveAttendance: (record: AttendanceRecord) => void;
  onOpenMarkAttendance: (member: TeamMember, dateKey: string) => void;
  onOpenProfile: (member: TeamMember) => void;
  canManage?: boolean;
}

const ALL = 'all';

export const AttendanceDashboard: React.FC<Props> = ({
  team,
  attendance,
  projects,
  leaves,
  onSaveAttendance,
  onOpenMarkAttendance,
  onOpenProfile,
  canManage = false,
}) => {
  const { showToast } = useToast();
  const today = getTodayDateString();
  const [dateKey, setDateKey] = useState(today);
  const [mode, setMode] = useState<'day' | 'month'>('day');
  const [monthKey, setMonthKey] = useState(today.slice(0, 7));
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(ALL);

  const activeTeam = useMemo(() => team.filter(isActiveMember), [team]);

  const rows = useMemo(
    () =>
      activeTeam.map((member) => ({
        member,
        day: resolveDayStatus({ member, dateKey, attendance, projects, leaves, today }),
      })),
    [activeTeam, dateKey, attendance, projects, leaves, today]
  );

  const summary = useMemo(() => {
    const s = { present: 0, absent: 0, late: 0, wfh: 0, leave: 0, notMarked: 0, onShoot: 0, weeklyOff: 0 };
    rows.forEach(({ day }) => {
      switch (day.kind) {
        case 'office':
        case 'half_day':
          s.present++;
          break;
        case 'wfh':
          s.wfh++;
          s.present++;
          break;
        case 'on_shoot':
          s.onShoot++;
          s.present++;
          break;
        case 'leave':
          s.leave++;
          break;
        case 'absent':
          s.absent++;
          break;
        case 'weekly_off':
        case 'holiday':
          s.weeklyOff++;
          break;
        default:
          s.notMarked++;
      }
      if (day.record?.isLate) s.late++;
    });
    return s;
  }, [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter(({ member, day }) => {
        if (!memberMatchesSearch(member, search)) return false;
        if (typeFilter !== ALL && day.kind !== typeFilter) return false;
        return true;
      }),
    [rows, search, typeFilter]
  );

  /** Check-in / check-out write straight into the attendance ledger. */
  const stampTime = (member: TeamMember, field: 'in' | 'out') => {
    const existing = getAttendanceOnDate(member, attendance, dateKey);
    const now = getCurrentTimeLabel();
    const status = existing?.status || getDefaultStatusForMember(member, dateKey, projects);
    const record = buildAttendanceRecord({
      member,
      dateKey,
      status,
      inTime: field === 'in' ? now : existing?.inTime,
      outTime: field === 'out' ? now : existing?.outTime,
      project: projects.find((p) => p.id === existing?.projectId),
      shoot: resolveDayStatus({ member, dateKey, attendance, projects, leaves, today }).shoot,
      location: existing?.location,
      notes: existing?.notes,
      existing,
    });
    onSaveAttendance(record);
    showToast(`${member.name} checked ${field === 'in' ? 'in' : 'out'} at ${now}.`);
  };

  const isPastOrToday = dateKey <= today;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className={`${CARD} flex flex-col gap-4 p-5 lg:flex-row lg:items-end`}>
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={LABEL} htmlFor="att-date">
              Attendance date
            </label>
            <input id="att-date" type="date" className={FIELD} value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="att-search">
              Search
            </label>
            <input id="att-search" className={FIELD} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, ID or role…" />
          </div>
          <div>
            <label className={LABEL} htmlFor="att-type">
              Attendance type
            </label>
            <select id="att-type" className={FIELD} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value={ALL}>All types</option>
              <option value="office">Office</option>
              <option value="wfh">WFH</option>
              <option value="on_shoot">On Shoot</option>
              <option value="leave">Leave</option>
              <option value="weekly_off">Weekly Off</option>
              <option value="holiday">Holiday</option>
              <option value="absent">Absent</option>
              <option value="not_marked">Not marked</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDateKey(today)} className={`${BTN_GHOST} !px-4 !py-3 !text-sm`} disabled={dateKey === today}>
            Today
          </button>
          <div className={TOGGLE_WRAP}>
            <button
              type="button"
              onClick={() => setMode('day')}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition ${mode === 'day' ? TOGGLE_ACTIVE : TOGGLE_IDLE}`}
              aria-pressed={mode === 'day'}
            >
              <CalendarDays className="size-4" /> Day
            </button>
            <button
              type="button"
              onClick={() => setMode('month')}
              className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-3 text-sm font-bold transition ${mode === 'month' ? TOGGLE_ACTIVE : TOGGLE_IDLE}`}
              aria-pressed={mode === 'month'}
            >
              <CalendarRange className="size-4" /> Month
            </button>
          </div>
        </div>
      </div>

      {mode === 'month' ? (
        <section className={`${CARD} p-6 space-y-5`}>
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Monthly attendance calendar</h3>
              <p className="text-sm text-slate-500 font-medium">Every member, every day — shoot days included.</p>
            </div>
            <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />
          </header>
          {activeTeam.length ? (
            <TeamAttendanceCalendarGrid
              team={activeTeam}
              monthKey={monthKey}
              attendance={attendance}
              projects={projects}
              leaves={leaves}
              onSelectMember={onOpenProfile}
            />
          ) : (
            <EmptyState icon={Users} title="No active team members" message="Add members to the roster to see the monthly attendance sheet." />
          )}
        </section>
      ) : (
        <>
          {/* Day summary */}
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Attendance for {formatLongDate(dateKey)}
              {dateKey === today && <span className="ml-2 text-[#2f5f54]">· Today</span>}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <KpiCard label="Present" value={summary.present} icon={CheckCircle2} tone="emerald" hint="Office + WFH + shoot" />
              <KpiCard label="Absent" value={summary.absent} icon={XCircle} tone="red" />
              <KpiCard label="Late" value={summary.late} icon={Clock} tone="amber" hint="After shift start" />
              <KpiCard label="WFH" value={summary.wfh} icon={Home} tone="blue" />
              <KpiCard label="On leave" value={summary.leave} icon={Plane} tone="amber" />
              <KpiCard label="Not marked" value={summary.notMarked} icon={Users} tone="neutral" />
            </div>
          </div>

          {/* Attendance table */}
          <section className={`${CARD} p-5 space-y-3`}>
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2f5f54]" /> Team attendance
              </h3>
              <p className="text-[11px] font-bold text-slate-500">
                {filteredRows.length} of {activeTeam.length} members · {summary.onShoot} on shoot
              </p>
            </header>

            {filteredRows.length === 0 ? (
              <EmptyState
                icon={Users}
                title={activeTeam.length ? 'No members match these filters' : 'No active team members'}
                message={
                  activeTeam.length
                    ? 'Clear the search or switch the attendance type filter.'
                    : 'Add team members first — attendance is tracked per roster member.'
                }
              />
            ) : (
              <ScrollArea>
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <TH>Employee</TH>
                      <TH>Role</TH>
                      <TH>Check in</TH>
                      <TH>Check out</TH>
                      <TH>Working hours</TH>
                      <TH>Attendance type</TH>
                      <TH>Status</TH>
                      <TH>Location</TH>
                      <TH className="text-right">Actions</TH>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map(({ member, day }) => {
                      const hours = day.workingHours ?? computeWorkingHours(day.checkIn, day.checkOut);
                      const canStamp = canManage && isPastOrToday && day.kind !== 'leave' && day.kind !== 'weekly_off' && day.kind !== 'holiday';
                      return (
                        <tr key={member.id} className="hover:bg-slate-50 transition">
                          <TD>
                            <button type="button" onClick={() => onOpenProfile(member)} className="flex items-center gap-2.5 text-left cursor-pointer group">
                              <Avatar member={member} size="sm" />
                              <span className="font-extrabold text-slate-900 group-hover:text-[#2f5f54] transition">{member.name}</span>
                            </button>
                          </TD>
                          <TD className="text-slate-600 font-semibold">{member.role}</TD>
                          <TD className="font-mono">
                            {day.checkIn || <span className="text-slate-400">--</span>}
                            {day.record?.isLate && <Badge className="ml-1.5 bg-amber-100 text-amber-800 border-amber-200">Late</Badge>}
                          </TD>
                          <TD className="font-mono">
                            {day.checkOut || (day.checkIn ? <span className="text-blue-600 font-bold">In progress</span> : <span className="text-slate-400">--</span>)}
                          </TD>
                          <TD className="font-mono font-bold text-slate-800">{formatHours(hours)}</TD>
                          <TD>
                            <Badge className={day.badgeClass}>{day.attendanceType || day.label}</Badge>
                          </TD>
                          <TD>
                            <span className="font-bold text-slate-800">{day.label}</span>
                            {day.derived && day.kind !== 'not_marked' && day.kind !== 'scheduled' && (
                              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Auto from {day.shoot ? 'shoot' : day.leave ? 'leave' : 'roster'}</p>
                            )}
                            {day.shoot && <p className="text-[10px] text-purple-700 font-semibold truncate max-w-[190px]">{day.shoot.shootTitle} · {day.shoot.projectName}</p>}
                          </TD>
                          <TD>
                            {day.location ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                                <MapPin className="w-3 h-3 text-slate-400" /> {day.location}
                              </span>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </TD>
                          <TD className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canStamp && !day.checkIn && (
                                <button type="button" onClick={() => stampTime(member, 'in')} className={`${BTN_GHOST} !px-2 !py-1.5`} title="Check in now">
                                  <LogIn className="w-3.5 h-3.5" /> In
                                </button>
                              )}
                              {canStamp && day.checkIn && !day.checkOut && (
                                <button type="button" onClick={() => stampTime(member, 'out')} className={`${BTN_GHOST} !px-2 !py-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50`} title="Check out now">
                                  <LogOut className="w-3.5 h-3.5" /> Out
                                </button>
                              )}
                              {canManage && (
                              <button
                                type="button"
                                onClick={() => onOpenMarkAttendance(member, dateKey)}
                                className={`${BTN_GHOST} !px-2 !py-1.5`}
                                title={day.record ? 'Edit attendance entry' : 'Mark attendance'}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              )}
                            </div>
                          </TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
            )}
          </section>
        </>
      )}
    </div>
  );
};
