'use client';

/**
 * Shoot workforce assignment.
 *
 * Crew is written back into the existing `Project.shoots[].crewAssignments`
 * array — the same structure the Projects and Shoots modules already read — so
 * nothing here creates a parallel assignment store. Before a member is added,
 * their other bookings for that date are checked and a double-booking warning
 * must be acknowledged explicitly.
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CalendarDays,
  MapPin,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  AttendanceRecord,
  CrewMemberAssignment,
  LeaveRequest,
  Project,
  ShootEvent,
  TeamMember,
} from '@/types';
import { useToast } from '@/components/common';
import { usePermission } from '@/features/access';
import {
  Avatar,
  BTN_GHOST,
  BTN_PRIMARY,
  Badge,
  CARD,
  EmptyState,
  FIELD,
  LABEL,
  Modal,
  RoleIcon,
} from './TeamUiKit';
import {
  CREW_ROLE_SLOTS,
  MemberShootAssignment,
  findBookingConflicts,
  formatDayLabel,
  formatLongDate,
  getAllShoots,
  getAvailability,
  getMemberPhone,
  memberHasRoleOnShoot,
  getTodayDateString,
  isActiveMember,
  toDateKey,
} from '../teamDomain';

interface Props {
  team: TeamMember[];
  projects: Project[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  onUpdateProject: (project: Project) => void;
  /** Set when the manager clicked "Assign shoot" on a specific member. */
  focusMember: TeamMember | null;
  onClearFocusMember: () => void;
  onOpenProfile: (member: TeamMember) => void;
}

type ShootFilter = 'upcoming' | 'past' | 'all';

