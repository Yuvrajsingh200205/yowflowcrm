'use client';

/**
 * Availability board — grouped by role so a manager building a wedding crew can
 * see, at a glance, which photographer / cinematographer / drone operator is
 * free on a given date.
 */

import React, { useMemo, useState } from 'react';
import { CalendarCheck2, Camera, CircleSlash, Users } from 'lucide-react';
import { AttendanceRecord, AvailabilityStatus, LeaveRequest, Project, TeamMember } from '@/types';
import { Avatar, BTN_GHOST, Badge, CARD, EmptyState, FIELD, KpiCard, RoleIcon } from './TeamUiKit';
import {
  formatLongDate,
  getAvailability,
  getTodayDateString,
  isActiveMember,
} from '../teamDomain';

interface Props {
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  onUpdateMember?: (member: TeamMember) => void;
  onAssignShoot?: (member: TeamMember) => void;
  onOpenProfile: (member: TeamMember) => void;
}

const OVERRIDE_OPTIONS: Array<AvailabilityStatus | ''> = ['', 'Available', 'Busy', 'WFH', 'Unavailable'];

export const TeamAvailabilityView: React.FC<Props> = ({
  team,
  attendance,
  projects,
  leaves,
  onUpdateMember,
  onAssignShoot,
  onOpenProfile,
}) => {
  const today = getTodayDateString();
  const [dateKey, setDateKey] = useState(today);

  const rows = useMemo(
    () =>
      team
        .filter(isActiveMember)
        .map((member) => ({
          member,
          availability: getAvailability(member, dateKey, attendance, projects, leaves),
        })),
    [team, dateKey, attendance, projects, leaves]
  );

  const byRole = useMemo(() => {
    const map = new Map<string, typeof rows>();
    rows.forEach((row) => {
      const role = String(row.member.role || 'Other');
      if (!map.has(role)) map.set(role, []);
      map.get(role)!.push(row);
    });
    return [...map.entries()]
      .map(([role, members]) => ({
        role,
        members: members.sort((a, b) => {
          // Free people float to the top of each role column.
          const weight = (s: AvailabilityStatus) => (s === 'Available' ? 0 : s === 'WFH' ? 1 : s === 'On Shoot' ? 2 : 3);
          return weight(a.availability.status) - weight(b.availability.status) || a.member.name.localeCompare(b.member.name);
        }),
      }))
      .sort((a, b) => a.role.localeCompare(b.role));
  }, [rows]);

  const counts = useMemo(() => {
    const c = { Available: 0, 'On Shoot': 0, Busy: 0, 'On Leave': 0, WFH: 0, Unavailable: 0 } as Record<AvailabilityStatus, number>;
    rows.forEach(({ availability }) => {
      c[availability.status] = (c[availability.status] || 0) + 1;
    });
    return c;
  }, [rows]);

  const setOverride = (member: TeamMember, value: string) => {
    if (!onUpdateMember) return;
    onUpdateMember({
      ...member,
      availabilityStatus: value ? (value as AvailabilityStatus) : undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div className={`${CARD} p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3`}>
        <div className="w-full sm:w-64">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1" htmlFor="avail-date">
            Check availability for
          </label>
          <input id="avail-date" type="date" className={FIELD} value={dateKey} onChange={(e) => setDateKey(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setDateKey(today)} className={BTN_GHOST} disabled={dateKey === today}>Today</button>
          <p className="text-[11px] font-bold text-slate-500">{formatLongDate(dateKey)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Available" value={counts.Available || 0} icon={CalendarCheck2} tone="emerald" />
        <KpiCard label="On shoot" value={counts['On Shoot'] || 0} icon={Camera} tone="purple" />
        <KpiCard label="WFH" value={counts.WFH || 0} tone="blue" />
        <KpiCard label="Busy" value={counts.Busy || 0} tone="amber" />
        <KpiCard label="On leave" value={counts['On Leave'] || 0} tone="red" />
        <KpiCard label="Unavailable" value={counts.Unavailable || 0} icon={CircleSlash} tone="neutral" />
      </div>

      {byRole.length === 0 ? (
        <div className={CARD}>
          <EmptyState icon={Users} title="No active team members" message="Availability is calculated for active roster members only." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {byRole.map(({ role, members }) => (
            <section key={role} className={`${CARD} overflow-hidden`}>
              <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 truncate">
                  <RoleIcon role={role} className="mr-1 inline size-3.5 text-[#24291E]" />{role}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700">
                  {members.filter((m) => m.availability.status === 'Available').length} free
                </span>
              </header>

              <ul className="divide-y divide-slate-100">
                {members.map(({ member, availability }) => (
                  <li key={member.id} className="px-4 py-2.5 space-y-1.5 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2.5">
                      <button type="button" onClick={() => onOpenProfile(member)} className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer group">
                        <Avatar member={member} size="sm" />
                        <span className="text-xs font-extrabold text-slate-900 truncate group-hover:text-[#24291E] transition">{member.name}</span>
                      </button>
                      <Badge className={availability.badgeClass}>{availability.status}</Badge>
                    </div>

                    <p className="text-[10px] font-semibold text-slate-500 pl-10 truncate" title={availability.reason}>
                      {availability.reason}
                    </p>

                    <div className="flex items-center gap-1.5 pl-10">
                      {onUpdateMember && (
                      <select
                        className="text-[10px] font-bold border border-slate-200 rounded-lg px-1.5 py-1 bg-white text-slate-700 cursor-pointer"
                        value={member.availabilityStatus || ''}
                        onChange={(e) => setOverride(member, e.target.value)}
                        aria-label={`Availability override for ${member.name}`}
                      >
                        {OVERRIDE_OPTIONS.map((opt) => (
                          <option key={opt || 'auto'} value={opt}>{opt || 'Auto (derived)'}</option>
                        ))}
                      </select>
                      )}
                      {onAssignShoot && availability.status !== 'On Leave' && (
                        <button type="button" onClick={() => onAssignShoot(member)} className="text-[10px] font-bold text-[#24291E] hover:text-[#1C2018] underline cursor-pointer">
                          Assign shoot
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
