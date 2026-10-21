import React, { useState } from 'react';
import { CrewMemberAssignment, TeamMember } from '@/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Plus, Trash2, Users, Sparkles, X, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { nextIndianMobileValue } from '@/lib/validation/indianMobile';

interface RoleColumnCrewManagerProps {
  crewAssignments: CrewMemberAssignment[];
  activeTeamMembers: TeamMember[];
  onAddRoleQuantity: (role: string, quantity: number) => void;
  onRemoveRoleColumn: (role: string) => void;
  onUpdateMember: (crewId: string, updates: Partial<CrewMemberAssignment>) => void;
  onRemoveMember: (crewId: string) => void;
  /** Existing shoots stay read-only until their event Edit action is opened. */
  readOnly?: boolean;
}

export const RoleColumnCrewManager: React.FC<RoleColumnCrewManagerProps> = ({
  crewAssignments,
  activeTeamMembers,
  onAddRoleQuantity,
  onRemoveRoleColumn,
  onUpdateMember,
  onRemoveMember,
  readOnly = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Photographer');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [quickStep, setQuickStep] = useState<number>(1);
  const [crewEntryModes, setCrewEntryModes] = useState<Record<string, 'existing' | 'manual'>>({});

  // Delete Confirmation state
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    itemTitle: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    itemTitle: '',
    onConfirm: () => {},
  });

  // Helper to determine role icon
  const getRoleIcon = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('photo')) return '📷';
    if (lower.includes('video')) return '🎥';
    if (lower.includes('cinema')) return '🎬';
    if (lower.includes('drone')) return '🚁';
    if (lower.includes('assist')) return '🎒';
    if (lower.includes('candid')) return '📸';
    if (lower.includes('editor') || lower.includes('live')) return '💻';
    if (lower.includes('crane')) return '🏗️';
    if (lower.includes('light')) return '💡';
    return '👤';
  };

  // Extract unique roles from crewAssignments in order
  const uniqueRoles: string[] = [];
  (crewAssignments || []).forEach((c) => {
    const r = c.role || 'Photographer';
    if (!uniqueRoles.includes(r)) {
      uniqueRoles.push(r);
    }
  });

  const getEffectiveRoleName = () => {
    if (selectedRole === 'CUSTOM') {
      return customRoleInput.trim() || 'Extra Role';
    }
    return selectedRole;
  };

  const handleAddColumnSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const roleToAdd = getEffectiveRoleName();
    if (selectedQty > 0 && roleToAdd) {
      onAddRoleQuantity(roleToAdd, selectedQty);
      if (selectedRole === 'CUSTOM') {
        setCustomRoleInput('');
      }
    }
  };

  const handleQuickAddOneRole = (roleName: string, qty: number = 1) => {
    onAddRoleQuantity(roleName, qty);
  };

  const handleQuickAddWeddingPreset = () => {
    onAddRoleQuantity('Photographer', 2);
    onAddRoleQuantity('Videographer', 2);
    onAddRoleQuantity('Drone Operator', 1);
    onAddRoleQuantity('Assistant', 2);
  };

  const promptDeleteColumn = (role: string, count: number) => {
    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete Role Column',
      itemTitle: `${role} Column (${count} slot${count > 1 ? 's' : ''})`,
      onConfirm: () => {
        onRemoveRoleColumn(role);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const promptDeleteMemberSlot = (role: string, crew: CrewMemberAssignment, slotIndex: number) => {
    const memberLabel = crew.name ? `${crew.name} (${role})` : `${role} Slot #${slotIndex + 1}`;
    setDeleteModalConfig({
      isOpen: true,
      title: 'Delete Slot',
      itemTitle: memberLabel,
      onConfirm: () => {
        onRemoveMember(crew.id);
        setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="space-y-3.5 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 overflow-hidden w-full">
      
      {/* Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModalConfig.isOpen}
        title={deleteModalConfig.title}
        itemTitle={deleteModalConfig.itemTitle}
        onConfirm={deleteModalConfig.onConfirm}
        onCancel={() => setDeleteModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <fieldset disabled={readOnly} className="min-w-0 border-0 p-0 disabled:opacity-60">
      {/* Primary "+ Add Role Column" Bar */}
      <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs space-y-2.5">
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${!isCollapsed ? 'border-b border-slate-100 pb-2' : ''}`}>
          <div>
            <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Team Crew Allocation & Role Columns</span>
            </h5>
            <p className="text-[10px] text-slate-500 font-medium">
              Add standard or custom role columns (e.g. Photographer, Drone, Crane Operator) and allocate slots
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {uniqueRoles.length} Active Column{uniqueRoles.length !== 1 ? 's' : ''} ({crewAssignments?.length || 0} Slot{(crewAssignments?.length || 0) !== 1 ? 's' : ''})
            </span>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-extrabold text-xs flex items-center gap-1 border border-slate-200 hover:border-indigo-200 transition cursor-pointer"
              title={isCollapsed ? "Unhide / Expand Team Crew Allocation" : "Hide / Collapse Team Crew Allocation"}
            >
              {isCollapsed ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Show / Unhide</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hide / Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>


            {/* Quick Add Presets Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight shrink-0 mr-1">
                Quick Add Column:
              </span>
              {[
                { name: 'Photographer', icon: '📷' },
                { name: 'Videographer', icon: '🎥' },
                { name: 'Drone Operator', icon: '🚁' },
                { name: 'Assistant', icon: '🎒' },
              ].map((item) => {
                const currentCount = (crewAssignments || []).filter(
                  (c) => (c.role || 'Photographer') === item.name
                ).length;

                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 hover:border-indigo-300 transition"
                  >
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 shrink-0">
                      <span>{item.icon}</span>
                      <span className="hidden sm:inline">{item.name}</span>
                      <span className="sm:hidden">{item.name.split(' ')[0]}</span>
                      {currentCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black">
                          {currentCount}
                        </span>
                      )}
                    </span>

                    <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-md overflow-hidden divide-x divide-indigo-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuickAddOneRole(item.name, 1)}
                        className="px-1.5 py-0.5 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black text-[12px] transition cursor-pointer flex items-center justify-center min-w-[20px]"
                        title={`Add +1 ${item.name} Slot`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentCount > 0) {
                            const members = crewAssignments.filter(
                              (c) => (c.role || 'Photographer') === item.name
                            );
                            const lastMember = members[members.length - 1];
                            if (lastMember) {
                              if (!lastMember.name || lastMember.name.trim() === '') {
                                onRemoveMember(lastMember.id);
                              } else {
                                promptDeleteMemberSlot(item.name, lastMember, members.length - 1);
                              }
                            }
                          }
                        }}
                        disabled={currentCount === 0}
                        className="px-1.5 py-0.5 text-indigo-700 hover:bg-red-500 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-indigo-700 font-black text-[12px] transition cursor-pointer flex items-center justify-center min-w-[20px]"
                        title={`Remove 1 ${item.name}`}
                      >
                        –
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Direct Custom Quick Column Adder */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 hover:border-indigo-300 transition">
                <input
                  type="text"
                  placeholder="Custom Role Name"
                  aria-label="Custom Role Name"
                  title="Enter a custom crew role name"
                  value={customRoleInput}
                  onChange={(e) => {
                    setCustomRoleInput(e.target.value);
                    if (selectedRole !== 'CUSTOM') setSelectedRole('CUSTOM');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (customRoleInput.trim()) {
                        onAddRoleQuantity(customRoleInput.trim(), 1);
                        setCustomRoleInput('');
                      }
                    }
                  }}
                  className="w-28 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-800 outline-none placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const roleName = customRoleInput.trim() || 'Custom Role';
                    onAddRoleQuantity(roleName, 1);
                    setCustomRoleInput('');
                  }}
                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded transition cursor-pointer"
                  title="Add Custom Role Column"
                >
                  + Add
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Role Columns Grid */}
      {!isCollapsed && (
        <>
          {uniqueRoles.length === 0 ? (
            <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No team role columns added yet.</p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Choose Photographer, Videographer, Drone, Assistant or Custom Extra Role above and click <strong>"+"</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-hidden">
              {uniqueRoles.map((role) => {
                const roleMembers = (crewAssignments || []).filter((c) => (c.role || 'Photographer') === role);

                return (
                  <div
                    key={role}
                    className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 flex flex-col justify-between shadow-2xs hover:border-indigo-300 transition min-w-0"
                  >
                    <div className="space-y-2 min-w-0">
                      {/* Column Header */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-1.5 min-w-0">
                        <div className="flex items-center gap-1 font-black text-xs text-slate-900 uppercase tracking-wide min-w-0 flex-1 overflow-hidden">
                          <span className="text-base shrink-0">{getRoleIcon(role)}</span>
                          <span className="truncate min-w-0 font-extrabold">{role}</span>
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black border border-indigo-200 shrink-0">
                            QTY: {roleMembers.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => onAddRoleQuantity(role, 1)}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded border border-slate-200 transition flex items-center gap-0.5 cursor-pointer"
                            title={`Add 1 more slot to ${role}`}
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>Slot</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDeleteColumn(role, roleMembers.length)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title={`Delete entire ${role} column`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>

                      {/* Individual Member Slots inside this Role Column */}
                      <div className="space-y-2 min-w-0">
                        {roleMembers.map((crew, idx) => {
                          const hasExistingMatch = activeTeamMembers.some((m) => m.id === crew.userId || m.name === crew.name);
                          const entryMode = crewEntryModes[crew.id] || (!hasExistingMatch && crew.name ? 'manual' : 'existing');
                          const setEntryMode = (mode: 'existing' | 'manual') => {
                            setCrewEntryModes((current) => ({ ...current, [crew.id]: mode }));
                            if (mode === 'manual') {
                              onUpdateMember(crew.id, { userId: '' });
                            }
                          };

                          return (
                            <div key={`${role}-${idx}-${crew.id}`} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 min-w-0 overflow-hidden">
                              <div className="flex items-center justify-between gap-1.5 min-w-0">
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                                  #{idx + 1}
                                </span>
                                <div className="flex flex-1 min-w-0 rounded-lg border border-slate-200 bg-white p-0.5">
                                  {(['existing', 'manual'] as const).map((mode) => (
                                    <button
                                      key={mode}
                                      type="button"
                                      onClick={() => setEntryMode(mode)}
                                      className={`flex-1 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-tight transition ${
                                        entryMode === mode
                                          ? 'bg-indigo-600 text-white shadow-sm'
                                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                      }`}
                                      title={mode === 'existing' ? 'Select an existing team member' : 'Enter crew details manually'}
                                    >
                                      {mode === 'existing' ? 'Select Existing' : 'Manual Entry'}
                                    </button>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => promptDeleteMemberSlot(role, crew, idx)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer shrink-0"
                                  title="Delete Slot"
                                >
                                  <X className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </div>

                              {entryMode === 'existing' ? (
                                <div className="space-y-1.5">
                                  {(() => {
                                    const selectedUserId =
                                      (crew.userId && activeTeamMembers.some((m) => m.id === crew.userId) && crew.userId) ||
                                      activeTeamMembers.find((m) => m.name === crew.name)?.id ||
                                      '';
                                    return (
                                      <select
                                        value={selectedUserId}
                                        onChange={(e) => {
                                          const matched = activeTeamMembers.find((m) => m.id === e.target.value);
                                          if (!matched) {
                                            onUpdateMember(crew.id, { name: '', userId: '', mobile: '', assignmentId: undefined });
                                            return;
                                          }
                                          onUpdateMember(crew.id, {
                                            name: matched.name,
                                            userId: matched.id,
                                            mobile: matched.phone || '',
                                            ...(matched.id !== crew.userId ? { assignmentId: undefined } : {}),
                                          });
                                        }}
                                        className="w-full min-w-0 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                      >
                                        <option value="">Select {role}...</option>
                                        {activeTeamMembers.map((m) => (
                                          <option key={m.id || m.name} value={m.id}>
                                            {m.name}{m.role ? ` (${m.role})` : ''}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  })()}
                                  <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={20}
                                    pattern="[+0-9\(\) \-]{7,20}"
                                    placeholder="Mobile / Contact No."
                                    value={crew.mobile || ''}
                                    onChange={(e) => onUpdateMember(crew.id, { mobile: nextIndianMobileValue(e.target.value, crew.mobile || '') })}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-1.5">
                                  <input
                                    type="text"
                                    placeholder={`Full Name (${role})`}
                                    value={crew.name || ''}
                                    onChange={(e) => onUpdateMember(crew.id, { name: e.target.value, userId: '', assignmentId: undefined })}
                                    className="w-full min-w-0 bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  />
                                  <input
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={20}
                                    pattern="[+0-9\(\) \-]{7,20}"
                                    placeholder="Mobile / Contact No."
                                    value={crew.mobile || ''}
                                    onChange={(e) => onUpdateMember(crew.id, { mobile: nextIndianMobileValue(e.target.value, crew.mobile || '') })}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[11px] text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Add Slot button inside column */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onAddRoleQuantity(role, 1)}
                        className="w-full py-1 bg-slate-50 hover:bg-indigo-50 text-indigo-700 font-extrabold text-[11px] rounded border border-slate-200 hover:border-indigo-200 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>Add 1 {role} Slot</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      </fieldset>
    </div>
  );
};
