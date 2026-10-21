import { apiRequest } from './client';

/** Studio-side management of the couple's portal: access, gallery gates and the couple's activity. */
export interface PortalAccessUser { id: string; email: string; fullName: string; phone: string | null; status: 'INVITED' | 'ACTIVE' | 'SUSPENDED'; invitedAt: string | null; lastLoginAt: string | null; createdAt: string }
export interface AdminSection {
  id: string; name: string; description: string | null; sectionDate: string | null; venueName: string | null; status: string; orderIndex: number;
  isVisibleToClient: boolean; isDownloadAllowed: boolean; isShareAllowed: boolean; hasWatermark: boolean; mediaCount: number;
  subFolders: Array<{ id: string; name: string; isClientVisible: boolean }>;
}
export interface AdminGallery { id: string; title: string; status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; welcomeMessage: string | null; albumSelectionTarget: number; expectedDeliveryDate: string | null; publishedAt: string | null }
export interface GallerySettings { gallery: AdminGallery; sections: AdminSection[]; pendingDerivatives: number }
export interface ClientActivity {
  portalUsers: Array<{ id: string; fullName: string; email: string; status: string; lastLoginAt: string | null; favorites: number }>;
  requests: Array<{ id: string; type: string; status: string; title: string; description: string; adminResponse: string | null; createdAt: string; resolvedAt: string | null; from: string }>;
  comments: Array<{ id: string; body: string; type: string; isResolved: boolean; createdAt: string; mediaId: string | null; mediaTitle: string | null; from: string; fromStudio: boolean }>;
  albumSelection: Array<{ mediaId: string; title: string; fileName: string; section: string; selectedAt: string }>;
  shareLinks: Array<{ id: string; title: string; accessType: string; status: string; viewsCount: number; downloadsCount: number; expiresAt: string | null; createdAt: string }>;
}

const g = (projectId: string) => `/projects/${encodeURIComponent(projectId)}/gallery`;
const body = (method: string, b?: unknown): RequestInit => ({ method, ...(b === undefined ? {} : { body: JSON.stringify(b) }) });

export const portalAdminApi = {
  access: {
    list: async (clientId: string) => (await apiRequest<PortalAccessUser[]>(`/clients/${clientId}/portal-access`, { fresh: true })).data,
    invite: async (clientId: string, b: { email: string; fullName: string; phone?: string }) => (await apiRequest<PortalAccessUser>(`/clients/${clientId}/portal-access`, body('POST', b))).data,
    setStatus: async (clientId: string, id: string, status: 'ACTIVE' | 'SUSPENDED') => (await apiRequest<PortalAccessUser>(`/clients/${clientId}/portal-access/${id}`, body('PATCH', { status }))).data,
    remove: async (clientId: string, id: string) => { await apiRequest(`/clients/${clientId}/portal-access/${id}`, body('DELETE')); },
  },
  gallery: {
    settings: async (projectId: string) => (await apiRequest<GallerySettings>(`${g(projectId)}/settings`, { fresh: true })).data,
    update: async (projectId: string, b: Partial<{ title: string; welcomeMessage: string | null; albumSelectionTarget: number; expectedDeliveryDate: string | null; status: AdminGallery['status'] }>) => (await apiRequest<AdminGallery>(g(projectId), body('PATCH', b))).data,
    createSection: async (projectId: string, name: string) => (await apiRequest<{ id: string; name: string }>(`${g(projectId)}/sections`, body('POST', { name }))).data,
    updateSection: async (projectId: string, id: string, b: Partial<Pick<AdminSection, 'name' | 'isVisibleToClient' | 'isDownloadAllowed' | 'isShareAllowed' | 'hasWatermark'>>) => (await apiRequest(`${g(projectId)}/sections/${id}`, body('PATCH', b))).data,
    deleteSection: async (projectId: string, id: string) => { await apiRequest(`${g(projectId)}/sections/${id}`, body('DELETE')); },
    createFolder: async (projectId: string, sectionId: string, name: string) => (await apiRequest(`${g(projectId)}/sections/${sectionId}/folders`, body('POST', { name }))).data,
    deleteFolder: async (projectId: string, id: string) => { await apiRequest(`${g(projectId)}/folders/${id}`, body('DELETE')); },
    backfill: async (projectId: string) => (await apiRequest<{ processed?: number; remaining?: number }>(`${g(projectId)}/derivatives`, body('POST'))).data,
  },
  activity: {
    get: async (projectId: string) => (await apiRequest<ClientActivity>(`${g(projectId)}/client-activity`, { fresh: true })).data,
    respond: async (projectId: string, requestId: string, b: { status?: string; adminResponse?: string }) => (await apiRequest(`${g(projectId)}/requests/${requestId}`, body('PATCH', b))).data,
    reply: async (projectId: string, commentId: string, text: string) => (await apiRequest(`${g(projectId)}/comments/${commentId}/reply`, body('POST', { body: text }))).data,
  },
};
