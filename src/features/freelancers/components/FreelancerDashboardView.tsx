import React from 'react';
import { Freelancer, FreelancerAssignment, FreelancerPayment, FreelancerDataReceived, FreelancerCategory, Project } from '@/types';
import {
  Users,
  Camera,
  Video,
  Navigation,
  UserCheck,
  Layers,
  Film,
  CreditCard,
  UserPlus,
} from 'lucide-react';
import { Badge, BTN_GHOST, BTN_PRIMARY, CARD, EmptyState } from '@/features/team/components/TeamUiKit';
import { formatInr, freelancerLedger, freelancerPerformance, getFreelancerKpis, isPreferredFreelancer, todayKey } from '../freelancerDomain';

type PendingCrewRole = {
  role: string;
  required: number;
  assigned: number;
  pending: number;
};

type PendingShootAssignment = {
  key: string;
  projectId: string;
  shootId: string;
  projectName: string;
  clientName: string;
  projectStatus: Project['status'];
  shootTitle: string;
  shootType: string;
  shootDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  location: string;
  shootStatus: string;
  roles: PendingCrewRole[];
  requiredTotal: number;
  assignedTotal: number;
  pendingTotal: number;
};

interface FreelancerDashboardViewProps {
  freelancers: Freelancer[];
  assignments: FreelancerAssignment[];
  payments: FreelancerPayment[];
  dataReceivedList: FreelancerDataReceived[];
  categories: FreelancerCategory[];
  projects?: Project[];
  onTabChange: (subTab: string) => void;
  onAddFreelancerClick?: () => void;
  onAssignShootClick?: () => void;
  onRecordPaymentClick?: () => void;
  onManageCategoriesClick?: () => void;
  onOpenProfile: (freelancer: Freelancer) => void;
  onFilterCategory?: (categoryName: string) => void;
  onAssignPendingShootClick?: (projectId: string, shootId: string, role?: string) => void;
}

const ACTIVE_PROJECT_STATUSES: Project['status'][] = ['new_project', 'running', 'pending', 'urgent', 'ready_to_deliver'];

const normalizeRole = (role: string | undefined | null) => {
  const value = (role || '').trim();
  const lower = value.toLowerCase();
  if (!value) return 'Other';
  if (lower.includes('drone')) return 'Drone Operator';
  if (lower.includes('cinema') || lower.includes('video')) return 'Videographer';
  if (lower.includes('assist') || lower.includes('helper') || lower.includes('support')) return 'Assistant';
  if (lower.includes('album')) return 'Album Design';
  if (lower.includes('edit')) return lower.includes('video') ? 'Video Editor' : 'Photo Editor';
  if (lower.includes('photo')) return 'Photographer';
  return value;
};

const isFilledCrewSlot = (value: string | undefined | null) => Boolean((value || '').trim());

const addRoleCount = (map: Map<string, number>, role: string, count = 1) => {
  const normalized = normalizeRole(role);
  map.set(normalized, (map.get(normalized) || 0) + Math.max(0, count));
};

const matchingAssignmentsForShoot = (assignments: FreelancerAssignment[], project: Project, shoot: Project['shoots'][number]) => {
  const shootTitle = (shoot.title || '').toLowerCase().trim();
  const projectTitle = (project.clientWeddingTitle || project.name || project.projectName || '').toLowerCase().trim();
  return assignments.filter((assignment) => {
    if (!assignment || assignment.assignmentStatus === 'cancelled') return false;
    if (assignment.projectId && assignment.projectId === project.id) {
      return assignment.shootDate === shoot.date && (!assignment.eventName || assignment.eventName.toLowerCase().trim() === shootTitle);
    }
    return (
      assignment.shootDate === shoot.date &&
      (assignment.projectName || '').toLowerCase().trim() === projectTitle &&
      (!assignment.eventName || assignment.eventName.toLowerCase().trim() === shootTitle)
    );
  });
};

const requiredRolesForShoot = (shoot: Project['shoots'][number]) => {
  const required = new Map<string, number>();

  (shoot.plannedRoleSlots || []).forEach((slot) => {
    addRoleCount(required, slot.role, Number(slot.requiredCount) || 0);
  });

  if (isFilledCrewSlot(shoot.leadPhotographer)) addRoleCount(required, 'Photographer');
  if (isFilledCrewSlot(shoot.cinematographer)) addRoleCount(required, 'Videographer');
  if (isFilledCrewSlot(shoot.droneOperator)) addRoleCount(required, 'Drone Operator');
  if (isFilledCrewSlot(shoot.assistant)) addRoleCount(required, 'Assistant');

  (shoot.crewAssignments || []).forEach((crew) => addRoleCount(required, crew.role));

  return required;
};

