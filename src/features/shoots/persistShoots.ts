import { ApiError } from '@/lib/api/client';
import { shootsApi, type BackendCrewRole, type BackendShoot, type BackendShootStatus } from '@/lib/api/shoots';
import type { CrewMemberAssignment, DataBackup, Project, ShootEvent, TeamMember } from '@/types';
import { buildPlannedRoleSlots, firstIsoDate, isPersistedProjectId } from '@/features/projects/projectViewModel';

export function toCrewRole(role: string): BackendCrewRole {
  const value = role.toLowerCase();
  if (value.includes('drone')) return 'DRONE_OPERATOR';
  if (value.includes('cinema')) return 'CINEMATOGRAPHER';
  if (value.includes('video') || value.includes('videograph')) return 'TRADITIONAL_VIDEOGRAPHER';
  if (value.includes('candid')) return 'CANDID_PHOTOGRAPHER';
  if (value.includes('light')) return 'LIGHT_ASSISTANT';
  if (value.includes('assist')) return 'ASSISTANT';
  if (value.includes('editor') || value.includes('live')) return 'LIVE_EDITOR';
  if (value.includes('coord')) return 'COORDINATOR';
  if (value.includes('photo')) return 'LEAD_PHOTOGRAPHER';
  return 'OTHER';
}

function fromCrewRole(role: string): string {
  const labels: Record<string, string> = {
    LEAD_PHOTOGRAPHER: 'Photographer',
    CANDID_PHOTOGRAPHER: 'Candid Photographer',
    TRADITIONAL_PHOTOGRAPHER: 'Photographer',
    CINEMATOGRAPHER: 'Cinematographer',
    TRADITIONAL_VIDEOGRAPHER: 'Videographer',
    DRONE_OPERATOR: 'Drone Operator',
    ASSISTANT: 'Assistant',
    LIGHT_ASSISTANT: 'Assistant',
    LIVE_EDITOR: 'Editor / Live',
    COORDINATOR: 'Coordinator',
    OTHER: 'Team Member',
  };
  return labels[role] || role;
}

function toShootStatus(status?: ShootEvent['status']): BackendShootStatus {
  if (status === 'completed') return 'COMPLETED';
  if (status === 'cancelled') return 'CANCELLED';
  return 'SCHEDULED';
}

function toIsoDateTime(date: string, time?: string): string | undefined {
  if (!time?.trim()) return undefined;
  const twentyFourHour = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1]);
    const minute = Number(twentyFourHour[2]);
    if (hour <= 23 && minute <= 59) {
      return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
    }
  }
  const match = time.trim().toUpperCase().match(/^(\d{1,2})(?::|\s+)(\d{2})\s*(AM|PM)$/);
  if (!match) return undefined;
  let hour = Number(match[1]);
  if (hour < 1 || hour > 12 || Number(match[2]) > 59) return undefined;
  if (match[3] === 'PM' && hour !== 12) hour += 12;
  if (match[3] === 'AM' && hour === 12) hour = 0;
  return `${date}T${String(hour).padStart(2, '0')}:${match[2]}:00.000Z`;
}

/**
 * The Shoot table correctly rejects an end timestamp that is not after the
 * start timestamp. Validate the Project form's existing time fields before
 * any project write starts, so a bad shoot cannot leave a newly-created
 * project only partially persisted.
 */
export function assertProjectShootTimes(shoots: ShootEvent[]) {
  for (const shoot of shoots) {
    const date = firstIsoDate(shoot.date);
    if (!date) continue;
    const startTime = toIsoDateTime(date, shoot.startTime);
    const endTime = toIsoDateTime(date, shoot.endTime);
    if (startTime && endTime && new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      throw new Error(`End time must be later than start time for shoot \"${shoot.title?.trim() || 'Shoot'}\".`);
    }
  }
}

