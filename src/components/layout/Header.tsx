import React from 'react';
import {
  Camera,
  Sparkles,
  LayoutDashboard,
  FolderKanban,
  Film,
  HardDrive,
  Users,
  Menu,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Briefcase,
  Download,
  Upload,
  LogOut,
  ShieldCheck,
  UserCheck,
  Crown,
  Target,
  Banknote,
  Heart,
  MoreHorizontal,
  Settings
} from 'lucide-react';
import { ProjectStatus, TeamMember } from '@/types';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { BRAND } from '@/config/brand';

export type TabType = 'dashboard' | 'roles' | 'projects' | 'shoots' | 'expenses' | 'data' | 'team' | 'freelancers' | 'clients' | 'deliveries' | 'owner_workspace' | 'equipment' | 'leads' | 'access' | 'settings';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isOpenOnMobile: boolean;
  setIsOpenOnMobile: (open: boolean) => void;
  currentUser?: TeamMember | { id: string; name: string; role: string; email: string; roles?: string[]; permissions?: string[] } | null;
  onLogout?: () => void;
  canAccessTab?: (tab: TabType) => boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenOnMobile,
  setIsOpenOnMobile,
  currentUser,
  onLogout,
  canAccessTab,
}) => {
  const userRoles = currentUser && 'roles' in currentUser ? currentUser.roles ?? [] : [];
  const userPermissions = currentUser && 'permissions' in currentUser ? currentUser.permissions ?? [] : [];
  const roleNames = [currentUser?.role, ...userRoles]
    .filter(Boolean)
    .map((role) => String(role).trim().toLowerCase().replace(/[\s-]+/g, '_'));
  const isFullAdmin =
    roleNames.some((role) => ['owner', 'studio_owner', 'admin', 'super_admin'].includes(role)) ||
    (userPermissions.includes('USER_MANAGE') && userPermissions.includes('PERMISSION_ASSIGN'));
  const allowed = (tab: TabType) => (canAccessTab ? canAccessTab(tab) : true);

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'owner_workspace' as TabType, label: 'My workrole', icon: Crown },
    { id: 'leads' as TabType, label: 'Leads & Inquiries', icon: Target },
    { id: 'projects' as TabType, label: 'Projects', icon: FolderKanban },
    { id: 'shoots' as TabType, label: 'Shoot Management', icon: Film },
    { id: 'data' as TabType, label: 'Data Management', icon: HardDrive },
    { id: 'team' as TabType, label: 'Team & Attendance', icon: Users },
    { id: 'freelancers' as TabType, label: 'Freelancer Team', icon: UserCheck },
    { id: 'expenses' as TabType, label: 'Finance', icon: Banknote },
    { id: 'clients' as TabType, label: 'Clients', icon: Heart },
    { id: 'equipment' as TabType, label: 'Equipment Inventory', icon: Camera },
    { id: 'access' as TabType, label: 'Roles & Permissions', icon: ShieldCheck },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ].filter((item) => allowed(item.id));

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('')
    : 'RV';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenOnMobile && (
        <div
          onClick={() => setIsOpenOnMobile(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`app-sidebar fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-700 transition-transform duration-200 transform ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
        {/* Brand Header */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="sidebar-brand text-lg font-black tracking-tight text-indigo-400">
                {BRAND.name.toUpperCase()}
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold">
                CRM Studio System
              </p>
            </div>
            <button
              onClick={() => setIsOpenOnMobile(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="sidebar-divider h-[1px] bg-slate-700 my-3" />

          {/* User Profile Block */}
          <div className="sidebar-profile flex items-center justify-between bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs flex-shrink-0 ${isFullAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}>
                {userInitials}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'Alex Morgan'}</p>
                <p className="text-[10px] text-indigo-300 font-medium truncate flex items-center gap-1">
                  {isFullAdmin ? <ShieldCheck className="w-3 h-3 text-indigo-400 inline" /> : <UserCheck className="w-3 h-3 text-emerald-400 inline" />}
                  <span>{currentUser?.role || 'Owner'}</span>
                </p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Switch Role / Logout"
                className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Item Links */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpenOnMobile(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors text-left ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

        </nav>

        {/* Footer Status & Logout button */}
        <div className="sidebar-footer p-4 mt-auto border-t border-slate-800 bg-slate-950/40 space-y-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="sidebar-switch w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <LogOut className="w-3.5 h-3.5 text-indigo-400" />
              <span>Logout</span>
            </button>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
            <span>Access: {isFullAdmin ? 'FULL ADMIN' : 'ROLE RESTRICTED'}</span>
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>Active</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const PAGE_ICONS: Record<TabType, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  roles: Briefcase,
  projects: FolderKanban,
  shoots: Film,
  expenses: Banknote,
  data: HardDrive,
  team: Users,
  freelancers: UserCheck,
  clients: Heart,
  deliveries: CheckCircle2,
  owner_workspace: Crown,
  equipment: Camera,
  leads: Target,
  access: ShieldCheck,
  settings: Settings,
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
  counts: {
    total: number;
    running: number;
    completed: number;
    readyToDeliver: number;
    pending: number;
    urgent: number;
  };
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  statusFilter,
  setStatusFilter,
  onOpenAIModal,
  onToggleMobileSidebar,
  onExportData,
  onImportData,
  currentUser,
  counts,
}) => {
  const isFullAdmin = currentUser?.role === 'Owner' || currentUser?.role === 'Studio Manager' || currentUser?.role === 'Manager' || currentUser?.role === 'Account Manager';
  const showProjectFilters = activeTab === 'projects' || activeTab === 'deliveries';
  const pageTitles: Record<TabType, string> = {
    dashboard: 'Studio Dashboard',
    roles: 'My Desk',
    projects: 'Projects',
    shoots: 'Shoot Management',
    expenses: 'Expense Management',
    data: 'Data Management',
    team: 'Team & Attendance',
    freelancers: 'Freelancer Team',
    clients: 'Clients',
    deliveries: 'Deliveries',
    owner_workspace: 'Owner Workspace',
    equipment: 'Equipment Inventory',
    leads: 'Leads & Inquiries',
    access: 'Roles & Permissions',
    settings: 'Settings',
  };
  const PageIcon = PAGE_ICONS[activeTab];
  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : BRAND.shortName.slice(0, 2).toUpperCase();

  return (
    <header className="relative z-20 border-b border-[#e8ddd7] bg-[linear-gradient(180deg,#fffdfb_0%,#f8f1ee_100%)] shadow-[0_4px_18px_rgba(34,37,33,0.05)]">
      <div className="h-1 bg-[linear-gradient(90deg,#ddc89c_0%,#8f3655_48%,#6d2f45_100%)]" />
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 overflow-x-auto scrollbar-none">
          <button
            onClick={onToggleMobileSidebar}
            className="shrink-0 rounded-lg border border-[#e4d8d2] p-2 text-[#3F443C] transition hover:bg-[#F4F5F3] md:hidden"
            title="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {!showProjectFilters ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-[#CCEB8E]/50 bg-[linear-gradient(145deg,#464B43,#373B35)] text-white shadow-[0_8px_16px_rgba(55,59,53,.22)]">
                <PageIcon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold tracking-tight text-[#1C1F1B] sm:text-base">{pageTitles[activeTab]}</p>
                <p className="hidden items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-[#a07a4a] sm:flex">
                  <span className="size-1.5 rounded-full bg-[#CCEB8E]" />
                  {BRAND.name}
                </p>
              </div>
            </div>
          ) : <div className="flex items-center gap-4 whitespace-nowrap text-xs font-semibold text-slate-600 sm:gap-6 sm:text-sm">
            <button
              onClick={() => {
                setActiveTab('projects');
                setStatusFilter('all');
              }}
              className={`py-3 px-1 border-b-2 transition ${activeTab === 'projects' && statusFilter === 'all'
                ? 'text-rose-800 border-rose-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              All Projects ({counts.total})
            </button>

            <button
              onClick={() => {
                setActiveTab('projects');
                setStatusFilter('running');
              }}
              className={`py-3 px-1 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'projects' && statusFilter === 'running'
                ? 'text-rose-800 border-rose-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
              <span>Running ({counts.running})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('deliveries');
              }}
              className={`py-3 px-1 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'deliveries' || (activeTab === 'projects' && statusFilter === 'ready_to_deliver')
                ? 'text-rose-800 border-rose-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>Ready ({counts.readyToDeliver})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('projects');
                setStatusFilter('urgent');
              }}
              className={`py-3 px-1 border-b-2 transition flex items-center gap-1.5 ${activeTab === 'projects' && statusFilter === 'urgent'
                ? 'text-red-600 border-red-600 font-bold'
                : 'border-transparent text-red-500 hover:text-red-700'
                }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Urgent ({counts.urgent})</span>
            </button>
          </div>}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenAIModal}
            title="Open AI Helper"
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#CCEB8E]/70 bg-[#F4FBE6] px-2.5 text-xs font-bold text-[#7a5a2e] transition hover:bg-[#E9F6CF] sm:px-3"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden lg:inline">AI Helper</span>
          </button>

          {isFullAdmin && (onExportData || onImportData) && (
            <details className="group relative">
              <summary className="flex h-9 cursor-pointer list-none items-center gap-1 rounded-xl border border-[#e4d8d2] bg-white px-2.5 text-xs font-bold text-[#393E37] transition hover:bg-[#faf5f3] [&::-webkit-details-marker]:hidden">
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden xl:inline">Backup</span>
              </summary>
              <div className="absolute right-0 top-11 z-40 w-44 space-y-1 rounded-xl border border-[#e4d8d2] bg-white p-2 shadow-[0_14px_35px_rgba(27,29,26,.16)]">
                {onExportData && <button onClick={onExportData} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-[#F4F5F3]"><Download className="h-4 w-4 text-rose-700" />Export backup</button>}
                {onImportData && <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-[#F4F5F3]"><Upload className="h-4 w-4 text-rose-700" />Restore backup<input type="file" accept=".json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { onImportData(file); e.target.value = ''; } }} /></label>}
              </div>
            </details>
          )}

          {currentUser && <NotificationBell enabled />}

          {currentUser && (
            <div className="hidden items-center gap-2 rounded-2xl border border-[#e8ddd7] bg-white/80 py-1 pl-1 pr-3 sm:flex">
              <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(145deg,#464B43,#373B35)] text-[10px] font-black text-white">
                {userInitials}
              </span>
              <span className="min-w-0">
                <span className="block max-w-36 truncate text-xs font-extrabold text-[#1C1F1B]">{currentUser.name}</span>
                <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-[#a07a4a]">{currentUser.role}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
