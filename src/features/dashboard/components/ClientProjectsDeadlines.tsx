import { ArrowUpRight, Briefcase, CalendarClock, MapPin, Phone } from 'lucide-react';
import { Project } from '@/types';
import { computeAutoProjectStatus } from '@/utils/projectStatusCalculator';

interface Props {
  projects: Project[];
  isEditor: boolean;
  onSelect: (project: Project) => void;
  onViewAll: () => void;
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  urgent: 'border-red-200 bg-red-100 text-red-700',
  ready_to_deliver: 'border-green-200 bg-green-100 text-green-700',
  completed: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  pending: 'border-slate-200 bg-slate-100 text-slate-700',
};

export function ClientProjectsDeadlines({ projects, isEditor, onSelect, onViewAll }: Props) {
  return (
    <section className="dashboard-panel dashboard-panel--projects flex h-[34rem] flex-col overflow-hidden rounded-2xl border border-[#dfd9d2] border-t-3 border-t-[#b99a5e] bg-white shadow-[0_10px_30px_rgba(48,44,46,.07)]">
      <div className="flex items-center justify-between border-b border-[#ece6e1] bg-linear-to-r from-[#f2f7f6] via-[#fbf7f1] to-white p-4 sm:p-5">
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-800">
          <Briefcase className="size-4 text-rose-700" />
          Client Projects &amp; Delivery Deadlines
        </h3>
        <button onClick={onViewAll} className="flex items-center gap-0.5 text-xs font-bold uppercase tracking-wider text-rose-700 hover:text-rose-900">
          View All ({projects.length})<ArrowUpRight className="size-3.5" />
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs italic text-slate-400">
          No projects yet.
        </p>
      ) : (
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
          {projects.map((project) => {
            const { completionPercent } = computeAutoProjectStatus(project);
            const isPaid = project.balanceDue <= 0;
            return (
              <div
                key={project.id}
                onClick={() => onSelect(project)}
                className="dashboard-row group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-[#e6ded8] bg-[#faf8f6] p-3 transition hover:border-rose-300"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 transition group-hover:text-rose-700">{project.clientWeddingTitle}</h4>
                      <span className="font-semibold text-rose-700 text-xs">{project.primaryServiceType}</span>
                      <span className={`rounded border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${STATUS_BADGE_CLASS[project.status] || 'border-rose-200 bg-rose-100 text-rose-800'}`}>
                        {(project.status || '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="size-3 text-slate-400" />{project.venueLocation}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Phone className="size-3 text-slate-400" />{project.clientContactMobile}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end text-right sm:self-auto">
                    {!isEditor && (
                      <div>
                        <div className="text-xs font-semibold text-slate-600">Budget: ₹{project.totalBudget.toLocaleString('en-IN')}</div>
                        <div className={`text-xs font-bold ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                          {isPaid ? 'Paid in Full' : `Due: ₹${project.balanceDue.toLocaleString('en-IN')}`}
                        </div>
                      </div>
                    )}
                    <div className="flex size-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 transition group-hover:bg-rose-700 group-hover:text-white">
                      <ArrowUpRight className="size-3.5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-[#ece6e1] pt-2">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Progress</span>
                      <span className="text-slate-600">{completionPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[#b99a5e]" style={{ width: `${completionPercent}%` }} />
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500">
                    <CalendarClock className="size-3.5 text-slate-400" />
                    Due {project.finalDeliveryDeadline}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
