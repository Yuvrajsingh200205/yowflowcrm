'use client';

/**
 * Attendance reporting.
 *
 * Keeps the studio's existing day-by-day duty log and its PDF / CSV export, and
 * adds the report types a wedding studio actually files: daily, weekly,
 * monthly, employee-wise, team-wise, WFH, shoot attendance and leave.
 */

import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart3,
  Building2,
  Camera,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Home,
  IndianRupee,
  Plane,
  Search,
} from 'lucide-react';
import { AttendanceRecord, LeaveRequest, Project, TeamMember } from '@/types';
import { useToast } from '@/components/common';
import {
  BTN_GHOST,
  BTN_PRIMARY,
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
  formatCurrency,
  formatDayLabel,
  formatHours,
  getAttendanceStats,
  getDateRange,
  getTodayDateString,
  resolveDayStatus,
  toDateKey,
} from '../teamDomain';
import { BRAND } from '@/config/brand';

interface Props {
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  /** The existing daily reporting widget, rendered above the reports. */
  dailyWidgetSlot?: React.ReactNode;
}

type ReportType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'employee'
  | 'team'
  | 'wfh'
  | 'shoot'
  | 'leave';

const REPORT_TYPES: Array<{ value: ReportType; label: string; icon: typeof FileText }> = [
  { value: 'daily', label: 'Daily log', icon: FileText },
  { value: 'weekly', label: 'Weekly', icon: BarChart3 },
  { value: 'monthly', label: 'Monthly', icon: BarChart3 },
  { value: 'employee', label: 'Employee-wise', icon: Building2 },
  { value: 'team', label: 'Team-wise', icon: Building2 },
  { value: 'wfh', label: 'WFH', icon: Home },
  { value: 'shoot', label: 'Shoot attendance', icon: Camera },
  { value: 'leave', label: 'Leave', icon: Plane },
];

const ALL = 'all';

interface ReportTable {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  footer?: Array<string | number>;
}

