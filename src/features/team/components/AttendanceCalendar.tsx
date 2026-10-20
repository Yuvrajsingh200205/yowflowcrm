'use client';

/**
 * Monthly attendance calendar.
 *
 * Single-member mode powers the profile drawer; the team grid mode powers the
 * Attendance tab's month view. Both read `resolveDayStatus`, so a shoot day is
 * an "S" everywhere rather than an "A" in one place and a "P" in another.
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AttendanceRecord, LeaveRequest, Project, TeamMember } from '@/types';
import { Avatar, Badge, ScrollArea } from './TeamUiKit';
import {
  DayStatus,
  addDays,
  getTodayDateString,
  resolveDayStatus,
  toDateKey,
} from '../teamDomain';

/** Legend shared by both modes — matches the codes in the brief. */
export const CALENDAR_LEGEND: Array<{ code: string; label: string; className: string }> = [
  { code: 'P', label: 'Present (office)', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { code: 'WFH', label: 'Work from home', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  { code: 'S', label: 'On shoot', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  { code: 'HD', label: 'Half day', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  { code: 'L', label: 'Leave', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  { code: 'WO', label: 'Weekly off', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  { code: 'H', label: 'Holiday', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  { code: 'A', label: 'Absent', className: 'bg-red-100 text-red-700 border-red-200' },
  { code: '–', label: 'Not marked', className: 'bg-slate-50 text-slate-400 border-slate-200' },
];

export function getMonthDays(monthKey: string): string[] {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return [];
  const days: string[] = [];
  let cursor = `${monthKey}-01`;
  const total = new Date(year, month, 0).getDate();
  for (let i = 0; i < total; i++) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export const CalendarLegend: React.FC = () => (
  <div className="flex flex-wrap items-center gap-2.5 pt-1">
    {CALENDAR_LEGEND.map((item) => (
      <span key={item.code} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
        <span className={`inline-grid place-items-center min-w-[2rem] h-7 px-1.5 rounded-md border text-xs font-black ${item.className}`}>{item.code}</span>
        {item.label}
      </span>
    ))}
  </div>
);

export const MonthNavigator: React.FC<{
  monthKey: string;
  onChange: (monthKey: string) => void;
}> = ({ monthKey, onChange }) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => onChange(shiftMonth(monthKey, -1))}
      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-rose-300 hover:text-[#464B43] text-slate-500 transition cursor-pointer"
      aria-label="Previous month"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <span className="text-base font-extrabold text-slate-800 min-w-[11rem] text-center">{formatMonthLabel(monthKey)}</span>
    <button
      type="button"
      onClick={() => onChange(shiftMonth(monthKey, 1))}
      className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-rose-300 hover:text-[#464B43] text-slate-500 transition cursor-pointer"
      aria-label="Next month"
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
);

// ----------------------------------------------------------------------------

interface SingleMemberProps {
  member: TeamMember;
  monthKey: string;
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  onSelectDay?: (dateKey: string, status: DayStatus) => void;
}

/** Classic month grid for one member. */
export const MemberAttendanceCalendar: React.FC<SingleMemberProps> = ({
  member,
  monthKey,
  attendance,
  projects,
  leaves,
  onSelectDay,
}) => {
  const today = getTodayDateString();
  const days = useMemo(() => getMonthDays(monthKey), [monthKey]);
  const leadingBlanks = days.length ? new Date(`${days[0]}T00:00:00`).getDay() : 0;

  const statuses = useMemo(
    () =>
      days.map((dateKey) => ({
        dateKey,
        status: resolveDayStatus({ member, dateKey, attendance, projects, leaves, today }),
      })),
    [days, member, attendance, projects, leaves, today]
  );

  if (!days.length) return null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span key={d} className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 py-1">{d}</span>
        ))}
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" />
        ))}
        {statuses.map(({ dateKey, status }) => {
          const dayNumber = Number(dateKey.slice(8, 10));
          const isToday = dateKey === today;
          const content = (
            <>
              <span className="text-[10px] font-bold text-slate-500">{dayNumber}</span>
              <span className={`text-[10px] font-black leading-none ${status.kind === 'scheduled' ? 'text-slate-300' : ''}`}>
                {status.code}
              </span>
            </>
          );
          const className = `flex flex-col items-center justify-center gap-0.5 rounded-lg border py-1.5 transition ${status.badgeClass} ${
            isToday ? 'ring-2 ring-rose-300' : ''
          }`;

          return onSelectDay ? (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDay(dateKey, status)}
              title={`${dateKey} · ${status.label}${status.shoot ? ` · ${status.shoot.shootTitle}` : ''}`}
              className={`${className} cursor-pointer hover:ring-2 hover:ring-rose-300`}
            >
              {content}
            </button>
          ) : (
            <div
              key={dateKey}
              title={`${dateKey} · ${status.label}${status.shoot ? ` · ${status.shoot.shootTitle}` : ''}`}
              className={className}
            >
              {content}
            </div>
          );
        })}
      </div>
      <CalendarLegend />
    </div>
  );
};

// ----------------------------------------------------------------------------

interface TeamGridProps {
  team: TeamMember[];
  monthKey: string;
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  onSelectMember?: (member: TeamMember) => void;
}

/** Row-per-member month grid — the manager's whole-studio attendance sheet. */
export const TeamAttendanceCalendarGrid: React.FC<TeamGridProps> = ({
  team,
  monthKey,
  attendance,
  projects,
  leaves,
  onSelectMember,
}) => {
  const today = getTodayDateString();
  const days = useMemo(() => getMonthDays(monthKey), [monthKey]);

  const grid = useMemo(
    () =>
      team.map((member) => ({
        member,
        cells: days.map((dateKey) => ({
          dateKey,
          status: resolveDayStatus({ member, dateKey, attendance, projects, leaves, today }),
        })),
      })),
    [team, days, attendance, projects, leaves, today]
  );

  if (!team.length || !days.length) return null;

  return (
    <div className="space-y-5">
      <ScrollArea>
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-white py-3 pr-5 text-left text-xs font-extrabold uppercase tracking-wider text-slate-600 min-w-[240px]">
                Member
              </th>
              {days.map((dateKey) => (
                <th
                  key={dateKey}
                  className={`px-1 pb-3 text-xs font-extrabold ${dateKey === today ? 'text-[#464B43]' : 'text-slate-500'}`}
                >
                  {Number(dateKey.slice(8, 10))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map(({ member, cells }) => (
              <tr key={member.id} className="hover:bg-slate-50/60">
                <td className="sticky left-0 z-10 bg-white py-2.5 pr-5">
                  <button
                    type="button"
                    onClick={() => onSelectMember?.(member)}
                    className="flex items-center gap-3 text-left cursor-pointer group"
                  >
                    <Avatar member={member} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900 truncate max-w-[165px] group-hover:text-[#464B43] transition">{member.name}</p>
                      <p className="text-[11px] font-bold text-slate-500 truncate max-w-[165px]">{member.role}</p>
                    </div>
                  </button>
                </td>
                {cells.map(({ dateKey, status }) => (
                  <td key={dateKey} className="px-1 py-1.5">
                    <span
                      title={`${member.name} · ${dateKey} · ${status.label}${status.shoot ? ` · ${status.shoot.shootTitle}` : ''}`}
                      className={`grid place-items-center min-w-[2.45rem] h-9 rounded-lg border text-xs font-black ${status.badgeClass} ${
                        dateKey === today ? 'ring-1 ring-rose-300' : ''
                      }`}
                    >
                      {status.code}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
      <CalendarLegend />
    </div>
  );
};

export { toDateKey };
