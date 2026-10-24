import {
  Banknote, Camera, Crown, FileText, Film, FolderKanban, HardDrive, Heart, LayoutDashboard, Settings, ShieldCheck, SlidersHorizontal, Target, UserCheck, Users,
  type LucideIcon,
} from 'lucide-react';

export type TabType = 'dashboard' | 'roles' | 'projects' | 'shoots' | 'expenses' | 'data' | 'team' | 'freelancers' | 'clients' | 'deliveries' | 'owner_workspace' | 'equipment' | 'leads' | 'access' | 'settings' | 'quotes' | 'sales_setup';

export type NavItem = { id: TabType; label: string; icon: LucideIcon; keywords?: string };
export type NavGroup = { label: string; items: NavItem[] };

/** One source of truth for sidebar + command palette. */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview stats' },
      { id: 'owner_workspace', label: 'My workrole', icon: Crown, keywords: 'owner desk' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { id: 'leads', label: 'Leads & Inquiries', icon: Target, keywords: 'enquiry pipeline meta' },
      { id: 'quotes', label: 'Quotes', icon: FileText, keywords: 'quotation proposal estimate price send whatsapp' },
      { id: 'clients', label: 'Clients', icon: Heart, keywords: 'couples customers' },
      { id: 'sales_setup', label: 'Sales setup', icon: SlidersHorizontal, keywords: 'packages pricing catalogue booking page enquiry availability calendar upi gst reminders' },
    ],
  },
  {
    label: 'Production',
    items: [
      { id: 'projects', label: 'Projects', icon: FolderKanban, keywords: 'weddings events' },
      { id: 'shoots', label: 'Shoot Management', icon: Film, keywords: 'schedule calendar crew' },
      { id: 'equipment', label: 'Equipment Inventory', icon: Camera, keywords: 'gear cameras lenses' },
      { id: 'data', label: 'Data Management', icon: HardDrive, keywords: 'footage storage backup' },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'team', label: 'Team & Attendance', icon: Users, keywords: 'staff leave payroll' },
      { id: 'freelancers', label: 'Freelancer Team', icon: UserCheck, keywords: 'vendors talent' },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'expenses', label: 'Finance', icon: Banknote, keywords: 'invoices payments expenses money' },
      { id: 'access', label: 'Roles & Permissions', icon: ShieldCheck, keywords: 'access security' },
      { id: 'settings', label: 'Settings', icon: Settings, keywords: 'profile preferences' },
    ],
  },
];

export const PAGE_TITLES: Record<TabType, string> = {
  dashboard: 'Dashboard',
  roles: 'My Desk',
  projects: 'Projects',
  shoots: 'Shoot Management',
  expenses: 'Finance',
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
  quotes: 'Quotes',
  sales_setup: 'Sales setup',
};
