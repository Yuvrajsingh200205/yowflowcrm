'use client';

/**
 * Freelancer workforce view.
 *
 * Reads the existing Freelancer module records (`Freelancer`,
 * `FreelancerAssignment`, `FreelancerPayment`) rather than keeping a second
 * freelancer list, and adds any roster member marked as employment type
 * "Freelancer" so the manager sees one combined external crew.
 */

import React, { useMemo, useState } from 'react';
import { ExternalLink, IndianRupee, Search, UserCheck, Wallet } from 'lucide-react';
import {
  AttendanceRecord,
  Freelancer,
  FreelancerAssignment,
  FreelancerPayment,
  LeaveRequest,
  Project,
  TeamMember,
} from '@/types';
import {
  Avatar,
  BTN_GHOST,
  BTN_PRIMARY,
  Badge,
  CARD,
  EmptyState,
  FIELD,
  KpiCard,
  ScrollArea,
  TD,
  TH,
} from './TeamUiKit';
import {
  formatCurrency,
  formatDayLabel,
  getAvailability,
  getDailyRateBasis,
  getFreelancerAvailability,
  getFreelancerFinance,
  getMemberPaymentSummary,
  getMemberPhone,
  getTodayDateString,
  getUpcomingShoots,
  isFreelanceMember,
  toDateKey,
} from '../teamDomain';

interface Props {
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  freelancers: Freelancer[];
  freelancerAssignments: FreelancerAssignment[];
  freelancerPayments: FreelancerPayment[];
  onOpenProfile: (member: TeamMember) => void;
  onAddFreelancer?: () => void;
  onGoToFreelancerModule?: () => void;
}

/** One row shape for both external freelancers and freelance roster members. */
interface FreelancerRow {
  key: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  rate: number;
  rateLabel: string;
  totalShoots: number;
  upcomingShoots: number;
  totalPaid: number;
  pending: number;
  lastPaymentDate?: string;
  availability: { status: string; badgeClass: string; reason: string };
  source: 'external' | 'roster';
  member?: TeamMember;
}

