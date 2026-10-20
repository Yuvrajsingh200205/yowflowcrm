'use client';

import React, { useMemo, useState } from 'react';
import { Project, ProjectStatus } from '@/types';
import { computeAutoProjectStatus } from '@/utils/projectStatusCalculator';
import { formatDateDDMMYYYY } from '@/utils/shootTracking';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  Heart,
  IndianRupee,
  MapPin,
  Phone,
  ImagePlus,
  Search,
  Sparkles,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { Badge, BTN_CREAM, BTN_GHOST, BTN_PRIMARY, CARD, EmptyState, FIELD, KpiCard } from '@/features/team/components/TeamUiKit';
import { usePermission } from '@/features/access';
import { useClientPortalSync } from '@/features/client-portal';
import { GalleryUploadModal } from '@/features/client-portal/GalleryUploadModal';
import { BRAND } from '@/config/brand';

interface ClientsDirectoryViewProps {
  projects: Project[];
  onOpenClient: (project: Project) => void;
  onAddClient: () => void;
}

type ClientFilter = 'all' | 'running' | 'upcoming' | 'balance' | 'completed' | 'urgent';

const money = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const effectiveStatus = (p: Project): ProjectStatus => {
  const work = computeAutoProjectStatus(p);
  if (p.status === 'ready_to_deliver') return 'ready_to_deliver';
  if (work.autoStatus === 'completed' || work.autoStatus === 'ready_to_deliver') return work.autoStatus;
  return p.status || work.autoStatus;
};

const statusTone = (status: ProjectStatus) => {
  if (status === 'ready_to_deliver') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'completed') return 'border-violet-200 bg-violet-50 text-violet-800';
  if (status === 'urgent') return 'border-red-200 bg-red-50 text-red-700';
  if (status === 'pending' || status === 'new_project') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-rose-200 bg-rose-50 text-[#254b42]';
};

