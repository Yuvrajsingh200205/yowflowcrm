import type { TabType } from '@/components/layout';

export const TAB_ROUTES: Record<TabType, string> = {
  dashboard: '/dashboard',
  owner_workspace: '/owner-workspace',
  equipment: '/equipment',
  roles: '/workspaces',
  leads: '/leads',
  projects: '/projects',
  shoots: '/shoots',
  expenses: '/expenses',
  data: '/data-management',
  team: '/team',
  freelancers: '/freelancers',
  clients: '/clients',
  deliveries: '/deliveries',
  access: '/roles-permissions',
  settings: '/settings',
  quotes: '/quotes',
  sales_setup: '/sales-setup',
};

export const ROUTE_TABS = Object.fromEntries(
  Object.entries(TAB_ROUTES).map(([tab, route]) => [route, tab]),
) as Record<string, TabType>;
