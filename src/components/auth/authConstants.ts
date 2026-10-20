export const OWNER_USER = {
  id: 'owner-demo',
  name: 'Alex Morgan',
  role: 'Owner',
  email: 'admin@gmail.com',
  accessRoleId: 'super_admin',
};

export const DEMO_PANEL_USERS = [
  { id: 'demo-admin', name: 'Admin Panel', role: 'Admin', email: 'admin-panel@gmail.com', accessRoleId: 'admin' },
  { id: 'demo-manager', name: 'Manager Panel', role: 'Manager', email: 'manager@gmail.com', accessRoleId: 'manager' },
  { id: 'demo-employee', name: 'Employee Panel', role: 'Employee', email: 'employee@gmail.com', accessRoleId: 'employee' },
  { id: 'demo-freelancer', name: 'Freelancer Panel', role: 'Freelancer', email: 'freelancer@gmail.com', accessRoleId: 'freelancer' },
  { id: 'demo-photographer', name: 'Photographer Panel', role: 'Photographer', email: 'photographer@gmail.com', accessRoleId: 'photographer' },
  { id: 'demo-cinematographer', name: 'Cinematographer Panel', role: 'Cinematographer', email: 'cinematographer@gmail.com', accessRoleId: 'cinematographer' },
  { id: 'demo-photo-editor', name: 'Photo Editor Panel', role: 'Photo Editor', email: 'photo-editor@gmail.com', accessRoleId: 'photo_editor' },
  { id: 'demo-video-editor', name: 'Video Editor Panel', role: 'Video Editor', email: 'video-editor@gmail.com', accessRoleId: 'video_editor' },
  { id: 'demo-sales', name: 'Sales Panel', role: 'Sales Executive', email: 'sales@gmail.com', accessRoleId: 'sales_executive' },
  { id: 'demo-accountant', name: 'Finance Panel', role: 'Accountant', email: 'accountant@gmail.com', accessRoleId: 'accountant' },
  { id: 'demo-hr', name: 'HR Panel', role: 'HR', email: 'hr@gmail.com', accessRoleId: 'hr' },
  { id: 'demo-client', name: 'Client Panel', role: 'Client', email: 'client@gmail.com', accessRoleId: 'client' },
] as const;

export const DEMO_LOGIN_PASSWORD = '1234';
