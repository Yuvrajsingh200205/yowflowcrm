'use client';

import { useState } from 'react';
import { Calendar, Check, ListTodo, Plus, Trash2 } from 'lucide-react';
import { usePersonalTodos } from '@/hooks/usePersonalTodos';
import type { PersonalTodoPriority } from '@/lib/api/personalTodos';

type Filter = 'all' | 'pending' | 'completed';

export function PersonalTodoPanel({ title = 'Personal To-Do' }: { title?: string }) {
  const { data, loading, error, pending, create, update, remove, clearCompleted } = usePersonalTodos(true);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<PersonalTodoPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingCount = data.filter((item) => !item.completed).length;
  const completedCount = data.length - pendingCount;
  const rows = data.filter((item) => filter === 'all' || (filter === 'pending' ? !item.completed : item.completed));
  const message = error?.message;

  const fail = (reason: unknown, fallback: string) => {
    setActionError(reason instanceof Error ? reason.message : fallback);
  };

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    setActionError(null);
    try {
      await create({ title: text.trim(), priority, dueDate: dueDate || undefined });
      setText('');
      setDueDate('');
    } catch (reason) {
      fail(reason, 'Unable to add to-do.');
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-[#e9deda] bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f0e9e5] bg-[linear-gradient(115deg,#fbfcfc,#fff)] px-5 py-4">
        <div className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#464B43] text-white">
            <ListTodo className="size-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#464B43]">Only you can see this</p>
            <h2 className="text-lg font-black text-slate-900">{title}</h2>
            <p className="mt-0.5 text-sm text-slate-500">Assign work to yourself. These items stay private.</p>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
          {(['all', 'pending', 'completed'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-lg px-2.5 py-1 capitalize ${filter === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(event) => void add(event)} className="space-y-2 border-b border-[#f0e9e5] bg-[#FBFDF6] p-4">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Add a personal task…"
          className="w-full rounded-xl border border-[#ded5cf] bg-white px-3 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-[#464B43]/30"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as PersonalTodoPriority)}
            className="rounded-xl border border-[#ded5cf] bg-white px-2.5 py-2 text-xs font-bold"
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="rounded-xl border border-[#ded5cf] bg-white px-2.5 py-2 text-xs font-bold"
          />
          <button
            type="submit"
            disabled={pending || !text.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#464B43] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-60"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </div>
      </form>

      <div className="px-4 py-3">
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-500">Loading personal to-dos…</p>
        ) : message ? (
          <p className="py-6 text-center text-sm text-red-600">{message}</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No personal tasks yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((todo) => (
              <li
                key={todo.id}
                className={`flex items-start justify-between gap-3 rounded-2xl border px-3 py-2.5 ${todo.completed ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-[#eee7e2] bg-white'}`}
              >
                <button
                  type="button"
                  onClick={() => void update(todo.id, { completed: !todo.completed }).catch((reason) => fail(reason, 'Unable to update to-do.'))}
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${todo.completed ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'}`}
                  aria-label={todo.completed ? `Mark ${todo.title} incomplete` : `Complete ${todo.title}`}
                >
                  {todo.completed ? <Check className="size-3.5 stroke-[3]" /> : null}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-extrabold ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{todo.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase">
                    <span className={`rounded-full px-2 py-0.5 ${todo.priority === 'HIGH' ? 'bg-red-50 text-red-700' : todo.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
                      {todo.priority.toLowerCase()}
                    </span>
                    {todo.dueDate && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Calendar className="size-3" />
                        {todo.dueDate.slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(todo.id).catch((reason) => fail(reason, 'Unable to delete to-do.'))}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${todo.title}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {actionError && <p className="mt-3 text-xs font-medium text-red-600">{actionError}</p>}
        <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span>{pendingCount} pending · {completedCount} done</span>
          {completedCount > 0 && (
            <button type="button" onClick={() => void clearCompleted().catch((reason) => fail(reason, 'Unable to clear completed.'))} className="underline hover:text-red-600">
              Clear completed
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