export const TeamFreelancersView: React.FC<Props> = ({
  team,
  attendance,
  projects,
  leaves,
  freelancers,
  freelancerAssignments,
  freelancerPayments,
  onOpenProfile,
  onAddFreelancer,
  onGoToFreelancerModule,
}) => {
  const today = getTodayDateString();
  const [search, setSearch] = useState('');

  const rows = useMemo<FreelancerRow[]>(() => {
    const external: FreelancerRow[] = (freelancers || []).map((f) => {
      const finance = getFreelancerFinance(f.id, freelancerAssignments, freelancerPayments, today);
      const availability = getFreelancerAvailability(f, freelancerAssignments, today);
      return {
        key: `ext-${f.id}`,
        name: f.name,
        role: [f.mainCategory, f.subCategory].filter(Boolean).join(' · ') || 'Freelancer',
        phone: f.mobile || f.whatsapp || '',
        email: f.email || '',
        rate: f.perDayCharges || f.eventCharges || 0,
        rateLabel: f.perDayCharges ? 'per day' : f.eventCharges ? 'per event' : '—',
        totalShoots: finance.totalShoots,
        upcomingShoots: finance.upcomingShoots,
        totalPaid: finance.totalPaid,
        pending: finance.pending,
        lastPaymentDate: finance.lastPaymentDate,
        availability,
        source: 'external',
      };
    });

    const roster: FreelancerRow[] = team.filter(isFreelanceMember).map((member) => {
      const payments = getMemberPaymentSummary(member, attendance);
      const assignments = getUpcomingShoots(member, projects);
      const allShoots = (projects || []).reduce((count, project) => {
        return count + (project.shoots || []).filter((s) =>
          (s.crewAssignments || []).some((c) => c.id === member.id || c.name?.trim().toLowerCase() === member.name.trim().toLowerCase())
        ).length;
      }, 0);
      return {
        key: `mem-${member.id}`,
        name: member.name,
        role: String(member.role),
        phone: getMemberPhone(member),
        email: member.email || '',
        rate: getDailyRateBasis(member),
        rateLabel: member.payType === 'monthly' ? 'per day (from salary)' : 'per day',
        totalShoots: allShoots,
        upcomingShoots: assignments.filter((a) => a.date >= today).length,
        totalPaid: payments.totalPaid,
        pending: payments.totalPending,
        lastPaymentDate: payments.lastPaymentDate,
        availability: getAvailability(member, today, attendance, projects, leaves),
        source: 'roster',
        member,
      };
    });

    return [...roster, ...external].sort((a, b) => a.name.localeCompare(b.name));
  }, [freelancers, freelancerAssignments, freelancerPayments, team, attendance, projects, leaves, today]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [r.name, r.role, r.phone, r.email].filter(Boolean).some((v) => v.toLowerCase().includes(q));
      }),
    [rows, search]
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          count: acc.count + 1,
          paid: acc.paid + r.totalPaid,
          pending: acc.pending + r.pending,
          upcoming: acc.upcoming + r.upcomingShoots,
        }),
        { count: 0, paid: 0, pending: 0, upcoming: 0 }
      ),
    [rows]
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Freelancers" value={totals.count} icon={UserCheck} tone="rose" hint="External + roster freelancers" />
        <KpiCard label="Upcoming shoots" value={totals.upcoming} tone="purple" />
        <KpiCard label="Total paid" value={formatCurrency(totals.paid)} icon={Wallet} tone="emerald" />
        <KpiCard label="Pending payment" value={formatCurrency(totals.pending)} icon={IndianRupee} tone="red" />
      </div>

      <div className={`${CARD} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${FIELD} pl-9`} placeholder="Search freelancers…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search freelancers" />
        </div>
        <div className="flex items-center gap-2">
          {onGoToFreelancerModule && (
            <button type="button" onClick={onGoToFreelancerModule} className={BTN_GHOST}>
              <ExternalLink className="w-3.5 h-3.5" /> Freelancer module
            </button>
          )}
          {onAddFreelancer && (
          <button type="button" onClick={onAddFreelancer} className={BTN_PRIMARY}>
            <UserCheck className="w-4 h-4" /> Add freelancer
          </button>
          )}
        </div>
      </div>

      <section className={`${CARD} p-5`}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title={rows.length ? 'No freelancers match this search' : 'No freelancers on file yet'}
            message={
              rows.length
                ? 'Try a different name, role or phone number.'
                : 'Add an external crew member here, or mark a roster member as employment type "Freelancer" — their shoots and payments will roll up into this view.'
            }
            action={
              !rows.length && onAddFreelancer ? (
                <button type="button" onClick={onAddFreelancer} className={BTN_PRIMARY}>
                  <UserCheck className="w-4 h-4" /> Add freelancer
                </button>
              ) : undefined
            }
          />
        ) : (
          <ScrollArea>
            <table className="w-full min-w-[980px] border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <TH>Freelancer</TH>
                  <TH>Role</TH>
                  <TH>Contact</TH>
                  <TH>Rate</TH>
                  <TH>Total shoots</TH>
                  <TH>Upcoming</TH>
                  <TH>Total paid</TH>
                  <TH>Pending</TH>
                  <TH>Availability</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50 transition">
                    <TD>
                      <button
                        type="button"
                        onClick={() => row.member && onOpenProfile(row.member)}
                        disabled={!row.member}
                        className={`flex items-center gap-2.5 text-left ${row.member ? 'cursor-pointer group' : 'cursor-default'}`}
                      >
                        <Avatar member={{ id: row.key, name: row.name, profilePhoto: row.member?.profilePhoto }} size="sm" />
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 truncate group-hover:text-[#24291E] transition">{row.name}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {row.source === 'roster' ? 'Roster freelancer' : 'External'}
                          </p>
                        </div>
                      </button>
                    </TD>
                    <TD className="text-slate-600 font-semibold max-w-[180px] truncate">{row.role}</TD>
                    <TD>
                      <p className="font-mono text-[11px]">{row.phone || <span className="text-slate-400 italic">No phone</span>}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[160px]">{row.email || <span className="italic text-slate-400">No email</span>}</p>
                    </TD>
                    <TD className="font-mono font-bold">
                      {row.rate ? formatCurrency(row.rate) : <span className="text-slate-400">—</span>}
                      {row.rate ? <span className="block text-[9px] font-semibold text-slate-400">{row.rateLabel}</span> : null}
                    </TD>
                    <TD className="font-bold">{row.totalShoots}</TD>
                    <TD className="font-bold text-purple-700">{row.upcomingShoots}</TD>
                    <TD className="font-mono font-bold text-emerald-700">{formatCurrency(row.totalPaid)}</TD>
                    <TD>
                      <span className={`font-mono font-bold ${row.pending > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {formatCurrency(row.pending)}
                      </span>
                      {row.lastPaymentDate && (
                        <span className="block text-[9px] font-semibold text-slate-400">Last paid {formatDayLabel(row.lastPaymentDate)}</span>
                      )}
                    </TD>
                    <TD>
                      <Badge className={row.availability.badgeClass} title={row.availability.reason}>{row.availability.status}</Badge>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </section>

      {/* Per-shoot settlement detail — mirrors the Expense module's ledger */}
      {freelancerAssignments.length > 0 && (
        <section className={`${CARD} p-5 space-y-3`}>
          <header>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-[#24291E]" /> Shoot-wise settlements
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Agreed vs paid vs pending, per freelancer assignment.</p>
          </header>
          <ScrollArea>
            <table className="w-full min-w-[880px] border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <TH>Freelancer</TH>
                  <TH>Shoot / project</TH>
                  <TH>Date</TH>
                  <TH>Role</TH>
                  <TH>Agreed</TH>
                  <TH>Paid</TH>
                  <TH>Pending</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {freelancerAssignments
                  .slice()
                  .sort((a, b) => toDateKey(b.shootDate).localeCompare(toDateKey(a.shootDate)))
                  .slice(0, 25)
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <TD className="font-extrabold text-slate-900">{a.freelancerName}</TD>
                      <TD>
                        <p className="font-bold text-slate-800 truncate max-w-[200px]">{a.projectName || a.eventName}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{a.clientName}</p>
                      </TD>
                      <TD className="font-mono text-[11px]">{formatDayLabel(a.shootDate)}</TD>
                      <TD className="text-slate-600">{a.role || a.subCategory || a.category}</TD>
                      <TD className="font-mono font-bold">{formatCurrency(a.totalAgreedAmount)}</TD>
                      <TD className="font-mono font-bold text-emerald-700">{formatCurrency(a.advancePaid)}</TD>
                      <TD className={`font-mono font-bold ${a.pendingAmount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                        {formatCurrency(a.pendingAmount)}
                      </TD>
                      <TD>
                        <Badge
                          className={
                            a.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : a.paymentStatus === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {a.paymentStatus.replace(/_/g, ' ')}
                        </Badge>
                      </TD>
                    </tr>
                  ))}
              </tbody>
            </table>
          </ScrollArea>
        </section>
      )}
    </div>
  );
};
