import type {
  BackendProjectStatus,
  BackendProjectType,
  CreateProjectInput,
  Project as ProjectDto,
  UpdateProjectInput,
} from '@/lib/api/projects';
import { FREELANCER_ASSIGNEE, UNASSIGNED_ASSIGNEE } from '@/features/projects/assigneeOptions';
import type { CrewMemberAssignment, Project, ProjectTask, TeamMember } from '@/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const legacyStatus: Record<ProjectDto['status'], Project['status']> = { UPCOMING:'new_project', LEAD:'new_project', CONFIRMED:'running', PLANNING:'running', SHOOTING:'running', EDITING:'running', DELIVERY:'ready_to_deliver', COMPLETED:'completed', CANCELLED:'pending' };
const legacyService: Record<ProjectDto['type'], string> = { ROKA:'Roka', ENGAGEMENT:'Engagement', PRE_WEDDING:'Pre Wedding', WEDDING:'Wedding', COMPLETE_WEDDING_SERVICES:'Complete Wedding Services', HALDI_MEHENDI:'Haldi & Mehendi', SANGEET:'Sangeet', RECEPTION:'Reception', ANNIVERSARY:'Other', CORPORATE:'Other', OTHER:'Other' };
const typeByService: Record<string, BackendProjectType> = {
  Roka: 'ROKA',
  Engagement: 'ENGAGEMENT',
  'Pre Wedding': 'PRE_WEDDING',
  Wedding: 'WEDDING',
  'Complete Wedding Services': 'COMPLETE_WEDDING_SERVICES',
  'Haldi & Mehendi': 'HALDI_MEHENDI',
  Sangeet: 'SANGEET',
  Reception: 'RECEPTION',
  Other: 'OTHER',
};

const backendTaskStatusByEditingStatus = {
  not_started: 'TODO',
  in_progress: 'IN_PROGRESS',
  client_review: 'IN_REVIEW',
  revision: 'IN_PROGRESS',
  completed: 'COMPLETED',
} as const;

const editingStatusByBackendTaskStatus = {
  TODO: 'not_started',
  ASSIGNED: 'not_started',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'in_progress',
  IN_REVIEW: 'client_review',
  COMPLETED: 'completed',
  CANCELLED: 'not_started',
} as const;

const emptyPipeline = {
  video: { preWeddingVideo:'not_started' as const, longVideo:'not_started' as const, teaser:'not_started' as const, highlights:'not_started' as const, reels:'not_started' as const, otherVideo:'' },
  photo: { preWeddingPhotos:'not_started' as const, cullingSelection:'not_started' as const, colorGradingRetouching:'not_started' as const, albumDesigning:'not_started' as const, albumPrinting:'not_sent' as const, otherPhoto:'' },
  backup: { offloadedFromCards:false, hardDrive1:'', hardDrive1Done:false, hardDrive2:'', hardDrive2Done:false, cloudBackupDone:false, totalDataSizeGB:0, rawCleanupStatus:'not_cleaned' as const },
  delivery: { rawHandoverDone:false, teaserLinkSent:false, fullFilmSent:false, reelsSent:false, highResPhotosSent:false, albumPrintedAndDelivered:false },
};

type ProjectMetadata = {
  customDetails?: string;
  quotationLink?: string;
  weddingFunctionDates?: string;
  videoPipeline?: Project['videoPipeline'];
  photoPipeline?: Project['photoPipeline'];
  dataBackup?: Project['dataBackup'];
  deliveryStatus?: Project['deliveryStatus'];
};

type MetadataDataBackup = Project['dataBackup'] & {
  totalStorageCapacityGB?: number | string;
  totalStorageCapacityGb?: number | string;
};

function readMetadata(value?: string | null): ProjectMetadata {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : { customDetails: value };
  } catch {
    return { customDetails: value };
  }
}

function writeMetadata(project: Project): string | undefined {
  const metadata: ProjectMetadata = {
    ...readMetadata(project.otherClientDetails),
    customDetails: project.primaryServiceType === 'Other' ? project.otherClientDetails?.trim() || undefined : undefined,
    quotationLink: project.quotationLink?.trim() || undefined,
    weddingFunctionDates: project.weddingFunctionDates?.trim() || undefined,
    videoPipeline: project.videoPipeline,
    photoPipeline: project.photoPipeline,
    dataBackup: project.dataBackup,
    deliveryStatus: project.deliveryStatus,
  };
  return Object.values(metadata).some((value) => value !== undefined) ? JSON.stringify(metadata) : undefined;
}

export function isPersistedProjectId(id?: string) {
  return !!id && UUID_RE.test(id);
}

export function firstIsoDate(value?: string) {
  return value?.match(/\d{4}-\d{2}-\d{2}/)?.[0];
}

function formatStoredShootTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hours = date.getUTCHours();
  return `${String(hours % 12 || 12).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}

function splitVenue(venue?: string) {
  const parts = (venue || '').split(',').map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return {};
  if (parts.length === 1) return { venueName: parts[0] };
  return { venueName: parts.slice(0, -1).join(', '), venueCity: parts[parts.length - 1] };
}

export function toBackendProjectType(service?: string): BackendProjectType {
  return typeByService[service || ''] || 'WEDDING';
}

export function toBackendProjectStatus(status: Project['status']): BackendProjectStatus {
  return status === 'new_project' ? 'UPCOMING'
    : status === 'completed' ? 'COMPLETED'
    : status === 'ready_to_deliver' ? 'DELIVERY'
    : status === 'pending' ? 'CANCELLED'
    : status === 'running' ? 'CONFIRMED'
    : 'LEAD';
}

function toBackendTaskStatus(
  status: ProjectTask['status'],
  isAssigned: boolean,
): NonNullable<CreateProjectInput['tasks']>[number]['status'] {
  if (status === 'not_started') return isAssigned ? 'ASSIGNED' : 'TODO';
  return backendTaskStatusByEditingStatus[status] || 'TODO';
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
  const twelveHour = time.trim().toUpperCase().match(/^(\d{1,2})(?::|\s+)(\d{2})\s*(AM|PM)$/);
  if (!twelveHour) return undefined;
  let hour = Number(twelveHour[1]);
  if (hour < 1 || hour > 12 || Number(twelveHour[2]) > 59) return undefined;
  if (twelveHour[3] === 'PM' && hour !== 12) hour += 12;
  if (twelveHour[3] === 'AM' && hour === 12) hour = 0;
  return `${date}T${String(hour).padStart(2, '0')}:${twelveHour[2]}:00.000Z`;
}

function toBackendCrewRole(role: string): NonNullable<NonNullable<CreateProjectInput['shoots']>[number]['crewAssignments']>[number]['role'] {
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

function toBackendShootStatus(
  status?: Project['shoots'][number]['status'],
): NonNullable<CreateProjectInput['shoots']>[number]['status'] {
  if (status === 'completed') return 'COMPLETED';
  if (status === 'cancelled') return 'CANCELLED';
  return 'SCHEDULED';
}

function taskAssigneeId(task: ProjectTask, team: TeamMember[]) {
  if (task.assignedToId && isPersistedProjectId(task.assignedToId)) return task.assignedToId;
  const name = (task.assignedTo || '').trim();
  if (!name || name === UNASSIGNED_ASSIGNEE || name === FREELANCER_ASSIGNEE) return undefined;
  return team.find((member) => member.name.trim().toLowerCase() === name.toLowerCase())?.id;
}

function crewUserId(crew: CrewMemberAssignment, team: TeamMember[]) {
  if (crew.userId && isPersistedProjectId(crew.userId)) return crew.userId;
  const name = (crew.name || '').trim().toLowerCase();
  if (!name) return undefined;
  return team.find((member) => member.name.trim().toLowerCase() === name)?.id;
}

type PlannedRoleSlotInput = NonNullable<NonNullable<CreateProjectInput['shoots']>[number]['plannedRoleSlots']>[number];

/**
 * Crew rows that are not backed by a team member become `plannedRoleSlots`.
 * A named row is one slot carrying its handover data. An unnamed row is a
 * required position nobody has been assigned to yet ("2 photographers, 1
 * assistant"), so it is stored as a per-role headcount. Dropping these is what
 * made a shoot lose its crew counts the moment the project was saved.
 */
export function buildPlannedRoleSlots(crew: CrewMemberAssignment[] = [], team: TeamMember[] = []): PlannedRoleSlotInput[] {
  const named: PlannedRoleSlotInput[] = [];
  const unassignedByRole = new Map<string, number>();
  for (const row of crew) {
    const role = row.role?.trim();
    if (!role || crewUserId(row, team)) continue;
    const name = (row.name || '').trim();
    if (!name) {
      unassignedByRole.set(role, (unassignedByRole.get(role) || 0) + 1);
      continue;
    }
    const copyInHD = (row.copyInHD || row.hardDriveName || '').trim();
    named.push({
      role,
      requiredCount: 1,
      name,
      ...(row.mobile?.trim() ? { mobile: row.mobile.trim() } : {}),
      ...(row.dataReceived ? { dataReceived: true } : {}),
      ...(row.dataSizeGB ? { dataSizeGb: String(Math.round(row.dataSizeGB * 100) / 100) } : {}),
      ...(copyInHD ? { copyInHD } : {}),
      ...(row.backupInHD?.trim() ? { backupInHD: row.backupInHD.trim() } : {}),
    });
  }
  const unassigned = [...unassignedByRole].map(([role, requiredCount]) => ({ role, requiredCount }));
  return [...named, ...unassigned];
}

/** Maps only API-provided values; unavailable legacy workflow sections stay empty. */
export function normalizeProject(dto: ProjectDto): Project {
  const budget = Number(dto.totalQuotation) || 0;
  const parsedMeta = readMetadata(dto.otherClientDetails);
  const metadataBackup = parsedMeta.dataBackup as MetadataDataBackup | undefined;
  const metadataCapacity = Number(metadataBackup?.totalStorageCapacityGB ?? metadataBackup?.totalStorageCapacityGb);
  const projectCapacity = Number(dto.totalStorageCapacityGb);

  const payments = (dto.payments || []).map((p) => ({
    id: p.id,
    date: p.paymentDate?.slice(0, 10) || '',
    amount: Number(p.amount || 0),
    type: 'installment' as const,
    paymentMode: p.paymentMethod === 'UPI' ? 'UPI / GPay' as const
      : p.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' as const
      : p.paymentMethod === 'CASH' ? 'Cash' as const
      : p.paymentMethod === 'CHEQUE' ? 'Cheque' as const
      : p.paymentMethod === 'CREDIT_CARD' || p.paymentMethod === 'DEBIT_CARD' ? 'Card' as const
      : 'Other' as const,
    receiptNumber: p.id,
    notes: p.notes || '',
    receiptScreenshot: p.receiptFileId ? `/files/${p.receiptFileId}` : undefined,
  }));

  const receiptReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const milestoneReceived = (dto.paymentMilestones || [])
    .filter((milestone) => milestone.status === 'RECEIVED')
    .reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0);
  // A received milestone and its payment receipt can represent the same client
  // collection. Use the larger source as the project total to avoid counting
  // the same installment twice after the finance ledger is hydrated.
  const received = Math.max(receiptReceived, milestoneReceived);

  return {
    id: dto.id,
    clientId: dto.client?.id,
    name: dto.name,
    projectName: dto.name,
    clientWeddingTitle: dto.client?.displayName || dto.name,
    clientContactMobile: dto.client?.primaryPhone || '',
    venueLocation: [dto.venueName, dto.venueCity].filter(Boolean).join(', '),
    primaryServiceType: dto.customServiceType ? 'Other' : (legacyService[dto.type as keyof typeof legacyService] || 'Wedding'),
    customServiceType: dto.customServiceType || undefined,
    otherClientDetails: parsedMeta.customDetails || undefined,
    quotationLink: parsedMeta.quotationLink || undefined,
    weddingFunctionDates: parsedMeta.weddingFunctionDates || dto.weddingDate?.slice(0, 10) || '',
    finalDeliveryDeadline: dto.deliveryDueDate?.slice(0, 10) ?? '',
    totalBudget: budget,
    totalStorageCapacityGB: Number.isFinite(projectCapacity) ? projectCapacity : Number.isFinite(metadataCapacity) ? metadataCapacity : 5000,
    advanceReceived: received,
    balanceDue: Math.max(0, budget - received),
    specialNotesMusicPreferences: dto.notes ?? '',
    status: dto.isUrgent ? 'urgent' : (legacyStatus[dto.status as keyof typeof legacyStatus] || 'running'),
    isUrgent: Boolean(dto.isUrgent),
    createdAt: dto.createdAt,
    videoPipeline: parsedMeta.videoPipeline || { ...emptyPipeline.video },
    photoPipeline: parsedMeta.photoPipeline || { ...emptyPipeline.photo },
    shoots: (dto.shoots || []).map((s) => {
      const startTime = formatStoredShootTime(s.startTime);
      const endTime = formatStoredShootTime(s.endTime);
      const assignmentRows = (s.assignments || []).map((a) => ({
        id: `slot-${a.id}`,
        assignmentId: a.id,
        userId: a.user?.id || undefined,
        role: a.role,
        name: a.user?.fullName || a.freelancer?.fullName || '',
        mobile: a.user?.phone || a.freelancer?.phone || '',
        dataReceived: Boolean(a.dataReceived),
        dataSizeGB: Number(a.dataSizeGb || 0),
        copyInHD: a.storageReference || '',
        hardDriveName: a.storageReference || '',
        backupInHD: a.notes || '',
      }));
      const plannedRows = Array.isArray(s.plannedRoleSlots)
        ? s.plannedRoleSlots.flatMap((slot, index) =>
            Array.from({ length: slot.requiredCount || 0 }, (_, count) => ({
              id: `slot-${slot.role}-${index}-${count}`,
              role: slot.role,
              name: slot.name || '',
              mobile: slot.mobile || '',
              dataReceived: Boolean(slot.dataReceived),
              dataSizeGB: Number(slot.dataSizeGb || 0),
              copyInHD: slot.copyInHD || '',
              hardDriveName: slot.copyInHD || '',
              backupInHD: slot.backupInHD || '',
            })),
          )
        : [];
      return {
        id: s.id,
        title: s.title || s.name || 'Shoot',
        date: s.shootDate?.slice(0, 10) || s.eventDate?.slice(0, 10) || '',
        time: startTime,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        venue: s.venueName || s.venue || '',
        location: s.location || s.venueName || s.venue || '',
        notes: s.notes || '',
        plannedRoleSlots: s.plannedRoleSlots || undefined,
        status: s.status === 'COMPLETED' ? 'completed' : s.status === 'CANCELLED' ? 'cancelled' : 'scheduled',
        crewAssignments: [...assignmentRows, ...plannedRows],
      };
    }),
    tasks: (dto.tasks || []).map((t) => ({
      id: t.id,
      taskName: t.title || '',
      quantity: t.quantity || 1,
      unit: t.unit || '',
      assignedTo: t.assignee?.fullName || UNASSIGNED_ASSIGNEE,
      assignedToId: t.assigneeId || undefined,
      status: editingStatusByBackendTaskStatus[t.status as keyof typeof editingStatusByBackendTaskStatus] || 'not_started',
      notes: t.description || undefined,
      category: t.category,
      completedAt: t.completedAt || undefined,
    })),
    dataBackup: parsedMeta.dataBackup || (dto.dataBackup as Project['dataBackup'] | undefined) || { ...emptyPipeline.backup },
    payments,
    deliveryStatus: parsedMeta.deliveryStatus || (dto.deliveryStatus as Project['deliveryStatus'] | undefined) || { ...emptyPipeline.delivery },
  };
}

function projectCoreInput(project: Project) {
  const venue = splitVenue(project.venueLocation);
  const weddingDate = firstIsoDate(project.weddingFunctionDates);
  const deliveryDueDate = firstIsoDate(project.finalDeliveryDeadline);
  return {
    name: (project.clientWeddingTitle || project.name || 'Untitled project').trim(),
    type: toBackendProjectType(project.primaryServiceType),
    weddingDate,
    deliveryDueDate,
    venueName: venue.venueName,
    venueCity: venue.venueCity,
    totalQuotation: Number.isFinite(project.totalBudget) ? String(project.totalBudget) : undefined,
    totalStorageCapacityGb: Number.isFinite(project.totalStorageCapacityGB ?? NaN) && (project.totalStorageCapacityGB ?? -1) >= 0 ? project.totalStorageCapacityGB : undefined,
    customServiceType: project.primaryServiceType === 'Other' ? project.customServiceType : undefined,
    otherClientDetails: writeMetadata(project),
    notes: project.specialNotesMusicPreferences || undefined,
    isUrgent: Boolean(project.isUrgent),
  };
}

export function toCreateProjectInput(project: Project, team: TeamMember[] = []): CreateProjectInput {
  const tasks: NonNullable<CreateProjectInput['tasks']> = (project.tasks || []).flatMap((task) => {
    const title = task.taskName?.trim();
    if (!title) return [];
    const assigneeId = taskAssigneeId(task, team);
    return [{
      title,
      description: task.notes || undefined,
      quantity: task.quantity || 1,
      unit: task.unit || undefined,
      ...(assigneeId ? { assigneeId } : {}),
      status: toBackendTaskStatus(task.status, Boolean(assigneeId)),
    }];
  });
  const shoots: NonNullable<CreateProjectInput['shoots']> = (project.shoots || []).flatMap((shoot) => {
      const shootDate = firstIsoDate(shoot.date);
      if (!shootDate) return [];
      const crewAssignments = (shoot.crewAssignments || []).flatMap((crew) => {
        const userId = crewUserId(crew, team);
        return userId ? [{ userId, role: toBackendCrewRole(crew.role || '') }] : [];
      });
      return [{
        title: shoot.title?.trim() || 'Shoot',
        shootDate,
        startTime: toIsoDateTime(shootDate, shoot.startTime || shoot.time),
        location: shoot.venue || shoot.location || undefined,
      notes: shoot.notes || undefined,
        plannedRoleSlots: buildPlannedRoleSlots(shoot.crewAssignments, team),
        status: toBackendShootStatus(shoot.status),
        shootType: 'PHOTO_AND_VIDEO' as const,
        ...(crewAssignments.length ? { crewAssignments } : {}),
      }];
    });
  return {
    client: {
      displayName: project.clientWeddingTitle.trim(),
      primaryPhone: project.clientContactMobile.trim(),
    },
    status: toBackendProjectStatus(project.status),
    ...projectCoreInput(project),
    ...(tasks.length ? { tasks } : {}),
    ...(shoots.length ? { shoots } : {}),
  };
}

export function toUpdateProjectInput(project: Project): UpdateProjectInput {
  return projectCoreInput(project);
}
