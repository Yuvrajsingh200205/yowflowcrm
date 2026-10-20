'use client';

/**
 * Capacity & performance.
 *
 * Answers "who is overbooked?" and "who is showing up?" from the same derived
 * data the rest of the module uses — shoot bookings for workload, the
 * attendance ledger for reliability.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarRange, Camera, Clock, Download, TrendingUp, Users, WalletCards } from 'lucide-react';
import { AttendanceRecord, LeaveRequest, Project, TeamMember } from '@/types';
import {
  Avatar,
  BTN_GHOST,
  Badge,
  CARD,
  EmptyState,
  FIELD,
  KpiCard,
  LABEL,
  ScrollArea,
  TD,
  TH,
} from './TeamUiKit';
import {
  addDays,
  formatDayLabel,
  formatHours,
  getAttendanceStats,
  getAvailability,
  getTodayDateString,
  getWorkloadForRange,
  isActiveMember,
} from '../teamDomain';
import { attendanceApi, type EmployeePerformanceReport } from '@/lib/api/attendance';

interface Props {
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  onOpenProfile: (member: TeamMember) => void;
}

const PRESETS = [
  { label: 'This week', days: 7 },
  { label: 'Next 2 weeks', days: 14 },
  { label: 'This month', days: 30 },
];

export const TeamPerformanceView: React.FC<Props> = ({ team, attendance, projects, leaves, onOpenProfile }) => {
  const today = getTodayDateString();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [span, setSpan] = useState(7);
  const [statsStart, setStatsStart] = useState(monthStart);
  const [statsEnd, setStatsEnd] = useState(today);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [reportMonth, setReportMonth] = useState(today.slice(0, 7));
  const [employeeReport, setEmployeeReport] = useState<EmployeePerformanceReport | null>(null);
  const [reportState, setReportState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [downloadingReport, setDownloadingReport] = useState(false);

  const capacityEnd = useMemo(() => addDays(today, span - 1), [today, span]);
  const activeTeam = useMemo(() => team.filter(isActiveMember), [team]);

  useEffect(() => {
    if (!selectedEmployeeId && activeTeam[0]) setSelectedEmployeeId(activeTeam[0].id);
  }, [activeTeam, selectedEmployeeId]);

  useEffect(() => {
    if (!selectedEmployeeId || !reportMonth) return;
    let active = true;
    setReportState('loading');
    attendanceApi.performanceReport(selectedEmployeeId, reportMonth)
      .then((report) => {
        if (!active) return;
        setEmployeeReport(report);
        setReportState('idle');
      })
      .catch(() => {
        if (!active) return;
        setEmployeeReport(null);
        setReportState('error');
      });
    return () => { active = false; };
  }, [selectedEmployeeId, reportMonth]);

  const workload = useMemo(
    () => getWorkloadForRange(activeTeam, projects, attendance, leaves, today, capacityEnd),
    [activeTeam, projects, attendance, leaves, today, capacityEnd]
  );

  const capacity = useMemo(() => {
    const c = { available: 0, onShoot: 0, onLeave: 0, wfh: 0 };
    activeTeam.forEach((member) => {
      const a = getAvailability(member, today, attendance, projects, leaves);
      if (a.status === 'Available') c.available++;
      else if (a.status === 'On Shoot') c.onShoot++;
      else if (a.status === 'On Leave') c.onLeave++;
      else if (a.status === 'WFH') c.wfh++;
    });
    return c;
  }, [activeTeam, today, attendance, projects, leaves]);

  const statsRows = useMemo(
    () =>
      activeTeam
        .map((member) => ({
          member,
          stats: getAttendanceStats(member, attendance, projects, leaves, statsStart, statsEnd),
        }))
        .sort((a, b) => b.stats.attendancePercent - a.stats.attendancePercent || a.member.name.localeCompare(b.member.name)),
    [activeTeam, attendance, projects, leaves, statsStart, statsEnd]
  );

  const maxShoots = Math.max(1, ...workload.map((w) => w.shootsInRange));

  const downloadReport = async () => {
    if (!selectedEmployeeId || !reportMonth) return;
    setDownloadingReport(true);
    try {
      const { blob, filename } = await attendanceApi.downloadPerformanceReport(selectedEmployeeId, reportMonth);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || `Performance_Report_${reportMonth}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingReport(false);
    }
  };

  if (!activeTeam.length) {
    return (
      <div className={CARD}>
        <EmptyState icon={Users} title="No active team members" message="Capacity and performance are calculated for active roster members." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className={`${CARD} overflow-hidden`}>
        <header className="border-b border-[#eee7e2] bg-[linear-gradient(120deg,#fbfcfc,#FBFDF6)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-black text-slate-900"><TrendingUp className="size-5 text-[#464B43]" /> Employee performance report</h3>
              <p className="mt-1 text-xs font-medium text-slate-500">Authoritative attendance, shift hours, payroll and delivery metrics from one report API.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label>
                <span className={LABEL}>Employee</span>
                <select className={`${FIELD} min-w-[240px]`} value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                  {activeTeam.map((member) => <option key={member.id} value={member.id}>{member.name} — {member.role}</option>)}
                </select>
              </label>
              <label>
                <span className={LABEL}>Report month</span>
                <input type="month" className={FIELD} value={reportMonth} max={today.slice(0, 7)} onChange={(e) => setReportMonth(e.target.value)} />
              </label>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" className={BTN_GHOST} disabled={!employeeReport || downloadingReport} onClick={() => void downloadReport()}>
              <Download className="size-4" /> {downloadingReport ? 'Preparing PDF…' : 'Download PDF'}
            </button>
          </div>
        </header>
        {reportState === 'loading' && <div className="p-6 text-sm font-semibold text-slate-500">Loading employee report…</div>}
        {reportState === 'error' && <div className="p-6 text-sm font-semibold text-red-700">Could not load this employee report. Please try again.</div>}
        {employeeReport && reportState === 'idle' && (() => {
          const { employee, attendance: attendanceSummary, salary, performance } = employeeReport;
          const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
          return <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-lg font-black text-slate-900">{employee.fullName}</p><p className="text-xs font-semibold text-slate-500">{employee.employeeCode || 'No employee ID'} · Shift {employee.shift.start || 'Not set'} – {employee.shift.end || 'Not set'}</p></div>
              <Badge className="border-[#D8DBD6] bg-[#fafcfb] text-[#464B43]">{employeeReport.month}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
              <KpiCard label="Present" value={attendanceSummary.present} hint={`${attendanceSummary.halfDay} half day`} tone="emerald" />
              <KpiCard label="Working hours" value={formatHours(attendanceSummary.workingMinutes / 60)} hint={`Expected ${formatHours(attendanceSummary.expectedMinutes / 60)}`} icon={Clock} tone="blue" />
              <KpiCard label="Undertime" value={formatHours(attendanceSummary.undertimeMinutes / 60)} tone={attendanceSummary.undertimeMinutes ? 'amber' : 'stone'} />
              <KpiCard label="Calculated salary" value={money.format(salary.calculatedSalary)} hint={`${attendanceSummary.payableDays} payable days`} icon={WalletCards} tone="emerald" />
              <KpiCard label="Tasks complete" value={`${performance.completedTasks}/${performance.assignedTasks}`} hint={`${performance.completionRate}% completion`} tone="purple" />
              <KpiCard label="Shoot assignments" value={performance.shootAssignments} hint={`${formatHours(performance.trackedWorkMinutes / 60)} tracked`} icon={Camera} tone="rose" />
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-xs font-bold text-slate-500">Absent</span><p className="mt-1 font-black text-slate-900">{attendanceSummary.absent}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-xs font-bold text-slate-500">Late arrivals</span><p className="mt-1 font-black text-slate-900">{attendanceSummary.late}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-xs font-bold text-slate-500">Leave days</span><p className="mt-1 font-black text-slate-900">{attendanceSummary.onLeave}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-xs font-bold text-slate-500">Tracked sessions</span><p className="mt-1 font-black text-slate-900">{performance.trackedWorkSessions}</p></div>
            </div>
          </div>;
        })()}
      </section>

      {/* Capacity snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Active members" value={activeTeam.length} icon={Users} tone="rose" />
        <KpiCard label="Available now" value={capacity.available} icon={Activity} tone="emerald" />
        <KpiCard label="On shoot today" value={capacity.onShoot} icon={Camera} tone="purple" />
        <KpiCard label="WFH today" value={capacity.wfh} tone="blue" />
        <KpiCard label="On leave today" value={capacity.onLeave} tone="amber" />
      </div>

      {/* Upcoming workload */}
      <section className={`${CARD} p-5 space-y-4`}>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-[#464B43]" /> Upcoming workload
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {formatDayLabel(today)} → {formatDayLabel(capacityEnd)} · spot who is carrying too many shoots.
            </p>
          </div>
          <div className="flex items-center rounded-xl border border-[#e2d9d3] bg-[#f6f1ee] p-1">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setSpan(p.days)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition ${span === p.days ? 'border border-[#DBF1AE]/80 bg-white text-[#373B35] shadow-sm' : 'text-slate-600 hover:text-[#373B35]'}`}
                aria-pressed={span === p.days}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        <ul className="space-y-2">
          {workload.map(({ member, shootsInRange, upcomingShoots, nextShoot, availability }) => (
            <li key={member.id} className="flex items-center gap-3">
              <button type="button" onClick={() => onOpenProfile(member)} className="flex items-center gap-2.5 min-w-[190px] text-left cursor-pointer group">
                <Avatar member={member} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-900 truncate group-hover:text-[#464B43] transition">{member.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">{member.role}</p>
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <div className="h-6 rounded-lg bg-slate-100 overflow-hidden relative">
                  <div
                    className={`h-full rounded-lg transition-all ${
                      shootsInRange >= 5 ? 'bg-red-500' : shootsInRange >= 3 ? 'bg-amber-500' : 'bg-[#464B43]'
                    }`}
                    style={{ width: `${Math.round((shootsInRange / maxShoots) * 100)}%` }}
                  />
                  <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-black text-slate-700">
                    {shootsInRange} shoot{shootsInRange === 1 ? '' : 's'} in window
                  </span>
                </div>
                {nextShoot && (
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">
                    Next: {formatDayLabel(nextShoot.date)} · {nextShoot.shootTitle} · {nextShoot.location || 'TBD'}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {shootsInRange >= 5 && <Badge className="bg-red-100 text-red-700 border-red-200">Overbooked</Badge>}
                <Badge className={availability.badgeClass}>{availability.status}</Badge>
                <span className="text-[10px] font-bold text-slate-400 w-20 text-right">{upcomingShoots} upcoming</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Attendance statistics */}
      <section className={`${CARD} p-5 space-y-4`}>
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#464B43]" /> Attendance statistics
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Weekly offs and holidays are excluded from the percentage; shoot days count as present.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className={LABEL} htmlFor="perf-start">From</label>
              <input id="perf-start" type="date" className={FIELD} value={statsStart} onChange={(e) => setStatsStart(e.target.value)} />
            </div>
            <div>
              <label className={LABEL} htmlFor="perf-end">To</label>
              <input id="perf-end" type="date" className={FIELD} value={statsEnd} max={today} onChange={(e) => setStatsEnd(e.target.value)} />
            </div>
            <button
              type="button"
              onClick={() => {
                setStatsStart(monthStart);
                setStatsEnd(today);
              }}
              className={BTN_GHOST}
            >
              This month
            </button>
          </div>
        </header>

        <ScrollArea>
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="border-b border-slate-200">
              <tr>
                <TH>Member</TH>
                <TH>Attendance %</TH>
                <TH>Present</TH>
                <TH>Office</TH>
                <TH>WFH</TH>
                <TH>Shoot</TH>
                <TH>Leave</TH>
                <TH>Absent</TH>
                <TH>Late</TH>
                <TH>Avg hours</TH>
                <TH>Overtime</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statsRows.map(({ member, stats }) => (
                <tr key={member.id} className="hover:bg-slate-50 transition">
                  <TD>
                    <button type="button" onClick={() => onOpenProfile(member)} className="flex items-center gap-2.5 text-left cursor-pointer group">
                      <Avatar member={member} size="sm" />
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 truncate group-hover:text-[#464B43] transition">{member.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate">{member.role}</p>
                      </div>
                    </button>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            stats.attendancePercent >= 90 ? 'bg-emerald-500' : stats.attendancePercent >= 75 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${stats.attendancePercent}%` }}
                        />
                      </div>
                      <span className="font-mono font-black text-slate-800 w-9 text-right">{stats.attendancePercent}%</span>
                    </div>
                  </TD>
                  <TD className="font-bold">{stats.presentDays}</TD>
                  <TD>{stats.officeDays}</TD>
                  <TD className="text-blue-700 font-bold">{stats.wfhDays}</TD>
                  <TD className="text-purple-700 font-bold">{stats.shootDays}</TD>
                  <TD className="text-amber-700">{stats.leaveDays}</TD>
                  <TD className={stats.absentDays ? 'text-red-600 font-bold' : ''}>{stats.absentDays}</TD>
                  <TD>{stats.lateCount ? <Badge className="bg-amber-100 text-amber-800 border-amber-200">{stats.lateCount}</Badge> : '0'}</TD>
                  <TD className="font-mono">{formatHours(stats.averageHours)}</TD>
                  <TD className="font-mono">
                    {stats.overtimeHours > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[#373B35] font-bold">
                        <Clock className="w-3 h-3" /> {formatHours(stats.overtimeHours)}
                      </span>
                    ) : (
                      '--'
                    )}
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
      </section>
    </div>
  );
};
