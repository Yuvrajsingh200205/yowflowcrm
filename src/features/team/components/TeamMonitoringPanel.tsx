'use client';

/**
 * Studio software-guard monitoring & the drag-to-reorder roster cards.
 *
 * This is the original Team Roster surface, preserved as its own component so
 * the redesigned Team & Attendance module can keep every existing behaviour:
 * per-member permitted-software tagging, the unauthorised-app alert and
 * auto-logout flow, the PIN unlock, live work status, clock-out, and manual
 * card ordering.
 */

import React, { useState } from 'react';
import { TeamMember } from '@/types';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  GripVertical,
  Lock,
  Mail,
  Phone,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { getAvatarStyle, getInitials } from '../teamDomain';

export const UNAUTHORIZED_APPS_SIMULATION = [
  'Google Chrome / YouTube Shorts',
  'Instagram Web / Social Media',
  'Steam / PC Games',
  'Netflix / Video Streaming',
  'Telegram / Personal Chat App',
];

interface MemberSoftwareManagerProps {
  member: TeamMember;
  getPermittedSoftwares: (m: TeamMember) => string[];
  onAddSoftware: (member: TeamMember, software: string) => void;
  onRemoveSoftware: (member: TeamMember, software: string) => void;
}

const MemberSoftwareManager: React.FC<MemberSoftwareManagerProps> = ({
  member,
  getPermittedSoftwares,
  onAddSoftware,
  onRemoveSoftware,
}) => {
  const [customInput, setCustomInput] = useState('');
  const permitted = getPermittedSoftwares(member);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onAddSoftware(member, customInput.trim());
      setCustomInput('');
    }
  };

  const commonPresets = [
    'Adobe Premiere Pro',
    'DaVinci Resolve',
    'Adobe Photoshop',
    'Adobe Lightroom',
    'After Effects',
    'Final Cut Pro',
  ];

  return (
    <div className="space-y-2 pt-1.5 border-t border-slate-200/60">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
          Permitted Softwares ({permitted.length}):
        </label>
        <span className="text-[10px] font-bold text-[#8f3655] bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
          Manual Tagging
        </span>
      </div>

      {/* Currently Permitted Software Badges */}
      {permitted.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          {permitted.map((sw) => (
            <span
              key={sw}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-[#55333f] border border-rose-200 shadow-2xs"
            >
              <span className="truncate max-w-[150px]">{sw}</span>
              <button
                type="button"
                onClick={() => onRemoveSoftware(member, sw)}
                className="w-4 h-4 rounded-full bg-rose-100 hover:bg-red-500 hover:text-white text-[#8f3655] flex items-center justify-center transition"
                title={`Remove ${sw}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-center text-[11px] text-slate-400 font-medium italic">
          No software permitted yet. Type name below to grant access.
        </div>
      )}

      {/* Manual Add Input Box */}
      <form onSubmit={handleAdd} className="flex items-center gap-1.5 pt-0.5">
        <input
          type="text"
          placeholder="Add software (e.g. Premiere Pro)..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#9b4865] focus:outline-hidden placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-[#8f3655] hover:bg-[#6d2f45] text-white font-bold text-xs flex items-center gap-1 transition shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {/* Quick Suggestions Pills */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Quick Add:</span>
        {commonPresets.map((preset) => {
          const isAlreadyAdded = permitted.some((p) => p.toLowerCase().includes(preset.toLowerCase()));
          if (isAlreadyAdded) return null;

          return (
            <button
              key={preset}
              type="button"
              onClick={() => onAddSoftware(member, preset)}
              className="text-[10px] font-semibold bg-slate-100 hover:bg-rose-50 hover:text-[#6d2f45] hover:border-rose-300 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200 transition"
            >
              + {preset}
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface TeamMonitoringPanelProps {
  team: TeamMember[];
  softwareOptions: string[];
  onUpdateTeamMember?: (member: TeamMember) => void;
  onReorderTeam?: (team: TeamMember[]) => void;
  onDeleteTeamMember?: (memberId: string) => void;
  onOpenMember: (member: TeamMember) => void;
  onEditMember?: (member: TeamMember) => void;
  /** Renders only the alert banners — used at the top of the module shell. */
  bannersOnly?: boolean;
  /** Renders only the roster cards grid (no guard panel / banners). */
  cardsOnly?: boolean;
}

export const TeamMonitoringPanel: React.FC<TeamMonitoringPanelProps> = ({
  team,
  softwareOptions,
  onUpdateTeamMember,
  onReorderTeam,
  onDeleteTeamMember,
  onOpenMember,
  onEditMember,
  bannersOnly = false,
  cardsOnly = false,
}) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [pickedMemberIdx, setPickedMemberIdx] = useState<number | null>(null);

  const [selectedSimMemberId, setSelectedSimMemberId] = useState<string>(team[0]?.id || '');
  const [simAppChoice, setSimAppChoice] = useState<string>(UNAUTHORIZED_APPS_SIMULATION[0]);
  const [simMinutes, setSimMinutes] = useState<number>(7);

  const [unlockMember, setUnlockMember] = useState<TeamMember | null>(null);
  const [unlockPin, setUnlockPin] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  const alertingMembers = team.filter((m) => (m.unauthorizedMinutes || 0) >= 5 && !m.isLoggedOut);
  const loggedOutMembers = team.filter((m) => m.isLoggedOut);

  /** Permitted software list, falling back to the legacy single-string field. */
  const getPermittedSoftwares = (member: TeamMember): string[] => {
    if (member.assignedSoftwares && member.assignedSoftwares.length > 0) return member.assignedSoftwares;
    if (member.assignedSoftware) return [member.assignedSoftware];
    return [];
  };

  const handleReorderIndices = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= team.length || toIdx >= team.length) return;
    const newTeam = [...team];
    const [moved] = newTeam.splice(fromIdx, 1);
    newTeam.splice(toIdx, 0, moved);
    onReorderTeam?.(newTeam);
  };

  const handleMoveMember = (idx: number, direction: 'prev' | 'next' | 'top' | 'bottom') => {
    let targetIdx = idx;
    if (direction === 'prev') targetIdx = idx - 1;
    else if (direction === 'next') targetIdx = idx + 1;
    else if (direction === 'top') targetIdx = 0;
    else if (direction === 'bottom') targetIdx = team.length - 1;
    handleReorderIndices(idx, targetIdx);
  };

  const handleAddPermittedSoftware = (member: TeamMember, software: string) => {
    if (!onUpdateTeamMember) return;
    const trimmed = software.trim();
    if (!trimmed) return;
    const current = getPermittedSoftwares(member);
    if (current.includes(trimmed)) return;
    const updated = [...current, trimmed];
    onUpdateTeamMember({
      ...member,
      assignedSoftwares: updated,
      assignedSoftware: updated[0] || '',
      currentSoftware: updated[0] || '',
      unauthorizedMinutes: 0,
    });
  };

  const handleRemovePermittedSoftware = (member: TeamMember, software: string) => {
    if (!onUpdateTeamMember) return;
    const updated = getPermittedSoftwares(member).filter((s) => s !== software);
    onUpdateTeamMember({
      ...member,
      assignedSoftwares: updated,
      assignedSoftware: updated[0] || '',
      currentSoftware: updated[0] || '',
      unauthorizedMinutes: 0,
    });
  };

  const handleWorkStatusChange = (member: TeamMember, newStatus: TeamMember['workStatus']) => {
    if (!onUpdateTeamMember) return;
    onUpdateTeamMember({ ...member, workStatus: newStatus, isLoggedOut: newStatus === 'LOCKED' });
  };

  const handleClockOut = (member: TeamMember) => {
    if (!onUpdateTeamMember) return;
    onUpdateTeamMember({ ...member, workStatus: 'CLOCKED_OUT' });
  };

  const handleResetMemberSoftware = (member: TeamMember) => {
    if (!onUpdateTeamMember) return;
    const list = getPermittedSoftwares(member);
    onUpdateTeamMember({
      ...member,
      currentSoftware: list[0] || softwareOptions[0],
      unauthorizedMinutes: 0,
      isLoggedOut: false,
      workStatus: 'EDITING',
    });
  };

  const handleSimulateUnauthorizedUsage = () => {
    if (!onUpdateTeamMember) return;
    const target = team.find((t) => t.id === selectedSimMemberId);
    if (!target) return;

    const permittedList = getPermittedSoftwares(target);
    const isPermitted = permittedList.some((p) => p.includes(simAppChoice) || simAppChoice.includes(p));
    if (isPermitted) {
      alert(`'${simAppChoice}' is already permitted for ${target.name} — no violation triggered.`);
      return;
    }

    const minutes = Number(simMinutes);
    const violations = (target.violationsCount || 0) + 1;
    const isAutoLogout = minutes >= 10 || violations >= 3;

    onUpdateTeamMember({
      ...target,
      currentSoftware: simAppChoice,
      unauthorizedMinutes: minutes,
      violationsCount: violations,
      isLoggedOut: isAutoLogout,
      workStatus: isAutoLogout ? 'LOCKED' : target.workStatus,
    });

    if (isAutoLogout) {
      alert(`Auto logout enforced for ${target.name}: unauthorised app limit exceeded.`);
    } else if (minutes >= 5) {
      alert(`Alert generated for ${target.name}: '${simAppChoice}' used for ${minutes} minutes.`);
    }
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockMember || !onUpdateTeamMember) return;
    if (unlockPin !== '1234' && unlockPin.trim().length < 4) {
      setUnlockError('Invalid PIN! Use 1234 or the owner password.');
      return;
    }
    const list = getPermittedSoftwares(unlockMember);
    onUpdateTeamMember({
      ...unlockMember,
      isLoggedOut: false,
      unauthorizedMinutes: 0,
      violationsCount: 0,
      currentSoftware: list[0] || softwareOptions[0],
      workStatus: 'EDITING',
    });
    alert(`${unlockMember.name}'s account has been re-authenticated and unlocked.`);
    setUnlockMember(null);
    setUnlockPin('');
    setUnlockError('');
  };

  const unlockModal = unlockMember ? (
    <>
      {unlockMember && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 border border-red-200">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Re-Login Required for {unlockMember.name}
              </h3>
              <p className="text-xs text-slate-500">
                Account was automatically logged out due to software violation (10+ min limit or repeated app switches). Please enter Owner PIN or Password to unlock session.
              </p>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Password / Owner PIN (Default: 1234)
                </label>
                <input
                  type="password"
                  placeholder="Enter PIN (e.g. 1234)"
                  value={unlockPin}
                  onChange={(e) => {
                    setUnlockPin(e.target.value);
                    setUnlockError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-center font-mono font-bold text-sm text-slate-900 tracking-widest focus:bg-white focus:border-[#9b4865] focus:ring-1 focus:ring-[#9b4865]"
                  autoFocus
                />
                {unlockError && (
                  <p className="text-[11px] font-bold text-red-600 mt-1 text-center">{unlockError}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUnlockMember(null);
                    setUnlockPin('');
                    setUnlockError('');
                  }}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#8f3655] hover:bg-[#6d2f45] text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1"
                >
                  <Unlock className="w-3.5 h-3.5" /> Re-Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  ) : null;

  if (bannersOnly) {
    return (
      <>
        {(alertingMembers.length > 0 || loggedOutMembers.length > 0) && (
          <div className="space-y-2">
            {alertingMembers.map((m) => (
              <div key={`alert-${m.id}`} className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-xs animate-pulse">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-extrabold text-amber-900">Software misuse warning: </span>
                    <span className="font-bold text-slate-800">{m.name}</span> has been using unapproved software <span className="font-mono font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">'{m.currentSoftware}'</span> for <span className="font-black text-amber-900">{m.unauthorizedMinutes} minutes</span>!
                    <span className="block text-[11px] text-amber-800 font-medium">Permitted Softwares (Limit 2-3): {getPermittedSoftwares(m).join(' | ')}</span>
                  </div>
                </div>
                {onUpdateTeamMember && (
                <button
                  onClick={() => handleResetMemberSoftware(m)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider flex-shrink-0"
                >
                  Clear Warning
                </button>
                )}
              </div>
            ))}

            {loggedOutMembers.map((m) => (
              <div key={`lock-${m.id}`} className="bg-red-50 border-2 border-red-300 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <span className="font-black text-red-900">Auto logout enforced: </span>
                    <span className="font-bold text-slate-900">{m.name}</span> has been automatically logged out due to unauthorized app limit exceed!
                  </div>
                </div>
                {onUpdateTeamMember && (
                <button
                  onClick={() => setUnlockMember(m)}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Re-Login / Unlock</span>
                </button>
                )}
              </div>
            ))}
          </div>
        )}
        {unlockModal}
      </>
    );
  }

  if (cardsOnly) {
    return (
      <>
        <div className="flex items-center justify-between bg-rose-50/90 border border-rose-200 px-4 py-2.5 rounded-2xl text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <GripVertical className="w-5 h-5 text-[#8f3655] flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-extrabold text-slate-900">
                Drag & drop to reorder cards
              </span>
              <span className="text-slate-600 text-[11px] ml-2 hidden sm:inline font-medium">
                • Pick up any card by dragging it (or click "Pick") and drop it anywhere to move Upar, Niche, Aage, Piche!
              </span>
            </div>
          </div>
          {pickedMemberIdx !== null && (
            <button
              type="button"
              onClick={() => setPickedMemberIdx(null)}
              className="text-[10px] font-extrabold text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-full uppercase transition"
            >
              Cancel Pick
            </button>
          )}
          <span className="text-[10px] font-black text-[#6d2f45] bg-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Total {team.length} Cards
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map((t, idx) => {
            const permitted = getPermittedSoftwares(t);
            const isAlerting = (t.unauthorizedMinutes || 0) >= 5 && !t.isLoggedOut;
            const isLocked = t.isLoggedOut || t.workStatus === 'LOCKED';
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx;
            const isPicked = pickedMemberIdx === idx;

            return (
              <div
                key={t.id}
                draggable={true}
                onDragStart={(e) => {
                  setDraggedIdx(idx);
                  e.dataTransfer.setData('text/plain', String(idx));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverIdx !== idx) setDragOverIdx(idx);
                }}
                onDragLeave={() => {
                  if (dragOverIdx === idx) setDragOverIdx(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const sourceIdx = draggedIdx !== null ? draggedIdx : parseInt(e.dataTransfer.getData('text/plain'), 10);
                  if (!isNaN(sourceIdx) && sourceIdx !== idx) {
                    handleReorderIndices(sourceIdx, idx);
                  }
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden flex flex-col justify-between p-4 space-y-3 relative group cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? 'opacity-40 scale-[0.97] border-[#8f3655] border-dashed bg-rose-50/50'
                    : isDragOver
                    ? 'border-2 border-[#8f3655] bg-rose-50/70 ring-4 ring-rose-200 scale-[1.02] shadow-xl z-20'
                    : isPicked
                    ? 'border-2 border-amber-500 bg-amber-50/60 ring-4 ring-amber-300 shadow-md'
                    : isLocked
                    ? 'border-red-300 bg-red-50/20 ring-2 ring-red-400/30 hover:border-red-400'
                    : isAlerting
                    ? 'border-amber-300 ring-2 ring-amber-400/40 hover:border-amber-400'
                    : 'border-slate-200/90 hover:border-rose-300 hover:shadow-md'
                }`}
              >
                {/* Card Order Position Control Header */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-[#8f3655] transition" title="Drag to reorder card">
                      <GripVertical className="w-4 h-4" />
                      <span className="font-mono text-[#6d2f45] font-extrabold text-[11px]">#{idx + 1}</span>
                    </div>
                    {isPicked ? (
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase">Picked</span>
                    ) : (
                      <span className="text-slate-400 text-[10px] font-normal hidden sm:inline">Position</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {pickedMemberIdx !== null ? (
                      pickedMemberIdx === idx ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickedMemberIdx(null);
                          }}
                          className="px-2 py-0.5 text-[10px] font-extrabold text-red-600 bg-red-100 hover:bg-red-200 rounded border border-red-300 uppercase"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderIndices(pickedMemberIdx, idx);
                            setPickedMemberIdx(null);
                          }}
                          className="px-2.5 py-0.5 text-[10px] font-extrabold text-white bg-[#8f3655] hover:bg-[#6d2f45] rounded border border-[#6d2f45] uppercase shadow-xs animate-bounce"
                        >
                          Drop here
                        </button>
                      )
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickedMemberIdx(idx);
                          }}
                          className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-50 hover:bg-[#8f3655] hover:text-white text-[#6d2f45] rounded border border-rose-200 uppercase transition"
                          title="Pick this card to place elsewhere"
                        >
                          Pick
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveMember(idx, 'top');
                          }}
                          disabled={idx === 0}
                          className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded border transition uppercase ${
                            idx === 0
                              ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-white hover:bg-[#8f3655] hover:text-white text-slate-700 border-slate-300 cursor-pointer'
                          }`}
                          title="Move to Top (Sabse Upar)"
                        >
                          Top
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveMember(idx, 'prev');
                          }}
                          disabled={idx === 0}
                          className={`p-1 rounded border transition ${
                            idx === 0
                              ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-white hover:bg-[#8f3655] hover:text-white text-slate-700 border-slate-300 cursor-pointer shadow-2xs'
                          }`}
                          title="Move Left / Up"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveMember(idx, 'next');
                          }}
                          disabled={idx === team.length - 1}
                          className={`p-1 rounded border transition ${
                            idx === team.length - 1
                              ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-white hover:bg-[#8f3655] hover:text-white text-slate-700 border-slate-300 cursor-pointer shadow-2xs'
                          }`}
                          title="Move Right / Down"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {/* Card Header */}
                <div 
                  onClick={() => onOpenMember(t)}
                  className="flex items-start justify-between gap-3 cursor-pointer group"
                  title="Click to view full Member Dashboard"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center font-black text-sm tracking-wider shadow-xs ${getAvatarStyle(idx)} group-hover:scale-105 transition`}>
                      {getInitials(t.name)}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#8f3655] transition flex items-center gap-1.5">
                        <span>{t.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-[#8f3655] transition" />
                      </h3>
                      <p className="text-xs font-bold text-[#8f3655] mt-0.5">
                        {t.role}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge & Edit Button */}
                  <div className="flex items-center gap-2">
                    {onEditMember && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditMember(t);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-[#8f3655] hover:text-white text-[#6d2f45] font-extrabold text-[11px] flex items-center gap-1 border border-rose-200 transition shadow-2xs cursor-pointer"
                      title={`Edit ${t.name}'s Details & Salary`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    )}

                    {isLocked ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300 flex items-center gap-1 uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    ) : t.workStatus === 'IDLE' ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        IDLE
                      </span>
                    ) : t.workStatus === 'ON_BREAK' ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">
                        ON BREAK
                      </span>
                    ) : t.workStatus === 'CLOCKED_OUT' ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                        CLOCKED OUT
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                        EDITING
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact & Softwares Container */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  {/* Contact details */}
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium truncate">{t.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-medium">{t.phone}</span>
                    </div>
                  </div>

                  {/* Permitted Software Tag Manager */}
                  <MemberSoftwareManager
                    member={t}
                    getPermittedSoftwares={getPermittedSoftwares}
                    onAddSoftware={handleAddPermittedSoftware}
                    onRemoveSoftware={handleRemovePermittedSoftware}
                  />

                  {/* Live Detected App Status */}
                  <div className="text-[11px] pt-1">
                    {isLocked ? (
                      <div className="bg-red-100/80 border border-red-200 text-red-800 rounded-lg p-2 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-red-600" />
                          Session Locked (Auto Logged Out)
                        </span>
                        <button
                          onClick={() => setUnlockMember(t)}
                          className="underline text-[10px] uppercase font-black"
                        >
                          Unlock
                        </button>
                      </div>
                    ) : isAlerting ? (
                      <div className="bg-amber-100/90 border border-amber-300 text-amber-900 rounded-lg p-2 font-bold space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            App Switch Warning!
                          </span>
                          <span className="font-black text-amber-900">{t.unauthorizedMinutes}m used</span>
                        </div>
                        <p className="text-[10px] text-amber-800 font-medium">Currently on: '{t.currentSoftware}'</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-slate-500 font-medium px-1">
                        <span>Live Active App:</span>
                        <span className="font-bold text-emerald-700 truncate max-w-[150px]">
                          {t.currentSoftware || permitted[0] || 'Premiere Pro'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Shift Timings (In Time, Out Time, Weekly Off & Lunch) Row */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8f3655]" /> SHIFT & SCHEDULE
                        </span>
                        <span className="text-[10px] font-bold text-slate-700">Duty Hours</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold bg-rose-50 border border-rose-200 text-[#38262d] px-2.5 py-1 rounded-lg">
                        <span className="text-emerald-700">In: {t.inTime || '09:30 AM'}</span>
                        <span className="text-slate-300">|</span>
                        <span className="text-red-700">Out: {t.outTime || '07:30 PM'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] bg-slate-50 p-1.5 rounded-lg border border-slate-200/70 font-semibold">
                      <span className="text-amber-800 font-bold flex items-center gap-1 text-[10px]">
                        Off: <span className="text-slate-800 font-bold">{t.weeklyOff || 'Sunday'}</span>
                      </span>
                      <span className="text-emerald-800 font-bold flex items-center gap-1 text-[10px]">
                        Lunch: <span className="text-slate-800 font-bold">{t.lunchTime || '30 Mins'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Salary & Pay Structure Row */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">
                        PAY STRUCTURE
                      </span>
                      <span className="text-[10px] font-black uppercase text-[#6d2f45]">
                        {t.payType === 'monthly' ? 'MONTHLY SALARY' : 'DAILY RATE'}
                      </span>
                    </div>
                    <div className="text-right">
                      {t.payType === 'monthly' ? (
                        <span className="font-extrabold text-slate-900 text-sm font-mono">
                          ₹{(t.monthlySalary || 45000).toLocaleString('en-IN')}<span className="text-[10px] font-medium text-slate-500">/mo</span>
                        </span>
                      ) : (
                        <span className="font-extrabold text-slate-900 text-sm font-mono">
                          ₹{(t.dailyRate || 2500).toLocaleString('en-IN')}<span className="text-[10px] font-medium text-slate-500">/day</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasks stats */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-blue-600 leading-none">
                      {t.activeTasksCount || 0}
                    </div>
                    <div className="text-[11px] font-bold text-blue-900/70 mt-1">
                      Active Tasks
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-emerald-600 leading-none">
                      {t.completedTasksCount || (t.id === 'team-akash' ? 42 : t.id === 'team-pooja' ? 68 : t.id === 'team-rohan' ? 31 : 15)}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-900/70 mt-1">
                      Completed
                    </div>
                  </div>
                </div>

                {/* Prominent Employee Dashboard Button */}
                <button
                  type="button"
                  onClick={() => onOpenMember(t)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#8f3655] hover:bg-[#6d2f45] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-xs uppercase tracking-wider cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#eadfe2]" />
                  <span>View {t.name}'s Dashboard</span>
                </button>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold text-[11px]">Status:</span>
                    <select
                      value={t.workStatus || 'EDITING'}
                      onChange={(e) => handleWorkStatusChange(t, e.target.value as TeamMember['workStatus'])}
                      className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                    >
                      <option value="EDITING">Editing</option>
                      <option value="IDLE">Idle</option>
                      <option value="ON_BREAK">On Break</option>
                      <option value="CLOCKED_OUT">Clocked Out</option>
                      <option value="LOCKED">Locked / Auto Logout</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLocked ? (
                      <button
                        onClick={() => setUnlockMember(t)}
                        className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Re-Login
                      </button>
                    ) : (
                      <button
                        onClick={() => handleClockOut(t)}
                        className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs transition"
                      >
                        Clock Out
                      </button>
                    )}

                    {onDeleteTeamMember && (
                      <button
                        onClick={() => onDeleteTeamMember(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Delete Team Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {unlockModal}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#c4a0ad]" />
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
              2-3 Permitted Softwares & Monthly Salary Guard System
            </h3>
          </div>
          <span className="text-[11px] font-bold bg-[#24171c] text-[#ecc8d3] border border-[#6d2f45] px-2.5 py-0.5 rounded-full">
            2-3 Software Limit per Employee
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Each team member can be assigned maximum <strong>2 to 3 Permitted Softwares</strong>. Spending <strong>5-10 minutes</strong> on any unauthorized software will trigger an Auto-Logout alert along with <strong>Monthly Fixed Salary</strong> & <strong>In/Out timing log</strong> tracking.
        </p>

        {/* Test Simulator Panel */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Test Live App Switcher:</span>
            <select
              value={selectedSimMemberId}
              onChange={(e) => setSelectedSimMemberId(e.target.value)}
              className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold"
            >
              {team.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.role})
                </option>
              ))}
            </select>

            <select
              value={simAppChoice}
              onChange={(e) => setSimAppChoice(e.target.value)}
              className="bg-slate-900 text-amber-300 border border-amber-500/50 rounded-lg px-2.5 py-1 text-xs font-bold"
            >
              {UNAUTHORIZED_APPS_SIMULATION.map((app) => (
                <option key={app} value={app}>
                  Switch to: {app}
                </option>
              ))}
            </select>

            <select
              value={simMinutes}
              onChange={(e) => setSimMinutes(Number(e.target.value))}
              className="bg-slate-900 text-slate-100 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold"
            >
              <option value={3}>3 Mins (Normal)</option>
              <option value={7}>7 Mins (Trigger Dashboard Alert)</option>
              <option value={12}>12 Mins (Trigger Auto-Logout)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateUnauthorizedUsage}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate App Switch</span>
            </button>
            {team.find((t) => t.id === selectedSimMemberId) && (
              <button
                onClick={() => {
                  const t = team.find((item) => item.id === selectedSimMemberId);
                  if (t) handleResetMemberSoftware(t);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
      {unlockModal}
    </div>
  );
};
