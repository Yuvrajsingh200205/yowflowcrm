/**
 * Team & Attendance domain layer.
 *
 * Every screen in the Team module reads through these helpers so the numbers on
 * the KPI cards, the attendance table, the schedule and the profile drawer can
 * never disagree with each other. Nothing here invents data: it derives from the
 * records the CRM already keeps — `TeamMember[]`, `AttendanceRecord[]`,
 * `Project[].shoots[]` (with their `crewAssignments`), `LeaveRequest[]` and the
 * freelancer/expense records.
 */

import {
  AttendanceRecord,
  AttendanceType,
  AvailabilityStatus,
  EmploymentType,
  Freelancer,
  FreelancerAssignment,
  FreelancerPayment,
  LeaveRequest,
  Project,
  ShootEvent,
  TeamDepartment,
  TeamMember,
  TeamRole,
} from '@/types';
import { getTodayDateString } from '@/utils/shootTracking';

export { getTodayDateString };

// ----------------------------------------------------------------------------
// Option lists (shared by every form in the module)
// ----------------------------------------------------------------------------

/** Wedding-photography roles offered in the Add / Edit member form. */
export const WEDDING_TEAM_ROLES: string[] = [
  'Photographer',
  'Cinematographer',
  'Drone Operator',
  'Assistant Photographer',
  'Assistant Cinematographer',
  'Editor',
  'Photo Editor',
  'Video Editor',
  'Album Designer',
  'Retoucher',
  'Coordinator',
  'Social Media Handler',
  'Sales Team',
  'Account Manager',
  'Studio Manager',
  'Manager',
  'Admin',
  'Other',
];

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Full Time',
  'Part Time',
  'Freelancer',
  'Contract',
  'Intern',
];

export const TEAM_DEPARTMENTS: TeamDepartment[] = [
  'Production',
  'Post Production',
  'Management',
  'Sales & Marketing',
  'Operations',
  'Other',
];

export const LEAVE_TYPES = ['Casual', 'Sick', 'Personal', 'Emergency', 'Other'];

export const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Crew slots a wedding shoot is normally staffed with. */
export const CREW_ROLE_SLOTS = [
  'Photographer',
  'Cinematographer',
  'Drone Operator',
  'Assistant',
  'Editor',
];

// ----------------------------------------------------------------------------
// Small formatting / identity helpers
// ----------------------------------------------------------------------------

