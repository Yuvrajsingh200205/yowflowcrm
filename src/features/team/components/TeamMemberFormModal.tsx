'use client';

/**
 * Add / Edit team member.
 *
 * One form serves both flows so the roster can never drift into two different
 * shapes of member record. Everything the old add-member modal captured (pay
 * structure, shift timings, weekly off, permitted software) is still here — the
 * HR profile and attendance settings are layered on top.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Camera,
  Eye,
  EyeOff,
  IdCard,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { EmploymentType, TeamMember, TeamMemberStatus } from '@/types';
import type { AccessRole } from '@/features/access';
import type { PermissionModule } from '@/features/access/accessTypes';
import { assignableRoles, rolePermissionPreview } from '@/features/access/roleSelection';
import { useToast } from '@/components/common';
import { indianMobileError, nextIndianMobileValue } from '@/lib/validation/indianMobile';
import {
  Avatar,
  BTN_GHOST,
  BTN_PRIMARY,
  FIELD,
  LABEL,
  Modal,
  ModalHero,
} from './TeamUiKit';
import {
  EMPLOYMENT_TYPES,
  TEAM_DEPARTMENTS,
  WEEK_DAYS,
  getDepartmentForRole,
  getEmployeeCode,
} from '../teamDomain';
import { BRAND } from '@/config/brand';

interface Props {
  isOpen: boolean;
  /** null → add mode. */
  member: TeamMember | null;
  team: TeamMember[];
  softwareOptions: string[];
  onSave: (member: TeamMember, mode: 'create' | 'update', password?: string) => Promise<void>;
  onClose: () => void;
  /** Pre-selects Freelancer employment type when opened from the freelancer tab. */
  defaultEmploymentType?: EmploymentType;
  accessRoles?: AccessRole[];
  /** Backend permission catalogue, used to preview what a role grants. */
  accessPermissions?: PermissionModule[];
}

interface FormState {
  name: string;
  profilePhoto: string;
  phone: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  employeeId: string;
  /** Job title, mirrored from the selected role. */
  role: string;
  department: string;
  employmentType: EmploymentType;
  joiningDate: string;
  status: TeamMemberStatus;
  reportingManagerId: string;
  attendanceMode: NonNullable<TeamMember['attendanceMode']>;
  shift: string;
  inTime: string;
  outTime: string;
  weeklyOff: string;
  lunchTime: string;
  attendanceRequired: boolean;
  payType: 'monthly' | 'daily';
  monthlySalary: string;
  dailyRate: string;
  skills: string;
  softwares: string[];
  accessRoleId: string;
  password: string;
}

function isValidPassword(password: string): boolean {
  return password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
}

function passwordValidationMessage(password: string): string {
  if (!password) return 'Temporary password is required.';
  if (password.length < 10) return 'Password must be at least 10 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
  return 'Password must include a digit.';
}

function emptyForm(defaultEmploymentType?: EmploymentType): FormState {
  return {
    name: '',
    profilePhoto: '',
    phone: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    employeeId: '',
    role: '',
    department: '',
    employmentType: defaultEmploymentType || 'Full Time',
    joiningDate: new Date().toISOString().slice(0, 10),
    status: 'active',
    reportingManagerId: '',
    attendanceMode: 'Office',
    shift: 'General Shift',
    inTime: '09:30 AM',
    outTime: '07:30 PM',
    weeklyOff: 'Sunday',
    lunchTime: '30 Mins',
    attendanceRequired: true,
    payType: 'monthly',
    monthlySalary: '45000',
    dailyRate: '2500',
    skills: '',
    softwares: [],
    accessRoleId: '',
    password: '',
  };
}

function formFromMember(member: TeamMember): FormState {
  return {
    name: member.name || '',
    profilePhoto: member.profilePhoto || '',
    phone: member.phone || member.mobile || '',
    email: member.email || '',
    gender: member.gender || '',
    dateOfBirth: member.dateOfBirth || '',
    address: member.address || '',
    emergencyContact: member.emergencyContact || '',
    employeeId: member.employeeId || '',
    role: String(member.role || ''),
    department: member.department || '',
    employmentType: member.employmentType || 'Full Time',
    joiningDate: member.joiningDate || '',
    status: member.status || 'active',
    reportingManagerId: member.reportingManagerId || '',
    attendanceMode: member.attendanceMode || 'Office',
    shift: member.shift || 'General Shift',
    inTime: member.inTime || '09:30 AM',
    outTime: member.outTime || '07:30 PM',
    weeklyOff: member.weeklyOff || 'Sunday',
    lunchTime: member.lunchTime || '30 Mins',
    attendanceRequired: member.attendanceRequired !== false,
    payType: member.payType || 'monthly',
    monthlySalary: String(member.monthlySalary ?? 45000),
    dailyRate: String(member.dailyRate ?? 2500),
    skills: (member.skills || []).join(', '),
    softwares: member.assignedSoftwares || (member.assignedSoftware ? [member.assignedSoftware] : []),
    accessRoleId: member.accessRoleId || '',
    password: '',
  };
}

