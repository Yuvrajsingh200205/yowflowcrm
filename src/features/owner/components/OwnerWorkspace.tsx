import React, { useState } from 'react';
import { OwnerNotepad } from './OwnerNotepad';
import { OwnerTodoList } from './OwnerTodoList';
import { OwnerExcelSheet } from './OwnerExcelSheet';
import { Crown, LayoutGrid, ListTodo, NotebookPen, Sheet, UsersRound } from 'lucide-react';
import { TeamMember, Project } from '@/types';
import { KpiCard } from '@/features/team/components/TeamUiKit';
import { BRAND } from '@/config/brand';

interface OwnerWorkspaceProps {
  projects?: Project[];
  activeTeamMembers?: TeamMember[];
}

export const OwnerWorkspace: React.FC<OwnerWorkspaceProps> = ({
  projects = [],
  activeTeamMembers = [],
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'todo' | 'notepad' | 'sheet'>('all');
  const [pendingTodosCount, setPendingTodosCount] = useState(0);
  const activeProjectsCount = projects.filter((project) => project.status !== 'completed').length;

  return (
    <div className="space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-[#CCEB8E]/35 bg-[radial-gradient(circle_at_88%_20%,rgba(204,235,142,.24),transparent_25%),radial-gradient(circle_at_8%_130%,rgba(149,158,145,.34),transparent_38%),linear-gradient(125deg,#41463E,#55333f_48%,#21241F)] p-5 text-white shadow-[0_18px_42px_rgba(32,35,31,.17)] sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10 shadow-[0_0_0_56px_rgba(255,255,255,.025),0_0_0_112px_rgba(255,255,255,.018)]" />
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#D8DBD6]">
              <span className="grid size-7 place-items-center rounded-full border border-white/15 bg-white/10">
                <Crown className="size-3.5" />
              </span>
              Owner Workspace • {BRAND.name}
            </div>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
                <NotebookPen className="size-6 text-[#DCDFDA]" />
              </span>
              To-Do List & Private Notepad
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#dfeae7] sm:text-base">
              Your private tasks and notes. Every employee gets this desk by default — only you can see your list.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Pending Tasks" value={pendingTodosCount} hint="Open items on your list" icon={ListTodo} tone="amber" onClick={() => setActiveSection('todo')} active={activeSection === 'todo'} />
        <KpiCard label="Active Projects" value={activeProjectsCount} hint="Work still in progress" icon={LayoutGrid} tone="rose" onClick={() => setActiveSection('all')} active={activeSection === 'all'} />
        <KpiCard label="Studio Team" value={activeTeamMembers.length} hint="People on the roster" icon={UsersRound} tone="emerald" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'all' as const, label: 'All Columns', icon: LayoutGrid },
            { id: 'todo' as const, label: `To-Do List & Tasks (${pendingTodosCount})`, icon: ListTodo },
            { id: 'notepad' as const, label: 'Owner Private Notepad', icon: NotebookPen },
            { id: 'sheet' as const, label: 'Excel Sheet', icon: Sheet },
          ]
        ).map((chip) => {
          const Icon = chip.icon;
          const active = activeSection === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setActiveSection(chip.id)}
              className={`flex min-w-40 shrink-0 items-center gap-3 rounded-2xl border p-3 text-left ${
                active ? 'border-[#4F554C] bg-[#373B35] text-white shadow-md' : 'border-slate-200 bg-[#FBFDF6] text-slate-700 hover:border-rose-300'
              }`}
            >
              <span className={`grid size-9 place-items-center rounded-xl ${active ? 'bg-white/15' : 'bg-white shadow-sm'}`}>
                <Icon className="size-4" />
              </span>
              <strong className="block text-xs">{chip.label}</strong>
            </button>
          );
        })}
      </div>

      {(activeSection === 'all' || activeSection === 'todo') && <OwnerTodoList onPendingCountChange={setPendingTodosCount} />}
      {(activeSection === 'all' || activeSection === 'notepad') && <OwnerNotepad />}
      <div className={activeSection === 'all' || activeSection === 'sheet' ? undefined : 'hidden'}>
        <OwnerExcelSheet />
      </div>
    </div>
  );
};
