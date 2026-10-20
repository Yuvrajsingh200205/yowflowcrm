'use client';

import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  Eye,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import type { RoleMember, UserPermissionOverride } from '@/lib/api/rbac';
import { TeamMember } from '@/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { useToast } from '@/components/common';
import { Badge, BTN_CREAM, BTN_GHOST, BTN_PRIMARY, CARD, EmptyState, FIELD, KpiCard, LABEL, Modal, ModalHero } from '@/features/team/components/TeamUiKit';
import { AccessAuditEntry, AccessRole, AccessRoleStatus, PermissionGrant, PermissionModule, PermissionScope } from '../accessTypes';
import { enabledCount, SCOPE_LABELS } from '../accessDomain';
import { enabledPermissionKeys, filterRoles, roleTemplates } from '../roleSelection';

interface Props {
  roles: AccessRole[];
  team: TeamMember[];
  currentUserName: string;
  permissions: PermissionModule[];
  onCreateRole: (input: {
    name: string;
    description: string;
    status: AccessRoleStatus;
    permissionKeys: string[];
  }) => Promise<void>;
  onUpdateRole: (input: {
    id: string;
    name: string;
    description: string;
    status: AccessRoleStatus;
    permissionKeys: string[];
  }) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void>;
  /** Loads the role slice of the audit trail; omitted when the actor lacks AUDIT_VIEW. */
  onLoadAudit?: () => Promise<AccessAuditEntry[]>;
  /** Employees holding a role, loaded when the role row is expanded. */
  onLoadRoleUsers: (roleId: string) => Promise<RoleMember[]>;
  onLoadMemberPermissionOverride: (userId: string) => Promise<UserPermissionOverride>;
  onSaveMemberPermissionOverride: (userId: string, permissionKeys: string[]) => Promise<UserPermissionOverride>;
  onClearMemberPermissionOverride: (userId: string) => Promise<UserPermissionOverride>;
  /**
   * Mirrors the backend permissions so the page hides what the API would
   * reject. The API remains the authority — this is presentation only.
   */
  capabilities: {
    create: boolean;
    update: boolean;
    assignPermissions: boolean;
    remove: boolean;
  };
}

type StatusFilter = 'all' | AccessRoleStatus;