export const TeamMemberFormModal: React.FC<Props> = ({
  isOpen,
  member,
  team,
  softwareOptions,
  onSave,
  onClose,
  defaultEmploymentType,
  accessRoles = [],
  accessPermissions = [],
}) => {
  const { showToast } = useToast();
  const isEdit = !!member;
  // This selector intentionally shows reusable templates only. Employee
  // specific roles remain visible in Individual Access on the roles desk.
  const assignable = useMemo(
    () => assignableRoles(accessRoles),
    [accessRoles],
  );
  const matchingRoles = assignable;
  const [form, setForm] = useState<FormState>(() => emptyForm(defaultEmploymentType));
  const [softwareInput, setSoftwareInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm(member ? formFromMember(member) : emptyForm(defaultEmploymentType));
    setSoftwareInput('');
    setPasswordError('');
    setIsPasswordVisible(false);
    // Re-seeding only when the modal opens keeps in-progress edits from being
    // wiped by unrelated roster updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, member?.id]);

  if (!isOpen) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedAccessRole = accessRoles.find((role) => role.id === form.accessRoleId) || null;
  // One role field only: the access role is both the roster job title and the
  // permission set, so the two can never drift apart. An existing member keeps
  // their stored title until a role is picked.
  const effectiveRole = selectedAccessRole?.name || form.role;
  const rolePreview = rolePermissionPreview(selectedAccessRole, accessPermissions);

  const handlePhotoUpload = (file?: File | null) => {
    if (!file) return;
    if (file.size > 2_000_000) {
      showToast('Profile photo must be under 2 MB.', { variant: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('profilePhoto', String(reader.result || ''));
    reader.onerror = () => showToast('Could not read that image file.', { variant: 'error' });
    reader.readAsDataURL(file);
  };

  const addSoftware = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || form.softwares.includes(trimmed)) return;
    set('softwares', [...form.softwares, trimmed]);
    setSoftwareInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Full name is required.', { variant: 'error' });
      return;
    }
    const phoneError = indianMobileError(form.phone, false);
    if (phoneError) {
      showToast(phoneError, { variant: 'error' });
      return;
    }
    if (!effectiveRole) {
      showToast('Pick the employee\u2019s role.', { variant: 'error' });
      return;
    }
    // A profile change must never silently retain an old role. Existing
    // legacy/personal roles are excluded from `matchingRoles`, so editing one
    // requires explicitly selecting an approved fixed role.
    if (isEdit && !matchingRoles.some((role) => role.id === form.accessRoleId)) {
      showToast('Select one of the approved fixed roles before saving this employee.', { variant: 'error' });
      return;
    }
    if (!isEdit && !form.email.trim()) {
      showToast('Email is required to create a studio login.', { variant: 'error' });
      return;
    }
    if (!isEdit && !isValidPassword(form.password)) {
      setPasswordError(passwordValidationMessage(form.password));
      return;
    }
    if (!isEdit && !form.accessRoleId) {
      showToast('Select the employee\u2019s role before creating their login.', { variant: 'error' });
      return;
    }

    // Guard against creating the same person twice — historical attendance is
    // matched by name, so duplicates corrupt every report downstream.
    const duplicate = team.find(
      (m) =>
        m.id !== member?.id &&
        m.name.trim().toLowerCase() === form.name.trim().toLowerCase()
    );
    if (duplicate) {
      showToast(`"${duplicate.name}" is already on the roster (${duplicate.role}).`, { variant: 'error' });
      return;
    }

    const monthlySalary = Number(form.monthlySalary) || 0;
    const dailyRate = Number(form.dailyRate) || 0;

    const saved: TeamMember = {
      // Preserve every field the CRM already stores on this member (software
      // monitoring counters, task counts, work status, documents…).
      ...(member || {}),
      id: member?.id || `team-${Date.now()}`,
      name: form.name.trim(),
      role: effectiveRole,
      phone: form.phone.trim(),
      mobile: form.phone.trim() || member?.mobile,
      email: form.email.trim(),
      profilePhoto: form.profilePhoto || undefined,
      gender: form.gender || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      address: form.address.trim() || undefined,
      emergencyContact: form.emergencyContact.trim() || undefined,
      employeeId: form.employeeId.trim() || member?.employeeId,
      department: form.department || getDepartmentForRole(effectiveRole),
      employmentType: form.employmentType,
      joiningDate: form.joiningDate || undefined,
      status: form.status,
      reportingManagerId: form.reportingManagerId || undefined,
      reportingManager: team.find((m) => m.id === form.reportingManagerId)?.name,
      attendanceMode: form.attendanceMode,
      shift: form.shift.trim() || undefined,
      attendanceRequired: form.attendanceRequired,
      inTime: form.inTime,
      outTime: form.outTime,
      weeklyOff: form.weeklyOff,
      lunchTime: form.lunchTime,
      payType: form.payType,
      monthlySalary: form.payType === 'monthly' ? monthlySalary : member?.monthlySalary ?? 0,
      dailyRate: form.payType === 'daily' ? dailyRate : Math.round(monthlySalary / 26),
      skills: form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      assignedSoftwares: form.softwares,
      assignedSoftware: form.softwares[0] || member?.assignedSoftware,
      accessRoleId: form.accessRoleId || undefined,
      currentSoftware: member?.currentSoftware || form.softwares[0],
      workStatus: member?.workStatus || 'IDLE',
      activeTasksCount: member?.activeTasksCount ?? 0,
      completedTasksCount: member?.completedTasksCount ?? 0,
    };

    setIsSubmitting(true);
    try {
      await onSave(saved, isEdit ? 'update' : 'create', isEdit ? undefined : form.password);
    } catch {
      // The API-specific error has already been presented by the parent.
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleId = 'team-member-form-title';

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledBy={titleId} widthClass="max-w-3xl">
      <ModalHero
        icon={UserRound}
        eyebrow="Studio Workforce Intake"
        title={isEdit ? `Edit ${member?.name}` : 'Add Team Member'}
        description={
          isEdit
            ? `Employee ID ${getEmployeeCode(member!)} · attendance history stays linked`
            : 'Creates the roster record plus a studio login account'
        }
        onClose={onClose}
        labelledBy={titleId}
      />

      <form onSubmit={handleSubmit} className="p-5 space-y-6">
        {/* ---------------- Basic information ---------------- */}
        <fieldset className="space-y-3">
          <legend className="flex items-center gap-1.5 text-sm font-black uppercase tracking-[.1em] text-[#254b42]">
            <IdCard className="w-4 h-4 text-[#2f5f54]" /> Basic information
          </legend>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex flex-col items-center gap-2">
              <Avatar member={{ id: member?.id || 'new', name: form.name || 'New Member', profilePhoto: form.profilePhoto }} size="xl" />
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
              />
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => photoInputRef.current?.click()} className={`${BTN_GHOST} !px-2.5 !py-1.5`}>
                  <Camera className="w-3.5 h-3.5" /> Photo
                </button>
                {form.profilePhoto && (
                  <button
                    type="button"
                    onClick={() => set('profilePhoto', '')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="tm-name">Full name *</label>
                <input id="tm-name" className={FIELD} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Rahul Sharma" required />
              </div>
              <div>
                <label className={LABEL} htmlFor="tm-phone">Phone</label>
                <input id="tm-phone" type="tel" inputMode="numeric" maxLength={10} className={FIELD} value={form.phone} onChange={(e) => set('phone', nextIndianMobileValue(e.target.value, form.phone))} placeholder="9876543210" />
              </div>
              <div>
                <label className={LABEL} htmlFor="tm-email">Email</label>
                <input id="tm-email" type="email" className={FIELD} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={`name@${BRAND.domain}`} />
              </div>
              {!isEdit && (
                <div className="sm:col-span-2">
                  <label className={LABEL} htmlFor="tm-password">Temporary password *</label>
                  <div className="relative">
                    <input
                      id="tm-password"
                      type={isPasswordVisible ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={10}
                      aria-invalid={Boolean(passwordError)}
                      aria-describedby="tm-password-help"
                      className={`${FIELD} pr-11 ${passwordError ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''}`}
                      value={form.password}
                      onChange={(e) => {
                        const password = e.target.value;
                        set('password', password);
                        setPasswordError(password && !isValidPassword(password) ? passwordValidationMessage(password) : '');
                      }}
                      placeholder="At least 10 characters: Aa1…"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsPasswordVisible((visible) => !visible)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-[#2f5f54]"
                      aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                      title={isPasswordVisible ? 'Hide password' : 'Show password'}
                    >
                      {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p id="tm-password-help" className={`mt-1 text-[11px] font-medium ${passwordError ? 'text-red-600' : 'text-slate-500'}`}>
                    {passwordError || 'Use at least 10 characters with uppercase, lowercase, and a digit.'}
                  </p>
                </div>
              )}
              <div>
                <label className={LABEL} htmlFor="tm-gender">Gender</label>
                <select id="tm-gender" className={FIELD} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                  <option value="">Not specified</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="tm-dob">Date of birth</label>
                <input id="tm-dob" type="date" className={FIELD} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="tm-address">Address</label>
                <input id="tm-address" className={FIELD} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="City, area, landmark" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="tm-emergency">Emergency contact</label>
                <input id="tm-emergency" className={FIELD} value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="Name & number" />
              </div>
            </div>
          </div>
        </fieldset>

        {/* ---------------- Professional ---------------- */}
        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className="flex items-center gap-1.5 text-sm font-black uppercase tracking-[.1em] text-[#254b42]">
            <Building2 className="w-4 h-4 text-[#2f5f54]" /> Professional information
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={LABEL} htmlFor="tm-empid">Employee ID</label>
              <input
                id="tm-empid"
                className={FIELD}
                value={form.employeeId}
                onChange={(e) => set('employeeId', e.target.value)}
                placeholder={member ? getEmployeeCode(member) : 'Auto-generated'}
              />
            </div>

            <div>
              <label className={LABEL} htmlFor="tm-role">Role *</label>
              <select
                id="tm-role"
                className={FIELD}
                value={form.accessRoleId}
                required={!isEdit}
                disabled={!isEdit && assignable.length === 0}
                onChange={(e) => set('accessRoleId', e.target.value)}
              >
                <option value="">
                  {accessRoles.length === 0
                    ? 'Loading roles…'
                    : assignable.length === 0
                      ? 'No roles you are allowed to assign'
                      : 'Select a role'}
                </option>
                {matchingRoles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>

              {selectedAccessRole && (
                <div className="mt-2 rounded-xl border border-[#ddeae7] bg-[#fbfcfc] px-3 py-2.5">
                  <p className="text-sm font-extrabold text-slate-800">
                    Access included with {selectedAccessRole.name}
                  </p>
                  {selectedAccessRole.description && (
                    <p className="text-[11px] font-medium text-slate-500">{selectedAccessRole.description}</p>
                  )}
                  {rolePreview.length === 0 ? (
                    <p className="mt-1 text-xs font-medium text-slate-500">No module access is configured for this role.</p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {rolePreview.length} access areas · {rolePreview.reduce((total, entry) => total + entry.count, 0)} permissions
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className={LABEL} htmlFor="tm-dept">Department</label>
              <select id="tm-dept" className={FIELD} value={form.department} onChange={(e) => set('department', e.target.value)}>
                <option value="">Auto ({getDepartmentForRole(effectiveRole)})</option>
                {TEAM_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL} htmlFor="tm-emptype">Employment type</label>
              <select id="tm-emptype" className={FIELD} value={form.employmentType} onChange={(e) => set('employmentType', e.target.value as EmploymentType)}>
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL} htmlFor="tm-joining">Joining date</label>
              <input id="tm-joining" type="date" className={FIELD} value={form.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} />
            </div>

            <div>
              <label className={LABEL} htmlFor="tm-status">Status</label>
              <select id="tm-status" className={FIELD} value={form.status} onChange={(e) => set('status', e.target.value as TeamMemberStatus)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className={LABEL} htmlFor="tm-manager">Reporting manager</label>
              <select id="tm-manager" className={FIELD} value={form.reportingManagerId} onChange={(e) => set('reportingManagerId', e.target.value)}>
                <option value="">None</option>
                {team
                  .filter((m) => m.id !== member?.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
                  ))}
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className={LABEL} htmlFor="tm-skills">Skills (comma separated)</label>
              <input id="tm-skills" className={FIELD} value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="Candid, Drone, Colour grading" />
            </div>
          </div>
        </fieldset>

        {/* ---------------- Attendance settings ---------------- */}
        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className="flex items-center gap-1.5 text-sm font-black uppercase tracking-[.1em] text-[#254b42]">
            <CalendarDays className="w-4 h-4 text-[#2f5f54]" /> Attendance settings
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className={LABEL} htmlFor="tm-mode">Work mode</label>
              <select id="tm-mode" className={FIELD} value={form.attendanceMode} onChange={(e) => set('attendanceMode', e.target.value as FormState['attendanceMode'])}>
                <option value="Office">Office</option>
                <option value="WFH">Remote / WFH</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Field">Field / On Shoot</option>
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="tm-shift">Shift</label>
              <input id="tm-shift" className={FIELD} value={form.shift} onChange={(e) => set('shift', e.target.value)} placeholder="General Shift" />
            </div>
            <div>
              <label className={LABEL} htmlFor="tm-weeklyoff">Weekly off</label>
              <select id="tm-weeklyoff" className={FIELD} value={form.weeklyOff} onChange={(e) => set('weeklyOff', e.target.value)}>
                <option value="">None</option>
                {WEEK_DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="tm-intime">Shift in-time</label>
              <input id="tm-intime" className={FIELD} value={form.inTime} onChange={(e) => set('inTime', e.target.value)} placeholder="09:30 AM" />
            </div>
            <div>
              <label className={LABEL} htmlFor="tm-outtime">Shift out-time</label>
              <input id="tm-outtime" className={FIELD} value={form.outTime} onChange={(e) => set('outTime', e.target.value)} placeholder="07:30 PM" />
            </div>
            <div>
              <label className={LABEL} htmlFor="tm-lunch">Lunch break</label>
              <input id="tm-lunch" className={FIELD} value={form.lunchTime} onChange={(e) => set('lunchTime', e.target.value)} placeholder="30 Mins" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.attendanceRequired}
              onChange={(e) => set('attendanceRequired', e.target.checked)}
              className="size-4 rounded border-slate-300 text-[#2f5f54] focus:ring-[#366e61]"
            />
            Daily attendance required
            <span className="font-medium text-slate-500">— turn off for crew tracked only through shoot assignments</span>
          </label>
        </fieldset>

        {/* ---------------- Pay ---------------- */}
        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Pay structure</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={LABEL} htmlFor="tm-paytype">Pay type</label>
              <select id="tm-paytype" className={FIELD} value={form.payType} onChange={(e) => set('payType', e.target.value as 'monthly' | 'daily')}>
                <option value="monthly">Monthly salary</option>
                <option value="daily">Daily / per shoot rate</option>
              </select>
            </div>
            {form.payType === 'monthly' ? (
              <div>
                <label className={LABEL} htmlFor="tm-salary">Monthly salary (₹)</label>
                <input id="tm-salary" type="number" min={0} className={FIELD} value={form.monthlySalary} onChange={(e) => set('monthlySalary', e.target.value)} />
              </div>
            ) : (
              <div>
                <label className={LABEL} htmlFor="tm-rate">Daily rate (₹)</label>
                <input id="tm-rate" type="number" min={0} className={FIELD} value={form.dailyRate} onChange={(e) => set('dailyRate', e.target.value)} />
              </div>
            )}
          </div>
        </fieldset>

        {/* ---------------- Permitted software (existing guard system) ---------------- */}
        <fieldset className="space-y-3 border-t border-slate-100 pt-5">
          <legend className="flex items-center gap-1.5 text-sm font-black uppercase tracking-[.1em] text-[#254b42]">
            <ShieldCheck className="w-4 h-4 text-[#2f5f54]" /> Permitted software ({form.softwares.length})
          </legend>

          {form.softwares.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.softwares.map((sw) => (
                <span key={sw} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-[#253d37] border border-rose-200">
                  <span className="truncate max-w-[180px]">{sw}</span>
                  <button
                    type="button"
                    onClick={() => set('softwares', form.softwares.filter((s) => s !== sw))}
                    className="w-4 h-4 rounded-full bg-rose-100 hover:bg-red-500 hover:text-white text-[#2f5f54] flex items-center justify-center transition cursor-pointer"
                    aria-label={`Remove ${sw}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              className={FIELD}
              value={softwareInput}
              onChange={(e) => setSoftwareInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSoftware(softwareInput);
                }
              }}
              placeholder="Add software and press Enter…"
            />
            <button type="button" onClick={() => addSoftware(softwareInput)} className={BTN_GHOST}>Add</button>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Quick add:</span>
            {softwareOptions
              .filter((opt) => !form.softwares.includes(opt))
              .slice(0, 7)
              .map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => addSoftware(opt)}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-rose-50 hover:text-[#254b42] hover:border-rose-300 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200 transition cursor-pointer"
                >
                  + {opt.split('(')[0].trim()}
                </button>
              ))}
          </div>
        </fieldset>

        <footer className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-end gap-2 border-t border-[#eee7e2] bg-white px-5 py-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className={BTN_GHOST}>Cancel</button>
          <button type="submit" disabled={isSubmitting} className={BTN_PRIMARY}>
            <Save className="w-4 h-4" />
            {isSubmitting ? (isEdit ? 'Saving…' : 'Creating employee…') : (isEdit ? 'Save changes' : 'Add team member')}
          </button>
        </footer>
      </form>
    </Modal>
  );
};