const assignedRolesForShoot = (shoot: Project['shoots'][number]) => {
  const assigned = new Map<string, number>();
  if (isFilledCrewSlot(shoot.leadPhotographer)) addRoleCount(assigned, 'Photographer');
  if (isFilledCrewSlot(shoot.cinematographer)) addRoleCount(assigned, 'Videographer');
  if (isFilledCrewSlot(shoot.droneOperator)) addRoleCount(assigned, 'Drone Operator');
  if (isFilledCrewSlot(shoot.assistant)) addRoleCount(assigned, 'Assistant');
  (shoot.crewAssignments || []).forEach((crew) => {
    if (isFilledCrewSlot(crew.name)) addRoleCount(assigned, crew.role);
  });
  return assigned;
};

const pendingShootsForProjects = (projects: Project[], assignments: FreelancerAssignment[], today: string): PendingShootAssignment[] =>
  projects
    .filter((project) => ACTIVE_PROJECT_STATUSES.includes(project.status))
    .flatMap((project) =>
      (project.shoots || [])
        .filter((shoot) => shoot.status !== 'cancelled' && shoot.date >= today)
        .map((shoot) => {
          const required = requiredRolesForShoot(shoot);
          const assigned = assignedRolesForShoot(shoot);
          matchingAssignmentsForShoot(assignments, project, shoot).forEach((assignment) => {
            addRoleCount(assigned, assignment.role || assignment.subCategory || assignment.category);
          });

          const roles = [...required.entries()]
            .map(([role, requiredCount]) => {
              const assignedCount = assigned.get(role) || 0;
              return {
                role,
                required: requiredCount,
                assigned: Math.min(assignedCount, requiredCount),
                pending: Math.max(0, requiredCount - assignedCount),
              };
            })
            .filter((role) => role.required > 0);

          const requiredTotal = [...required.values()].reduce((sum, count) => sum + count, 0);
          const assignedTotal = roles.reduce((sum, role) => sum + role.assigned, 0);
          const pendingTotal = roles.reduce((sum, role) => sum + role.pending, 0);

          return {
            key: `${project.id}:${shoot.id}`,
            projectId: project.id,
            shootId: shoot.id,
            projectName: project.name || project.projectName || project.clientWeddingTitle,
            clientName: project.clientWeddingTitle,
            projectStatus: project.status,
            shootTitle: shoot.title,
            shootType: project.primaryServiceType || 'Shoot',
            shootDate: shoot.date,
            startTime: shoot.startTime || shoot.time || '',
            endTime: shoot.endTime || '',
            venue: shoot.venue || project.venueLocation,
            location: shoot.location || shoot.venue || project.venueLocation,
            shootStatus: shoot.status,
            roles,
            requiredTotal,
            assignedTotal,
            pendingTotal,
          };
        })
    )
    .filter((item) => item.pendingTotal > 0)
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate) || a.projectName.localeCompare(b.projectName));

