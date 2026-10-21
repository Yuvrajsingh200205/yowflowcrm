import { ApiError, apiBaseUrl } from '@/lib/api/client';

/**
 * Client-portal API. Separate from the staff client on purpose: different
 * cookies (httpOnly, set by the API), different refresh endpoint, and a 401
 * here must never touch a staff session.
 */

export interface PortalMe {
  user: { id: string; email: string; fullName: string; phone: string | null; lastLoginAt: string | null };
  client: { id: string; displayName: string; brideName: string | null; groomName: string | null };
  studio: { name: string; slug: string; phone: string | null; email: string | null; website: string | null };
}
export interface Studio { name: string; phone: string | null; email: string | null; website: string | null }

export interface ProjectCard {
  id: string; projectNumber: string; name: string; type: string; status: string; weddingDate: string | null; deliveryDueDate: string | null; venueName: string | null; venueCity: string | null;
  payments: { total: number; received: number; balance: number };
  gallery: { published: boolean; mediaCount: number; expectedDeliveryDate: string | null };
  openRequests: number;
}
export interface ProjectList { unreadNotifications: number; projects: ProjectCard[] }

export interface ProjectDetail {
  project: { id: string; projectNumber: string; name: string; type: string; status: string; weddingDate: string | null; deliveryDueDate: string | null; venueName: string | null; venueAddress: string | null; venueCity: string | null; totalQuotation: number };
  events: Array<{ id: string; name: string; eventDate: string; startTime: string | null; endTime: string | null; venueName: string | null; city: string | null; status: string }>;
  payments: {
    total: number; received: number; balance: number;
    milestones: Array<{ id: string; title: string; dueDate: string | null; amount: number; status: string }>;
    invoices: Array<{ id: string; invoiceNumber: string; issueDate: string; dueDate: string | null; total: number; amountPaid: number; amountDue: number; status: string }>;
    history: Array<{ id: string; paymentNumber: string; amount: number; paymentDate: string; paymentMethod: string }>;
  };
  deliveries: Array<{ id: string; title: string; type: string; status: string; expectedDate: string | null; deliveredDate: string | null }>;
  studio: Studio | null;
}

export interface GallerySection {
  id: string; name: string; description: string | null; sectionDate: string | null; venueName: string | null; status: string;
  downloadAllowed: boolean; shareAllowed: boolean; watermark: boolean; mediaCount: number; subFolders: Array<{ id: string; name: string; mediaCount: number }>;
}
export interface GalleryOverview {
  available: boolean;
  project: { id: string; name: string };
  gallery: { id?: string; title: string; welcomeMessage?: string | null; albumSelectionTarget?: number; expectedDeliveryDate: string | null; publishedAt?: string | null } | null;
  sections: GallerySection[];
  totals: { media: number; photos: number; videos: number };
  selection: { favorites: number; album: number; albumTarget: number; submittedAt: string | null; submissionStatus: string | null } | null;
  studio: Studio | null;
}
export interface MediaItem {
  id: string; sectionId: string; subFolderId: string | null; title: string; mediaType: 'IMAGE' | 'VIDEO'; orientation: string | null; durationSeconds: number | null;
  thumbUrl: string; previewUrl: string; width: number | null; height: number | null; isFavorite: boolean; isAlbumPick: boolean; downloadAllowed: boolean; watermarked: boolean;
}
export interface MediaPage { items: MediaItem[]; nextCursor: string | null }
export interface MediaDetail extends Omit<MediaItem, 'sectionId' | 'subFolderId' | 'orientation' | 'watermarked'> { sectionName: string; originalName: string; sizeBytes: number; comments: PortalComment[] }
export interface PortalComment { id: string; mediaId: string | null; type: string; body: string; isResolved: boolean; createdAt: string; author: string; fromStudio: boolean; mine: boolean }
export interface PortalRequest { id: string; type: string; status: string; title: string; description: string; adminResponse: string | null; relatedMediaId: string | null; createdAt: string; updatedAt: string; resolvedAt: string | null }
export interface PortalShareLink { id: string; token: string; title: string; accessType: string; status: string; expiresAt: string | null; viewsCount: number; downloadsCount: number; passwordProtected: boolean; sectionId: string | null; selectedCount: number; createdAt: string }
export interface PortalNotification { id: string; type: string; title: string; message: string; actionPath: string | null; actionLabel: string | null; isRead: boolean; createdAt: string; projectId: string | null }

type Envelope<T> = { success: true; data: T } | { success: false; error?: { message?: string; code?: string; details?: unknown[] } };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TRANSIENT = new Set([0, 502, 503, 504]);
const AUTH_PATHS = ['/portal/auth/login', '/portal/auth/refresh', '/portal/auth/logout'];

