import { describe, expect, it } from 'vitest';
import type { Project, ShootEvent, TeamMember } from '@/types';
import { buildPlannedRoleSlots, normalizeProject, toCreateProjectInput } from './projectViewModel';
import { toPlannedRoleSlots } from '@/features/shoots/persistShoots';

const memberId = '3b241101-e2bb-4255-8caf-4136c566a2c8';
const team = [{ id: memberId, name: 'Asha Rao' }] as TeamMember[];

const unassigned = (id: string, role: string) => ({ id, name: '', role, mobile: '' });

describe('buildPlannedRoleSlots', () => {
  it('turns unassigned crew rows into per-role headcounts', () => {
    const slots = buildPlannedRoleSlots([
      unassigned('c-1', 'Photographer'),
      unassigned('c-2', 'Photographer'),
      unassigned('c-3', 'Videographer'),
      unassigned('c-4', 'Drone Operator'),
      unassigned('c-5', 'Assistant'),
      unassigned('c-6', 'Assistant'),
    ]);
    expect(slots).toEqual([
      { role: 'Photographer', requiredCount: 2 },
      { role: 'Videographer', requiredCount: 1 },
      { role: 'Drone Operator', requiredCount: 1 },
      { role: 'Assistant', requiredCount: 2 },
    ]);
  });

  it('keeps named walk-in crew as single slots next to the headcounts', () => {
    const slots = buildPlannedRoleSlots([
      { id: 'c-1', name: 'Ravi', role: 'Photographer', mobile: '9000000001', dataReceived: true, dataSizeGB: 12.5, copyInHD: 'HDD-1' },
      unassigned('c-2', 'Photographer'),
    ]);
    expect(slots).toEqual([
      { role: 'Photographer', requiredCount: 1, name: 'Ravi', mobile: '9000000001', dataReceived: true, dataSizeGb: '12.5', copyInHD: 'HDD-1' },
      { role: 'Photographer', requiredCount: 1 },
    ]);
  });

  it('leaves out crew that is backed by a team member (those become real assignments)', () => {
    expect(buildPlannedRoleSlots([
      { id: 'c-1', name: 'Asha Rao', role: 'Photographer' },
      { id: 'c-2', name: 'Someone', userId: memberId, role: 'Assistant' },
    ], team)).toEqual([]);
  });

  it('is the same output the shoot save path sends', () => {
    const shoot = { id: 's', title: 'ABC', date: '2026-12-14', time: '', venue: '', location: '', status: 'scheduled', crewAssignments: [unassigned('c-1', 'Videographer')] } as ShootEvent;
    expect(toPlannedRoleSlots(shoot, [])).toEqual([{ role: 'Videographer', requiredCount: 1 }]);
  });
});

describe('create project with unassigned shoot crew', () => {
  const project = {
    id: 'proj-1',
    clientWeddingTitle: 'Aarav & Diya',
    clientContactMobile: '9812345678',
    venueLocation: 'Jaipur',
    primaryServiceType: 'Wedding',
    weddingFunctionDates: '2026-12-14',
    finalDeliveryDeadline: '',
    totalBudget: 100000,
    advanceReceived: 0,
    balanceDue: 100000,
    status: 'new_project',
    tasks: [],
    payments: [],
    shoots: [
      {
        id: 'shoot-1', title: 'ABC', date: '2026-12-14', time: '10:00 AM', venue: 'Hall', location: '', status: 'scheduled',
        crewAssignments: [unassigned('c-1', 'Photographer'), unassigned('c-2', 'Photographer'), unassigned('c-3', 'Videographer'), unassigned('c-4', 'Assistant')],
      },
      { id: 'shoot-2', title: 'CDE', date: '2026-12-15', time: '10:00 AM', venue: 'Hall', location: '', status: 'scheduled', crewAssignments: [] },
    ],
  } as unknown as Project;

  it('sends the unassigned headcounts with each shoot', () => {
    const input = toCreateProjectInput(project, []);
    expect(input.shoots?.[0].plannedRoleSlots).toEqual([
      { role: 'Photographer', requiredCount: 2 },
      { role: 'Videographer', requiredCount: 1 },
      { role: 'Assistant', requiredCount: 1 },
    ]);
    expect(input.shoots?.[0].crewAssignments).toBeUndefined();
    expect(input.shoots?.[1].plannedRoleSlots).toEqual([]);
  });

  it('shows the same counts again after the API response is normalized', () => {
    const input = toCreateProjectInput(project, []);
    const dto = {
      id: 'b0000000-0000-4000-8000-000000000001',
      name: 'Aarav & Diya',
      type: 'WEDDING',
      status: 'UPCOMING',
      createdAt: '2026-10-23T00:00:00.000Z',
      shoots: input.shoots?.map((shoot, index) => ({
        id: `b1000000-0000-4000-8000-00000000000${index}`,
        projectId: 'b0000000-0000-4000-8000-000000000001',
        title: shoot.title,
        shootDate: `${shoot.shootDate}T00:00:00.000Z`,
        status: 'SCHEDULED',
        plannedRoleSlots: shoot.plannedRoleSlots,
        assignments: [],
      })),
    } as unknown as Parameters<typeof normalizeProject>[0];

    const [abc, cde] = normalizeProject(dto).shoots;
    const counts = (shoot: ShootEvent) => (shoot.crewAssignments || []).reduce<Record<string, number>>((acc, row) => {
      acc[row.role] = (acc[row.role] || 0) + 1;
      return acc;
    }, {});
    expect(counts(abc)).toEqual({ Photographer: 2, Videographer: 1, Assistant: 1 });
    expect(counts(cde)).toEqual({});
  });
});