export const FreelancerDashboardView: React.FC<FreelancerDashboardViewProps> = ({
  freelancers,
  assignments,
  payments,
  dataReceivedList,
  categories,
  projects = [],
  onTabChange,
  onAddFreelancerClick,
  onAssignShootClick,
  onRecordPaymentClick,
  onManageCategoriesClick,
  onOpenProfile,
  onFilterCategory,
  onAssignPendingShootClick,
}) => {
  const kpis = getFreelancerKpis(freelancers, assignments, payments, todayKey());
  const today = todayKey();

  const photographersCount = freelancers.filter((f) => /photo/i.test(`${f.mainCategory} ${f.subCategory}`)).length;
  const videographersCount = freelancers.filter((f) => /cinema|video/i.test(`${f.mainCategory} ${f.subCategory}`)).length;
  const droneOperatorsCount = freelancers.filter((f) => /drone|fpv|pilot/i.test(`${f.mainCategory} ${f.subCategory}`)).length;
  const assistantsCount = freelancers.filter((f) => /assist|support|helper|lighting|gimbal/i.test(`${f.mainCategory} ${f.subCategory}`)).length;
  const othersCount = Math.max(0, freelancers.length - photographersCount - videographersCount - droneOperatorsCount - assistantsCount);

  let totalEventsCount = 0;
  const pendingAssignments = pendingShootsForProjects(projects, assignments, today);
  const crewPendingCount = pendingAssignments.reduce((sum, item) => sum + item.pendingTotal, 0);

  if (projects.length > 0) {
    projects.forEach((proj) => {
      (proj.shoots || []).forEach((s) => {
        totalEventsCount++;
      });
    });
  } else {
    const eventGroupMap = new Set<string>();
    (assignments || []).forEach((a) => {
      if (!a) return;
      eventGroupMap.add(`${a.projectId || a.projectName || 'proj'}_${(a.eventName || '').toLowerCase().trim()}_${a.shootDate || 'date'}`);
    });
    totalEventsCount = eventGroupMap.size;
  }

  const upcomingAssignments = assignments
    .filter((a) => a.shootDate >= today && a.assignmentStatus !== 'cancelled')
    .sort((a, b) => a.shootDate.localeCompare(b.shootDate))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {onAssignShootClick && (
        <button type="button" onClick={onAssignShootClick} className={BTN_GHOST}>
          <Film className="size-3.5" /> Assign Shoot
        </button>
        )}
        {onRecordPaymentClick && (
        <button type="button" onClick={onRecordPaymentClick} className={BTN_GHOST}>
          <CreditCard className="size-3.5" /> Record Payment
        </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Photographers', value: photographersCount, icon: Camera, category: 'Photographer' },
          { label: 'Videographers', value: videographersCount, icon: Video, category: 'Videographer' },
          { label: 'Drone', value: droneOperatorsCount, icon: Navigation, category: 'Drone Operator' },
          { label: 'Assistants', value: assistantsCount, icon: UserCheck, category: 'Assistant' },
          { label: 'Editors & Other', value: othersCount, icon: Layers, category: 'Editor' },
        ].map((item) => (
          <button key={item.label} type="button" onClick={() => onFilterCategory ? onFilterCategory(item.category) : onTabChange('all_freelancers')} className={`${CARD} p-4 text-left transition hover:border-rose-200`}>
            <item.icon className="mb-2 size-4 text-[#24291E]" />
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className="mt-1 text-xl font-black text-slate-900">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className={`${CARD} p-5 lg:col-span-1`}>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Category mix</h3>
          <div className="mt-4 space-y-3">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-500">No categories yet.</p>
            ) : (
              categories.map((cat) => {
                const count = freelancers.filter((f) => f.mainCategory === cat.name).length;
                const percentage = freelancers.length > 0 ? Math.round((count / freelancers.length) * 100) : 0;
                return (
                  <button type="button" key={cat.id} className="w-full space-y-1 text-left" onClick={() => onFilterCategory?.(cat.name)}>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800">{cat.name}</span>
                      <span className="font-extrabold text-[#24291E]">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F4F9EB]">
                      <div className="h-full rounded-full bg-[#24291E]" style={{ width: `${percentage}%` }} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-2">
              <p className="font-bold text-slate-500">Events</p>
              <p className="font-black text-slate-900">{totalEventsCount}</p>
            </div>
            <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-2">
              <p className="font-bold text-slate-500">Crew pending</p>
              <p className="font-black text-slate-900">{crewPendingCount}</p>
            </div>
          </div>
        </section>

        <section className={`${CARD} p-4 lg:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Pending assignments</h3>
              {crewPendingCount > 0 && (
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {pendingAssignments.length} shoot{pendingAssignments.length === 1 ? '' : 's'} · {crewPendingCount} crew position{crewPendingCount === 1 ? '' : 's'} still needed
                </p>
              )}
            </div>
            <button type="button" onClick={() => onTabChange('calendar')} className="text-xs font-bold text-[#24291E]">
              Open calendar
            </button>
          </div>
          {pendingAssignments.length === 0 ? (
            <EmptyState
              icon={Film}
              title="No pending shoot assignments"
              message="All upcoming shoots with crew requirements are fully assigned."
              action={
                onAssignShootClick ? (
                <button type="button" onClick={onAssignShootClick} className={BTN_PRIMARY}>
                  <Film className="size-3.5" /> Assign Shoot
                </button>
                ) : undefined
              }
            />
          ) : (
            <div className="mt-3 max-h-[430px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:#d9c9c0_transparent]">
              <ul className="space-y-2">
                {pendingAssignments.map((item) => (
                  <li key={item.key} className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900">{item.projectName}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{item.clientName} · {item.projectStatus.replaceAll('_', ' ')}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          <span className="font-black uppercase tracking-wider text-[#24291E]">{item.shootTitle}</span>
                          <span className="font-semibold text-slate-500">
                            {item.shootDate}
                            {item.startTime ? ` · ${item.startTime}` : ''}
                            {item.endTime ? ` - ${item.endTime}` : ''}
                          </span>
                        </div>
                        {(item.location || item.venue) && <p className="mt-1 truncate text-[11px] font-medium text-slate-500">Venue: {item.location || item.venue}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{item.pendingTotal} pending</Badge>
                        <Badge>{item.assignedTotal}/{item.requiredTotal} assigned</Badge>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {item.roles.map((role) => (
                        <div key={role.role} className="flex items-center justify-between gap-2 rounded-lg border border-[#eee7e2] bg-white px-2.5 py-1.5 text-[11px]">
                          <span className="font-extrabold text-slate-800">{role.role}</span>
                          <span className="whitespace-nowrap font-semibold text-slate-500">
                            {role.assigned}/{role.required} · {role.pending} left
                          </span>
                        </div>
                      ))}
                    </div>
                    {onAssignPendingShootClick && (
                      <div className="mt-3 flex justify-end border-t border-[#eee7e2] pt-2">
                        <button
                          type="button"
                          onClick={() => onAssignPendingShootClick(item.projectId, item.shootId, item.roles.find((role) => role.pending > 0)?.role)}
                          className={`${BTN_PRIMARY} !px-3 !py-2 !text-xs`}
                        >
                          <Film className="size-3.5" /> Assign Shoot
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={`${CARD} p-5`}>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Insights</h3>
          {(() => {
            const ranked = [...freelancers].sort((a, b) => freelancerPerformance(b, assignments, payments).totalShoots - freelancerPerformance(a, assignments, payments).totalShoots);
            const top = ranked[0];
            const topCostCat = [...categories].map((c) => ({
              name: c.name,
              cost: assignments.filter((a) => a.category === c.name).reduce((s, a) => s + (a.totalAgreedAmount || 0), 0),
            })).sort((a, b) => b.cost - a.cost)[0];
            return (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                  <p className="font-bold text-slate-500">Most used</p>
                  <p className="font-extrabold text-slate-900">{top ? `${top.name} · ${freelancerPerformance(top, assignments, payments).totalShoots} shoots` : 'No assignments yet'}</p>
                </div>
                <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                  <p className="font-bold text-slate-500">Highest category cost</p>
                  <p className="font-extrabold text-slate-900">{topCostCat && topCostCat.cost > 0 ? `${topCostCat.name} · ${formatInr(topCostCat.cost)}` : 'No spend yet'}</p>
                </div>
                <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                  <p className="font-bold text-slate-500">Pending payments</p>
                  <p className="font-extrabold text-slate-900">{formatInr(kpis.pendingPayments)}</p>
                </div>
                <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                  <p className="font-bold text-slate-500">Upcoming commitment</p>
                  <p className="font-extrabold text-slate-900">{formatInr(upcomingAssignments.reduce((s, a) => s + (a.totalAgreedAmount || 0), 0))}</p>
                </div>
              </div>
            );
          })()}
        </section>
        <section className={`${CARD} p-5`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Top freelancer roster</h3>
            <button type="button" onClick={() => onTabChange('all_freelancers')} className="text-xs font-bold text-[#24291E]">
              View all
            </button>
          </div>
          {freelancers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No freelancers yet"
              message="Build your production team by adding photographers, cinematographers, drone operators, editors and assistants."
              action={
                onAddFreelancerClick || onManageCategoriesClick ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {onAddFreelancerClick && (
                  <button type="button" onClick={onAddFreelancerClick} className={BTN_PRIMARY}>
                    <UserPlus className="size-3.5" /> Add Freelancer
                  </button>
                  )}
                  {onManageCategoriesClick && (
                  <button type="button" onClick={onManageCategoriesClick} className={BTN_GHOST}>Manage Categories</button>
                  )}
                </div>
                ) : undefined
              }
            />
          ) : (
            <div className="mt-3 space-y-2">
              {[...freelancers]
                .sort((a, b) => freelancerPerformance(b, assignments, payments).totalShoots - freelancerPerformance(a, assignments, payments).totalShoots)
                .slice(0, 5)
                .map((f) => {
                  const stats = freelancerPerformance(f, assignments, payments);
                  const ledger = freelancerLedger(f.id, assignments, payments);
                  return (
                    <button key={f.id} type="button" onClick={() => onOpenProfile(f)} className="flex w-full items-center gap-3 rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3 text-left hover:border-rose-200">
                      <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-[#E6E8E4] text-xs font-black text-[#1C2018]">
                        {f.profilePhoto ? <img src={f.profilePhoto} alt="" className="size-10 object-cover" /> : f.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-xs font-extrabold text-slate-900">{f.name}</span>
                          {isPreferredFreelancer(f) && <Badge className="border-amber-200 bg-amber-50 text-amber-800">Preferred</Badge>}
                        </span>
                        <span className="block text-[11px] font-medium text-slate-500">
                          {f.subCategory} · {f.availabilityStatus || 'Available'} · {stats.totalShoots} shoots
                        </span>
                      </span>
                      <span className="text-right text-[11px]">
                        <span className="block font-bold text-slate-500">{f.rating ? `${f.rating}/5` : '—'}</span>
                        <span className="block font-extrabold text-slate-800">{formatInr(ledger.pending)}</span>
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
