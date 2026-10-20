'use client';

/**
 * Workforce schedule — "who is working, and where?" for a rolling window.
 * Each row is one member on one day, resolved from shoots, leave, the weekly
 * off roster and any marked attendance.
 */

import React, { useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { AttendanceRecord, LeaveRequest, Project, TeamMember } from '@/types';
import { Avatar, BTN_GHOST, Badge, CARD, EmptyState, FIELD } from './TeamUiKit';
import {
  addDays,
  formatLongDate,
  getDateRange,
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
  onOpenProfile: (member: TeamMember) => void;
}

const RANGE_PRESETS = [
  { label: 'This week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: 'This month', days: 30 },
];

export const TeamScheduleView: React.FC<Props> = ({ team, attendance, projects, leaves, onOpenProfile }) => {
  const today = getTodayDateString();
  const [startDate, setStartDate] = useState(today);
  const [span, setSpan] = useState(7);
  const [search, setSearch] = useState('');
  const [onlyWorking, setOnlyWorking] = useState(true);

  const endDate = useMemo(() => addDays(startDate, span - 1), [startDate, span]);
  const activeTeam = useMemo(() => team.filter(isActiveMember), [team]);

  const days = useMemo(() => {
    const range = getDateRange(startDate, endDate);
    return range.map((dateKey) => {
      const entries = activeTeam
        .filter((member) => memberMatchesSearch(member, search))
        .map((member) => ({
          member,
          status: resolveDayStatus({ member, dateKey, attendance, projects, leaves, today }),
        }))
        // Shoot bookings first — they are the commitments that cannot move.
        .sort((a, b) => {
          const weight = (kind: string) => (kind === 'on_shoot' ? 0 : kind === 'office' || kind === 'wfh' ? 1 : 2);
          return weight(a.status.kind) - weight(b.status.kind) || a.member.name.localeCompare(b.member.name);
        })
        .filter(({ status }) => {
          if (!onlyWorking) return true;
          return ['on_shoot', 'office', 'wfh', 'half_day', 'leave'].includes(status.kind);
        });
      return { dateKey, entries };
    });
  }, [startDate, endDate, activeTeam, search, attendance, projects, leaves, today, onlyWorking]);

  const totalEntries = days.reduce((sum, d) => sum + d.entries.length, 0);

  return (
    <div className="space-y-5">
      <div className={`${CARD} p-4 flex flex-col lg:flex-row lg:items-end gap-3`}>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1" htmlFor="sch-start">Start date</label>
            <input id="sch-start" type="date" className={FIELD} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1" htmlFor="sch-span">Window</label>
            <select id="sch-span" className={FIELD} value={span} onChange={(e) => setSpan(Number(e.target.value))}>
              {RANGE_PRESETS.map((p) => (
                <option key={p.days} value={p.days}>{p.label} ({p.days} days)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1" htmlFor="sch-search">Search</label>
            <input id="sch-search" className={FIELD} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by member or role…" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setStartDate(addDays(startDate, -span))} className={`${BTN_GHOST} !px-2`} aria-label="Previous window">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setStartDate(today)} className={BTN_GHOST}>Today</button>
          <button type="button" onClick={() => setStartDate(addDays(startDate, span))} className={`${BTN_GHOST} !px-2`} aria-label="Next window">
            <ChevronRight className="w-4 h-4" />
          </button>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={onlyWorking}
              onChange={(e) => setOnlyWorking(e.target.checked)}
              className="size-3.5 rounded border-slate-300 text-[#2f5f54] focus:ring-[#366e61]"
            />
            Working days only
          </label>
        </div>
      </div>

      {totalEntries === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={CalendarClock}
            title="Nothing scheduled in this window"
            message={
              activeTeam.length
                ? 'No shoots, office days or leave fall in this range. Assign crew to a shoot to populate the schedule.'
                : 'Add active team members to build a schedule.'
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {days.map(({ dateKey, entries }) => (
            <section key={dateKey} className={`${CARD} overflow-hidden`}>
              <header className={`flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 ${dateKey === today ? 'bg-rose-50/60' : 'bg-slate-50/60'}`}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <CalendarClock className={`w-4 h-4 ${dateKey === today ? 'text-[#2f5f54]' : 'text-slate-400'}`} />
                  {formatLongDate(dateKey)}
                  {dateKey === today && <Badge className="bg-rose-100 text-[#254b42] border-rose-200">Today</Badge>}
                </h3>
                <span className="text-[11px] font-bold text-slate-500">
                  {entries.filter((e) => e.status.kind === 'on_shoot').length} on shoot · {entries.length} scheduled
                </span>
              </header>

              {entries.length === 0 ? (
                <p className="px-5 py-4 text-xs text-slate-400 font-medium italic">No one scheduled.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {entries.map(({ member, status }) => (
                    <li key={`${dateKey}-${member.id}`} className="flex flex-col sm:flex-row sm:items-center gap-2 px-5 py-2.5 hover:bg-slate-50 transition">
                      <button type="button" onClick={() => onOpenProfile(member)} className="flex items-center gap-2.5 min-w-[190px] text-left cursor-pointer group">
                        <Avatar member={member} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate group-hover:text-[#2f5f54] transition">{member.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 truncate">{status.shoot?.role || member.role}</p>
                        </div>
                      </button>

                      <div className="flex-1 min-w-0">
                        {status.shoot ? (
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {status.shoot.shootTitle}
                            <span className="font-medium text-slate-500"> · {status.shoot.projectName}</span>
                          </p>
                        ) : (
                          <p className="text-xs font-bold text-slate-700">
                            {status.kind === 'wfh' ? 'Working from home' : status.kind === 'leave' ? `${status.leave?.leaveType || ''} leave`.trim() : status.label}
                          </p>
                        )}
                        <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {status.location || (status.kind === 'office' ? 'Studio Office' : '—')}
                          {status.shoot?.time && <span className="text-slate-400">· {status.shoot.time}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Badge className={status.badgeClass}>{status.label}</Badge>
                        {member.shift && status.kind !== 'on_shoot' && (
                          <Badge className="bg-slate-100 text-slate-600 border-slate-200">{member.shift}</Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
