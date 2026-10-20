import { ArrowUpRight, Briefcase, CalendarClock, MapPin, Phone } from 'lucide-react';
import { Project } from '@/types';
import { computeAutoProjectStatus } from '@/utils/projectStatusCalculator';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/States';

interface Props { projects: Project[]; isEditor: boolean; onSelect: (project: Project) => void; onViewAll: () => void; }

const TONE: Record<string, 'danger' | 'success' | 'neutral' | 'brand'> = { urgent: 'danger', ready_to_deliver: 'success', completed: 'success', pending: 'neutral' };

export function ClientProjectsDeadlines({ projects, isEditor, onSelect, onViewAll }: Props) {
  return (
    <section aria-labelledby="deadlines" className="flex h-[34rem] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line-soft bg-surface shadow-[var(--elev-1)]">
      <div className="flex items-center justify-between border-b border-line-soft px-5 py-4">
        <h3 id="deadlines" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg"><Briefcase className="size-4 text-brand" aria-hidden="true" />Projects and delivery deadlines</h3>
        <button type="button" onClick={onViewAll} className="flex cursor-pointer items-center gap-0.5 text-[13px] font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
          View all ({projects.length})<ArrowUpRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={<Briefcase />} title="No projects yet" description="Create a project to track shoots, payments and deliveries in one place." action={{ label: 'Create a project', onClick: onViewAll }} />
      ) : (
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {projects.map((project) => {
            const { completionPercent } = computeAutoProjectStatus(project);
            const isPaid = project.balanceDue <= 0;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onSelect(project)}
                  className="group flex w-full cursor-pointer flex-col gap-3 rounded-[var(--radius-md)] border border-line-soft bg-surface-sunken p-3.5 text-left transition-colors hover:border-[var(--ring)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-fg group-hover:text-brand">{project.clientWeddingTitle}</h4>
                        <span className="text-xs text-fg-muted">{project.primaryServiceType}</span>
                        <Badge tone={TONE[project.status] ?? 'brand'} dot>{(project.status || '').replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
                        <span className="flex items-center gap-1"><MapPin className="size-3" aria-hidden="true" />{project.venueLocation}</span>
                        <span className="flex items-center gap-1"><Phone className="size-3" aria-hidden="true" />{project.clientContactMobile}</span>
                      </div>
                    </div>
                    {!isEditor && (
                      <div className="shrink-0 text-left tabular sm:text-right">
                        <div className="text-xs text-fg-muted">Budget ₹{project.totalBudget.toLocaleString('en-IN')}</div>
                        <div className={isPaid ? 'text-xs font-medium text-ok' : 'text-xs font-medium text-bad'}>{isPaid ? 'Paid in full' : `Due ₹${project.balanceDue.toLocaleString('en-IN')}`}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 border-t border-line-soft pt-3">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-fg-subtle"><span>Progress</span><span className="tabular text-fg-muted">{completionPercent}%</span></div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-valuenow={completionPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Project progress">
                        <div className="h-full rounded-full bg-lime transition-[width] duration-500" style={{ width: `${completionPercent}%` }} />
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-fg-muted"><CalendarClock className="size-3.5" aria-hidden="true" />Due {project.finalDeliveryDeadline}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
