'use client';

/**
 * Team member profile — everything the studio knows about one person.
 *
 * Overview, attendance (with a month calendar), shoot history, upcoming
 * bookings, leave, payments and documents. All figures are derived from the
 * records the CRM already holds; nothing here is stored twice.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  CalendarCheck,
  CalendarPlus,
  Camera,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plane,
  Power,
  Trash2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import {
  AttendanceRecord,
  LeaveRequest,
  Project,
  TeamDocument,
  TeamDocumentType,
  TeamMember,
} from '@/types';
import { useToast } from '@/components/common';
import {
  Avatar,
  BTN_GHOST,
  BTN_PRIMARY,
  Badge,
  CARD,
  Drawer,
  EmptyState,
  FIELD,
  KpiCard,
  ScrollArea,
  TD,
  TH,
} from './TeamUiKit';
import { MemberAttendanceCalendar, MonthNavigator } from './AttendanceCalendar';
import {
  formatCurrency,
  formatDayLabel,
  formatHours,
  formatLongDate,
  getAttendanceStats,
  getAvailability,
  getEmployeeCode,
  getEmploymentType,
  getLeaveStatusBadge,
  getMemberDepartment,
  getMemberLeaves,
  getMemberPaymentSummary,
  getMemberPhone,
  getMemberStatusBadge,
  getPastShoots,
  getTodayDateString,
  getUpcomingShoots,
  resolveDayStatus,
} from '../teamDomain';

interface Props {
  member: TeamMember | null;
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  onClose: () => void;
  onEdit?: (member: TeamMember) => void;
  onUpdateMember?: (member: TeamMember) => void;
  onMarkAttendance?: (member: TeamMember) => void;
  onAssignShoot?: (member: TeamMember) => void;
  onApplyLeave?: (member: TeamMember) => void;
  onToggleActive?: (member: TeamMember) => void;
  onOpenFullDashboard?: (member: TeamMember) => void;
}

type Section = 'overview' | 'attendance' | 'shoots' | 'leave' | 'payments' | 'documents';

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'shoots', label: 'Shoots' },
  { id: 'leave', label: 'Leave' },
  { id: 'payments', label: 'Payments' },
  { id: 'documents', label: 'Documents' },
];

const DOCUMENT_TYPES: Array<{ value: TeamDocumentType; label: string }> = [
  { value: 'id_proof', label: 'ID proof' },
  { value: 'contract', label: 'Contract' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'bank_details', label: 'Bank details' },
  { value: 'other', label: 'Other' },
];

export const TeamMemberProfileDrawer: React.FC<Props> = ({
  member,
  team,
  attendance,
  projects,
  leaves,
  onClose,
  onEdit,
  onUpdateMember,
  onMarkAttendance,
  onAssignShoot,
  onApplyLeave,
  onToggleActive,
  onOpenFullDashboard,
}) => {
  const { showToast } = useToast();
  const today = getTodayDateString();
  const [section, setSection] = useState<Section>('overview');
  const [monthKey, setMonthKey] = useState(today.slice(0, 7));
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [docType, setDocType] = useState<TeamDocumentType>('id_proof');

  const monthStart = `${monthKey}-01`;
  const monthEnd = useMemo(() => {
    const [y, m] = monthKey.split('-').map(Number);
    return `${monthKey}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
  }, [monthKey]);

  const stats = useMemo(
    () => (member ? getAttendanceStats(member, attendance, projects, leaves, monthStart, monthEnd) : null),
    [member, attendance, projects, leaves, monthStart, monthEnd]
  );

  const todayStatus = useMemo(
    () => (member ? resolveDayStatus({ member, dateKey: today, attendance, projects, leaves, today }) : null),
    [member, attendance, projects, leaves, today]
  );

  const availability = useMemo(
    () => (member ? getAvailability(member, today, attendance, projects, leaves) : null),
    [member, today, attendance, projects, leaves]
  );

  const upcoming = useMemo(() => (member ? getUpcomingShoots(member, projects) : []), [member, projects]);
  const past = useMemo(() => (member ? getPastShoots(member, projects) : []), [member, projects]);
  const memberLeaves = useMemo(() => (member ? getMemberLeaves(member, leaves) : []), [member, leaves]);
  const payments = useMemo(() => (member ? getMemberPaymentSummary(member, attendance) : null), [member, attendance]);

  if (!member) return null;

  const statusBadge = getMemberStatusBadge(member);
  const manager = team.find((m) => m.id === member.reportingManagerId);
  const isActive = (member.status || 'active') === 'active';
  const hasMonthlySalary = member.payType !== 'daily';
  const salaryAmount = hasMonthlySalary ? member.monthlySalary : member.dailyRate;
  const salaryLabel = hasMonthlySalary ? 'Monthly salary' : 'Daily rate';

  const handleUpload = (file?: File | null) => {
    if (!file || !onUpdateMember) return;
    if (file.size > 3_000_000) {
      showToast('Documents must be under 3 MB.', { variant: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const doc: TeamDocument = {
        id: `doc-${Date.now()}`,
        title: file.name,
        type: docType,
        fileName: file.name,
        fileUrl: String(reader.result || ''),
        uploadDate: today,
      };
      onUpdateMember({ ...member, documents: [...(member.documents || []), doc] });
      showToast(`${file.name} attached to ${member.name}'s profile.`);
    };
    reader.onerror = () => showToast('Could not read that file.', { variant: 'error' });
    reader.readAsDataURL(file);
  };

  const removeDocument = (docId: string) => {
    if (!onUpdateMember) return;
    onUpdateMember({ ...member, documents: (member.documents || []).filter((d) => d.id !== docId) });
    showToast('Document removed.');
  };

  const titleId = 'member-profile-title';

  return (
    <Drawer isOpen onClose={onClose} labelledBy={titleId}>
      {/* Header */}
      <header className="relative flex-shrink-0 space-y-4 overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(236,190,169,.24),transparent_32%),linear-gradient(125deg,#41463E,#30342E_52%,#21241F)] px-5 py-5 text-white">
        <div className="absolute -bottom-16 -right-8 size-44 rounded-full border-[24px] border-white/5" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar member={member} size="lg" className="ring-2 ring-white/30" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#D9DCD8]">Team Member Profile</p>
              <h2 id={titleId} className="mt-1 truncate text-xl font-black">{member.name}</h2>
              <p className="text-sm font-semibold text-[#DCDFDA]">{member.role}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge className="border-white/20 bg-white/10 text-white">{getEmployeeCode(member)}</Badge>
                <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                {todayStatus && <Badge className={todayStatus.badgeClass}>Today: {todayStatus.label}</Badge>}
                {availability && <Badge className={availability.badgeClass}>{availability.status}</Badge>}
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 flex-shrink-0 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/80 transition hover:bg-white/15 hover:text-white" aria-label="Close profile">
            <X className="size-5" />
          </button>
        </div>

        <div className="relative flex flex-wrap items-center gap-1.5">
          {onEdit && <button type="button" onClick={() => onEdit(member)} className={BTN_GHOST}><Pencil className="w-3.5 h-3.5" /> Edit</button>}
          {onMarkAttendance && <button type="button" onClick={() => onMarkAttendance(member)} className={BTN_GHOST}><CalendarCheck className="w-3.5 h-3.5" /> Mark attendance</button>}
          {onAssignShoot && <button type="button" onClick={() => onAssignShoot(member)} className={BTN_GHOST}><Camera className="w-3.5 h-3.5" /> Assign shoot</button>}
          {onApplyLeave && <button type="button" onClick={() => onApplyLeave(member)} className={BTN_GHOST}><CalendarPlus className="w-3.5 h-3.5" /> Apply leave</button>}
          {onOpenFullDashboard && (
            <button type="button" onClick={() => onOpenFullDashboard(member)} className={BTN_GHOST}>
              <LayoutDashboard className="w-3.5 h-3.5" /> Full dashboard
            </button>
          )}
          {onToggleActive && (
          <button
            type="button"
            onClick={() => onToggleActive(member)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border font-bold text-xs transition cursor-pointer ${
              isActive ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" /> Delete member
          </button>
          )}
        </div>

        <nav className="relative flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/25 bg-[#151714]/55 p-1.5">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`cursor-pointer whitespace-nowrap rounded-xl border px-3 py-1.5 text-xs font-extrabold transition ${
                section === s.id
                  ? 'border-[#DBF1AE] bg-[#fffaf6] text-[#373B35] shadow-[0_5px_16px_rgba(0,0,0,.28)]'
                  : 'border-transparent text-[#CFD3CD] hover:bg-white/10 hover:text-white'
              }`}
              aria-current={section === s.id ? 'page' : undefined}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {section === 'overview' && (
          <>
            <section className={`${CARD} p-5 space-y-3`}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserRound className="w-3.5 h-3.5 text-[#464B43]" /> Profile
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                {[
                  { label: 'Employee ID', value: getEmployeeCode(member) },
                  { label: 'Role', value: String(member.role) },
                  { label: 'Department', value: getMemberDepartment(member) },
                  { label: 'Employment type', value: getEmploymentType(member) },
                  { label: salaryLabel, value: salaryAmount ? formatCurrency(salaryAmount) : 'Not set' },
                  { label: 'Joining date', value: member.joiningDate ? formatLongDate(member.joiningDate) : 'Not recorded' },
                  { label: 'Status', value: statusBadge.label },
                  { label: 'Work mode', value: member.attendanceMode || 'Office' },
                  { label: 'Shift', value: `${member.inTime || '09:30 AM'} – ${member.outTime || '07:30 PM'}` },
                  { label: 'Weekly off', value: member.weeklyOff || 'None' },
                  { label: 'Reporting manager', value: manager?.name || member.reportingManager || 'None' },
                  { label: 'Date of birth', value: member.dateOfBirth ? formatLongDate(member.dateOfBirth) : 'Not recorded' },
                  { label: 'Gender', value: member.gender || 'Not specified' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col">
                    <dt className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</dt>
                    <dd className="font-bold text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                <p className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {getMemberPhone(member) || <span className="italic text-slate-400">No phone on file</span>}
                </p>
                <p className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {member.email || <span className="italic text-slate-400">No email on file</span>}
                </p>
                {member.address && (
                  <p className="flex items-center gap-2 text-slate-700 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {member.address}
                  </p>
                )}
              </div>

              {(member.skills || []).length > 0 && (
                <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-1.5">
                  {(member.skills || []).map((s) => (
                    <Badge key={s} className="bg-rose-50 text-[#373B35] border-rose-200">{s}</Badge>
                  ))}
                </div>
              )}
            </section>

            {todayStatus && (
              <section className={`${CARD} p-5 space-y-2`}>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Today</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={todayStatus.badgeClass}>{todayStatus.label}</Badge>
                  {todayStatus.checkIn && <span className="text-xs font-mono font-bold text-slate-700">In {todayStatus.checkIn}</span>}
                  {todayStatus.checkOut && <span className="text-xs font-mono font-bold text-slate-700">Out {todayStatus.checkOut}</span>}
                  {todayStatus.workingHours ? <Badge className="bg-slate-100 text-slate-700 border-slate-200">{formatHours(todayStatus.workingHours)}</Badge> : null}
                </div>
                {todayStatus.shoot && (
                  <p className="text-xs font-semibold text-slate-600">
                    {todayStatus.shoot.shootTitle} · {todayStatus.shoot.projectName} · {todayStatus.shoot.location || 'TBD'}
                  </p>
                )}
                {availability && <p className="text-[11px] font-medium text-slate-500">{availability.reason}</p>}
              </section>
            )}
          </>
        )}

        {section === 'attendance' && stats && (
          <>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Attendance summary</h3>
              <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Attendance" value={`${stats.attendancePercent}%`} tone={stats.attendancePercent >= 90 ? 'emerald' : stats.attendancePercent >= 75 ? 'amber' : 'red'} />
              <KpiCard label="Present days" value={stats.presentDays} tone="emerald" hint={`${stats.officeDays} office`} />
              <KpiCard label="Shoot days" value={stats.shootDays} tone="purple" />
              <KpiCard label="WFH days" value={stats.wfhDays} tone="blue" />
              <KpiCard label="Leave days" value={stats.leaveDays} tone="amber" />
              <KpiCard label="Absent days" value={stats.absentDays} tone="red" />
              <KpiCard label="Late arrivals" value={stats.lateCount} tone="amber" hint={`${stats.earlyDepartureCount} early exits`} />
              <KpiCard label="Avg hours" value={formatHours(stats.averageHours)} tone="rose" hint={`${formatHours(stats.overtimeHours)} overtime`} />
            </div>

            <section className={`${CARD} p-5`}>
              <MemberAttendanceCalendar
                member={member}
                monthKey={monthKey}
                attendance={attendance}
                projects={projects}
                leaves={leaves}
              />
            </section>
          </>
        )}

        {section === 'shoots' && (
          <>
            <section className={`${CARD} p-5 space-y-3`}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#464B43]" /> Upcoming shoots ({upcoming.length})
              </h3>
              {upcoming.length === 0 ? (
                <EmptyState icon={Camera} title="No upcoming shoots" message="This member is not crewed on any future shoot yet." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {upcoming.map((s) => (
                    <li key={`${s.shootId}-${s.date}`} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900 truncate">{s.shootTitle}</p>
                        <p className="text-[10px] font-semibold text-slate-500 truncate">{s.projectName} · {s.role}</p>
                        <p className="truncate text-[10px] font-semibold text-slate-500">{s.location || s.venue || 'TBD'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[11px] font-black text-slate-800">{formatDayLabel(s.date)}</p>
                        {s.time && <p className="text-[10px] font-semibold text-slate-500">{s.time}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`${CARD} p-5 space-y-3`}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#464B43]" /> Shoot history ({past.length})
              </h3>
              {past.length === 0 ? (
                <EmptyState icon={Briefcase} title="No past shoots" message="Completed shoots will show here once this member is crewed on one." />
              ) : (
                <ScrollArea>
                  <table className="w-full min-w-[560px] border-collapse">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <TH>Shoot</TH>
                        <TH>Client</TH>
                        <TH>Date</TH>
                        <TH>Role</TH>
                        <TH>Location</TH>
                        <TH>Status</TH>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {past.slice(0, 40).map((s) => (
                        <tr key={`${s.shootId}-${s.date}`} className="hover:bg-slate-50 transition">
                          <TD className="font-bold text-slate-800 max-w-[160px] truncate">{s.shootTitle}</TD>
                          <TD className="text-slate-600 max-w-[160px] truncate">{s.projectName}</TD>
                          <TD className="font-mono text-[11px]">{formatDayLabel(s.date)}</TD>
                          <TD>{s.role}</TD>
                          <TD className="max-w-[130px] truncate">{s.location || s.venue || '—'}</TD>
                          <TD>
                            <Badge
                              className={
                                s.shootStatus === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : s.shootStatus === 'cancelled'
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }
                            >
                              {s.shootStatus}
                            </Badge>
                          </TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </section>
          </>
        )}

        {section === 'leave' && (
          <section className={`${CARD} p-5 space-y-3`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5 text-[#464B43]" /> Leave history ({memberLeaves.length})
              </h3>
              {onApplyLeave && (
                <button type="button" onClick={() => onApplyLeave(member)} className={BTN_GHOST}>
                  <CalendarPlus className="w-3.5 h-3.5" /> Apply leave
                </button>
              )}
            </div>
            {memberLeaves.length === 0 ? (
              <EmptyState icon={Plane} title="No leave records" message="Leave applied for this member will appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {memberLeaves
                  .slice()
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .map((l) => (
                    <li key={l.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-900">
                          {l.leaveType} · {formatDayLabel(l.startDate)} → {formatDayLabel(l.endDate)}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500">{l.days} day{l.days === 1 ? '' : 's'} · applied {formatDayLabel(l.appliedOn)}</p>
                        {l.reason && <p className="text-[11px] text-slate-600 mt-0.5">{l.reason}</p>}
                      </div>
                      <Badge className={getLeaveStatusBadge(l.status)}>{l.status}</Badge>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        )}

        {section === 'payments' && payments && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Total earned" value={formatCurrency(payments.totalEarned)} icon={IndianRupee} tone="rose" />
              <KpiCard label="Total paid" value={formatCurrency(payments.totalPaid)} tone="emerald" />
              <KpiCard label="Pending" value={formatCurrency(payments.totalPending)} tone={payments.totalPending > 0 ? 'red' : 'neutral'} />
              <KpiCard
                label="Last payment"
                value={payments.lastPaymentAmount ? formatCurrency(payments.lastPaymentAmount) : '—'}
                hint={payments.lastPaymentDate ? formatDayLabel(payments.lastPaymentDate) : 'No payments yet'}
                tone="neutral"
              />
            </div>

            <section className={`${CARD} p-5 space-y-3`}>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Payment history</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Built from this member's attendance payouts. {getEmploymentType(member) === 'Freelancer' && 'Per-shoot settlements also appear in the Freelancers tab.'}
              </p>
              {payments.records.length === 0 ? (
                <EmptyState icon={IndianRupee} title="No payout records" message="Mark attendance to start building this member's payout ledger." />
              ) : (
                <ScrollArea>
                  <table className="w-full min-w-[520px] border-collapse">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <TH>Date</TH>
                        <TH>Duty</TH>
                        <TH>Project</TH>
                        <TH>Amount</TH>
                        <TH>Status</TH>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.records.slice(0, 40).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <TD className="font-mono text-[11px]">{formatDayLabel(r.date)}</TD>
                          <TD className="capitalize">{r.status.replace(/_/g, ' ')}</TD>
                          <TD className="text-slate-600 max-w-[170px] truncate">{r.projectTitle || 'Studio duty'}</TD>
                          <TD className="font-mono font-bold">{formatCurrency(r.payAmount)}</TD>
                          <TD>
                            <Badge className={r.paidStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                              {r.paidStatus}
                            </Badge>
                          </TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </section>
          </>
        )}

        {section === 'documents' && (
          <section className={`${CARD} p-5 space-y-3`}>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#464B43]" /> Documents ({(member.documents || []).length})
            </h3>

            {onUpdateMember && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-44">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1" htmlFor="doc-type">Type</label>
                <select id="doc-type" className={FIELD} value={docType} onChange={(e) => setDocType(e.target.value as TeamDocumentType)}>
                  {DOCUMENT_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} className={BTN_PRIMARY}>
                <Upload className="w-4 h-4" /> Attach document
              </button>
            </div>
            )}

            {(member.documents || []).length === 0 ? (
              <EmptyState icon={FileText} title="No documents on file" message="Attach ID proof, contracts or agreements. Files are stored with the member record." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {(member.documents || []).map((doc) => (
                  <li key={doc.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-900 truncate">{doc.title}</p>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {DOCUMENT_TYPES.find((d) => d.value === doc.type)?.label || doc.type} · uploaded {formatDayLabel(doc.uploadDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className={BTN_GHOST}>Open</a>
                      )}
                      {onUpdateMember && (
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        aria-label={`Remove ${doc.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </Drawer>
  );
};