export const AttendanceReportsView: React.FC<Props> = ({ team, attendance, projects, leaves, dailyWidgetSlot }) => {
  const { showToast } = useToast();
  const today = getTodayDateString();
  const monthStart = `${today.slice(0, 7)}-01`;

  const [reportType, setReportType] = useState<ReportType>('daily');
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [memberFilter, setMemberFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [search, setSearch] = useState('');

  const scopedTeam = useMemo(
    () => (memberFilter === ALL ? team : team.filter((m) => m.id === memberFilter)),
    [team, memberFilter]
  );

  /** Every resolved day in range, for every scoped member. */
  const resolvedDays = useMemo(() => {
    const days = getDateRange(startDate, endDate).filter((d) => d <= today);
    const out: Array<{
      member: TeamMember;
      dateKey: string;
      status: ReturnType<typeof resolveDayStatus>;
    }> = [];
    scopedTeam.forEach((member) => {
      days.forEach((dateKey) => {
        out.push({ member, dateKey, status: resolveDayStatus({ member, dateKey, attendance, projects, leaves, today }) });
      });
    });
    return out;
  }, [scopedTeam, startDate, endDate, attendance, projects, leaves, today]);

  const filteredDays = useMemo(
    () =>
      resolvedDays.filter(({ member, status }) => {
        if (statusFilter !== ALL && status.kind !== statusFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const haystack = [member.name, String(member.role), status.label, status.shoot?.shootTitle, status.shoot?.projectName, status.record?.notes]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        // The day log is about what happened; days with nothing recorded and no
        // derived meaning would only add noise.
        return status.kind !== 'scheduled';
      }),
    [resolvedDays, statusFilter, search]
  );

  const summary = useMemo(() => {
    const s = { office: 0, wfh: 0, shoot: 0, leave: 0, absent: 0, halfDay: 0, weeklyOff: 0, notMarked: 0, pay: 0, hours: 0 };
    filteredDays.forEach(({ status }) => {
      if (status.kind === 'office') s.office++;
      else if (status.kind === 'wfh') s.wfh++;
      else if (status.kind === 'on_shoot') s.shoot++;
      else if (status.kind === 'leave') s.leave++;
      else if (status.kind === 'absent') s.absent++;
      else if (status.kind === 'half_day') s.halfDay++;
      else if (status.kind === 'weekly_off' || status.kind === 'holiday') s.weeklyOff++;
      else s.notMarked++;
      s.pay += status.record?.payAmount || 0;
      s.hours += status.workingHours || 0;
    });
    return s;
  }, [filteredDays]);

  /** The table actually rendered / exported, per report type. */
  const table = useMemo<ReportTable>(() => {
    switch (reportType) {
      case 'employee':
      case 'team': {
        const grouped =
          reportType === 'employee'
            ? scopedTeam.map((member) => ({ key: member.name, label: `${member.name} (${member.role})`, members: [member] }))
            : [...new Set(scopedTeam.map((m) => String(m.role)))].sort().map((role) => ({
                key: role,
                label: role,
                members: scopedTeam.filter((m) => String(m.role) === role),
              }));

        const rows = grouped.map((group) => {
          const agg = group.members.reduce(
            (acc, member) => {
              const s = getAttendanceStats(member, attendance, projects, leaves, startDate, endDate);
              return {
                present: acc.present + s.presentDays,
                office: acc.office + s.officeDays,
                wfh: acc.wfh + s.wfhDays,
                shoot: acc.shoot + s.shootDays,
                leave: acc.leave + s.leaveDays,
                absent: acc.absent + s.absentDays,
                late: acc.late + s.lateCount,
                hours: acc.hours + s.totalHours,
                pay: acc.pay + s.totalPay,
                pct: acc.pct + s.attendancePercent,
              };
            },
            { present: 0, office: 0, wfh: 0, shoot: 0, leave: 0, absent: 0, late: 0, hours: 0, pay: 0, pct: 0 }
          );
          const avgPct = group.members.length ? Math.round(agg.pct / group.members.length) : 0;
          return [
            group.label,
            `${avgPct}%`,
            agg.present,
            agg.office,
            agg.wfh,
            agg.shoot,
            agg.leave,
            agg.absent,
            agg.late,
            formatHours(agg.hours),
            formatCurrency(agg.pay),
          ];
        });

        return {
          title: reportType === 'employee' ? 'Employee-wise attendance report' : 'Team-wise attendance report',
          headers: ['Name', 'Attendance %', 'Present', 'Office', 'WFH', 'Shoot', 'Leave', 'Absent', 'Late', 'Hours', 'Payout'],
          rows,
        };
      }

      case 'weekly':
      case 'monthly': {
        const buckets = new Map<string, { present: number; office: number; wfh: number; shoot: number; leave: number; absent: number; pay: number }>();
        filteredDays.forEach(({ dateKey, status }) => {
          const key =
            reportType === 'monthly'
              ? dateKey.slice(0, 7)
              : // Week bucket labelled by its Monday
                (() => {
                  const d = new Date(`${dateKey}T00:00:00`);
                  const offset = (d.getDay() + 6) % 7;
                  return addDays(dateKey, -offset);
                })();
          if (!buckets.has(key)) buckets.set(key, { present: 0, office: 0, wfh: 0, shoot: 0, leave: 0, absent: 0, pay: 0 });
          const b = buckets.get(key)!;
          if (status.kind === 'office' || status.kind === 'half_day') {
            b.office++;
            b.present++;
          } else if (status.kind === 'wfh') {
            b.wfh++;
            b.present++;
          } else if (status.kind === 'on_shoot') {
            b.shoot++;
            b.present++;
          } else if (status.kind === 'leave') b.leave++;
          else if (status.kind === 'absent') b.absent++;
          b.pay += status.record?.payAmount || 0;
        });

        return {
          title: reportType === 'weekly' ? 'Weekly attendance summary' : 'Monthly attendance summary',
          headers: [reportType === 'weekly' ? 'Week starting' : 'Month', 'Present', 'Office', 'WFH', 'Shoot', 'Leave', 'Absent', 'Payout'],
          rows: [...buckets.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, b]) => [
              reportType === 'weekly' ? formatDayLabel(key) : key,
              b.present,
              b.office,
              b.wfh,
              b.shoot,
              b.leave,
              b.absent,
              formatCurrency(b.pay),
            ]),
        };
      }

      case 'leave': {
        const scopedIds = new Set(scopedTeam.map((m) => m.id));
        const rows = leaves
          .filter((l) => scopedIds.has(l.teamMemberId))
          .filter((l) => toDateKey(l.endDate) >= startDate && toDateKey(l.startDate) <= endDate)
          .filter((l) => (search.trim() ? l.teamMemberName.toLowerCase().includes(search.toLowerCase()) : true))
          .sort((a, b) => b.startDate.localeCompare(a.startDate))
          .map((l) => [l.teamMemberName, String(l.role), l.leaveType, l.startDate, l.endDate, l.days, l.status, l.reason || '-']);
        return {
          title: 'Leave report',
          headers: ['Member', 'Role', 'Type', 'From', 'To', 'Days', 'Status', 'Reason'],
          rows,
        };
      }

      case 'wfh':
      case 'shoot':
      case 'daily':
      default: {
        const kindFilter = reportType === 'wfh' ? 'wfh' : reportType === 'shoot' ? 'on_shoot' : null;
        const source = kindFilter ? filteredDays.filter((d) => d.status.kind === kindFilter) : filteredDays;
        const rows = source
          .slice()
          .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.member.name.localeCompare(b.member.name))
          .map(({ member, dateKey, status }) => [
            dateKey,
            member.name,
            String(member.role),
            status.label,
            status.checkIn && status.checkOut ? `${status.checkIn} - ${status.checkOut}` : status.checkIn || '--',
            formatHours(status.workingHours),
            status.shoot ? `${status.shoot.shootTitle} (${status.shoot.projectName})` : status.record?.projectTitle || 'Studio duty',
            status.location || '-',
            formatCurrency(status.record?.payAmount || 0),
          ]);
        return {
          title:
            reportType === 'wfh'
              ? 'Work-from-home report'
              : reportType === 'shoot'
              ? 'Shoot attendance report'
              : 'Day-by-day attendance log',
          headers: ['Date', 'Member', 'Role', 'Status', 'In / Out', 'Hours', 'Project / shoot', 'Location', 'Pay'],
          rows,
          footer: ['', '', '', '', '', '', '', 'Total', formatCurrency(source.reduce((s, d) => s + (d.status.record?.payAmount || 0), 0))],
        };
      }
    }
  }, [reportType, filteredDays, scopedTeam, attendance, projects, leaves, startDate, endDate, search]);

  const exportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text(`${BRAND.name.toUpperCase()}`, 14, 15);
      doc.setFontSize(11);
      doc.setTextColor(79, 70, 229);
      doc.text(`${table.title} (${startDate} to ${endDate})`, 14, 22);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Rows: ${table.rows.length}`, 14, 28);

      autoTable(doc, {
        startY: 32,
        head: [table.headers],
        body: table.rows.map((r) => r.map((c) => String(c))),
        foot: table.footer ? [table.footer.map((c) => String(c))] : undefined,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
        footStyles: { fillColor: [15, 23, 42], textColor: [52, 211, 153], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 1.8, valign: 'middle' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`${table.title.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.pdf`);
      showToast('PDF report downloaded.');
    } catch (error) {
      console.error('PDF generation error:', error);
      showToast('Could not generate the PDF — try the CSV export instead.', { variant: 'error' });
    }
  };

  const exportCsv = () => {
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = [
      table.headers.map(escape).join(','),
      ...table.rows.map((r) => r.map(escape).join(',')),
      ...(table.footer ? [table.footer.map(escape).join(',')] : []),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.title.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV report downloaded.');
  };

  const setQuickRange = (days: number) => {
    setEndDate(today);
    setStartDate(addDays(today, -(days - 1)));
  };

  return (
    <div className="space-y-5">
      {dailyWidgetSlot}

      {/* Report type */}
      <div className={`${CARD} space-y-3 p-3 sm:p-4`}>
        <div className="mb-1 flex items-center gap-2 text-sm font-extrabold text-slate-700">
          Attendance Reports
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {REPORT_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setReportType(value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                reportType === value
                  ? 'border-[#24291E] bg-gradient-to-r from-[#24291E] to-[#1C2018] text-white shadow-sm'
                  : 'border-[#ded5cf] bg-white text-slate-600 hover:border-rose-300 hover:text-[#1C2018]'
              }`}
              aria-pressed={reportType === value}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className={LABEL} htmlFor="rep-start">From</label>
            <input id="rep-start" type="date" className={FIELD} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="rep-end">To</label>
            <input id="rep-end" type="date" className={FIELD} value={endDate} max={today} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="rep-member">Team member</label>
            <select id="rep-member" className={FIELD} value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
              <option value={ALL}>All members ({team.length})</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="rep-status">Day type</label>
            <select id="rep-status" className={FIELD} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value={ALL}>All types</option>
              <option value="office">Office</option>
              <option value="wfh">WFH</option>
              <option value="on_shoot">On shoot</option>
              <option value="half_day">Half day</option>
              <option value="leave">Leave</option>
              <option value="weekly_off">Weekly off</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="rep-search">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input id="rep-search" className={`${FIELD} pl-8`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Member, project, note…" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Quick range:
            </span>
            {[
              { label: 'Last 7 days', days: 7 },
              { label: 'Last 30 days', days: 30 },
            ].map((p) => (
              <button key={p.days} type="button" onClick={() => setQuickRange(p.days)} className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-[#1C2018] text-slate-700 text-[10px] font-bold transition cursor-pointer">
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setStartDate(monthStart);
                setEndDate(today);
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-[#1C2018] text-slate-700 text-[10px] font-bold transition cursor-pointer"
            >
              This month
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={exportCsv} className={BTN_GHOST}>
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button type="button" onClick={exportPdf} className={BTN_PRIMARY}>
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Office days" value={summary.office} icon={Building2} tone="emerald" />
        <KpiCard label="WFH days" value={summary.wfh} icon={Home} tone="blue" />
        <KpiCard label="Shoot days" value={summary.shoot} icon={Camera} tone="purple" />
        <KpiCard label="Leave days" value={summary.leave} icon={Plane} tone="amber" />
        <KpiCard label="Absent days" value={summary.absent} tone="red" />
        <KpiCard label="Total payout" value={formatCurrency(summary.pay)} icon={IndianRupee} tone="rose" hint={formatHours(summary.hours)} />
      </div>

      {/* Table */}
      <section className={`${CARD} overflow-hidden`}>
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">{table.title}</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {formatDayLabel(startDate)} → {formatDayLabel(endDate)} · {table.rows.length} row{table.rows.length === 1 ? '' : 's'}
            </p>
          </div>
          <Badge className="bg-rose-50 text-[#1C2018] border-rose-200">
            {memberFilter === ALL ? `${team.length} members` : team.find((m) => m.id === memberFilter)?.name}
          </Badge>
        </header>

        {table.rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No records for this report"
            message="Widen the date range, clear the filters, or mark some attendance first."
          />
        ) : (
          <div className="p-5">
            <ScrollArea>
              <table className="w-full min-w-[900px] border-collapse">
                <thead className="border-b border-slate-200">
                  <tr>
                    {table.headers.map((h) => (
                      <TH key={h}>{h}</TH>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.rows.slice(0, 300).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      {row.map((cell, j) => (
                        <TD key={j} className={j === 0 ? 'font-bold text-slate-900 whitespace-nowrap' : ''}>
                          {cell}
                        </TD>
                      ))}
                    </tr>
                  ))}
                </tbody>
                {table.footer && (
                  <tfoot className="bg-slate-900 text-white font-extrabold">
                    <tr>
                      {table.footer.map((cell, i) => (
                        <td key={i} className="py-3 px-3 text-xs text-right first:text-left">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </ScrollArea>
            {table.rows.length > 300 && (
              <p className="mt-3 text-[11px] font-semibold text-slate-500">
                Showing the first 300 rows on screen — the PDF and CSV exports include all {table.rows.length}.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
