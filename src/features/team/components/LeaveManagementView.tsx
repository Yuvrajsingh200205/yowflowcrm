'use client';

/**
 * Leave requests — apply, approve, reject, and see the history.
 * Approved leave feeds straight back into attendance, availability and the
 * schedule, so a member on leave is never counted as absent.
 */

import React, { useMemo, useState } from 'react';
import { CalendarPlus, Check, Clock3, Plane, Undo2, X, XCircle } from 'lucide-react';
import { LeaveRequest, LeaveStatus, Project, TeamMember } from '@/types';
import { useToast } from '@/components/common';
import {
  Avatar,
  BTN_GHOST,
  BTN_PRIMARY,
  Badge,
  CARD,
  EmptyState,
  FIELD,
  KpiCard,
  LABEL,
  Modal,
  ModalHero,
  ScrollArea,
  TD,
  TH,
} from './TeamUiKit';
import {
  LEAVE_TYPES,
  countLeaveDays,
  formatDayLabel,
  getLeaveStatusBadge,
  getShootsOnDate,
  getDateRange,
  getTodayDateString,
} from '../teamDomain';

interface Props {
  team: TeamMember[];
  leaves: LeaveRequest[];
  projects: Project[];
  currentUserName?: string;
  onSaveLeave: (leave: LeaveRequest) => void;
  applyForMember: TeamMember | null;
  onCloseApplyForm: () => void;
  onOpenApplyForm: (member?: TeamMember) => void;
  canRequest?: boolean;
  canApprove?: boolean;
}

const ALL = 'all';

export const LeaveManagementView: React.FC<Props> = ({
  team,
  leaves,
  projects,
  currentUserName,
  onSaveLeave,
  applyForMember,
  onCloseApplyForm,
  onOpenApplyForm,
  canRequest = false,
  canApprove = false,
}) => {
  const { showToast } = useToast();
  const today = getTodayDateString();
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | typeof ALL>(ALL);
  const [memberFilter, setMemberFilter] = useState(ALL);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    leaves.forEach((l) => {
      c[l.status] = (c[l.status] || 0) + 1;
    });
    return c;
  }, [leaves]);

  const filtered = useMemo(
    () =>
      leaves
        .filter((l) => (statusFilter === ALL ? true : l.status === statusFilter))
        .filter((l) => (memberFilter === ALL ? true : l.teamMemberId === memberFilter))
        .slice()
        .sort((a, b) => b.appliedOn.localeCompare(a.appliedOn) || b.startDate.localeCompare(a.startDate)),
    [leaves, statusFilter, memberFilter]
  );

  const review = (leave: LeaveRequest, status: LeaveStatus) => {
    onSaveLeave({
      ...leave,
      status,
      reviewedBy: currentUserName || 'Manager',
      reviewedOn: today,
    });
    showToast(`${leave.teamMemberName}'s leave ${status}.`);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Pending" value={counts.pending} icon={Clock3} tone="amber" hint="Awaiting your decision" />
        <KpiCard label="Approved" value={counts.approved} icon={Check} tone="emerald" />
        <KpiCard label="Rejected" value={counts.rejected} icon={XCircle} tone="red" />
        <KpiCard label="Total requests" value={leaves.length} icon={Plane} tone="rose" />
      </div>

      <div className={`${CARD} p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3`}>
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="sm:w-48">
            <label className={LABEL} htmlFor="lv-status">Status</label>
            <select id="lv-status" className={FIELD} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeaveStatus | typeof ALL)}>
              <option value={ALL}>All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="sm:w-64">
            <label className={LABEL} htmlFor="lv-member">Team member</label>
            <select id="lv-member" className={FIELD} value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)}>
              <option value={ALL}>All members</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
        {canRequest && (
        <button type="button" onClick={() => onOpenApplyForm()} className={BTN_PRIMARY}>
          <CalendarPlus className="w-4 h-4" /> Apply leave
        </button>
        )}
      </div>

      <section className={`${CARD} p-5`}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Plane}
            title={leaves.length ? 'No requests match these filters' : 'No leave requests yet'}
            message={
              leaves.length
                ? 'Change the status or member filter to see other requests.'
                : 'Apply leave on behalf of a team member — approved leave automatically updates attendance and availability.'
            }
            action={
              !leaves.length && canRequest ? (
                <button type="button" onClick={() => onOpenApplyForm()} className={BTN_PRIMARY}>
                  <CalendarPlus className="w-4 h-4" /> Apply leave
                </button>
              ) : undefined
            }
          />
        ) : (
          <ScrollArea>
            <table className="w-full min-w-[900px] border-collapse">
              <thead className="border-b border-slate-200">
                <tr>
                  <TH>Member</TH>
                  <TH>Type</TH>
                  <TH>Dates</TH>
                  <TH>Days</TH>
                  <TH>Reason</TH>
                  <TH>Status</TH>
                  <TH>Reviewed</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((leave) => {
                  const member = team.find((m) => m.id === leave.teamMemberId);
                  // Warn when a leave overlaps a shoot the member is crewed on.
                  const clashingShoots = member
                    ? getDateRange(leave.startDate, leave.endDate).flatMap((d) => getShootsOnDate(member, projects, d))
                    : [];
                  return (
                    <tr key={leave.id} className="hover:bg-slate-50 transition align-top">
                      <TD>
                        <div className="flex items-center gap-2.5">
                          {member ? <Avatar member={member} size="sm" /> : null}
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{leave.teamMemberName}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate">{leave.role}</p>
                          </div>
                        </div>
                      </TD>
                      <TD><Badge className="bg-slate-100 text-slate-700 border-slate-200">{leave.leaveType}</Badge></TD>
                      <TD className="font-mono text-[11px]">
                        {formatDayLabel(leave.startDate)} → {formatDayLabel(leave.endDate)}
                      </TD>
                      <TD className="font-bold">{leave.days}</TD>
                      <TD>
                        <p className="max-w-[220px] text-slate-600">{leave.reason || <span className="italic text-slate-400">No reason given</span>}</p>
                        {clashingShoots.length > 0 && leave.status !== 'rejected' && (
                          <p className="mt-1 text-[10px] font-bold text-amber-700">
                            Clashes with {clashingShoots.length} shoot{clashingShoots.length > 1 ? 's' : ''}: {clashingShoots[0].shootTitle}
                          </p>
                        )}
                      </TD>
                      <TD><Badge className={getLeaveStatusBadge(leave.status)}>{leave.status}</Badge></TD>
                      <TD className="text-[10px] text-slate-500">
                        {leave.reviewedBy ? `${leave.reviewedBy}${leave.reviewedOn ? ` · ${formatDayLabel(leave.reviewedOn)}` : ''}` : '—'}
                      </TD>
                      <TD className="text-right">
                        {canApprove ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {leave.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => review(leave, 'approved')}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => review(leave, 'rejected')}
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-[11px] transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => review(leave, 'pending')}
                              className={`${BTN_GHOST} !px-2 !py-1.5`}
                              title="Move back to pending"
                            >
                              <Undo2 className="w-3.5 h-3.5" /> Reopen
                            </button>
                          )}
                        </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">—</span>
                        )}
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </section>

      <ApplyLeaveModal
        isOpen={canRequest && !!applyForMember}
        member={applyForMember}
        team={team}
        projects={projects}
        onSave={(leave) => {
          onSaveLeave(leave);
          showToast(`Leave request submitted for ${leave.teamMemberName}.`);
          onCloseApplyForm();
        }}
        onClose={onCloseApplyForm}
      />
    </div>
  );
};

