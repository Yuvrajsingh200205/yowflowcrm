import { clientsApi } from '@/lib/api/clients';
import { projectsApi } from '@/lib/api/projects';
import type { Project, TeamMember } from '@/types';
import { FREELANCER_ASSIGNEE, UNASSIGNED_ASSIGNEE } from './assigneeOptions';
import { isPersistedProjectId, normalizeProject, toBackendProjectStatus, toCreateProjectInput, toUpdateProjectInput } from './projectViewModel';
import { projectStatusChangeSteps } from './projectStatusFlow';
import { usersApi } from '@/lib/api/users';
import { normalizeTeamMember } from '@/features/team/teamViewModel';
import { loadProjectTasks, persistProjectTasks } from './persistProjectTasks';
import { persistProjectShoots, toShootEvent } from '@/features/shoots/persistShoots';
import { shootsApi } from '@/lib/api/shoots';

export function assignedNames(project: Project) {
  return [...new Set(
    (project.tasks || [])
      .map((task) => (task.assignedTo || '').trim())
      .filter((name) => name && name !== UNASSIGNED_ASSIGNEE && name !== FREELANCER_ASSIGNEE),
  )];
}

export interface SaveOptions {
  /** Identifies one attempt to create a project, so a retry can never make a second one. */
  idempotencyKey?: string;
}

export async function persistStudioProject(project: Project, team: TeamMember[] = [], options: SaveOptions = {}): Promise<Project> {
  let roster = team;
  if (isPersistedProjectId(project.id) && !roster.length) {
    try {
      const listed = await usersApi.list({ page: 1, limit: 100 });
      roster = listed.items.map(normalizeTeamMember);
    } catch {
      roster = [];
    }
  }
  if (isPersistedProjectId(project.id)) {
    const [previousTasks, previousShoots] = await Promise.all([
      loadProjectTasks(project.id),
      shootsApi.list({ projectId: project.id, page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'asc' }).then((result) => result.items.map(toShootEvent)),
    ]);
    const dto = await projectsApi.update(project.id, toUpdateProjectInput(project));
    const base = { ...project, id: dto.id, name: dto.name, clientId: dto.client?.id ?? project.clientId };
    if (base.clientId) {
      await clientsApi.update(base.clientId, {
        displayName: project.clientWeddingTitle.trim(),
        primaryPhone: project.clientContactMobile.trim(),
      });
    }
    const targetStatus = toBackendProjectStatus(project.status);
    if (dto.status !== targetStatus) {
      for (const status of projectStatusChangeSteps(dto.status, project.status)) {
        await projectsApi.changeStatus(base.id, { status });
      }
    }
    const [tasks, shoots] = await Promise.all([
      persistProjectTasks(base.id, project.tasks || [], previousTasks, roster),
      persistProjectShoots(base, { ...base, shoots: previousShoots }, roster),
    ]);
    return { ...base, tasks, shoots: shoots.shoots, dataBackup: shoots.dataBackup };
  }
  // Create the project and its shoots together so a crew-assignment failure
  // rolls back the whole project instead of leaving a partial project behind.
  const createInput = toCreateProjectInput(project, roster);
  const dto = await projectsApi.create(createInput, options.idempotencyKey);
  const created = normalizeProject(dto);
  return {
    ...project,
    ...created,
    payments: project.payments,
    advanceReceived: project.advanceReceived,
    balanceDue: Math.max(0, created.totalBudget - project.advanceReceived),
  };
}