let refreshing: Promise<boolean> | null = null;
/** Single-flight: a burst of 401s from parallel panels renews the session once. */
function refresh(): Promise<boolean> {
  refreshing ??= fetch(`${apiBaseUrl()}/portal/auth/refresh`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

async function call<T>(path: string, init: RequestInit = {}, retried = false, attempt = 0): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init, method, credentials: 'include',
      headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    if (method === 'GET' && attempt < 2) { await wait(400 * 3 ** attempt); return call(path, init, retried, attempt + 1); }
    throw new ApiError(0, 'We could not reach the server. Check your connection and try again.');
  }
  if (response.status === 401 && !retried && !AUTH_PATHS.includes(path)) {
    if (await refresh()) return call(path, init, true, attempt);
  }
  if (TRANSIENT.has(response.status) && method === 'GET' && attempt < 2) {
    await wait(400 * 3 ** attempt + Math.random() * 200);
    return call(path, init, retried, attempt + 1);
  }
  const body = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !body || !body.success) {
    const err = body && body.success === false ? body.error : undefined;
    throw new ApiError(response.status, err?.message ?? (response.status === 401 ? 'Please sign in to continue.' : 'Something went wrong. Please try again.'), err?.code, err?.details);
  }
  return body.data;
}

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
const qs = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const portalApi = {
  // auth
  login: (email: string, password: string) => call<PortalMe>('/portal/auth/login', json({ email, password })),
  logout: () => call<{ loggedOut: boolean }>('/portal/auth/logout', { method: 'POST' }),
  me: () => call<PortalMe>('/portal/me'),
  previewInvite: (token: string) => call<{ email: string; fullName: string; studioName: string }>(`/portal/auth/invite/${encodeURIComponent(token)}`),
  acceptInvite: (token: string, password: string) => call<PortalMe>(`/portal/auth/invite/${encodeURIComponent(token)}/accept`, json({ password })),
  forgotPassword: (email: string) => call<{ sent: boolean }>('/portal/auth/forgot-password', json({ email })),
  resetPassword: (token: string, password: string) => call<unknown>('/portal/auth/reset-password', json({ token, password })),
  // data
  projects: () => call<ProjectList>('/portal/projects'),
  project: (id: string) => call<ProjectDetail>(`/portal/projects/${id}`),
  gallery: (id: string) => call<GalleryOverview>(`/portal/projects/${id}/gallery`),
  media: (id: string, q: { sectionId?: string; subFolderId?: string; filter?: string; cursor?: string; limit?: number }, signal?: AbortSignal) =>
    call<MediaPage>(`/portal/projects/${id}/gallery/media${qs(q)}`, { signal }),
  mediaDetail: (mediaId: string) => call<MediaDetail>(`/portal/media/${mediaId}`),
  select: (mediaId: string, kind: 'FAVORITE' | 'ALBUM', on: boolean) => call<unknown>(`/portal/media/${mediaId}/selections/${kind}`, { method: on ? 'PUT' : 'DELETE' }),
  submitAlbum: (id: string) => call<{ requestId: string; submittedAt: string; album: number }>(`/portal/projects/${id}/gallery/album-selection/submit`, { method: 'POST' }),
  download: (mediaId: string) => call<{ url: string; fileName: string }>(`/portal/media/${mediaId}/download`),
  comment: (mediaId: string, body: string, type?: string) => call<unknown>(`/portal/media/${mediaId}/comments`, json({ body, type })),
  galleryComments: (id: string) => call<PortalComment[]>(`/portal/projects/${id}/comments`),
  requests: (id: string) => call<PortalRequest[]>(`/portal/projects/${id}/requests`),
  createRequest: (id: string, b: { type: string; title: string; description: string; relatedMediaId?: string }) => call<PortalRequest>(`/portal/projects/${id}/requests`, json(b)),
  shareLinks: (id: string) => call<PortalShareLink[]>(`/portal/projects/${id}/share-links`),
  createShareLink: (id: string, b: { title: string; accessType: string; sectionId?: string; mediaIds?: string[]; password?: string; expiresInDays?: number }) => call<PortalShareLink>(`/portal/projects/${id}/share-links`, json(b)),
  revokeShareLink: (id: string, linkId: string) => call<unknown>(`/portal/projects/${id}/share-links/${linkId}`, { method: 'DELETE' }),
  notifications: () => call<{ items: PortalNotification[]; unread: number }>('/portal/notifications'),
  readNotification: (id: string) => call<unknown>(`/portal/notifications/${id}/read`, { method: 'POST' }),
  readAllNotifications: () => call<unknown>('/portal/notifications/read-all', { method: 'POST' }),
};

export const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
export const fmtDate = (d: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => (d ? new Intl.DateTimeFormat('en-IN', opts).format(new Date(d)) : '—');
export const errorMessage = (e: unknown, fallback = 'Something went wrong. Please try again.') => (e instanceof ApiError ? e.message : fallback);