export function getInitials(name?: string): string {
  const clean = (name || '').trim();
  if (!clean) return '??';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

const AVATAR_STYLES = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-[#254b42] border-rose-200',
];

/** Stable avatar tint derived from the member id, so it never shifts on re-sort. */
export function getAvatarStyle(seed: string | number): string {
  if (typeof seed === 'number') return AVATAR_STYLES[Math.abs(seed) % AVATAR_STYLES.length];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_STYLES[Math.abs(hash) % AVATAR_STYLES.length];
}

export function getRoleIcon(role?: string): 'drone' | 'cinema' | 'video' | 'photo' | 'album' | 'retouch' | 'editor' | 'assist' | 'coord' | 'sales' | 'manager' | 'social' | 'user' {
  const lower = (role || '').toLowerCase();
  if (lower.includes('drone')) return 'drone';
  if (lower.includes('cinemat') || lower.includes('video editor')) return 'cinema';
  if (lower.includes('video')) return 'video';
  if (lower.includes('photo')) return 'photo';
  if (lower.includes('album')) return 'album';
  if (lower.includes('retouch')) return 'retouch';
  if (lower.includes('editor')) return 'editor';
  if (lower.includes('assist')) return 'assist';
  if (lower.includes('coordinat')) return 'coord';
  if (lower.includes('sales')) return 'sales';
  if (lower.includes('manager') || lower.includes('admin')) return 'manager';
  if (lower.includes('social')) return 'social';
  return 'user';
}

export function getRoleEmoji(role?: string): string {
  return '';
}

/** Department inferred from the role when a member has none saved yet. */
export function getDepartmentForRole(role?: string): TeamDepartment {
  const lower = (role || '').toLowerCase();
  if (/photograph|cinemat|drone|assistant|videograph/.test(lower)) return 'Production';
  if (/editor|album|retouch|design|colour|color/.test(lower)) return 'Post Production';
  if (/sales|social|market/.test(lower)) return 'Sales & Marketing';
  if (/manager|admin|owner|account/.test(lower)) return 'Management';
  if (/coordinat|operation|studio/.test(lower)) return 'Operations';
  return 'Other';
}

/** Employee code shown in the UI. Uses only the saved backend employee id. */
export function getEmployeeCode(member: TeamMember): string {
  if (member.employeeId && member.employeeId.trim()) return member.employeeId.trim();
  return '';
}

export function getEmploymentType(member: TeamMember): EmploymentType {
  return member.employmentType || 'Full Time';
}

export function getMemberDepartment(member: TeamMember): TeamDepartment {
  return member.department || getDepartmentForRole(member.role);
}

export function getMemberPhone(member: TeamMember): string {
  return member.phone || member.mobile || '';
}

export function isFreelanceMember(member: TeamMember): boolean {
  return getEmploymentType(member) === 'Freelancer';
}

export function isActiveMember(member: TeamMember): boolean {
  return (member.status || 'active') === 'active';
}

// ----------------------------------------------------------------------------
// Date & time helpers
// ----------------------------------------------------------------------------

export function toDateKey(value: string | Date): string {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return (value || '').slice(0, 10);
}

export function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function getWeekdayName(dateKey: string): string {
  if (!dateKey) return '';
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return WEEK_DAYS[d.getDay()];
}

export function formatDayLabel(dateKey: string): string {
  if (!dateKey) return '--';
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function formatLongDate(dateKey: string): string {
  if (!dateKey) return '--';
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

/** Parses "09:32 AM", "9:32am", "21:15" and "09:32" into minutes past midnight. */
export function parseTimeToMinutes(value?: string): number | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})[:.]?(\d{2})?\s*([APap][Mm])?/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Working hours between check-in and check-out. Shoot days routinely run past
 * midnight, so an out-time earlier than the in-time rolls to the next day
 * instead of returning a negative (or zero) shift.
 */
export function computeWorkingHours(inTime?: string, outTime?: string): number | null {
  const start = parseTimeToMinutes(inTime);
  const end = parseTimeToMinutes(outTime);
  if (start === null || end === null) return null;
  let diff = end - start;
  if (diff < 0) diff += 24 * 60; // Overnight wedding shift
  return Math.round((diff / 60) * 100) / 100;
}

export function formatHours(hours?: number | null): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return '--';
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatCurrency(amount?: number): string {
  return `₹${Math.round(amount || 0).toLocaleString('en-IN')}`;
}

// ----------------------------------------------------------------------------
// Record ↔ member matching
// ----------------------------------------------------------------------------

function sameName(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Attendance rows have historically been written with either the member id or
 * only the name (imports, older builds), so both are accepted.
 */
export function attendanceBelongsToMember(record: AttendanceRecord, member: TeamMember): boolean {
  if (!record || !member) return false;
  if (record.teamMemberId && record.teamMemberId === member.id) return true;
  return sameName(record.teamMemberName, member.name);
}

export function getMemberAttendance(member: TeamMember, attendance: AttendanceRecord[]): AttendanceRecord[] {
  return (attendance || []).filter((rec) => attendanceBelongsToMember(rec, member));
}

export function getAttendanceOnDate(
  member: TeamMember,
  attendance: AttendanceRecord[],
  dateKey: string
): AttendanceRecord | undefined {
  return (attendance || []).find(
    (rec) => toDateKey(rec.date) === dateKey && attendanceBelongsToMember(rec, member)
  );
}

// ----------------------------------------------------------------------------
// Shoot assignments (Project → ShootEvent → crew)
// ----------------------------------------------------------------------------

export interface MemberShootAssignment {
  projectId: string;
  projectName: string;
  clientMobile?: string;
  shootId: string;
  shootTitle: string;
  date: string;
  time?: string;
  venue?: string;
  location?: string;
  role: string;
  shootStatus: ShootEvent['status'];
}

/** Named crew slots on a shoot that sit outside the `crewAssignments` array. */
const NAMED_CREW_FIELDS: Array<{ key: keyof ShootEvent; role: string }> = [
  { key: 'leadPhotographer', role: 'Lead Photographer' },
  { key: 'cinematographer', role: 'Cinematographer' },
  { key: 'droneOperator', role: 'Drone Operator' },
  { key: 'assistant', role: 'Assistant' },
];

function crewMatchesMember(crew: { id?: string; userId?: string; name?: string }, member: TeamMember): boolean {
  return crew.id === member.id || crew.userId === member.id || sameName(crew.name, member.name);
}

/** Roles a member already holds on a shoot. */
export function getMemberRolesOnShoot(shoot: ShootEvent, member: TeamMember): string[] {
  const roles = (shoot.crewAssignments || [])
    .filter((crew) => crewMatchesMember(crew, member))
    .map((crew) => crew.role || member.role || 'Crew');

  for (const field of NAMED_CREW_FIELDS) {
    const value = shoot[field.key];
    if (typeof value === 'string' && sameName(value, member.name) && !roles.some((role) => role.toLowerCase() === field.role.toLowerCase())) {
      roles.push(field.role);
    }
  }
  return roles;
}

/** The role a member is booked in for a shoot, or null when not on the crew. */
export function getShootRoleForMember(shoot: ShootEvent, member: TeamMember): string | null {
  return getMemberRolesOnShoot(shoot, member)[0] ?? null;
}

export function memberHasRoleOnShoot(shoot: ShootEvent, member: TeamMember, role: string): boolean {
  return getMemberRolesOnShoot(shoot, member).some((held) => held.toLowerCase() === role.toLowerCase());
}

/** Every shoot (across every project) this member is booked on. */
export function getMemberShootAssignments(
  member: TeamMember,
  projects: Project[]
): MemberShootAssignment[] {
  const out: MemberShootAssignment[] = [];
  (projects || []).forEach((project) => {
    (project.shoots || []).forEach((shoot) => {
      getMemberRolesOnShoot(shoot, member).forEach((role) => {
        out.push({
          projectId: project.id,
          projectName: project.clientWeddingTitle || project.projectName || project.name || 'Untitled project',
          clientMobile: project.clientContactMobile,
          shootId: shoot.id,
          shootTitle: shoot.title || 'Shoot',
          date: toDateKey(shoot.date),
          time: shoot.time,
          venue: shoot.venue,
          location: shoot.location || shoot.venue,
          role,
          shootStatus: shoot.status,
        });
      });
    });
  });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Shoots this member is booked on for one specific day (cancelled excluded). */
export function getShootsOnDate(
  member: TeamMember,
  projects: Project[],
  dateKey: string
): MemberShootAssignment[] {
  return getMemberShootAssignments(member, projects).filter(
    (a) => a.date === dateKey && a.shootStatus !== 'cancelled'
  );
}

export function getUpcomingShoots(
  member: TeamMember,
  projects: Project[],
  fromDate: string = getTodayDateString()
): MemberShootAssignment[] {
  return getMemberShootAssignments(member, projects).filter(
    (a) => a.date >= fromDate && a.shootStatus !== 'cancelled'
  );
}

export function getPastShoots(
  member: TeamMember,
  projects: Project[],
  beforeDate: string = getTodayDateString()
): MemberShootAssignment[] {
  return getMemberShootAssignments(member, projects)
    .filter((a) => a.date < beforeDate)
    .reverse();
}

/** Flat list of every shoot in the CRM, newest booking context preserved. */
export interface ShootWithProject {
  project: Project;
  shoot: ShootEvent;
}

export function getAllShoots(projects: Project[]): ShootWithProject[] {
  const out: ShootWithProject[] = [];
  (projects || []).forEach((project) => {
    (project.shoots || []).forEach((shoot) => out.push({ project, shoot }));
  });
  return out.sort((a, b) => toDateKey(a.shoot.date).localeCompare(toDateKey(b.shoot.date)));
}

// ----------------------------------------------------------------------------
// Leave
// ----------------------------------------------------------------------------

export function getMemberLeaves(member: TeamMember, leaves: LeaveRequest[]): LeaveRequest[] {
  return (leaves || []).filter(
    (l) => l.teamMemberId === member.id || sameName(l.teamMemberName, member.name)
  );
}

/** The approved leave covering a date, if any. */
export function getLeaveOnDate(
  member: TeamMember,
  leaves: LeaveRequest[],
  dateKey: string
): LeaveRequest | undefined {
  return getMemberLeaves(member, leaves).find(
    (l) => l.status === 'approved' && dateKey >= toDateKey(l.startDate) && dateKey <= toDateKey(l.endDate)
  );
}

export function countLeaveDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${toDateKey(startDate)}T00:00:00`);
  const end = new Date(`${toDateKey(endDate)}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

export function isWeeklyOff(member: TeamMember, dateKey: string): boolean {
  if (!member.weeklyOff) return false;
  const day = getWeekdayName(dateKey);
  return member.weeklyOff.toLowerCase().includes(day.toLowerCase()) && !!day;
}

// ----------------------------------------------------------------------------
// Day resolution — the core rule set
// ----------------------------------------------------------------------------

export type DayStatusKind =
  | 'on_shoot'
  | 'office'
  | 'wfh'
  | 'leave'
  | 'weekly_off'
  | 'holiday'
  | 'half_day'
  | 'absent'
  | 'not_marked'
  | 'scheduled';

export interface DayStatus {
  kind: DayStatusKind;
  /** Bucket used by the attendance filters and the calendar legend. */
  attendanceType: AttendanceType | null;
  label: string;
  /** Single-letter/short code for the monthly calendar grid. */
  code: string;
  badgeClass: string;
  record?: AttendanceRecord;
  shoot?: MemberShootAssignment;
  leave?: LeaveRequest;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: number | null;
  /** True when nothing was marked and the status came from shoots/leave/roster. */
  derived: boolean;
}

const STATUS_PRESETS: Record<DayStatusKind, { label: string; code: string; badgeClass: string; type: AttendanceType | null }> = {
  on_shoot: { label: 'On Shoot', code: 'S', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200', type: 'On Shoot' },
  office: { label: 'Office', code: 'P', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', type: 'Office' },
  wfh: { label: 'WFH', code: 'WFH', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200', type: 'WFH' },
  leave: { label: 'On Leave', code: 'L', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', type: 'Leave' },
  weekly_off: { label: 'Weekly Off', code: 'WO', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200', type: 'Weekly Off' },
  holiday: { label: 'Holiday', code: 'H', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200', type: 'Holiday' },
  half_day: { label: 'Half Day', code: 'HD', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200', type: 'Office' },
  absent: { label: 'Absent', code: 'A', badgeClass: 'bg-red-100 text-red-700 border-red-200', type: null },
  not_marked: { label: 'Not Marked', code: '–', badgeClass: 'bg-slate-50 text-slate-400 border-slate-200', type: null },
  scheduled: { label: 'Scheduled', code: '·', badgeClass: 'bg-slate-50 text-slate-400 border-slate-200', type: null },
};

function buildDayStatus(kind: DayStatusKind, extra: Partial<DayStatus> = {}): DayStatus {
  const preset = STATUS_PRESETS[kind];
  return {
    kind,
    attendanceType: preset.type,
    label: preset.label,
    code: preset.code,
    badgeClass: preset.badgeClass,
    derived: true,
    ...extra,
  };
}

/** Maps a stored attendance status onto a day-status kind. */
function kindFromRecordStatus(status: AttendanceRecord['status']): DayStatusKind {
  switch (status) {
    case 'present_shoot':
      return 'on_shoot';
    case 'present_wfh':
      return 'wfh';
    case 'half_day':
      return 'half_day';
    case 'leave':
      return 'leave';
    case 'weekly_off':
      return 'weekly_off';
    case 'holiday':
      return 'holiday';
    case 'absent':
      return 'absent';
    case 'present':
    case 'present_office':
    default:
      return 'office';
  }
}

/**
 * The first day this member was actually being tracked — the earlier bound
 * beyond which a missing record means "never recorded", not "absent".
 * Cached per attendance array so the month grids stay cheap.
 */
const trackingStartCache = new WeakMap<AttendanceRecord[], Map<string, string | null>>();

export function getTrackingStart(member: TeamMember, attendance: AttendanceRecord[]): string | null {
  let cache = trackingStartCache.get(attendance);
  if (!cache) {
    cache = new Map();
    trackingStartCache.set(attendance, cache);
  }
  if (cache.has(member.id)) return cache.get(member.id) ?? null;

  let earliest: string | null = null;
  (attendance || []).forEach((rec) => {
    if (!attendanceBelongsToMember(rec, member)) return;
    const key = toDateKey(rec.date);
    if (key && (!earliest || key < earliest)) earliest = key;
  });

  // A member with no attendance on file has never been tracked, so their past
  // days stay "not marked" instead of being back-filled as absences.
  const joining = member.joiningDate ? toDateKey(member.joiningDate) : null;
  const start = earliest && joining ? (earliest > joining ? earliest : joining) : earliest;
  cache.set(member.id, start);
  return start;
}

export interface DayStatusInput {
  member: TeamMember;
  dateKey: string;
  attendance: AttendanceRecord[];
  projects: Project[];
  leaves?: LeaveRequest[];
  today?: string;
}

/**
 * Resolves what a member was doing on a given day.
 *
 * Precedence: a marked record wins, except that a member booked on a shoot is
 * never reported as absent for that day — the shoot is the truth (a wedding
 * crew is out of the office by design, section 11 of the module brief).
 */
export function resolveDayStatus({
  member,
  dateKey,
  attendance,
  projects,
  leaves = [],
  today = getTodayDateString(),
}: DayStatusInput): DayStatus {
  const record = getAttendanceOnDate(member, attendance, dateKey);
  const shoots = getShootsOnDate(member, projects, dateKey);
  const shoot = shoots[0];
  const leave = getLeaveOnDate(member, leaves, dateKey);

  const checkIn = record?.inTime;
  const checkOut = record?.outTime;
  const workingHours = record?.workingHours ?? computeWorkingHours(checkIn, checkOut);

  if (record) {
    const kind = kindFromRecordStatus(record.status);

    // A marked "absent" on a day the member is crewed on a shoot is almost
    // always a stale office-centric entry — surface the shoot instead.
    if (kind === 'absent' && shoot) {
      return buildDayStatus('on_shoot', {
        record,
        shoot,
        location: shoot.location || shoot.venue,
        checkIn,
        checkOut,
        workingHours,
        derived: true,
      });
    }

    return buildDayStatus(kind, {
      record,
      shoot: kind === 'on_shoot' ? shoot : undefined,
      leave: kind === 'leave' ? leave : undefined,
      location:
        record.location ||
        (kind === 'on_shoot' ? shoot?.location || shoot?.venue : undefined) ||
        (kind === 'wfh' ? 'Home' : kind === 'office' || kind === 'half_day' ? 'Studio Office' : undefined),
      checkIn,
      checkOut,
      workingHours,
      derived: false,
    });
  }

  if (leave) {
    return buildDayStatus('leave', { leave, location: 'On Leave' });
  }

  if (shoot) {
    return buildDayStatus('on_shoot', {
      shoot,
      location: shoot.location || shoot.venue,
    });
  }

  if (isWeeklyOff(member, dateKey)) {
    return buildDayStatus('weekly_off');
  }

  if (dateKey > today) {
    return buildDayStatus('scheduled');
  }

  if (dateKey === today) {
    return buildDayStatus('not_marked');
  }

  // A member who joined later is not "absent" for days before they started.
  if (member.joiningDate && dateKey < toDateKey(member.joiningDate)) {
    return buildDayStatus('scheduled', { label: 'Pre-joining' });
  }
  if (!isActiveMember(member)) {
    return buildDayStatus('not_marked');
  }

  // Only call a past day "absent" once this member is genuinely being tracked;
  // otherwise a brand-new roster would show months of fictitious absences.
  const trackingStart = getTrackingStart(member, attendance);
  if (!trackingStart || dateKey < trackingStart) {
    return buildDayStatus('not_marked');
  }

  return buildDayStatus('absent');
}

// ----------------------------------------------------------------------------
// Availability
// ----------------------------------------------------------------------------

export interface AvailabilityInfo {
  status: AvailabilityStatus;
  reason: string;
  badgeClass: string;
  shoot?: MemberShootAssignment;
}

const AVAILABILITY_BADGES: Record<AvailabilityStatus, string> = {
  Available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'On Shoot': 'bg-purple-100 text-purple-800 border-purple-200',
  Busy: 'bg-amber-100 text-amber-800 border-amber-200',
  'On Leave': 'bg-red-100 text-red-700 border-red-200',
  WFH: 'bg-blue-100 text-blue-800 border-blue-200',
  Unavailable: 'bg-slate-200 text-slate-600 border-slate-300',
};

export function getAvailabilityBadge(status: AvailabilityStatus): string {
  return AVAILABILITY_BADGES[status] || AVAILABILITY_BADGES.Unavailable;
}

/**
 * Availability for a date. A manual override on the member wins only when the
 * member is not actually booked on a shoot that day.
 */
export function getAvailability(
  member: TeamMember,
  dateKey: string,
  attendance: AttendanceRecord[],
  projects: Project[],
  leaves: LeaveRequest[] = []
): AvailabilityInfo {
  const build = (status: AvailabilityStatus, reason: string, shoot?: MemberShootAssignment): AvailabilityInfo => ({
    status,
    reason,
    badgeClass: getAvailabilityBadge(status),
    shoot,
  });

  if (!isActiveMember(member)) {
    const label = member.status === 'suspended' ? 'Suspended' : member.status === 'on_leave' ? 'On extended leave' : 'Inactive member';
    return build('Unavailable', label);
  }

  const shoots = getShootsOnDate(member, projects, dateKey);
  if (shoots.length) {
    const reason = shoots.length > 1
      ? `${shoots.length} shoots booked on this date`
      : `${shoots[0].shootTitle} · ${shoots[0].location || shoots[0].venue || 'Location TBD'}`;
    return build('On Shoot', reason, shoots[0]);
  }

  const leave = getLeaveOnDate(member, leaves, dateKey);
  if (leave) return build('On Leave', `${leave.leaveType} leave until ${formatDayLabel(leave.endDate)}`);

  if (isWeeklyOff(member, dateKey)) return build('Unavailable', `Weekly off (${member.weeklyOff})`);

  if (member.availabilityStatus) {
    return build(member.availabilityStatus, 'Set manually by the manager');
  }

  const day = resolveDayStatus({ member, dateKey, attendance, projects, leaves });
  if (day.kind === 'wfh') return build('WFH', 'Working from home today');
  if (day.kind === 'office' || day.kind === 'half_day') return build('Available', 'In studio — free for assignment');

  return build('Available', 'No booking on this date');
}

// ----------------------------------------------------------------------------
// Double booking
// ----------------------------------------------------------------------------

export interface BookingConflict {
  member: TeamMember;
  date: string;
  existing: MemberShootAssignment[];
}

/**
 * Existing shoots that clash with booking this member on `dateKey`.
 * `excludeShootId` keeps a shoot from conflicting with itself while editing.
 */
export function findBookingConflicts(
  member: TeamMember,
  dateKey: string,
  projects: Project[],
  excludeShootId?: string,
  excludeProjectId?: string,
): MemberShootAssignment[] {
  return getShootsOnDate(member, projects, dateKey).filter((a) => {
    if (excludeProjectId && a.projectId === excludeProjectId) return false;
    return a.shootId !== excludeShootId;
  });
}

export function hasBookingConflict(
  member: TeamMember,
  dateKey: string,
  projects: Project[],
  excludeShootId?: string
): boolean {
  return findBookingConflicts(member, dateKey, projects, excludeShootId).length > 0;
}

// ----------------------------------------------------------------------------
// Attendance statistics
// ----------------------------------------------------------------------------

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;   // Office + WFH + shoot + half-day (counted as worked)
  officeDays: number;
  wfhDays: number;
  shootDays: number;
  halfDays: number;
  leaveDays: number;
  weeklyOffDays: number;
  holidayDays: number;
  absentDays: number;
  notMarkedDays: number;
  lateCount: number;
  earlyDepartureCount: number;
  totalHours: number;
  averageHours: number;
  overtimeHours: number;
  attendancePercent: number;
  totalPay: number;
  paidAmount: number;
  pendingAmount: number;
}

const STANDARD_SHIFT_HOURS = 9;

export function getDateRange(startDate: string, endDate: string): string[] {
  const out: string[] = [];
  if (!startDate || !endDate || startDate > endDate) return out;
  let cursor = toDateKey(startDate);
  const end = toDateKey(endDate);
  let guard = 0;
  while (cursor <= end && guard < 800) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
    guard++;
  }
  return out;
}

/** Per-member attendance roll-up over a date range, shoot-days included. */
export function getAttendanceStats(
  member: TeamMember,
  attendance: AttendanceRecord[],
  projects: Project[],
  leaves: LeaveRequest[],
  startDate: string,
  endDate: string
): AttendanceStats {
  const days = getDateRange(startDate, endDate);
  const today = getTodayDateString();

  const stats: AttendanceStats = {
    totalDays: 0,
    presentDays: 0,
    officeDays: 0,
    wfhDays: 0,
    shootDays: 0,
    halfDays: 0,
    leaveDays: 0,
    weeklyOffDays: 0,
    holidayDays: 0,
    absentDays: 0,
    notMarkedDays: 0,
    lateCount: 0,
    earlyDepartureCount: 0,
    totalHours: 0,
    averageHours: 0,
    overtimeHours: 0,
    attendancePercent: 0,
    totalPay: 0,
    paidAmount: 0,
    pendingAmount: 0,
  };

  const shiftStart = parseTimeToMinutes(member.inTime || '09:30 AM');
  const shiftEnd = parseTimeToMinutes(member.outTime || '07:30 PM');
  let hoursSamples = 0;

  days.forEach((dateKey) => {
    if (dateKey > today) return; // Never score days that have not happened yet
    const day = resolveDayStatus({ member, dateKey, attendance, projects, leaves, today });
    stats.totalDays++;

    switch (day.kind) {
      case 'on_shoot':
        stats.shootDays++;
        stats.presentDays++;
        break;
      case 'office':
        stats.officeDays++;
        stats.presentDays++;
        break;
      case 'wfh':
        stats.wfhDays++;
        stats.presentDays++;
        break;
      case 'half_day':
        stats.halfDays++;
        stats.presentDays++;
        break;
      case 'leave':
        stats.leaveDays++;
        break;
      case 'weekly_off':
        stats.weeklyOffDays++;
        break;
      case 'holiday':
        stats.holidayDays++;
        break;
      case 'absent':
        stats.absentDays++;
        break;
      default:
        stats.notMarkedDays++;
    }

    if (day.record) {
      stats.totalPay += day.record.payAmount || 0;
      if (day.record.paidStatus === 'paid') stats.paidAmount += day.record.payAmount || 0;
      else stats.pendingAmount += day.record.payAmount || 0;

      const inMinutes = parseTimeToMinutes(day.record.inTime);
      const outMinutes = parseTimeToMinutes(day.record.outTime);
      // Shoot call-times legitimately sit outside the studio shift, so late /
      // early flags only apply to office & WFH days.
      const officeLike = day.kind === 'office' || day.kind === 'wfh' || day.kind === 'half_day';
      if (officeLike && shiftStart !== null && inMinutes !== null && inMinutes > shiftStart + 10) {
        stats.lateCount++;
      }
      if (officeLike && shiftEnd !== null && outMinutes !== null && outMinutes < shiftEnd - 15 && day.kind !== 'half_day') {
        stats.earlyDepartureCount++;
      }
    }

    if (day.workingHours) {
      stats.totalHours += day.workingHours;
      hoursSamples++;
      if (day.workingHours > STANDARD_SHIFT_HOURS) {
        stats.overtimeHours += day.workingHours - STANDARD_SHIFT_HOURS;
      }
    }
  });

  stats.totalHours = Math.round(stats.totalHours * 100) / 100;
  stats.overtimeHours = Math.round(stats.overtimeHours * 100) / 100;
  stats.averageHours = hoursSamples ? Math.round((stats.totalHours / hoursSamples) * 100) / 100 : 0;

  // Weekly offs and holidays are not working days, so they stay out of the
  // percentage. Days with nothing marked at all are excluded too.
  const workingDays = stats.presentDays + stats.absentDays + stats.leaveDays;
  stats.attendancePercent = workingDays ? Math.round((stats.presentDays / workingDays) * 100) : 0;

  return stats;
}

// ----------------------------------------------------------------------------
// Team-wide KPIs
// ----------------------------------------------------------------------------

export interface TeamKpis {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  availableToday: number;
  onShootToday: number;
  onLeaveToday: number;
  presentToday: number;
  absentToday: number;
  wfhToday: number;
  freelancers: number;
  pendingAttendance: number;
  weeklyOffToday: number;
}

export function getTeamKpis(
  team: TeamMember[],
  attendance: AttendanceRecord[],
  projects: Project[],
  leaves: LeaveRequest[],
  externalFreelancerCount = 0,
  dateKey: string = getTodayDateString()
): TeamKpis {
  const kpis: TeamKpis = {
    totalMembers: team.length,
    activeMembers: 0,
    inactiveMembers: 0,
    availableToday: 0,
    onShootToday: 0,
    onLeaveToday: 0,
    presentToday: 0,
    absentToday: 0,
    wfhToday: 0,
    freelancers: externalFreelancerCount,
    pendingAttendance: 0,
    weeklyOffToday: 0,
  };

  team.forEach((member) => {
    if (isActiveMember(member)) kpis.activeMembers++;
    else kpis.inactiveMembers++;

    if (isFreelanceMember(member)) kpis.freelancers++;

    if (!isActiveMember(member)) return;

    const day = resolveDayStatus({ member, dateKey, attendance, projects, leaves, today: dateKey });
    switch (day.kind) {
      case 'on_shoot':
        kpis.onShootToday++;
        kpis.presentToday++;
        break;
      case 'office':
      case 'half_day':
        kpis.presentToday++;
        break;
      case 'wfh':
        kpis.wfhToday++;
        kpis.presentToday++;
        break;
      case 'leave':
        kpis.onLeaveToday++;
        break;
      case 'weekly_off':
      case 'holiday':
        kpis.weeklyOffToday++;
        break;
      case 'absent':
        kpis.absentToday++;
        break;
      default:
        kpis.pendingAttendance++;
    }

    // "Available" here means the same thing it means on the Availability board:
    // free to be put on a shoot. WFH is reported separately.
    const availability = getAvailability(member, dateKey, attendance, projects, leaves);
    if (availability.status === 'Available') kpis.availableToday++;
  });

  return kpis;
}

// ----------------------------------------------------------------------------
// Workload / capacity
// ----------------------------------------------------------------------------

export interface MemberWorkload {
  member: TeamMember;
  shootsInRange: number;
  upcomingShoots: number;
  nextShoot?: MemberShootAssignment;
  availability: AvailabilityInfo;
}

export function getWorkloadForRange(
  team: TeamMember[],
  projects: Project[],
  attendance: AttendanceRecord[],
  leaves: LeaveRequest[],
  startDate: string,
  endDate: string
): MemberWorkload[] {
  const today = getTodayDateString();
  return team
    .map((member) => {
      const assignments = getMemberShootAssignments(member, projects).filter(
        (a) => a.shootStatus !== 'cancelled'
      );
      const inRange = assignments.filter((a) => a.date >= startDate && a.date <= endDate);
      const upcoming = assignments.filter((a) => a.date >= today);
      return {
        member,
        shootsInRange: inRange.length,
        upcomingShoots: upcoming.length,
        nextShoot: upcoming[0],
        availability: getAvailability(member, today, attendance, projects, leaves),
      };
    })
    .sort((a, b) => b.shootsInRange - a.shootsInRange || a.member.name.localeCompare(b.member.name));
}

// ----------------------------------------------------------------------------
// Money — team payouts and freelancer settlements
// ----------------------------------------------------------------------------

export interface MemberPaymentSummary {
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  records: AttendanceRecord[];
}

/** Payment view for an internal member, built from their attendance payouts. */
export function getMemberPaymentSummary(
  member: TeamMember,
  attendance: AttendanceRecord[]
): MemberPaymentSummary {
  const records = getMemberAttendance(member, attendance)
    .slice()
    .sort((a, b) => toDateKey(b.date).localeCompare(toDateKey(a.date)));

  const totalEarned = records.reduce((sum, r) => sum + (r.payAmount || 0), 0);
  const totalPaid = records
    .filter((r) => r.paidStatus === 'paid')
    .reduce((sum, r) => sum + (r.payAmount || 0), 0);
  const lastPaid = records.find((r) => r.paidStatus === 'paid');

  return {
    totalEarned,
    totalPaid,
    totalPending: totalEarned - totalPaid,
    lastPaymentDate: lastPaid ? toDateKey(lastPaid.date) : undefined,
    lastPaymentAmount: lastPaid?.payAmount,
    records,
  };
}

export interface FreelancerFinance {
  totalShoots: number;
  upcomingShoots: number;
  agreedTotal: number;
  totalPaid: number;
  pending: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

/** Freelancer money view, derived from their assignments and payment ledger. */
export function getFreelancerFinance(
  freelancerId: string,
  assignments: FreelancerAssignment[],
  payments: FreelancerPayment[],
  today: string = getTodayDateString()
): FreelancerFinance {
  const mine = (assignments || []).filter((a) => a.freelancerId === freelancerId);
  const active = mine.filter((a) => a.assignmentStatus !== 'cancelled');
  const myPayments = (payments || [])
    .filter((p) => p.freelancerId === freelancerId)
    .slice()
    .sort((a, b) => toDateKey(b.paymentDate).localeCompare(toDateKey(a.paymentDate)));

  const agreedTotal = active.reduce((sum, a) => sum + (a.totalAgreedAmount || 0), 0);
  // The payment ledger is the authority once transactions exist; assignments
  // carry the running `advancePaid` only as a denormalised cache.
  const paidFromLedger = myPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const paidFromAssignments = active.reduce((sum, a) => sum + (a.advancePaid || 0), 0);
  const totalPaid = myPayments.length ? paidFromLedger : paidFromAssignments;

  return {
    totalShoots: active.length,
    upcomingShoots: active.filter((a) => toDateKey(a.shootDate) >= today).length,
    agreedTotal,
    totalPaid,
    pending: Math.max(0, agreedTotal - totalPaid),
    lastPaymentDate: myPayments[0] ? toDateKey(myPayments[0].paymentDate) : undefined,
    lastPaymentAmount: myPayments[0]?.amountPaid,
  };
}

/** Freelancer availability on a date, from their own assignment records. */
export function getFreelancerAvailability(
  freelancer: Freelancer,
  assignments: FreelancerAssignment[],
  dateKey: string
): AvailabilityInfo {
  if (freelancer.status === 'inactive') {
    return { status: 'Unavailable', reason: 'Marked inactive', badgeClass: getAvailabilityBadge('Unavailable') };
  }
  const booked = (assignments || []).filter(
    (a) =>
      a.freelancerId === freelancer.id &&
      toDateKey(a.shootDate) === dateKey &&
      a.assignmentStatus !== 'cancelled'
  );
  if (booked.length) {
    return {
      status: 'On Shoot',
      reason: `${booked[0].projectName || booked[0].eventName} · ${booked[0].shootLocation || booked[0].venue || 'Location TBD'}`,
      badgeClass: getAvailabilityBadge('On Shoot'),
    };
  }
  if (freelancer.availabilityStatus && freelancer.availabilityStatus !== 'Available') {
    const status = freelancer.availabilityStatus as AvailabilityStatus;
    return { status, reason: 'Set on the freelancer profile', badgeClass: getAvailabilityBadge(status) };
  }
  return { status: 'Available', reason: 'No booking on this date', badgeClass: getAvailabilityBadge('Available') };
}

// ----------------------------------------------------------------------------
// Attendance record construction
// ----------------------------------------------------------------------------

/** Daily pay basis for a member — monthly salary spread over a 26-day month. */
export function getDailyRateBasis(member: TeamMember): number {
  if (member.payType === 'monthly' && member.monthlySalary) {
    return Math.round(member.monthlySalary / 26);
  }
  return member.dailyRate || 0;
}

export function getPayForStatus(member: TeamMember, status: AttendanceRecord['status']): number {
  const basis = getDailyRateBasis(member);
  if (status === 'half_day') return Math.round(basis / 2);
  if (status === 'absent' || status === 'leave' || status === 'weekly_off' || status === 'holiday') return 0;
  return basis;
}

export interface BuildAttendanceInput {
  member: TeamMember;
  dateKey: string;
  status: AttendanceRecord['status'];
  inTime?: string;
  outTime?: string;
  project?: Project;
  shoot?: MemberShootAssignment;
  location?: string;
  notes?: string;
  markedBy?: string;
  existing?: AttendanceRecord;
}

/** Builds (or updates) an attendance row with all derived fields filled in. */
export function buildAttendanceRecord({
  member,
  dateKey,
  status,
  inTime,
  outTime,
  project,
  shoot,
  location,
  notes,
  markedBy,
  existing,
}: BuildAttendanceInput): AttendanceRecord {
  const workingHours = computeWorkingHours(inTime, outTime);
  const shiftStart = parseTimeToMinutes(member.inTime || '09:30 AM');
  const shiftEnd = parseTimeToMinutes(member.outTime || '07:30 PM');
  const inMinutes = parseTimeToMinutes(inTime);
  const outMinutes = parseTimeToMinutes(outTime);
  const officeLike = status === 'present_office' || status === 'present' || status === 'present_wfh' || status === 'half_day';

  const resolvedLocation =
    location ||
    (status === 'present_shoot' ? shoot?.location || shoot?.venue || project?.venueLocation : undefined) ||
    (status === 'present_wfh' ? 'Home' : undefined) ||
    (status === 'present_office' || status === 'present' || status === 'half_day' ? 'Studio Office' : undefined);

  return {
    id: existing?.id || `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: dateKey,
    teamMemberId: member.id,
    teamMemberName: member.name,
    role: member.role,
    projectId: project?.id || (shoot ? shoot.projectId : undefined),
    projectTitle: project?.clientWeddingTitle || shoot?.projectName,
    status,
    inTime: inTime || undefined,
    outTime: outTime || undefined,
    lunchTime: member.lunchTime,
    // Keep a manually adjusted payout, but recompute it whenever the day type
    // changes (e.g. office day corrected to absent).
    payAmount:
      existing && existing.status === status
        ? existing.payAmount
        : getPayForStatus(member, status),
    paidStatus: existing?.paidStatus || 'pending',
    notes: notes ?? existing?.notes,
    shootId: shoot?.shootId,
    shootTitle: shoot?.shootTitle,
    location: resolvedLocation,
    workingHours: workingHours ?? undefined,
    isLate: officeLike && shiftStart !== null && inMinutes !== null ? inMinutes > shiftStart + 10 : false,
    isEarlyDeparture:
      officeLike && status !== 'half_day' && shiftEnd !== null && outMinutes !== null
        ? outMinutes < shiftEnd - 15
        : false,
    markedBy: markedBy || existing?.markedBy,
  };
}

/** Attendance status implied by a member's configured work mode. */
export function getDefaultStatusForMember(
  member: TeamMember,
  dateKey: string,
  projects: Project[]
): AttendanceRecord['status'] {
  if (getShootsOnDate(member, projects, dateKey).length) return 'present_shoot';
  if (member.attendanceMode === 'WFH') return 'present_wfh';
  return 'present_office';
}

/** "09:32 AM" for the current moment — matches the stored time format. */
export function getCurrentTimeLabel(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase();
}

// ----------------------------------------------------------------------------
// Search & sort
// ----------------------------------------------------------------------------

export function memberMatchesSearch(member: TeamMember, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    member.name,
    member.role,
    getEmployeeCode(member),
    getMemberPhone(member),
    member.email,
    getMemberDepartment(member),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export type TeamSortKey = 'name' | 'attendance' | 'upcoming_shoot' | 'joining_date' | 'role';

export function sortMembers(
  members: TeamMember[],
  sortKey: TeamSortKey,
  context: {
    attendance: AttendanceRecord[];
    projects: Project[];
    leaves: LeaveRequest[];
    rangeStart: string;
    rangeEnd: string;
  }
): TeamMember[] {
  const copy = [...members];
  switch (sortKey) {
    case 'attendance':
      return copy.sort((a, b) => {
        const sa = getAttendanceStats(a, context.attendance, context.projects, context.leaves, context.rangeStart, context.rangeEnd);
        const sb = getAttendanceStats(b, context.attendance, context.projects, context.leaves, context.rangeStart, context.rangeEnd);
        return sb.attendancePercent - sa.attendancePercent;
      });
    case 'upcoming_shoot':
      return copy.sort((a, b) => {
        const na = getUpcomingShoots(a, context.projects)[0]?.date || '9999-12-31';
        const nb = getUpcomingShoots(b, context.projects)[0]?.date || '9999-12-31';
        return na.localeCompare(nb);
      });
    case 'joining_date':
      return copy.sort((a, b) => (a.joiningDate || '9999-12-31').localeCompare(b.joiningDate || '9999-12-31'));
    case 'role':
      return copy.sort((a, b) => String(a.role || '').localeCompare(String(b.role || '')));
    case 'name':
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

/** Team member status badge styling, shared across every view. */
export function getMemberStatusBadge(member: TeamMember): { label: string; className: string } {
  switch (member.status) {
    case 'inactive':
      return { label: 'Inactive', className: 'bg-slate-200 text-slate-600 border-slate-300' };
    case 'on_leave':
      return { label: 'On Leave', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'suspended':
      return { label: 'Suspended', className: 'bg-red-100 text-red-700 border-red-200' };
    default:
      return { label: 'Active', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  }
}

export function getLeaveStatusBadge(status: LeaveRequest['status']): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'cancelled':
      return 'bg-slate-200 text-slate-600 border-slate-300';
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200';
  }
}

/** Roles the CRM knows about, merged with any custom role already in use. */
export function getRoleOptions(team: TeamMember[]): string[] {
  const set = new Set<string>(WEDDING_TEAM_ROLES);
  team.forEach((m) => {
    if (m.role) set.add(String(m.role));
  });
  return [...set];
}