// ----------------------------------------------------------------------------

const ApplyLeaveModal: React.FC<{
  isOpen: boolean;
  member: TeamMember | null;
  team: TeamMember[];
  projects: Project[];
  onSave: (leave: LeaveRequest) => void;
  onClose: () => void;
}> = ({ isOpen, member, team, projects, onSave, onClose }) => {
  const { showToast } = useToast();
  const today = getTodayDateString();
  const [memberId, setMemberId] = useState('');
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    setMemberId(member?.id && member.id !== '__any__' ? member.id : team[0]?.id || '');
    setLeaveType('Casual');
    setStartDate(today);
    setEndDate(today);
    setReason('');
  }, [isOpen, member?.id, team, today]);

  if (!isOpen) return null;

  const selected = team.find((m) => m.id === memberId);
  const days = countLeaveDays(startDate, endDate);
  const clashing = selected
    ? getDateRange(startDate, endDate).flatMap((d) => getShootsOnDate(selected, projects, d))
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      showToast('Select a team member.', { variant: 'error' });
      return;
    }
    if (days <= 0) {
      showToast('The end date must be on or after the start date.', { variant: 'error' });
      return;
    }
    onSave({
      id: `leave-${Date.now()}`,
      teamMemberId: selected.id,
      teamMemberName: selected.name,
      role: selected.role,
      leaveType,
      startDate,
      endDate,
      days,
      reason: reason.trim(),
      status: 'pending',
      appliedOn: today,
    });
  };

  const titleId = 'apply-leave-title';

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={titleId} widthClass="max-w-lg">
      <ModalHero
        icon={Plane}
        eyebrow="Leave Request"
        title="Apply for leave"
        description="Submitted as pending for manager approval"
        onClose={onClose}
        labelledBy={titleId}
      />

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className={LABEL} htmlFor="lv-form-member">Team member *</label>
          <select id="lv-form-member" className={FIELD} value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
            <option value="">Select a member…</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={LABEL} htmlFor="lv-form-type">Leave type</label>
            <select id="lv-form-type" className={FIELD} value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="lv-form-start">From</label>
            <input id="lv-form-start" type="date" className={FIELD} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div>
            <label className={LABEL} htmlFor="lv-form-end">To</label>
            <input id="lv-form-end" type="date" className={FIELD} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="lv-form-reason">Reason</label>
          <textarea
            id="lv-form-reason"
            className={`${FIELD} min-h-[72px] resize-y`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Family function out of town"
          />
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 flex items-center justify-between">
          <span>Total days</span>
          <span className="font-mono text-[#254b42]">{days}</span>
        </div>

        {clashing.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 space-y-1">
            <p className="font-extrabold">This leave overlaps {clashing.length} booked shoot{clashing.length > 1 ? 's' : ''}</p>
            {clashing.slice(0, 3).map((s) => (
              <p key={`${s.shootId}-${s.date}`} className="font-semibold">
                {formatDayLabel(s.date)} · {s.shootTitle} · {s.projectName}
              </p>
            ))}
            <p className="font-medium">Reassign the crew for those dates before approving.</p>
          </div>
        )}

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button>
          <button type="submit" className={BTN_PRIMARY}>
            <CalendarPlus className="w-4 h-4" /> Submit request
          </button>
        </footer>
      </form>
    </Modal>
  );
};
