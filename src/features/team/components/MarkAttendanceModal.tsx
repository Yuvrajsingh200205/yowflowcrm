'use client';

/**
 * Mark / edit one attendance entry.
 *
 * Wedding crews do not fit a present-or-absent model, so the day type here is
 * the full set: Office, WFH, On Shoot, Half Day, Leave, Weekly Off, Holiday and
 * Absent. When the member is already crewed on a shoot for the chosen date the
 * form pre-selects "On Shoot" and links the record to that shoot.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarCheck,
  CalendarOff,
  Camera,
  CircleX,
  Clock,
  Home,
  MapPin,
  PartyPopper,
  Plane,
  Save,
  Timer,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AttendanceRecord, LeaveRequest, Project, TeamMember } from '@/types';
import { useToast } from '@/components/common';
import { BTN_GHOST, BTN_PRIMARY, Badge, FIELD, LABEL, Modal, ModalHero } from './TeamUiKit';
import {
  buildAttendanceRecord,
  computeWorkingHours,
  formatHours,
  formatLongDate,
  getAttendanceOnDate,
  getCurrentTimeLabel,
  getDefaultStatusForMember,
  getLeaveOnDate,
  getPayForStatus,
  getShootsOnDate,
  getTodayDateString,
  isWeeklyOff,
} from '../teamDomain';

interface Props {
  isOpen: boolean;
  member: TeamMember | null;
  defaultDate: string;
  team: TeamMember[];
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves: LeaveRequest[];
  onSave: (record: AttendanceRecord) => Promise<void> | void;
  onClose: () => void;
  onChangeMember?: (member: TeamMember) => void;
}

const STATUS_OPTIONS: Array<{ value: AttendanceRecord['status']; label: string; hint: string; icon: LucideIcon }> = [
  { value: 'present_office', label: 'Office', hint: 'Present in studio', icon: Building2 },
  { value: 'present_wfh', label: 'WFH', hint: 'Working remotely', icon: Home },
  { value: 'present_shoot', label: 'On Shoot', hint: 'Wedding / event', icon: Camera },
  { value: 'half_day', label: 'Half day', hint: 'Partial duty', icon: Timer },
  { value: 'leave', label: 'Leave', hint: 'Approved leave', icon: Plane },
  { value: 'weekly_off', label: 'Weekly off', hint: 'Scheduled off', icon: CalendarOff },
  { value: 'holiday', label: 'Studio holiday', hint: 'Closed day', icon: PartyPopper },
  { value: 'absent', label: 'Absent', hint: 'Not present', icon: CircleX },
];

export const MarkAttendanceModal: React.FC<Props> = ({
  isOpen,
  member,
  defaultDate,
  team,
  attendance,
  projects,
  leaves,
  onSave,
  onClose,
  onChangeMember,
}) => {
  const { showToast } = useToast();
  const [dateKey, setDateKey] = useState(defaultDate);
  const [status, setStatus] = useState<AttendanceRecord['status']>('present_office');
  const [inTime, setInTime] = useState('');
  const [outTime, setOutTime] = useState('');
  const [shootId, setShootId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);

  const shootsToday = useMemo(
    () => (member ? getShootsOnDate(member, projects, dateKey) : []),
    [member, projects, dateKey]
  );

  const existing = useMemo(
    () => (member ? getAttendanceOnDate(member, attendance, dateKey) : undefined),
    [member, attendance, dateKey]
  );

  const approvedLeave = useMemo(
    () => (member ? getLeaveOnDate(member, leaves, dateKey) : undefined),
    [member, leaves, dateKey]
  );

  // Reset the form whenever the modal opens or the target member/date changes,
  // pre-filling from an existing record when one is already on file.
  useEffect(() => {
    if (!isOpen || !member) return;
    setTouched(false);
    setDateKey(defaultDate);
  }, [isOpen, member?.id, defaultDate]);

  useEffect(() => {
    if (!isOpen || !member || touched) return;
    if (existing) {
      setStatus(existing.status);
      setInTime(existing.inTime || '');
      setOutTime(existing.outTime || '');
      setShootId(existing.shootId || '');
      setProjectId(existing.projectId || '');
      setLocation(existing.location || '');
      setNotes(existing.notes || '');
      return;
    }
    const suggested = approvedLeave
      ? 'leave'
      : isWeeklyOff(member, dateKey)
      ? 'weekly_off'
      : getDefaultStatusForMember(member, dateKey, projects);
    setStatus(suggested);
    setShootId(shootsToday[0]?.shootId || '');
    setProjectId(shootsToday[0]?.projectId || '');
    setInTime(suggested === 'present_shoot' ? '' : member.inTime || '09:30 AM');
    setOutTime('');
    setLocation(shootsToday[0]?.location || (suggested === 'present_wfh' ? 'Home' : suggested === 'present_office' ? 'Studio Office' : ''));
    setNotes('');
  }, [isOpen, member, dateKey, existing, approvedLeave, shootsToday, projects, touched]);

  if (!isOpen || !member) return null;

  const selectedShoot = shootsToday.find((s) => s.shootId === shootId) || shootsToday[0];
  const workingHours = computeWorkingHours(inTime, outTime);
  const needsTimes = status === 'present_office' || status === 'present_wfh' || status === 'present_shoot' || status === 'half_day';
  const payPreview = existing?.payAmount ?? getPayForStatus(member, status);

  const update = (fn: () => void) => {
    setTouched(true);
    fn();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateKey) {
      showToast('Pick a date for this attendance entry.', { variant: 'error' });
      return;
    }
    const record = buildAttendanceRecord({
      member,
      dateKey,
      status,
      inTime: needsTimes ? inTime : undefined,
      outTime: needsTimes ? outTime : undefined,
      project: projects.find((p) => p.id === projectId),
      shoot: status === 'present_shoot' ? selectedShoot : undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      existing,
    });
    try {
      await onSave(record);
      showToast(`Attendance saved for ${member.name} — ${formatLongDate(dateKey)}.`);
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to save attendance.', { variant: 'error' });
    }
  };

  const titleId = 'mark-attendance-title';

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={titleId} widthClass="max-w-xl">
      <ModalHero
        icon={CalendarCheck}
        eyebrow="Daily Attendance Desk"
        title={existing ? 'Update attendance' : 'Mark attendance'}
        description={`${member.name} · ${member.role}`}
        onClose={onClose}
        labelledBy={titleId}
      />

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {onChangeMember && (
          <div>
            <label className={LABEL} htmlFor="ma-member">Team member</label>
            <select
              id="ma-member"
              className={FIELD}
              value={member.id}
              onChange={(e) => {
                const next = team.find((m) => m.id === e.target.value);
                if (next) {
                  setTouched(false);
                  onChangeMember(next);
                }
              }}
            >
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={LABEL} htmlFor="ma-date">Date</label>
          <input
            id="ma-date"
            type="date"
            className={FIELD}
            value={dateKey}
            max={getTodayDateString()}
            onChange={(e) => {
              setTouched(false);
              setDateKey(e.target.value);
            }}
            required
          />
        </div>

        <div>
          <p className={LABEL}>Attendance type</p>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
              const selected = status === value;
              return (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="attendance-type"
                    checked={selected}
                    onChange={() => update(() => setStatus(value))}
                    className="peer sr-only"
                  />
                  <span className={`flex min-h-12 items-center gap-2.5 rounded-xl border px-3 py-2 transition peer-focus-visible:ring-4 peer-focus-visible:ring-rose-100 ${
                    selected
                      ? 'border-[#2f5f54] bg-[#2f5f54] text-white'
                      : 'border-[#ded5cf] bg-[#fbfaf8] text-slate-700 hover:border-rose-300'
                  }`}>
                    <Icon className={`size-4 shrink-0 ${selected ? 'text-white' : 'text-[#2f5f54]'}`} />
                    <span className="min-w-0">
                      <span className="block text-xs font-extrabold">{label}</span>
                      <span className={`block truncate text-[10px] font-medium ${selected ? 'text-white/80' : 'text-slate-500'}`}>{hint}</span>
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Context banners so the manager sees why a suggestion was made */}
        {shootsToday.length > 0 && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 text-[11px] space-y-1.5">
            <p className="font-extrabold text-purple-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {member.name} is crewed on {shootsToday.length === 1 ? 'a shoot' : `${shootsToday.length} shoots`} this day
            </p>
            {shootsToday.length > 1 ? (
              <select
                className={FIELD}
                value={shootId}
                onChange={(e) => {
                  const next = shootsToday.find((s) => s.shootId === e.target.value);
                  update(() => {
                    setShootId(e.target.value);
                    setProjectId(next?.projectId || '');
                    setLocation(next?.location || '');
                  });
                }}
              >
                {shootsToday.map((s) => (
                  <option key={s.shootId} value={s.shootId}>{s.shootTitle} · {s.projectName}</option>
                ))}
              </select>
            ) : (
              <p className="font-semibold text-purple-800">
                {shootsToday[0].shootTitle} · {shootsToday[0].projectName} · {shootsToday[0].location || 'Location TBD'}
              </p>
            )}
          </div>
        )}

        {approvedLeave && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-900">
            Approved {approvedLeave.leaveType} leave covers this date ({approvedLeave.startDate} → {approvedLeave.endDate}).
          </div>
        )}

        {needsTimes && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL} htmlFor="ma-in">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-[#2f5f54]" /> Check in</span>
                </label>
                <div className="flex gap-1.5">
                  <input id="ma-in" className={FIELD} value={inTime} onChange={(e) => update(() => setInTime(e.target.value))} placeholder="09:30 AM" />
                  <button type="button" onClick={() => update(() => setInTime(getCurrentTimeLabel()))} className={`${BTN_GHOST} !px-2`} title="Use current time">Now</button>
                </div>
              </div>
              <div>
                <label className={LABEL} htmlFor="ma-out">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-[#2f5f54]" /> Check out</span>
                </label>
                <div className="flex gap-1.5">
                  <input id="ma-out" className={FIELD} value={outTime} onChange={(e) => update(() => setOutTime(e.target.value))} placeholder="07:30 PM" />
                  <button type="button" onClick={() => update(() => setOutTime(getCurrentTimeLabel()))} className={`${BTN_GHOST} !px-2`} title="Use current time">Now</button>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-600">
              Working hours: <span className="font-mono text-[#254b42]">{formatHours(workingHours)}</span>
              {workingHours !== null && workingHours > 9 && (
                <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200">Long shoot day</Badge>
              )}
              {!outTime && inTime && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">Checked in, no checkout yet</Badge>
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor="ma-project">Linked project (optional)</label>
            <select id="ma-project" className={FIELD} value={projectId} onChange={(e) => update(() => setProjectId(e.target.value))}>
              <option value="">Studio / general duty</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.clientWeddingTitle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="ma-location">Location</label>
            <input id="ma-location" className={FIELD} value={location} onChange={(e) => update(() => setLocation(e.target.value))} placeholder="Studio Office / Jaipur / Home" />
          </div>
        </div>

        <div>
          <label className={LABEL} htmlFor="ma-notes">Notes</label>
          <input id="ma-notes" className={FIELD} value={notes} onChange={(e) => update(() => setNotes(e.target.value))} placeholder="e.g. Lead photographer for the Phere coverage" />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700">
          <span>Payout for this day</span>
          <span className="font-mono text-[#254b42]">₹{payPreview.toLocaleString('en-IN')}</span>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button>
          <button type="submit" className={BTN_PRIMARY}>
            <Save className="w-4 h-4" /> {existing ? 'Update entry' : 'Save attendance'}
          </button>
        </footer>
      </form>
    </Modal>
  );
};