function fromIsoDateTime(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const hours = date.getUTCHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${String(hours % 12 || 12).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} ${suffix}`;
}

function fromShootStatus(status: BackendShoot['status']): ShootEvent['status'] {
  if (status === 'COMPLETED') return 'completed';
  if (status === 'CANCELLED') return 'cancelled';
  return 'scheduled';
}

function num(value: string | number | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** API decimals allow at most two fractional digits. */
function toDataSizeGb(value: string | number | null | undefined): string {
  const rounded = Math.round(num(value) * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function mainCrew(rows: CrewMemberAssignment[]) {
  return rows.filter((row) => !row.role?.toLowerCase().includes('assistant'));
}

/** Local UI slot ids are not persisted shoot-assignment records. */
export function isLocalCrewRow(id?: string): boolean {
  if (!id) return true;
  return id.startsWith('c-') || id.startsWith('slot-') || id.startsWith('named-');
}

function assignmentRecordId(row: CrewMemberAssignment): string | undefined {
  if (row.assignmentId) return row.assignmentId;
  if (row.id && !isLocalCrewRow(row.id)) return row.id;
  return undefined;
}

/** Legacy rows stored the API assignment uuid in `id`; migrate to stable slot ids. */
function normalizeCrewSlot(row: CrewMemberAssignment): CrewMemberAssignment {
  if (row.assignmentId) {
    return isLocalCrewRow(row.id) ? row : { ...row, id: `slot-${row.assignmentId}` };
  }
  if (!isLocalCrewRow(row.id)) {
    return { ...row, assignmentId: row.id, id: `slot-${row.id}` };
  }
  return row;
}

function dedupeCrewSlots(rows: CrewMemberAssignment[]): CrewMemberAssignment[] {
  const seenAssignmentIds = new Set<string>();
  const seenSlotIds = new Set<string>();
  return rows.map((row, index) => {
    let next = normalizeCrewSlot(row);
    const assignmentId = next.assignmentId;
    if (assignmentId && seenAssignmentIds.has(assignmentId)) {
      next = { ...next, assignmentId: undefined, id: `c-${Date.now()}-dup-${index}` };
    }
    if (seenSlotIds.has(next.id)) {
      next = { ...next, id: `c-${Date.now()}-dup-${index}` };
    }
    if (next.assignmentId) seenAssignmentIds.add(next.assignmentId);
    seenSlotIds.add(next.id);
    return next;
  });
}

function crewRows(shoot: ShootEvent): CrewMemberAssignment[] {
  const fromAssignments = (shoot.crewAssignments || []).filter((row) => row.name?.trim());
  // Role-column UI stores every slot in crewAssignments.  Do not collapse
  // multiple photographers (or any role) into the legacy leadPhotographer field.
  if (fromAssignments.length > 0) return fromAssignments;

  // Legacy single-slot fields when crewAssignments is empty.
  return ([
    ['Photographer', shoot.leadPhotographer],
    ['Cinematographer', shoot.cinematographer],
    ['Drone Operator', shoot.droneOperator],
    ['Assistant', shoot.assistant],
  ] as const).flatMap(([role, name]) => {
    if (!name?.trim()) return [];
    return [{ id: `named-${role}`, name: name.trim(), role }];
  });
}

function crewAssignmentKey(userId: string, role: string) {
  return `${userId}:${toCrewRole(role)}`;
}

/** Keep the user's slot order after reload; refresh assignment data without reusing assignment uuids as slot ids. */
function mergeShootCrew(local: ShootEvent, fresh: ShootEvent, team: TeamMember[]): ShootEvent {
  const localRows = dedupeCrewSlots(local.crewAssignments || []);
  const freshRows = dedupeCrewSlots(crewRows(fresh));
  const freshByAssignmentId = new Map<string, CrewMemberAssignment>();
  const freshByKey = new Map<string, CrewMemberAssignment[]>();
  const freshManual: CrewMemberAssignment[] = [];

  for (const row of freshRows) {
    const assignmentId = assignmentRecordId(row);
    if (assignmentId) freshByAssignmentId.set(assignmentId, row);
    const userId = memberId(row, team);
    if (userId) {
      const key = crewAssignmentKey(userId, row.role);
      const list = freshByKey.get(key) || [];
      list.push(row);
      freshByKey.set(key, list);
    } else if (row.name?.trim()) {
      freshManual.push(row);
    }
  }

  const usedAssignmentIds = new Set<string>();
  const takeFreshMatch = (match?: CrewMemberAssignment) => {
    if (!match) return undefined;
    const assignmentId = assignmentRecordId(match);
    if (!assignmentId || usedAssignmentIds.has(assignmentId)) return undefined;
    usedAssignmentIds.add(assignmentId);
    return match;
  };

  const merged = localRows.map((localRow) => {
    const localAssignmentId = assignmentRecordId(localRow);
    const localUserId = memberId(localRow, team);
    let match = takeFreshMatch(
      localAssignmentId ? freshByAssignmentId.get(localAssignmentId) : undefined,
    );
    if (match && localUserId && memberId(match, team) !== localUserId) {
      const staleId = assignmentRecordId(match);
      if (staleId) usedAssignmentIds.delete(staleId);
      match = undefined;
    }

    if (!match) {
      const userId = memberId(localRow, team);
      if (userId) {
        const candidates = freshByKey.get(crewAssignmentKey(userId, localRow.role)) || [];
        match = takeFreshMatch(candidates.find((candidate) => {
          const assignmentId = assignmentRecordId(candidate);
          return assignmentId && !usedAssignmentIds.has(assignmentId);
        }));
      }
    }

    if (!match && !memberId(localRow, team)) {
      match = takeFreshMatch(freshManual.find(
        (row) =>
          row.role === localRow.role &&
          row.name?.trim().toLowerCase() === localRow.name?.trim().toLowerCase(),
      ));
    }

    if (!match) return localRow;

    const assignmentId = assignmentRecordId(match);
    return {
      ...localRow,
      assignmentId,
      userId: match.userId ?? localRow.userId ?? memberId(match, team),
      name: match.name || localRow.name,
      mobile: match.mobile || localRow.mobile,
      dataReceived: match.dataReceived,
      dataSizeGB: match.dataSizeGB,
      copyInHD: match.copyInHD,
      hardDriveName: match.hardDriveName,
      backupInHD: match.backupInHD,
    };
  });

  return { ...fresh, crewAssignments: dedupeCrewSlots(merged.length ? merged : fresh.crewAssignments || []) };
}

/** Named slots plus per-role headcounts of the still-unassigned ones. */
export function toPlannedRoleSlots(shoot: ShootEvent, team: TeamMember[]) {
  return buildPlannedRoleSlots(shoot.crewAssignments, team);
}

function memberId(crew: CrewMemberAssignment, team: TeamMember[]) {
  if (crew.userId && isPersistedProjectId(crew.userId)) return crew.userId;
  const name = crew.name.trim().toLowerCase();
  if (!name) return undefined;
  return team.find((row) => row.name.trim().toLowerCase() === name)?.id;
}

export function backupFromShoots(shoots: ShootEvent[], existing?: DataBackup): DataBackup {
  const crew = mainCrew(shoots.flatMap((shoot) => shoot.crewAssignments || []));
  const copies = [...new Set(crew.map((row) => (row.copyInHD || row.hardDriveName || '').trim()).filter(Boolean))];
  const backups = [...new Set(crew.map((row) => (row.backupInHD || '').trim()).filter(Boolean))];
  const received = crew.length > 0 && crew.every((row) => row.dataReceived);
  const total = crew.reduce((sum, row) => sum + (row.dataSizeGB || 0), 0);
  const shootReceived = shoots.some((shoot) => shoot.dataReceivedAt);
  const shootBackedUp = shoots.length > 0 && shoots.every((shoot) => shoot.backupDoneAt);
  return {
    offloadedFromCards: received || shootReceived,
    hardDrive1: copies.join(', ') || existing?.hardDrive1 || '',
    hardDrive1Done: received || shootReceived,
    hardDrive2: backups.join(', ') || existing?.hardDrive2 || '',
    hardDrive2Done: shootBackedUp,
    cloudBackupDone: !!existing?.cloudBackupDone,
    cloudBackupLink: existing?.cloudBackupLink,
    totalDataSizeGB: total || existing?.totalDataSizeGB || 0,
    rawCleanupStatus: existing?.rawCleanupStatus || 'not_cleaned',
  };
}

export function toShootEvent(dto: BackendShoot): ShootEvent {
  const assignments = dto.assignments || [];
  const crew = assignments.map((row) => ({
    id: `slot-${row.id}`,
    assignmentId: row.id,
    userId: row.user?.id || undefined,
    name: row.user?.fullName || row.freelancer?.fullName || '',
    role: fromCrewRole(row.role),
    mobile: row.user?.phone || row.freelancer?.phone || '',
    dataReceived: !!row.dataReceived,
    dataSizeGB: num(row.dataSizeGb),
    copyInHD: row.storageReference || '',
    hardDriveName: row.storageReference || '',
    backupInHD: row.notes || '',
  }));
  const planned = Array.isArray(dto.plannedRoleSlots) ? dto.plannedRoleSlots.flatMap((slot, index) =>
    Array.from({ length: slot.requiredCount || 0 }, (_, count) => ({
      id: `slot-${slot.role}-${index}-${count}`,
      name: slot.name || '',
      mobile: slot.mobile || '',
      role: slot.role,
      dataReceived: !!slot.dataReceived,
      dataSizeGB: num(slot.dataSizeGb),
      copyInHD: slot.copyInHD || '',
      hardDriveName: slot.copyInHD || '',
      backupInHD: slot.backupInHD || '',
    })),
  ) : [];
  const pickNamed = (match: (role: string) => boolean) => crew.find((row) => match(row.role))?.name;
  const photographer = pickNamed((role) => /photo/i.test(role));
  const cinematographer = pickNamed((role) => /cinema|video/i.test(role));
  const drone = pickNamed((role) => /drone/i.test(role));
  const assistant = pickNamed((role) => /assist/i.test(role));
  const date = String(dto.shootDate || '').slice(0, 10);
  return {
    id: dto.id,
    title: dto.title,
    date,
    time: fromIsoDateTime(dto.startTime) || '',
    startTime: fromIsoDateTime(dto.startTime),
    endTime: fromIsoDateTime(dto.endTime),
    venue: dto.location || dto.city || '',
    location: dto.location || '',
    leadPhotographer: photographer,
    cinematographer,
    droneOperator: drone,
    assistant,
    crewAssignments: [...crew, ...planned],
    plannedRoleSlots: dto.plannedRoleSlots || undefined,
    status: fromShootStatus(dto.status),
    notes: dto.notes || undefined,
    dataReceivedAt: dto.dataReceivedAt || undefined,
    backupDoneAt: dto.backupDoneAt || undefined,
  };
}

export function attachShoots(projects: Project[], shoots: BackendShoot[]): Project[] {
  const byProject = new Map<string, ShootEvent[]>();
  shoots.forEach((shoot) => {
    const list = byProject.get(shoot.projectId) || [];
    list.push(toShootEvent(shoot));
    byProject.set(shoot.projectId, list);
  });
  return projects.map((project) => {
    // API is authoritative: an empty list must clear a previously deleted
    // shoot instead of retaining stale project-local data.
    const rawShoots = byProject.get(project.id) || [];
    const savedCrewData = project.dataBackup?.crewDataByShoot || {};
    const nextShoots = rawShoots.map((shoot) => ({
      ...shoot,
      crewAssignments: (shoot.crewAssignments || []).map((crew) => ({
        ...crew,
        ...(savedCrewData[shoot.id]?.[crew.assignmentId || crew.id] || {}),
      })),
    }));
    return { ...project, shoots: nextShoots, dataBackup: backupFromShoots(nextShoots, project.dataBackup) };
  });
}

async function fetchShootAssignments(shootId: string, projectId: string) {
  const listed = await shootsApi.list({ projectId, page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'asc' });
  return listed.items.find((row) => row.id === shootId)?.assignments || [];
}

/** Reconcile API assignments to match the UI crew rows (authoritative desired state). */
async function syncAssignments(shootId: string, shoot: ShootEvent, projectId: string, team: TeamMember[]) {
  const next = crewRows(shoot);
  const desiredKeys = new Set<string>();
  for (const row of next) {
    const userId = memberId(row, team);
    if (userId) desiredKeys.add(crewAssignmentKey(userId, row.role));
  }

  const current = await fetchShootAssignments(shootId, projectId);
  const remaining = new Map<string, string>();
  for (const assignment of current) {
    const userId = assignment.user?.id;
    if (!userId) continue;
    remaining.set(crewAssignmentKey(userId, fromCrewRole(assignment.role)), assignment.id);
  }

  for (const [key, assignId] of remaining) {
    if (desiredKeys.has(key)) continue;
    try {
      await shootsApi.removeAssignment(shootId, assignId);
      remaining.delete(key);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 403) throw error;
    }
  }

  for (const row of next) {
    const userId = memberId(row, team);
    if (!userId) continue;
    const key = crewAssignmentKey(userId, row.role);
    if (remaining.has(key)) continue;
    try {
      const assigned = await shootsApi.assign(shootId, { userId, role: toCrewRole(row.role) });
      remaining.set(key, assigned.id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.message.includes('already assigned to this shoot in that role')) {
        remaining.set(key, 'existing');
        continue;
      }
      if (!(error instanceof ApiError) || error.status !== 403) throw error;
    }
  }
}

async function syncAssignmentData(shootId: string, shoot: ShootEvent, backup?: DataBackup) {
  const rows = crewRows(shoot);
  for (const row of rows) {
    const assignId = assignmentRecordId(row);
    if (!assignId) continue;
    try {
      await shootsApi.updateAssignment(shootId, assignId, {
        role: toCrewRole(row.role || ''),
        dataReceived: !!row.dataReceived,
        dataSizeGb: toDataSizeGb(row.dataSizeGB || 0),
        storageReference: (row.copyInHD || row.hardDriveName || '').slice(0, 160),
        notes: (row.backupInHD || '').slice(0, 2000),
      });
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 403) throw error;
    }
  }
  const received = rows.length > 0 && mainCrew(rows).every((row) => row.dataReceived);
  const totalGb = mainCrew(rows).reduce((sum, row) => sum + (row.dataSizeGB || 0), 0);
  try {
    await shootsApi.update(shootId, {
      dataSizeGb: toDataSizeGb(totalGb),
      ...(received ? { dataReceivedAt: shoot.dataReceivedAt || new Date().toISOString() } : {}),
      ...(backup?.hardDrive2Done ? { backupDoneAt: shoot.backupDoneAt || new Date().toISOString() } : {}),
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 403) throw error;
  }
}

async function reloadProjectShoots(project: Project, fallback: ShootEvent[], team: TeamMember[] = []): Promise<Project> {
  try {
    const listed = await shootsApi.list({ projectId: project.id, page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'asc' });
    const fallbackById = new Map(fallback.map((shoot) => [shoot.id, shoot]));
    const shoots = listed.items.map((dto) => {
      const fresh = toShootEvent(dto);
      const local = fallbackById.get(fresh.id);
      return local ? mergeShootCrew(local, fresh, team) : fresh;
    });
    return { ...project, shoots, dataBackup: backupFromShoots(shoots, project.dataBackup) };
  } catch {
    return { ...project, shoots: fallback, dataBackup: backupFromShoots(fallback, project.dataBackup) };
  }
}

export async function persistShootDataHandover(project: Project): Promise<Project> {
  if (!isPersistedProjectId(project.id)) return project;
  const nextShoots: ShootEvent[] = [];
  for (const shoot of project.shoots || []) {
    if (!isPersistedProjectId(shoot.id)) {
      nextShoots.push(shoot);
      continue;
    }
    await syncAssignmentData(shoot.id, shoot, project.dataBackup);
    nextShoots.push(shoot);
  }
  return reloadProjectShoots(project, nextShoots, []);
}

/** Persist one crew handover row. Used by the RAW Data editor so one row edit
 * does not re-save every assignment in every shoot. */
export async function persistSingleCrewDataHandover(project: Project, shootId: string, crewId: string): Promise<Project> {
  if (!isPersistedProjectId(project.id) || !isPersistedProjectId(shootId)) return project;
  const shoot = (project.shoots || []).find((row) => row.id === shootId);
  const crew = shoot?.crewAssignments?.find((row) => row.id === crewId);
  if (!shoot || !crew) return project;
  // Planned/local slots have no assignment record yet.  They still need a
  // single request (rather than being silently skipped), so save their shoot
  // total until an assignment ID exists.
  let assignmentId = crew.assignmentId || (isLocalCrewRow(crewId) ? undefined : crewId);
  if (!assignmentId) {
    const userId = crew.userId && isPersistedProjectId(crew.userId) ? crew.userId : undefined;
    if (userId) {
      try {
        const assigned = await shootsApi.assign(shootId, { userId, role: toCrewRole(crew.role || '') });
        assignmentId = assigned.id;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 409 || !error.message.includes('already assigned to this shoot in that role')) {
          throw error;
        }
      }
    }
    const totalGb = mainCrew(shoot.crewAssignments || []).reduce((sum, row) => sum + (row.dataSizeGB || 0), 0);
    const plannedRoleSlots = toPlannedRoleSlots(shoot, []);
    await shootsApi.update(shootId, { dataSizeGb: toDataSizeGb(totalGb), plannedRoleSlots });
    if (userId && assignmentId) {
      await shootsApi.updateAssignment(shootId, assignmentId, {
        role: toCrewRole(crew.role || ''),
        dataReceived: !!crew.dataReceived,
        dataSizeGb: toDataSizeGb(crew.dataSizeGB || 0),
        storageReference: (crew.copyInHD || crew.hardDriveName || '').slice(0, 160),
        notes: (crew.backupInHD || '').slice(0, 2000),
      });
    }
    return project;
  }
  await shootsApi.updateAssignment(shootId, assignmentId, {
    role: toCrewRole(crew.role || ''),
    dataReceived: !!crew.dataReceived,
    dataSizeGb: toDataSizeGb(crew.dataSizeGB || 0),
    storageReference: (crew.copyInHD || crew.hardDriveName || '').slice(0, 160),
    notes: (crew.backupInHD || '').slice(0, 2000),
  });
  return project;
}

export async function persistProjectShoots(
  project: Project,
  previous: Project | undefined,
  team: TeamMember[],
): Promise<Project> {
  if (!isPersistedProjectId(project.id)) return project;
  const nextShoots: ShootEvent[] = [];
  const previousById = new Map((previous?.shoots || []).map((shoot) => [shoot.id, shoot]));
  const nextIds = new Set((project.shoots || []).map((shoot) => shoot.id));

  for (const shoot of previous?.shoots || []) {
    if (nextIds.has(shoot.id) || !isPersistedProjectId(shoot.id)) continue;
    try {
      await shootsApi.remove(shoot.id);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 403) throw error;
    }
  }

  for (const shoot of project.shoots || []) {
    const date = firstIsoDate(shoot.date);
    if (!date) {
      nextShoots.push(shoot);
      continue;
    }
    const payload = {
      title: shoot.title?.trim() || 'Shoot',
      shootDate: date,
      startTime: toIsoDateTime(date, shoot.startTime),
      location: shoot.venue || shoot.location || undefined,
      notes: shoot.notes || undefined,
      plannedRoleSlots: toPlannedRoleSlots(shoot, team),
    };
    let shootId = shoot.id;
    if (!isPersistedProjectId(shootId)) {
      const created = await shootsApi.create({ projectId: project.id, ...payload, shootType: 'PHOTO_AND_VIDEO' });
      shootId = created.id;
    } else {
      try {
        await shootsApi.update(shootId, { ...payload, status: toShootStatus(shoot.status) });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 403) throw error;
      }
    }
    await syncAssignments(shootId, shoot, project.id, team);

    let shootForData: ShootEvent = { ...shoot, id: shootId };
    try {
      const listed = await shootsApi.list({ projectId: project.id, page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'asc' });
      const freshDto = listed.items.find((row) => row.id === shootId);
      if (freshDto) shootForData = mergeShootCrew({ ...shoot, id: shootId }, toShootEvent(freshDto), team);
    } catch {
      // Fall back to local rows when the refresh fails.
    }

    await syncAssignmentData(shootId, shootForData, project.dataBackup);
    nextShoots.push(shootForData);
  }

  return reloadProjectShoots(project, nextShoots, team);
}