const FILTER_BTN = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
    active
      ? 'border-[#2f5f54] bg-[#2f5f54] text-white'
      : 'border-[#ded5cf] bg-white text-slate-600 hover:border-[#2f5f54]/40'
  }`;

const Switch = ({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    disabled={disabled}
    onClick={onClick}
    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
      on ? 'bg-[#2f5f54]' : 'bg-[#ded5cf]'
    } disabled:opacity-50`}
  >
    <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${on ? 'left-5' : 'left-0.5'}`} />
  </button>
);

export const RolesPermissionsManager: React.FC<Props> = ({
  roles,
  team,
  currentUserName,
  permissions,
  onCreateRole,
  onUpdateRole,
  onDeleteRole,
  onLoadAudit,
  onLoadRoleUsers,
  onLoadMemberPermissionOverride,
  onSaveMemberPermissionOverride,
  onClearMemberPermissionOverride,
  capabilities,
}) => {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editorRoleId, setEditorRoleId] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AccessRole | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [audit, setAudit] = useState<AccessAuditEntry[]>([]);
  const [auditState, setAuditState] = useState<'idle' | 'loading' | 'error'>('idle');

  const canEdit = capabilities.update || capabilities.assignPermissions;
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, RoleMember[]>>({});
  const [memberState, setMemberState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [memberOverride, setMemberOverride] = useState<UserPermissionOverride | null>(null);
  const [memberOverrideReadOnly, setMemberOverrideReadOnly] = useState(false);

  const loadMembers = async (roleId: string) => {
    setMemberState('loading');
    try {
      const list = await onLoadRoleUsers(roleId);
      setMembers((prev) => ({ ...prev, [roleId]: list }));
      setMemberState('idle');
    } catch {
      setMemberState('error');
    }
  };

  const toggleMembers = (role: AccessRole) => {
    if (expandedRoleId === role.id) {
      setExpandedRoleId(null);
      return;
    }
    setExpandedRoleId(role.id);
    if (!members[role.id]) void loadMembers(role.id);
  };

  const openMemberPermissions = async (member: RoleMember, view = false) => {
    try {
      setMemberOverrideReadOnly(view);
      setMemberOverride(await onLoadMemberPermissionOverride(member.id));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load employee permissions.', { variant: 'error' });
    }
  };

  const openAudit = async () => {
    setShowAudit(true);
    if (!onLoadAudit || auditState === 'loading') return;
    setAuditState('loading');
    try {
      setAudit(await onLoadAudit());
      setAuditState('idle');
    } catch {
      setAuditState('error');
    }
  };

  const sectionRoles = useMemo(() => roleTemplates(roles), [roles]);
  const filtered = useMemo(
    () => filterRoles(sectionRoles, { query, status: statusFilter }),
    [sectionRoles, query, statusFilter],
  );

  const editing = roles.find((r) => r.id === editorRoleId) || null;

  const openEditor = (role: AccessRole, view = false) => {
    setReadOnly(view);
    setEditorRoleId(role.id);
  };

  const [pending, setPending] = useState(false);

  const handleDelete = async () => {
    if (!deleting || pending) return;
    setPending(true);
    try { await onDeleteRole(deleting.id); showToast(`Deleted ${deleting.name}.`); setDeleting(null); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Unable to delete role.', { variant: 'error' }); }
    finally { setPending(false); }
  };

  const enabledKeys = enabledPermissionKeys;

  const handleSaveEditor = async (next: AccessRole) => {
    try {
      await onUpdateRole({
        id: next.id,
        name: next.name,
        description: next.description,
        status: next.status,
        permissionKeys: enabledKeys(next),
      });
    } catch (error) { showToast(error instanceof Error ? error.message : 'Unable to update role.', { variant: 'error' }); return; }
    showToast('Permissions updated');
    setEditorRoleId(null);
  };

  const handleCreateRole = async (draft: AccessRole) => {
    const name = draft.name.trim();
    if (!name) {
      showToast('Enter a role name.', { variant: 'error' });
      throw new Error('Role name is required');
    }
    await onCreateRole({
      name,
      description: draft.description.trim(),
      status: draft.status,
      permissionKeys: enabledKeys(draft),
    });
    showToast(`Role “${name}” created.`);
    setCreating(false);
  };

  if (creating) {
    return (
      <PermissionEditor
        role={{
          id: '',
          name: '',
          description: '',
          type: 'custom',
          status: 'active',
          grants: {},
          createdAt: '',
          updatedAt: '',
          userCount: 0,
          assignable: true,
        }}
        mode="create"
        readOnly={false}
        onBack={() => setCreating(false)}
        onSave={handleCreateRole}
        permissions={permissions}
      />
    );
  }

  if (editing) {
    return (
      <PermissionEditor
        role={editing}
        mode="edit"
        readOnly={readOnly}
        onBack={() => setEditorRoleId(null)}
        onSave={handleSaveEditor}
        permissions={permissions}
      />
    );
  }

  if (memberOverride) {
    const defaultKeys = new Set(memberOverride.defaultPermissionKeys);
    const grants = Object.fromEntries(memberOverride.effectivePermissionKeys.map((key) => [key, { enabled: true, scope: 'all' as PermissionScope }]));
    return (
      <PermissionEditor
        role={{ id: memberOverride.userId, name: memberOverride.fullName, description: memberOverride.roleNames.join(' · '), type: 'system', status: 'active', grants, createdAt: '', updatedAt: memberOverride.updatedAt || '', userCount: 1, assignable: true }}
        mode="edit"
        readOnly={memberOverrideReadOnly}
        employeeOverride={{ roleNames: memberOverride.roleNames, hasOverride: memberOverride.overridePermissionKeys !== null, defaultKeys }}
        onResetEmployeeOverride={memberOverride.overridePermissionKeys !== null ? async () => {
          try {
            await onClearMemberPermissionOverride(memberOverride.userId);
            showToast(`${memberOverride.fullName} now inherits their fixed role defaults.`);
            setMemberOverride(null);
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Unable to reset employee permissions.', { variant: 'error' });
          }
        } : undefined}
        onBack={() => setMemberOverride(null)}
        onSave={async (next) => {
          try {
            await onSaveMemberPermissionOverride(memberOverride.userId, enabledKeys(next));
            showToast(`${memberOverride.fullName}'s individual permissions saved.`);
            setMemberOverride(null);
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Unable to save employee permissions.', { variant: 'error' });
            throw error;
          }
        }}
        permissions={permissions}
      />
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#ddc89c]/35 bg-[radial-gradient(circle_at_88%_8%,rgba(221,200,156,.2),transparent_30%),linear-gradient(125deg,#33514A,#55333f_50%,#1b2825)] p-5 text-white shadow-xl sm:p-7">
        <div className="absolute -bottom-20 -right-10 size-64 rounded-full border-[34px] border-white/[.04]" />
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-[.14em] text-[#e0ece9]">
              Administration
            </span>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
                <ShieldCheck className="size-6 text-[#d5e4e1]" />
              </span>
              Roles & Permissions
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#dfeae7] sm:text-base">
              Decide what each role can see on the Dashboard, and what they can create, edit, approve or export.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void openAudit()} className={`${BTN_GHOST} !border-white/20 !bg-white/10 !text-white hover:!bg-white/15`}>
              Audit Log
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Fixed roles" value={roles.length} hint="Approved studio roles" icon={ShieldCheck} tone="rose" />
        <KpiCard label="Active" value={roles.filter((r) => r.status === 'active').length} hint="Assignable now" icon={CheckCircle2} tone="emerald" />
        <KpiCard label="Role catalogue" value="13" hint="Flat fixed list" icon={Sparkles} tone="amber" />
        <KpiCard label="People Mapped" value={team.length} hint="From team roster" icon={Eye} tone="stone" />
      </div>

      <div className={`${CARD} space-y-4 p-4`}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
          <input className={`${FIELD} pl-10`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status</span>
          {(['all', 'active', 'inactive'] as StatusFilter[]).map((value) => (
            <button key={value} type="button" className={FILTER_BTN(statusFilter === value)} onClick={() => setStatusFilter(value)}>
              {value === 'all' ? 'All' : value === 'active' ? 'Active' : 'Inactive'}
            </button>
          ))}
          <span className="ml-auto text-xs font-bold text-slate-500">{filtered.length} of {sectionRoles.length} roles</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={CARD}>
          <EmptyState icon={ShieldCheck} title="No roles found" message="No approved fixed role matches this filter." />
        </div>
      ) : (
        <div className={`${CARD} overflow-hidden`}>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#233631] text-[10px] font-extrabold uppercase tracking-wider text-[#eaf2f0]">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Users</th>
                  <th className="px-4 py-3 text-right">Permissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((role) => (
                  <React.Fragment key={role.id}>
                  <tr
                    className={`border-t border-[#eee7e2] transition ${role.userCount > 0 ? 'cursor-pointer hover:bg-[#fbfcfc]' : ''}`}
                    onClick={() => {
                      if (role.userCount > 0) toggleMembers(role);
                    }}
                    title={role.userCount > 0 ? 'Click anywhere on this row to show assigned people' : undefined}
                  >
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-slate-900">{role.name}</p>
                      <p className="text-xs font-medium text-slate-500">{role.description}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge className={role.type === 'system' ? 'border-[#c9b7ad] bg-[#efe7e2] text-slate-700' : 'border-[#ddc89c] bg-[#f9f3e8] text-[#7a5a2e]'}>
                          {role.type === 'system' ? 'SYSTEM' : 'CUSTOM'}
                        </Badge>
                        {role.personalForUserId && (
                          <Badge className="border-[#c9b7ad] bg-[#f6f1ee] text-slate-700" title="Belongs to one employee only">
                            PERSONAL
                          </Badge>
                        )}
                        {!role.assignable && (
                          <Badge className="border-slate-200 bg-slate-50 text-slate-500" title="You cannot assign this role to an employee">
                            Not assignable by you
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleMembers(role);
                        }}
                        disabled={role.userCount === 0}
                        aria-expanded={expandedRoleId === role.id}
                        className="inline-flex items-center gap-1 font-extrabold text-[#2f5f54] disabled:text-slate-400"
                        title={role.userCount === 0 ? 'Nobody holds this role' : 'Show the people on this role'}
                      >
                        {role.userCount}
                        {role.userCount > 0 && (
                          <ChevronDown className={`size-3.5 transition ${expandedRoleId === role.id ? 'rotate-180' : ''}`} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-[#2f5f54]">{enabledCount(role)}</td>
                    <td className="px-4 py-3">
                      <Badge className={role.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-500'}>
                        {role.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500">{role.updatedAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button type="button" className={BTN_GHOST} onClick={(event) => { event.stopPropagation(); openEditor(role, true); }}><Eye className="size-3.5" /> View</button>
                        {canEdit && (
                          <button type="button" className={BTN_PRIMARY} onClick={(event) => { event.stopPropagation(); openEditor(role); }}><Pencil className="size-3.5" /> Edit</button>
                        )}
                        {role.type === 'custom' && capabilities.remove && (
                          <button type="button" className={BTN_GHOST} onClick={(event) => { event.stopPropagation(); setDeleting(role); }}><Trash2 className="size-3.5 text-red-600" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRoleId === role.id && (
                    <tr className="border-t border-[#d0e1dd] bg-[#fbfcfc]">
                      <td colSpan={6} className="px-4 py-4">
                        <RoleMemberList
                          role={role}
                          members={members[role.id]}
                          state={memberState}
                          canManage={capabilities.create && canEdit}
                          onViewMember={(member) => void openMemberPermissions(member, true)}
                          onEditMember={(member) => void openMemberPermissions(member)}
                        />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {filtered.map((role) => (
              <article key={role.id} className="rounded-2xl border border-[#eee7e2] bg-[#fbfaf8] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-extrabold text-slate-900">{role.name}</p>
                    <p className="text-xs text-slate-500">{role.description}</p>
                  </div>
                  <Badge>{role.status}</Badge>
                </div>
                <p className="mt-2 text-xs font-bold text-slate-600">{role.userCount} users · {enabledCount(role)} permissions · {role.type === 'system' ? 'SYSTEM' : 'CUSTOM'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {canEdit && (
                    <button type="button" className={BTN_PRIMARY} onClick={() => openEditor(role)}>Edit</button>
                  )}
                  <button type="button" className={BTN_GHOST} onClick={() => openEditor(role, true)}>View</button>
                  {role.type === 'custom' && capabilities.remove && (
                    <button type="button" className={BTN_GHOST} onClick={() => setDeleting(role)}>
                      <Trash2 className="size-3.5 text-red-600" />
                      Delete
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showAudit} onClose={() => setShowAudit(false)} labelledBy="audit-title" widthClass="max-w-2xl">
        <ModalHero icon={ShieldCheck} eyebrow="Activity" title="Permission Audit Log" onClose={() => setShowAudit(false)} labelledBy="audit-title" />
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-5">
          {auditState === 'loading' ? (
            <p className="text-sm text-slate-500">Loading role activity…</p>
          ) : auditState === 'error' || !onLoadAudit ? (
            <p className="text-sm text-slate-500">
              Role activity is only visible to accounts with audit access.
            </p>
          ) : audit.length === 0 ? (
            <p className="text-sm text-slate-500">No permission changes recorded yet.</p>
          ) : (
            audit.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-[#eee7e2] bg-white p-4">
                <p className="text-sm font-extrabold text-slate-900">{entry.roleName}</p>
                <p className="text-[11px] font-medium text-slate-500">{entry.changedBy} · {entry.date.slice(0, 16).replace('T', ' ')}</p>
                {entry.added.length > 0 && <p className="mt-2 text-xs font-bold text-emerald-700">Added: {entry.added.join(', ')}</p>}
                {entry.removed.length > 0 && <p className="mt-1 text-xs font-bold text-red-700">Removed: {entry.removed.join(', ')}</p>}
              </article>
            ))
          )}
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deleting}
        title="Delete Role"
        itemTitle={deleting?.name}
        message={deleting ? `Delete custom role “${deleting.name}”? This cannot be undone.` : ''}
        isConfirming={pending}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!pending) setDeleting(null);
        }}
      />
    </div>
  );
};

/**
 * Assigned people retain their shared fixed role. An optional per-user override
 * adjusts only that employee's effective permissions.
 */
function RoleMemberList({
  role,
  members,
  state,
  canManage,
  onViewMember,
  onEditMember,
}: {
  role: AccessRole;
  members?: RoleMember[];
  state: 'idle' | 'loading' | 'error';
  canManage: boolean;
  onViewMember?: (member: RoleMember) => void;
  onEditMember?: (member: RoleMember) => void;
}) {
  if (state === 'loading' && !members) {
    return <p className="text-xs font-semibold text-slate-500">Loading people on this role…</p>;
  }
  if (state === 'error' && !members) {
    return <p className="text-xs font-semibold text-slate-500">Could not load the people on this role.</p>;
  }
  if (!members || members.length === 0) {
    return <p className="text-xs font-semibold text-slate-500">Nobody holds this role yet.</p>;
  }

  return (
    <div className="rounded-2xl border border-[#d7e6e2] bg-[linear-gradient(115deg,#fbfcfc,#fcfbf9)] p-4 shadow-[0_8px_24px_rgba(32,64,57,.05)]">
      <div className="flex flex-col gap-2 border-b border-[#e0ece9] pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2f5f54]">
            <Users className="size-3.5" /> Assigned people · shared role
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-900">People using {role.name}</p>
        </div>
        <span className="w-fit rounded-full border border-[#c6dad6] bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#2f5f54]">{members.length} assigned</span>
      </div>
      <p className="mt-3 text-[11px] font-medium leading-relaxed text-slate-600">
        Role defaults stay shared. View or edit an employee’s own effective permissions without changing their fixed role.
      </p>
      <div className="mt-3 space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex flex-col gap-3 rounded-2xl border border-[#eee7e2] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-slate-900">{member.fullName}</p>
            <p className="truncate text-[11px] font-medium text-slate-500">
              {member.email}
              {member.employeeCode ? ` · ${member.employeeCode}` : ''}
              {member.status !== 'ACTIVE' ? ` · ${member.status}` : ''}
            </p>
            {member.roles.length > 1 && (
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                Also holds: {member.roles.filter((r) => r.id !== role.id).map((r) => r.name).join(', ')}
              </p>
            )}
          </div>
          {(onViewMember || (canManage && onEditMember)) && (
            <div className="flex flex-wrap items-end gap-2">
              {onViewMember && <button type="button" className={BTN_GHOST} onClick={() => onViewMember(member)}><Eye className="size-3.5" /> View</button>}
              {canManage && onEditMember && <button type="button" className={BTN_PRIMARY} onClick={() => onEditMember(member)}><Pencil className="size-3.5" /> Edit permissions</button>}
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

function PermissionEditor({
  role,
  mode,
  readOnly,
  onBack,
  onSave,
  permissions,
  employeeOverride,
  onResetEmployeeOverride,
}: {
  role: AccessRole;
  mode: 'create' | 'edit';
  readOnly: boolean;
  onBack: () => void;
  onSave: (role: AccessRole) => Promise<void>;
  permissions: PermissionModule[];
  employeeOverride?: { roleNames: string[]; hasOverride: boolean; defaultKeys: Set<string> };
  onResetEmployeeOverride?: () => Promise<void>;
}) {
  const isCreate = mode === 'create';
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [status, setStatus] = useState<AccessRoleStatus>(role.status);
  const [draft, setDraft] = useState<Record<string, PermissionGrant>>(() => {
    const next = { ...role.grants };
    permissions
      .filter((mod) => mod.id === 'notification')
      .forEach((mod) => {
        mod.permissions.forEach((p) => {
          next[p.key] = { enabled: true, scope: next[p.key]?.scope || 'all' };
        });
      });
    return next;
  });
  const [search, setSearch] = useState('');
  const [openMods, setOpenMods] = useState<string[]>(permissions.map((m) => m.id));
  const [saving, setSaving] = useState(false);
  const [pendingSensitive, setPendingSensitive] = useState<string | null>(null);
  const isEmployeeOverride = Boolean(employeeOverride);
  const isSystemAdmin = !isEmployeeOverride && role.type === 'system' && role.name === 'ADMIN';
  const isAlwaysOn = (modId: string, key?: string) =>
    modId === 'notification' || key === 'NOTIFICATION_VIEW';
  const isLocked = (modId: string, key?: string) =>
    readOnly ||
    isAlwaysOn(modId, key) ||
    (isSystemAdmin && modId !== 'dashboard') ||
    (isSystemAdmin && key === 'DASHBOARD_VIEW');
  const isSystem = role.type === 'system';
  const identityChanged =
    name !== role.name || description !== role.description || status !== role.status;
  const dirty = isCreate
    ? name.trim().length > 0
    : JSON.stringify(draft) !== JSON.stringify(role.grants) || identityChanged;
  const enabled = Object.values(draft).filter((grant) => grant.enabled).length;
  const q = search.trim().toLowerCase();
  const sensitiveKeys = useMemo(
    () => new Set(permissions.flatMap((module) => module.permissions.filter((permission) => permission.sensitive).map((permission) => permission.key))),
    [permissions],
  );

  const visibleModules = permissions
    .map((mod) => {
      if (!q) return mod;
      const moduleHit =
        mod.label.toLowerCase().includes(q) ||
        mod.id.toLowerCase().includes(q) ||
        (mod.description || '').toLowerCase().includes(q);
      if (moduleHit) return mod;
      return {
        ...mod,
        permissions: mod.permissions.filter(
          (p) => p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
        ),
      };
    })
    .filter((mod) => mod.permissions.length > 0);

  const jumpToModule = (id: string) => {
    setSearch('');
    setOpenMods((prev) => (prev.includes(id) ? prev : [...prev, id]));
    window.setTimeout(() => {
      document.getElementById(`role-mod-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const setGrant = (key: string, patch: Partial<PermissionGrant>) => {
    setDraft((prev) => ({ ...prev, [key]: { enabled: false, scope: 'all', ...prev[key], ...patch } }));
  };

  const toggle = (key: string) => {
    const modId = permissions.find((module) => module.permissions.some((p) => p.key === key))?.id || '';
    if (isLocked(modId, key)) return;
    const next = !draft[key]?.enabled;
    if (next && sensitiveKeys.has(key)) {
      setPendingSensitive(key);
      return;
    }
    setGrant(key, { enabled: next });
  };

  const selectModule = (modId: string, on: boolean) => {
    const mod = permissions.find((m) => m.id === modId);
    if (!mod || isLocked(modId)) return;
    setDraft((prev) => {
      const next = { ...prev };
      mod.permissions.forEach((p) => {
        if (isSystemAdmin && p.key === 'DASHBOARD_VIEW') return;
        next[p.key] = { enabled: on, scope: next[p.key]?.scope || 'all' };
      });
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ ...role, name: name.trim(), description, status, grants: draft });
    } catch {
      // The caller surfaces the message; keep the draft so nothing is lost.
    } finally {
      setSaving(false);
    }
  };

  const summary = permissions.map((mod) => ({ id: mod.id, label: mod.label, total: mod.permissions.length, on: mod.permissions.filter((permission) => draft[permission.key]?.enabled).length }));

  return (
    <div className="space-y-5 pb-24">
      <section className="relative overflow-hidden rounded-3xl border border-[#ddc89c]/35 bg-[linear-gradient(125deg,#33514A,#55333f_50%,#1b2825)] p-5 text-white shadow-xl sm:p-6">
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button type="button" onClick={onBack} className="text-xs font-bold text-[#ddc89c]">← All roles</button>
            <h1 className="mt-2 text-2xl font-black">
              {isCreate ? 'Create Role' : isEmployeeOverride ? `${role.name} — individual access` : role.name}
            </h1>
            {!isCreate && <p className="mt-1 text-sm text-[#dfeae7]">{isEmployeeOverride ? `Fixed role: ${employeeOverride!.roleNames.join(' · ') || 'Not assigned'}` : role.description}</p>}
            {!isCreate && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={isSystem ? 'border-[#c9b7ad] bg-[#efe7e2] text-slate-700' : 'border-[#ddc89c] bg-[#f9f3e8] text-[#7a5a2e]'}>
                  {isSystem ? 'SYSTEM ROLE' : 'CUSTOM ROLE'}
                </Badge>
                <Badge className={status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-600'}>
                  {status.toUpperCase()}
                </Badge>
                <Badge className="border-white/25 bg-white/10 text-white">{role.userCount} user(s)</Badge>
                {role.createdAt && (
                  <Badge className="border-white/25 bg-white/10 text-white">Created {role.createdAt}</Badge>
                )}
                {role.updatedAt && (
                  <Badge className="border-white/25 bg-white/10 text-white">Updated {role.updatedAt}</Badge>
                )}
              </div>
            )}
            {isSystemAdmin && (
              <p className="mt-2 text-xs font-semibold text-[#ddc89c]">
                Dashboard widgets can be shown or hidden for Admin. All other Admin permissions stay granted.
              </p>
            )}
            {isEmployeeOverride && (
              <p className="mt-2 max-w-2xl text-xs font-semibold leading-relaxed text-[#ddc89c]">
                {employeeOverride!.hasOverride ? 'Employee-specific override is active. Saving changes updates only this employee.' : 'Currently inherited from the fixed role. Saving creates an employee-specific override; the shared role remains unchanged.'}
              </p>
            )}
            <p className="mt-2 text-sm font-extrabold text-[#ddc89c]">{enabled} permissions enabled</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dirty && <Badge className="border-[#ddc89c] bg-[#f9f3e8] text-[#7a5a2e]">Unsaved Changes</Badge>}
            <button type="button" className={`${BTN_GHOST} !border-white/20 !bg-white/10 !text-white`} onClick={onBack}>Cancel</button>
            {isEmployeeOverride && employeeOverride!.hasOverride && !readOnly && onResetEmployeeOverride && (
              <button type="button" className={`${BTN_GHOST} !border-white/20 !bg-white/10 !text-white`} onClick={() => void onResetEmployeeOverride()}>
                Use role defaults
              </button>
            )}
            {!readOnly && (
              <button type="button" disabled={!dirty || saving} onClick={save} className={BTN_CREAM}>
                <Save className="size-4" />
                {saving ? 'Saving…' : isCreate ? 'Create Role' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </section>

      {!readOnly && !isEmployeeOverride && (
        <div className={`${CARD} grid gap-4 p-4 lg:grid-cols-3`}>
          <label>
            <span className={LABEL}>Role name {isCreate && '*'}</span>
            <input
              className={FIELD}
              value={name}
              disabled={isSystem}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sales Manager"
            />
            {isSystem && (
              <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                System role names are fixed.
              </span>
            )}
          </label>
          <label className="lg:col-span-1">
            <span className={LABEL}>Description</span>
            <input
              className={FIELD}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Responsible for leads, clients and sales operations."
            />
          </label>
          <label>
            <span className={LABEL}>Status</span>
            <select
              className={FIELD}
              value={status}
              disabled={isSystem}
              onChange={(e) => setStatus(e.target.value as AccessRoleStatus)}
            >
              <option value="active">Active — grants permissions and can be assigned</option>
              <option value="inactive">Inactive — grants nothing until reactivated</option>
            </select>
            {isSystem && (
              <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                System roles cannot be deactivated.
              </span>
            )}
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {summary.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => jumpToModule(row.id)}
            className={`${CARD} p-3 text-left transition hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md`}
          >
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{row.label}</p>
            <p className="mt-1 text-sm font-black text-slate-900">{row.on}/{row.total}</p>
            <div className="mt-2 h-1.5 rounded-full bg-[#f6f1ee]">
              <div className="h-full rounded-full bg-[#2f5f54]" style={{ width: `${row.total ? (row.on / row.total) * 100 : 0}%` }} />
            </div>
          </button>
        ))}
      </div>

      <div className={`${CARD} space-y-3 p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400" />
            <input className={`${FIELD} pl-10`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search permissions, e.g. download" />
          </div>
          <div className="flex gap-2">
            <button type="button" className={BTN_GHOST} onClick={() => setOpenMods(permissions.map((m) => m.id))}>Expand All</button>
            <button type="button" className={BTN_GHOST} onClick={() => setOpenMods([])}>Collapse All</button>
          </div>
        </div>
      </div>

      {visibleModules.length === 0 && q && (
        <div className={CARD}>
          <EmptyState
            icon={Search}
            title="No permissions match this search"
            message="Try a module name like finance, clients or team — or a permission like view, create or edit."
          />
        </div>
      )}

      {visibleModules.map((mod) => {
        const open = openMods.includes(mod.id);
        const onCount = mod.permissions.filter((p) => draft[p.key]?.enabled).length;
        return (
          <section key={mod.id} id={`role-mod-${mod.id}`} className={`${CARD} scroll-mt-24`}>
            <button
              type="button"
              onClick={() => setOpenMods((prev) => (prev.includes(mod.id) ? prev.filter((id) => id !== mod.id) : [...prev, mod.id]))}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span>
                <span className="block text-sm font-extrabold text-slate-900">{mod.label}</span>
                <span className="text-xs font-medium text-slate-500">{mod.description} · {onCount}/{mod.permissions.length}</span>
              </span>
              <ChevronDown className={`size-4 text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="border-t border-[#eee7e2] px-5 py-4">
                {!readOnly && !isLocked(mod.id) && (
                  <div className="mb-3 flex gap-2">
                    <button type="button" className={BTN_GHOST} onClick={() => selectModule(mod.id, true)}>Select All</button>
                    <button type="button" className={BTN_GHOST} onClick={() => selectModule(mod.id, false)}>Clear All</button>
                  </div>
                )}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        <th className="pb-2">Permission</th>
                        <th className="pb-2">Access</th>
                        <th className="pb-2">Data scope</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mod.permissions.map((perm) => {
                        const g = draft[perm.key] || { enabled: false, scope: 'all' as PermissionScope };
                        return (
                          <tr key={perm.key} className="border-t border-[#f3eeea]">
                            <td className="py-3 pr-3">
                              <p className="font-bold text-slate-800">{perm.label}</p>
                              {isEmployeeOverride && <p className={`mt-0.5 text-[10px] font-bold ${employeeOverride!.defaultKeys.has(perm.key) ? 'text-emerald-700' : 'text-slate-400'}`}>{employeeOverride!.defaultKeys.has(perm.key) ? 'Role default: allowed' : 'Role default: not allowed'}</p>}
                              {perm.sensitive && <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#2f5f54]">Sensitive</p>}
                            </td>
                            <td className="py-3 pr-3">
                              <Switch on={!!g.enabled} disabled={isLocked(mod.id, perm.key)} onClick={() => toggle(perm.key)} />
                            </td>
                            <td className="py-3">
                              {g.enabled && (perm.scopes || []).length > 1 ? (
                                <select
                                  disabled={readOnly}
                                  className={FIELD}
                                  value={g.scope || 'all'}
                                  onChange={(e) => setGrant(perm.key, { scope: e.target.value as PermissionScope })}
                                >
                                  {(perm.scopes || ['all']).map((scope) => (
                                    <option key={scope} value={scope}>{SCOPE_LABELS[scope]}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-medium text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 md:hidden">
                  {mod.permissions.map((perm) => {
                    const g = draft[perm.key] || { enabled: false, scope: 'all' as PermissionScope };
                    return (
                      <article key={perm.key} className="rounded-2xl border border-[#eee7e2] bg-[#fbfaf8] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div><p className="text-sm font-bold text-slate-800">{perm.label}</p>{isEmployeeOverride && <p className={`text-[10px] font-bold ${employeeOverride!.defaultKeys.has(perm.key) ? 'text-emerald-700' : 'text-slate-400'}`}>{employeeOverride!.defaultKeys.has(perm.key) ? 'Role default: allowed' : 'Role default: not allowed'}</p>}</div>
                          <Switch on={!!g.enabled} disabled={isLocked(mod.id, perm.key)} onClick={() => toggle(perm.key)} />
                        </div>
                        {g.enabled && (perm.scopes || []).length > 1 && (
                          <select
                            disabled={readOnly}
                            className={`${FIELD} mt-2`}
                            value={g.scope || 'all'}
                            onChange={(e) => setGrant(perm.key, { scope: e.target.value as PermissionScope })}
                          >
                            {(perm.scopes || ['all']).map((scope) => (
                              <option key={scope} value={scope}>{SCOPE_LABELS[scope]}</option>
                            ))}
                          </select>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        );
      })}

      {!readOnly && (
        <div className="sticky bottom-4 z-20 flex justify-end">
          <button type="button" disabled={!dirty || saving} onClick={save} className={`${BTN_PRIMARY} px-6 py-3 shadow-xl`}>
            <Save className="size-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!pendingSensitive}
        title="Enable sensitive permission"
        itemTitle={pendingSensitive || ''}
        confirmLabel="Enable"
        message="This permission provides access to sensitive studio or financial data. Are you sure you want to enable it?"
        onConfirm={() => {
          if (pendingSensitive) setGrant(pendingSensitive, { enabled: true });
          setPendingSensitive(null);
        }}
        onCancel={() => setPendingSensitive(null)}
      />
    </div>
  );
}
