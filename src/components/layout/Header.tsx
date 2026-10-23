'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Download, LogOut, Menu, MoreHorizontal, Search, ShieldCheck, Sparkles, Upload, UserCheck, X } from 'lucide-react';
import { ProjectStatus, TeamMember } from '@/types';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';
import { CommandPalette, useCommandShortcut, type Command } from './CommandPalette';
import { NAV_GROUPS, PAGE_TITLES, type TabType } from './navigation';

export type { TabType } from './navigation';

type AppUser = TeamMember | { id: string; name: string; role: string; email: string; roles?: string[]; permissions?: string[] } | null | undefined;

const initialsOf = (name?: string) =>
  (name ?? '').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'Y';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpenOnMobile: boolean;
  setIsOpenOnMobile: (open: boolean) => void;
  currentUser?: AppUser;
  onLogout?: () => void;
  canAccessTab?: (tab: TabType) => boolean;
}

/** The sidebar is always dark (data-theme="dark" scopes the tokens) so the lime accent reads in every theme. */
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpenOnMobile, setIsOpenOnMobile, currentUser, onLogout, canAccessTab }) => {
  const userRoles = currentUser && 'roles' in currentUser ? currentUser.roles ?? [] : [];
  const userPermissions = currentUser && 'permissions' in currentUser ? currentUser.permissions ?? [] : [];
  const roleNames = [currentUser?.role, ...userRoles].filter(Boolean).map((r) => String(r).trim().toLowerCase().replace(/[\s-]+/g, '_'));
  const isFullAdmin =
    roleNames.some((r) => ['owner', 'studio_owner', 'admin', 'super_admin'].includes(r)) ||
    (userPermissions.includes('USER_MANAGE') && userPermissions.includes('PERMISSION_ASSIGN'));
  const allowed = (tab: TabType) => (canAccessTab ? canAccessTab(tab) : true);
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => allowed(i.id)) })).filter((g) => g.items.length > 0);

  return (
    <>
      {isOpenOnMobile && <div onClick={() => setIsOpenOnMobile(false)} aria-hidden="true" className="fixed inset-0 z-40 bg-[var(--scrim)] backdrop-blur-[2px] md:hidden" />}

      <aside
        data-theme="dark"
        aria-label="Primary"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-line-soft bg-canvas text-fg transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] md:static md:translate-x-0 motion-reduce:transition-none',
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Logo priority />
          <button type="button" onClick={() => setIsOpenOnMobile(false)} aria-label="Close navigation" className="grid size-9 cursor-pointer place-items-center rounded-md text-fg-muted hover:bg-[var(--hover)] hover:text-fg md:hidden">
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 pb-6 pt-2">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-fg-subtle">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => { setActiveTab(item.id); setIsOpenOnMobile(false); }}
                        className={cn(
                          'group relative flex h-10 w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 text-left text-[13.5px] font-medium transition-colors duration-[var(--dur-base)]',
                          'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ring)]',
                          isActive ? 'bg-[var(--hover)] text-fg' : 'text-fg-muted hover:bg-[color-mix(in_srgb,var(--hover)_60%,transparent)] hover:text-fg',
                        )}
                      >
                        {isActive && <span className="absolute -left-3 top-2 h-6 w-[3px] rounded-r-full bg-lime shadow-[0_0_12px_var(--accent)]" aria-hidden="true" />}
                        <Icon className={cn('size-[18px] shrink-0 transition-colors', isActive ? 'text-brand' : 'text-fg-subtle group-hover:text-fg-muted')} aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line-soft p-3">
          <Dropdown>
            <DropdownTrigger asChild>
              <button type="button" className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] p-2 text-left transition-colors hover:bg-[var(--hover)] focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime text-xs font-bold text-on-lime">{initialsOf(currentUser?.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-fg">{currentUser?.name || 'Account'}</span>
                  <span className="flex items-center gap-1 truncate text-[11px] text-fg-subtle">
                    {isFullAdmin ? <ShieldCheck className="size-3 text-brand" aria-hidden="true" /> : <UserCheck className="size-3" aria-hidden="true" />}
                    {currentUser?.role || 'Member'}
                  </span>
                </span>
                <MoreHorizontal className="size-4 text-fg-subtle" aria-hidden="true" />
              </button>
            </DropdownTrigger>
            <DropdownContent side="top" align="start" className="w-60">
              <DropdownLabel>{currentUser?.email || 'Signed in'}</DropdownLabel>
              <DropdownSeparator />
              <DropdownItem onSelect={() => setActiveTab('settings')}><UserCheck />Account settings</DropdownItem>
              {onLogout && <DropdownItem destructive onSelect={onLogout}><LogOut />Log out</DropdownItem>}
            </DropdownContent>
          </Dropdown>
          {/* A plain, always-visible sign-out: it must never depend on a menu opening. */}
          {onLogout && (
            <button type="button" onClick={onLogout} className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2 text-left text-[13px] font-medium text-fg-muted transition-colors hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
              <LogOut className="size-4" aria-hidden="true" />Log out
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

interface TopHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  statusFilter: ProjectStatus | 'all';
  setStatusFilter: (filter: ProjectStatus | 'all') => void;
  onOpenAIModal: () => void;
  onToggleMobileSidebar: () => void;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
  currentUser?: TeamMember | { id: string; name: string; role: string; email: string } | null;
  onLogout?: () => void;
  canAccessTab?: (tab: TabType) => boolean;
  counts: { total: number; running: number; completed: number; readyToDeliver: number; pending: number; urgent: number };
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab, setActiveTab, statusFilter, setStatusFilter, onOpenAIModal, onToggleMobileSidebar, onExportData, onImportData, currentUser, onLogout, canAccessTab, counts,
}) => {
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  useCommandShortcut(React.useCallback(() => setPaletteOpen((o) => !o), []));

  const isFullAdmin = ['Owner', 'Studio Manager', 'Manager', 'Account Manager'].includes(currentUser?.role ?? '');
  const showProjectFilters = activeTab === 'projects' || activeTab === 'deliveries';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  const commands = React.useMemo<Command[]>(() => {
    const list: Command[] = [];
    for (const g of NAV_GROUPS) for (const i of g.items) {
      if (canAccessTab && !canAccessTab(i.id)) continue;
      list.push({ id: `nav-${i.id}`, label: i.label, group: 'Go to', icon: i.icon, keywords: i.keywords, run: () => setActiveTab(i.id) });
    }
    list.push({ id: 'act-ai', label: 'Open AI helper', group: 'Actions', icon: Sparkles, run: onOpenAIModal });
    if (isFullAdmin && onExportData) list.push({ id: 'act-export', label: 'Export backup', group: 'Actions', icon: Download, run: onExportData });
    if (onLogout) list.push({ id: 'act-logout', label: 'Log out', group: 'Account', icon: LogOut, run: onLogout });
    return list;
  }, [canAccessTab, setActiveTab, onOpenAIModal, isFullAdmin, onExportData, onLogout]);

  const tab = (active: boolean, danger = false) =>
    cn(
      'inline-flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]',
      active ? 'bg-surface text-fg shadow-[var(--elev-1)]' : danger ? 'text-bad hover:bg-bad-bg' : 'text-fg-muted hover:text-fg',
    );

  return (
    <header className="relative z-20 border-b border-line-soft bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileSidebar} aria-label="Open navigation"><Menu /></Button>
          {!showProjectFilters ? (
            <h1 className="truncate font-display text-lg font-semibold tracking-tight text-fg sm:text-xl">{PAGE_TITLES[activeTab]}</h1>
          ) : (
            <div role="tablist" aria-label="Project filters" className="flex items-center gap-1 overflow-x-auto rounded-[var(--radius-lg)] border border-line-soft bg-surface-sunken p-1">
              <button role="tab" aria-selected={activeTab === 'projects' && statusFilter === 'all'} className={tab(activeTab === 'projects' && statusFilter === 'all')} onClick={() => { setActiveTab('projects'); setStatusFilter('all'); }}>All ({counts.total})</button>
              <button role="tab" aria-selected={activeTab === 'projects' && statusFilter === 'running'} className={tab(activeTab === 'projects' && statusFilter === 'running')} onClick={() => { setActiveTab('projects'); setStatusFilter('running'); }}>
                <span className="size-1.5 rounded-full bg-lime shadow-[0_0_8px_var(--accent)]" aria-hidden="true" />Running ({counts.running})
              </button>
              <button role="tab" aria-selected={activeTab === 'deliveries' || (activeTab === 'projects' && statusFilter === 'ready_to_deliver')} className={tab(activeTab === 'deliveries' || (activeTab === 'projects' && statusFilter === 'ready_to_deliver'))} onClick={() => setActiveTab('deliveries')}>
                <CheckCircle2 className="size-3.5 text-ok" aria-hidden="true" />Ready ({counts.readyToDeliver})
              </button>
              <button role="tab" aria-selected={activeTab === 'projects' && statusFilter === 'urgent'} className={tab(activeTab === 'projects' && statusFilter === 'urgent', true)} onClick={() => { setActiveTab('projects'); setStatusFilter('urgent'); }}>
                <AlertCircle className="size-3.5" aria-hidden="true" />Urgent ({counts.urgent})
              </button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
           
            className="hidden h-9 w-56 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-line bg-surface px-3 text-[13px] text-fg-subtle transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-[var(--ring)] lg:flex"
          >
            <Search className="size-4" aria-hidden="true" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded border border-line px-1.5 font-mono text-[10px]">{isMac ? '⌘' : 'Ctrl'} K</kbd>
          </button>
          <Tooltip content="Search"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setPaletteOpen(true)} aria-label="Search"><Search /></Button></Tooltip>

          <Button variant="accent" size="sm" onClick={onOpenAIModal} className="px-2.5 sm:px-3" aria-label="Open AI helper"><Sparkles /><span className="hidden lg:inline">AI Helper</span></Button>

          {isFullAdmin && (onExportData || onImportData) && (
            <Dropdown>
              <DropdownTrigger asChild><Button variant="secondary" size="sm" aria-label="Backup options"><MoreHorizontal /><span className="hidden xl:inline">Backup</span></Button></DropdownTrigger>
              <DropdownContent align="end">
                {onExportData && <DropdownItem onSelect={onExportData}><Download />Export backup</DropdownItem>}
                {onImportData && (
                  <DropdownItem onSelect={(e) => e.preventDefault()} asChild>
                    <label className="cursor-pointer"><Upload />Restore backup<input type="file" accept=".json" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) { onImportData(f); e.target.value = ''; } }} /></label>
                  </DropdownItem>
                )}
              </DropdownContent>
            </Dropdown>
          )}

          {currentUser && <NotificationBell enabled />}
          {currentUser && onLogout && <Tooltip content="Log out"><Button variant="ghost" size="icon" onClick={onLogout} aria-label="Log out"><LogOut /></Button></Tooltip>}
        </div>
      </div>
      <CommandPalette commands={commands} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
};