export const ShootAssignmentView: React.FC<Props> = ({
  team,
  projects,
  attendance,
  leaves,
  onUpdateProject,
  focusMember,
  onClearFocusMember,
  onOpenProfile,
}) => {
  const { can } = usePermission();
  const canAssign =
    can('shoots.assign_photographer') ||
    can('shoots.assign_cinematographer') ||
    can('shoots.assign_freelancer');
  const today = getTodayDateString();
  const [filter, setFilter] = useState<ShootFilter>('upcoming');
  const [search, setSearch] = useState('');
  const [openShootKey, setOpenShootKey] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ project: Project; shoot: ShootEvent; role: string } | null>(null);

  const shoots = useMemo(() => {
    const all = getAllShoots(projects);
    return all
      .filter(({ shoot }) => {
        const date = toDateKey(shoot.date);
        if (filter === 'upcoming') return date >= today;
        if (filter === 'past') return date < today;
        return true;
      })
      .filter(({ project, shoot }) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [shoot.title, shoot.venue, shoot.location, project.clientWeddingTitle]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a, b) =>
        filter === 'past'
          ? toDateKey(b.shoot.date).localeCompare(toDateKey(a.shoot.date))
          : toDateKey(a.shoot.date).localeCompare(toDateKey(b.shoot.date))
      );
  }, [projects, filter, search, today]);

  /** Writes a modified shoot back into its project. */
  const saveShoot = (project: Project, shoot: ShootEvent) => {
    onUpdateProject({
      ...project,
      shoots: (project.shoots || []).map((s) => (s.id === shoot.id ? shoot : s)),
    });
  };

  const addCrew = (project: Project, shoot: ShootEvent, member: TeamMember, role: string) => {
    if (!canAssign) return;
    const crew: CrewMemberAssignment = {
      id: `crew-${member.id}-${role}`,
      userId: member.id,
      name: member.name,
      role,
      mobile: getMemberPhone(member) || undefined,
    };
    const existing = (shoot.crewAssignments || []).filter((c) => !(
      (c.id === member.id || c.userId === member.id) && c.role.toLowerCase() === role.toLowerCase()
    ));
    saveShoot(project, { ...shoot, crewAssignments: [...existing, crew] });
  };

  const removeCrew = (project: Project, shoot: ShootEvent, crewId: string, role: string) => {
    if (!canAssign) return;
    saveShoot(project, {
      ...shoot,
      crewAssignments: (shoot.crewAssignments || []).filter((c) => !(c.id === crewId && c.role === role)),
    });
  };

  return (
    <div className="space-y-5">
      {focusMember && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-[#30342E] flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Assigning <strong>{focusMember.name}</strong> ({focusMember.role}) — open a shoot below and add them to a crew slot.
          </p>
          <button type="button" onClick={onClearFocusMember} className="p-1 rounded-lg text-[#50574D] hover:bg-rose-100 cursor-pointer" aria-label="Clear focus member">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className={`${CARD} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className={`${FIELD} pl-9`}
            placeholder="Search shoots by name, client or venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search shoots"
          />
        </div>
        <div className="flex items-center rounded-xl border border-[#e2d9d3] bg-[#f6f1ee] p-1">
          {(['upcoming', 'past', 'all'] as ShootFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                filter === f ? 'border border-[#DBF1AE]/80 bg-white text-[#373B35] shadow-sm' : 'text-slate-600 hover:text-[#373B35]'
              }`}
              aria-pressed={filter === f}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {shoots.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={Camera}
            title={filter === 'upcoming' ? 'No upcoming shoots' : 'No shoots found'}
            message="Shoots are scheduled from the Projects and Shoot Management modules — they appear here for crew assignment."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {shoots.map(({ project, shoot }) => {
            const key = `${project.id}::${shoot.id}`;
            const isOpen = openShootKey === key;
            const dateKey = toDateKey(shoot.date);
            const crew = shoot.crewAssignments || [];
            const isCancelled = shoot.status === 'cancelled';

            return (
              <section key={key} className={`${CARD} overflow-hidden ${isCancelled ? 'opacity-70' : ''}`}>
                <button
                  type="button"
                  onClick={() => setOpenShootKey(isOpen ? null : key)}
                  className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900 truncate flex items-center gap-2">
                      {shoot.title || 'Shoot'}
                      {isCancelled && <Badge className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>}
                      {dateKey === today && <Badge className="bg-rose-100 text-[#373B35] border-rose-200">Today</Badge>}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500 truncate">{project.clientWeddingTitle}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-600">
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-slate-400" />{formatDayLabel(dateKey)}{shoot.time ? ` · ${shoot.time}` : ''}</span>
                    <span className="inline-flex items-center gap-1 truncate max-w-[220px]"><MapPin className="w-3.5 h-3.5 text-slate-400" />{shoot.venue || shoot.location || 'Venue TBD'}</span>
                    <Badge className={crew.length ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                      {crew.length ? `${crew.length} crew` : 'No crew assigned'}
                    </Badge>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/40">
                    {/* Existing crew */}
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Assigned crew</h4>
                      {crew.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium italic">Nobody assigned yet — pick a crew slot below.</p>
                      ) : (
                        <ul className="flex flex-wrap gap-2">
                          {crew.map((c, idx) => {
                            const member = team.find((m) => m.id === c.id || m.id === c.userId || m.name.trim().toLowerCase() === (c.name || '').trim().toLowerCase());
                            const conflicts = member ? findBookingConflicts(member, dateKey, projects, shoot.id, project.id) : [];
                            return (
                              <li
                                key={`${c.id}-${c.role}-${idx}`}
                                className={`flex items-center gap-2 rounded-xl border bg-white px-2.5 py-1.5 ${
                                  conflicts.length ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                                }`}
                              >
                                {member ? <Avatar member={member} size="sm" /> : (
                                  <span className="grid size-8 place-items-center rounded-full bg-rose-50 text-[#464B43]"><RoleIcon role={c.role} className="size-4" /></span>
                                )}
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => member && onOpenProfile(member)}
                                    disabled={!member}
                                    className={`text-xs font-extrabold text-slate-900 truncate max-w-[140px] block text-left ${member ? 'hover:text-[#464B43] cursor-pointer' : 'cursor-default'}`}
                                  >
                                    {c.name || 'Unnamed'}
                                  </button>
                                  <p className="text-[10px] font-bold text-slate-400 truncate">
                                    {c.role}
                                    {!member && <span className="ml-1 text-amber-600">· external</span>}
                                  </p>
                                </div>
                                {conflicts.length > 0 && (
                                  <span title={`Also booked: ${conflicts.map((x) => x.shootTitle).join(', ')}`}>
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  </span>
                                )}
                                {canAssign && (
                                <button
                                  type="button"
                                  onClick={() => removeCrew(project, shoot, c.id, c.role)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                  aria-label={`Remove ${c.name} from ${c.role}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Required crew slots */}
                    <div>
                      <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Required crew</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {CREW_ROLE_SLOTS.map((role) => {
                          const filled = crew.filter((c) => (c.role || '').toLowerCase().includes(role.toLowerCase().split(' ')[0]));
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => { if (canAssign) setPicker({ project, shoot, role }); }}
                              disabled={!canAssign}
                              className={`rounded-xl border border-slate-200 bg-white p-2.5 text-left ${canAssign ? 'hover:border-rose-300 hover:shadow-sm cursor-pointer' : 'opacity-70 cursor-default'} transition`}
                            >
                              <p className="flex items-center gap-1 truncate text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                <RoleIcon role={role} className="size-3.5 text-[#464B43]" /> {role}
                              </p>
                              <p className={`text-xs font-black mt-0.5 ${filled.length ? 'text-emerald-700' : 'text-slate-400'}`}>
                                {filled.length ? `${filled.length} assigned` : 'Select…'}
                              </p>
                              {canAssign && (
                              <p className="text-[10px] font-bold text-[#464B43] mt-1 inline-flex items-center gap-0.5">
                                <Plus className="w-3 h-3" /> Add crew
                              </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {picker && canAssign && (
        <CrewPickerModal
          project={picker.project}
          shoot={picker.shoot}
          role={picker.role}
          team={team}
          projects={projects}
          attendance={attendance}
          leaves={leaves}
          preselectMemberId={focusMember?.id}
          onAssign={(member) => {
            addCrew(picker.project, picker.shoot, member, picker.role);
            setPicker(null);
            if (focusMember?.id === member.id) onClearFocusMember();
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------

const CrewPickerModal: React.FC<{
  project: Project;
  shoot: ShootEvent;
  role: string;
  team: TeamMember[];
  projects: Project[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  preselectMemberId?: string;
  onAssign: (member: TeamMember) => void;
  onClose: () => void;
}> = ({ project, shoot, role, team, projects, attendance, leaves, preselectMemberId, onAssign, onClose }) => {
  const { showToast } = useToast();
  const dateKey = toDateKey(shoot.date);
  const [search, setSearch] = useState('');
  const [confirming, setConfirming] = useState<{ member: TeamMember; conflicts: MemberShootAssignment[] } | null>(null);

  const candidates = useMemo(() => {
    const roleWord = role.toLowerCase().split(' ')[0];
    return team
      .filter(isActiveMember)
      .filter((m) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return m.name.toLowerCase().includes(q) || String(m.role).toLowerCase().includes(q);
      })
      .map((member) => ({
        member,
        availability: getAvailability(member, dateKey, attendance, projects, leaves),
        conflicts: findBookingConflicts(member, dateKey, projects, shoot.id, project.id),
        alreadyOnThisShoot: memberHasRoleOnShoot(shoot, member, role),
        roleMatch: String(member.role).toLowerCase().includes(roleWord),
      }))
      .sort((a, b) => {
        // Best fit first: right role, then free, then everyone else.
        if (a.roleMatch !== b.roleMatch) return a.roleMatch ? -1 : 1;
        if (a.conflicts.length !== b.conflicts.length) return a.conflicts.length - b.conflicts.length;
        return a.member.name.localeCompare(b.member.name);
      });
  }, [team, search, dateKey, attendance, projects, leaves, shoot, role]);

  const attempt = (member: TeamMember, conflicts: MemberShootAssignment[]) => {
    if (conflicts.length) {
      setConfirming({ member, conflicts });
      return;
    }
    onAssign(member);
    showToast(`${member.name} assigned as ${role} for ${shoot.title}.`);
  };

  const titleId = 'crew-picker-title';

  return (
    <Modal isOpen onClose={onClose} labelledBy={titleId} widthClass="max-w-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 id={titleId} className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#464B43]" /> Assign {role}
          </h3>
          <p className="text-[11px] font-semibold text-slate-500">
            {shoot.title} · {project.clientWeddingTitle} · {formatLongDate(dateKey)}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="p-5 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${FIELD} pl-9`} placeholder="Search team members…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search members" />
        </div>

        {candidates.length === 0 ? (
          <EmptyState icon={Users} title="No matching team members" message="Try a different search, or add the person to your roster first." />
        ) : (
          <ul className="divide-y divide-slate-100 max-h-[52vh] overflow-y-auto -mx-1 px-1">
            {candidates.map(({ member, availability, conflicts, alreadyOnThisShoot, roleMatch }) => (
              <li
                key={member.id}
                className={`flex items-center gap-3 py-2.5 ${preselectMemberId === member.id ? 'bg-rose-50/60 rounded-xl px-2' : ''}`}
              >
                <Avatar member={member} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-slate-900 truncate">
                    {member.name}
                    {roleMatch && <Badge className="ml-1.5 bg-rose-100 text-[#373B35] border-rose-200">Role match</Badge>}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">{member.role}</p>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">{availability.reason}</p>
                </div>

                <Badge className={availability.badgeClass}>{availability.status}</Badge>

                {alreadyOnThisShoot ? (
                  <Badge className="bg-slate-100 text-slate-600 border-slate-200">On this shoot</Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => attempt(member, conflicts)}
                    className={conflicts.length ? `${BTN_GHOST} border-amber-300 text-amber-800 hover:bg-amber-50` : BTN_PRIMARY}
                  >
                    {conflicts.length ? <AlertTriangle className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {conflicts.length ? 'Booked' : 'Assign'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Double-booking confirmation */}
      {confirming && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 p-4 rounded-2xl">
          <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex-shrink-0">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <h4 className="text-sm font-black text-slate-900">This team member is already assigned to another shoot on this date.</h4>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  {confirming.member.name} · {formatLongDate(dateKey)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {confirming.conflicts.map((c) => (
                <div key={`${c.shootId}-${c.date}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] space-y-0.5">
                  <p className="font-extrabold text-slate-900">Existing assignment: {c.shootTitle}</p>
                  <p className="font-semibold text-slate-600">{c.projectName}</p>
                  <p className="font-semibold text-slate-600">Date: {formatDayLabel(c.date)}</p>
                  <p className="font-semibold text-slate-600">Location: {c.location || c.venue || 'TBD'}</p>
                  <p className="font-semibold text-slate-600">Booked as: {c.role}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setConfirming(null)} className={BTN_GHOST}>Cancel</button>
              <button
                type="button"
                onClick={() => {
                  onAssign(confirming.member);
                  showToast(`${confirming.member.name} double-booked on ${formatDayLabel(dateKey)} — override confirmed.`, { variant: 'error' });
                  setConfirming(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                Assign anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
