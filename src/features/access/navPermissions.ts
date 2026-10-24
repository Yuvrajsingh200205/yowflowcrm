import type { TabType } from '@/components/layout/Header';

/** Sidebar item → one or more view permissions (any match grants the tab). */
export const TAB_PERMISSIONS: Partial<Record<TabType, string | string[]>> = {
  dashboard: 'DASHBOARD_VIEW',
  equipment: ['settings.view', 'SETTING_VIEW'],
  leads: 'LEAD_VIEW',
  projects: 'PROJECT_VIEW',
  shoots: 'SHOOT_VIEW',
  expenses: ['EXPENSE_VIEW', 'PAYMENT_VIEW', 'INVOICE_VIEW', 'REPORT_VIEW'],
  data: 'DATA_MANAGEMENT_VIEW',
  team: ['TEAM_VIEW_SELF', 'TEAM_VIEW', 'TEAM_VIEW_ALL', 'ATTENDANCE_VIEW_SELF', 'ATTENDANCE_VIEW_ALL'],
  freelancers: 'FREELANCER_VIEW',
  clients: 'CLIENT_VIEW',
  deliveries: 'DELIVERY_VIEW',
  // Reading the roles desk needs ROLE_VIEW; the create/edit/delete actions on
  // the page are gated separately on their own permissions.
  access: 'ROLE_VIEW',
  settings: ['SETTING_VIEW', 'ORG_VIEW'],
  quotes: ['QUOTATION_VIEW', 'QUOTATION_CREATE'],
  sales_setup: ['CATALOG_VIEW', 'CATALOG_MANAGE', 'BOOKING_SETUP_MANAGE'],
};
