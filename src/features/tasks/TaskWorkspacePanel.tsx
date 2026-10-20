'use client';

import { CheckCircle2, ClipboardList, Clock3, UserRound } from 'lucide-react';
import type { TeamTask } from '@/types';

interface Props {
  tasks: TeamTask[];
  title: string;
  description: string;
  showAssignee?: boolean;
  canUpdate: boolean;
  onUpdate: (task: TeamTask) => void;
  /** Keeps the employee dashboard balanced when there are no assignments. */
  compactEmpty?: boolean;
  panelClassName?: string;
  contentClassName?: string;
  listLimit?: number | null;
}

const STATUS_OPTIONS: Array<{ value: TeamTask['status']; label: string }> = [
  { value: 'not_started', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'review', label: 'Ready for review' },
  { value: 'completed', label: 'Completed' },
];

function dueLabel(task: TeamTask): string {
  return task.dueDate ? `Due ${task.dueDate}` : 'No due date';
}

export function TaskWorkspacePanel({ tasks, title, description, showAssignee = false, canUpdate, onUpdate, compactEmpty = false, panelClassName = '', contentClassName = '', listLimit = 12 }: Props) {
  const openCount = tasks.filter((task) => task.status !== 'completed').length;
  const completedCount = tasks.length - openCount;
  const visibleTasks = listLimit === null ? tasks : tasks.slice(0, listLimit);

  return (
    <section className={`flex flex-col overflow-hidden rounded-3xl border border-[#e9deda] bg-white shadow-sm ${panelClassName}`}>
      <div className="shrink-0 flex flex-wrap items-start justify-between gap-4 border-b border-[#f0e9e5] bg-[linear-gradient(115deg,#fbfcfc,#fff)] px-5 py-4">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#2f5f54] text-white"><ClipboardList className="size-5" /></div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#2f5f54]">Live task workspace</p>
            <h2 className="text-lg font-black text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-extrabold">
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">{openCount} open</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">{completedCount} completed</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className={`min-h-0 flex-1 px-5 text-center ${compactEmpty ? 'py-6' : 'py-9'} ${contentClassName}`}>
          <CheckCircle2 className="mx-auto size-7 text-[#a4b8b3]" />
          <p className="mt-2 text-sm font-bold text-slate-700">No tasks assigned yet.</p>
          <p className="mt-1 text-xs text-slate-500">New assignments will appear here as soon as they are created.</p>
        </div>
      ) : (
        <div className={`min-h-0 flex-1 divide-y divide-[#f0e9e5] overflow-y-auto ${contentClassName}`}>
          {visibleTasks.map((task) => (
            <article key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900">{task.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />{dueLabel(task)}</span>
                  <span className="capitalize">{task.priority} priority</span>
                  {showAssignee && <span className="inline-flex items-center gap-1"><UserRound className="size-3" />{task.assignedToName}</span>}
                </div>
              </div>
              {canUpdate ? (
                <select
                  aria-label={`Status for ${task.title}`}
                  className="rounded-xl border border-[#ded5cf] bg-white px-3 py-2 text-xs font-bold text-slate-700"
                  value={task.status}
                  onChange={(event) => onUpdate({ ...task, status: event.target.value as TeamTask['status'] })}
                >
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : (
                <span className="rounded-full bg-[#f3f7f6] px-3 py-1.5 text-xs font-extrabold capitalize text-[#2f5f54]">{task.status.replaceAll('_', ' ')}</span>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