const initials = (name?: string) =>
  (name || 'CL')
    .split(/[&\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const ClientsDirectoryView: React.FC<ClientsDirectoryViewProps> = ({
  projects,
  onOpenClient,
  onAddClient,
}) => {
  const { can } = usePermission();
  // Keeps each wedding's gallery prepared so "Open Portal" is never an empty screen.
  const { hydrated: portalReady, openPortal } = useClientPortalSync(projects);
  const canAdd = can('clients.create');
  const canSeePay = can('finance.view_payments');
  const [galleryProject, setGalleryProject] = useState<Project | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('all');
  const today = new Date().toISOString().split('T')[0];

  const nextShootOf = (project: Project) =>
    [...(project.shoots || [])]
      .filter((s) => s.date && s.date >= today && s.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date))[0];

  const stats = useMemo(() => {
    const running = projects.filter((p) => ['running', 'new_project', 'pending', 'urgent'].includes(effectiveStatus(p)));
    const completed = projects.filter((p) => ['completed', 'ready_to_deliver'].includes(effectiveStatus(p)));
    const urgent = projects.filter((p) => effectiveStatus(p) === 'urgent');
    const withUpcoming = projects.filter((p) => !!nextShootOf(p));
    const withBalance = projects.filter((p) => (p.balanceDue || 0) > 0);
    return {
      total: projects.length,
      running: running.length,
      completed: completed.length,
      urgent: urgent.length,
      upcoming: withUpcoming.length,
      balance: withBalance.length,
      package: projects.reduce((sum, p) => sum + (p.totalBudget || 0), 0),
      received: projects.reduce((sum, p) => sum + (p.advanceReceived || 0), 0),
      due: projects.reduce((sum, p) => sum + (p.balanceDue || 0), 0),
    };
  }, [projects, today]);

  const clients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...projects]
      .filter((p) => {
        const status = effectiveStatus(p);
        const hay = [p.clientWeddingTitle, p.clientContactMobile, p.venueLocation, p.primaryServiceType]
          .join(' ')
          .toLowerCase();
        const matchesSearch = !q || hay.includes(q);
        if (!matchesSearch) return false;
        if (filter === 'running') return ['running', 'new_project', 'pending', 'urgent'].includes(status);
        if (filter === 'completed') return ['completed', 'ready_to_deliver'].includes(status);
        if (filter === 'urgent') return status === 'urgent';
        if (filter === 'upcoming') return !!nextShootOf(p);
        if (filter === 'balance') return (p.balanceDue || 0) > 0;
        return true;
      })
      .sort((a, b) => {
        const aDate = nextShootOf(a)?.date || a.weddingFunctionDates || '';
        const bDate = nextShootOf(b)?.date || b.weddingFunctionDates || '';
        return aDate.localeCompare(bDate);
      });
  }, [projects, search, filter, today]);

  const upcoming = useMemo(
    () =>
      [...projects]
        .map((project) => ({ project, shoot: nextShootOf(project) }))
        .filter((row) => row.shoot)
        .sort((a, b) => (a.shoot?.date || '').localeCompare(b.shoot?.date || ''))
        .slice(0, 5),
    [projects, today]
  );

  const allChips: { id: ClientFilter; label: string; detail: string; count: number; icon: typeof Heart; danger?: boolean }[] = [
    { id: 'all', label: 'All Clients', detail: 'Booked families', count: stats.total, icon: Heart },
    { id: 'running', label: 'Active', detail: 'Work in progress', count: stats.running, icon: Clock3 },
    { id: 'upcoming', label: 'Upcoming', detail: 'Next shoot booked', count: stats.upcoming, icon: CalendarDays },
    { id: 'balance', label: 'Balance Due', detail: 'Pending collection', count: stats.balance, icon: CircleDollarSign },
    { id: 'completed', label: 'Completed', detail: 'Work finished', count: stats.completed, icon: CheckCircle2 },
    { id: 'urgent', label: 'Urgent', detail: 'Needs attention', count: stats.urgent, icon: AlertCircle, danger: true },
  ];
  const chips = allChips.filter((chip) => canSeePay || chip.id !== 'balance');

  return (
    <div className="space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-[#ddc89c]/35 bg-[radial-gradient(circle_at_88%_20%,rgba(221,200,156,.24),transparent_25%),radial-gradient(circle_at_8%_130%,rgba(124,179,166,.34),transparent_38%),linear-gradient(125deg,#33514A,#55333f_48%,#1b2825)] p-5 text-white shadow-[0_18px_42px_rgba(27,39,36,.17)] sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10 shadow-[0_0_0_56px_rgba(255,255,255,.025),0_0_0_112px_rgba(255,255,255,.018)]" />
        <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#d0e1dd]">
              <span className="grid size-7 place-items-center rounded-full border border-white/15 bg-white/10">
                <Heart className="size-3.5" />
              </span>
              Studio Clients Desk • {BRAND.name}
            </div>
            <h1 className="mt-3 flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
                <UsersRound className="size-6 text-[#d5e4e1]" />
              </span>
              Client Directory
            </h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#dfeae7] sm:text-base">
              Wedding couples, package balances, upcoming shoots, and delivery status — from your existing booked projects.
            </p>
          </div>
          {canAdd && (
          <button type="button" onClick={onAddClient} className={BTN_CREAM}>
            <UserPlus className="size-4" />
            Add Client
          </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total Clients" value={stats.total} hint="Booked wedding families" icon={Heart} tone="rose" onClick={() => setFilter('all')} active={filter === 'all'} />
        <KpiCard label="Active Work" value={stats.running} hint="Running and pending projects" icon={Clock3} tone="amber" onClick={() => setFilter('running')} active={filter === 'running'} />
        <KpiCard label="Upcoming Shoots" value={stats.upcoming} hint="Clients with a date ahead" icon={CalendarDays} tone="blue" onClick={() => setFilter('upcoming')} active={filter === 'upcoming'} />
        {canSeePay ? (
        <KpiCard label="Balance Due" value={money(stats.due)} hint={`${money(stats.received)} collected of ${money(stats.package)}`} icon={IndianRupee} tone="red" onClick={() => setFilter('balance')} active={filter === 'balance'} />
        ) : (
        <KpiCard label="Completed" value={stats.completed || 0} hint="Delivered weddings" icon={CheckCircle2} tone="emerald" onClick={() => setFilter('completed')} active={filter === 'completed'} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className={`${CARD} p-4 sm:p-5 xl:col-span-2`}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-[#366e61]" />
            <input
              className={`${FIELD} pl-10`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search couple name, mobile, venue or service"
              aria-label="Search clients"
            />
          </div>
          <p className="mb-2 mt-4 text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Choose what you want to see</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {chips.map((chip) => {
              const Icon = chip.icon;
              const active = filter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setFilter(chip.id)}
                  className={`flex min-w-40 shrink-0 items-center gap-3 rounded-2xl border p-3 text-left ${
                    active
                      ? 'border-[#3b665c] bg-[#254b42] text-white shadow-md'
                      : chip.danger
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-slate-200 bg-[#fbfaf8] text-slate-700 hover:border-rose-300'
                  }`}
                >
                  <span className={`grid size-9 place-items-center rounded-xl ${active ? 'bg-white/15' : 'bg-white shadow-sm'}`}>
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <strong className="block text-xs">
                      {chip.label} <b className="ml-1">{chip.count}</b>
                    </strong>
                    <small className={active ? 'text-rose-100' : 'text-slate-500'}>{chip.detail}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={`${CARD} p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Upcoming clients</h3>
            <button type="button" onClick={() => setFilter('upcoming')} className="text-xs font-bold text-[#2f5f54]">
              View all
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-xs font-medium text-slate-500">No upcoming shoots on the books.</p>
            ) : (
              upcoming.map(({ project, shoot }) => (
                <button
                  key={`${project.id}-${shoot?.id}`}
                  type="button"
                  onClick={() => onOpenClient(project)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#eee7e2] bg-[#fbfaf8] px-3 py-2.5 text-left transition hover:border-rose-200"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-extrabold text-slate-900">{project.clientWeddingTitle}</span>
                    <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                      {shoot?.title} · {shoot?.location || shoot?.venue || project.venueLocation || 'Venue pending'}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[#2f5f54] px-2.5 py-1 text-[10px] font-extrabold text-white">
                    {formatDateDDMMYYYY(shoot?.date)}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">
            {filter === 'all' ? 'All Studio Clients' : chips.find((c) => c.id === filter)?.label}
          </h2>
          <p className="text-xs font-medium text-slate-500">
            Showing {clients.length} of {projects.length} clients
          </p>
        </div>
        <p className="hidden text-xs font-semibold text-slate-500 sm:block">
          <Eye className="mr-1 inline size-4" />
          Open a card for vault, payments and shoots
        </p>
      </div>

      {clients.length === 0 ? (
        <div className={CARD}>
          <EmptyState
            icon={Heart}
            title={projects.length === 0 ? 'No clients yet' : 'No matching clients'}
            message={
              projects.length === 0
                ? 'Booked weddings appear here from your project records.'
                : 'Try another filter or search by couple name, mobile or venue.'
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {projects.length > 0 && (
                  <button type="button" onClick={() => { setSearch(''); setFilter('all'); }} className={BTN_GHOST}>
                    Clear filters
                  </button>
                )}
                {canAdd && (
                <button type="button" onClick={onAddClient} className={BTN_PRIMARY}>
                  <UserPlus className="size-3.5" /> Add Client
                </button>
                )}
              </div>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((project, index) => {
            const status = effectiveStatus(project);
            const work = computeAutoProjectStatus(project);
            const nextShoot = nextShootOf(project);
            const collection = project.totalBudget ? Math.round((project.advanceReceived / project.totalBudget) * 100) : 0;
            return (
              <article
                key={project.id}
                className={`${CARD} group overflow-hidden transition hover:-translate-y-1 hover:border-rose-300 hover:shadow-xl`}
              >
                <button type="button" onClick={() => onOpenClient(project)} className="block w-full p-5 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e0ece9] text-xs font-black text-[#254b42]">
                        {initials(project.clientWeddingTitle)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#366e61]">
                          Client {String(index + 1).padStart(2, '0')} · {project.primaryServiceType || 'Wedding'}
                        </p>
                        <h3 className="mt-0.5 truncate text-lg font-black text-slate-900 group-hover:text-rose-800">
                          {project.clientWeddingTitle}
                        </h3>
                      </div>
                    </div>
                    <Badge className={statusTone(status)}>{status.replaceAll('_', ' ')}</Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex min-w-0 gap-2 rounded-xl bg-[#fbfaf8] p-2.5">
                      <Phone className="mt-0.5 size-4 shrink-0 text-[#366e61]" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Contact</p>
                        <p className="truncate font-semibold text-slate-700">{project.clientContactMobile || 'Not added'}</p>
                      </div>
                    </div>
                    <div className="flex min-w-0 gap-2 rounded-xl bg-[#fbfaf8] p-2.5">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#366e61]" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Wedding</p>
                        <p className="truncate font-semibold text-slate-700">
                          {formatDateDDMMYYYY(project.weddingFunctionDates) || 'Date TBD'}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 flex min-w-0 gap-2 rounded-xl bg-[#fbfaf8] p-2.5">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-[#366e61]" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Venue</p>
                        <p className="truncate font-semibold text-slate-700">{project.venueLocation || 'Venue pending'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-[#eee7e2] bg-[#fbfaf8] px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Next shoot</p>
                    <p className="text-xs font-extrabold text-slate-800">
                      {nextShoot
                        ? `${formatDateDDMMYYYY(nextShoot.date)} · ${nextShoot.title}`
                        : 'No upcoming shoot'}
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex justify-between text-xs">
                      <b className="text-slate-600">Work progress</b>
                      <strong>
                        {work.completedItems}/{work.totalItems} tasks · {work.completionPercent}%
                      </strong>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3b665c] to-[#b99a5e]"
                        style={{ width: `${work.completionPercent}%` }}
                      />
                    </div>
                  </div>

                  {canSeePay && (
                  <div className="mt-3 grid grid-cols-3 text-center">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">Package</p>
                      <p className="mt-1 text-xs font-black">{money(project.totalBudget)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">Received</p>
                      <p className="mt-1 text-xs font-black text-emerald-700">{money(project.advanceReceived)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">Due</p>
                      <p className="mt-1 text-xs font-black text-red-600">{money(project.balanceDue)}</p>
                    </div>
                  </div>
                  )}
                  {canSeePay && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Payment collection</span>
                      <span>{collection}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, collection)}%` }} />
                    </div>
                  </div>
                  )}
                </button>
                <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eee7e2] bg-[#fbfaf8] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onOpenClient(project)} className={BTN_PRIMARY}>
                      <Eye className="size-3.5" /> Open Client
                    </button>
                    <button
                      type="button"
                      disabled={!portalReady}
                      onClick={() => openPortal(project.id)}
                      title="Open this couple's Luxury Client Gallery in a new tab"
                      className={BTN_GHOST}
                    >
                      <Sparkles className="size-3.5 text-[#a07a4a]" /> Open Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryProject(project)}
                      title="Upload and manage this couple's gallery photos"
                      className={BTN_GHOST}
                    >
                      <ImagePlus className="size-3.5 text-[#2f5f54]" /> Photos
                    </button>
                  </div>
                  {nextShoot && (
                    <span className="rounded-full border border-[#ddc89c] bg-[#f9f3e8] px-2.5 py-1 text-[10px] font-extrabold text-[#8a6d3b]">
                      {formatDateDDMMYYYY(nextShoot.date)}
                    </span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {galleryProject && (
        <GalleryUploadModal project={galleryProject} onClose={() => setGalleryProject(null)} />
      )}
    </div>
  );
};
