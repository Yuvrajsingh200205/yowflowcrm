import { ApiError, ApiMeta } from './client';
import { BRAND } from '@/config/brand';

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050/api/v1';
const baseUrl = configuredApiUrl.replace(/[“”"']/g, '').trim().replace(/\/$/, '');
const SESSION_COOKIE = `${BRAND.cookiePrefix}_freelancer_session`;

function apiBaseUrl(): string {
  if (typeof window === 'undefined' || baseUrl.startsWith('/')) return baseUrl;
  const url = new URL(baseUrl);
  if (url.origin === window.location.origin) return baseUrl;
  return url.pathname.replace(/\/$/, '') || '/api/v1';
}

export type PortalStatus = 'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE' | 'SUSPENDED';
export type AvailabilityStatus = 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';

export interface PortalFileObject {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: string | number;
}

export interface PortalPortfolioItem {
  id: string;
  fileObjectId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  sortOrder: number;
  isPublished: boolean;
  fileObject?: PortalFileObject;
}

export interface PortalAvailability {
  id: string;
  date: string;
  status: AvailabilityStatus;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
}

export interface PortalPlan {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string | number;
  currency: string;
  billingInterval: string;
  features?: unknown;
}

export interface PortalSubscription {
  id: string;
  status: string;
  startedAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
  plan: PortalPlan;
}

export interface PortalApplication {
  id: string;
  status: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export interface PortalConnection {
  id: string;
  status: string;
  notes?: string | null;
  projectId?: string | null;
  shootId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  project?: { id: string; projectNumber: string; name: string } | null;
  shoot?: { id: string; title: string; shootDate: string } | null;
  createdBy?: { id: string; fullName: string } | null;
}

export interface PortalAssignment {
  id: string;
  role: string;
  status: string;
  agreedAmount: string | number;
  shoot?: { id: string; title: string; shootDate: string; status: string; project?: { id: string; projectNumber: string; name: string } };
}

export interface PortalPayout {
  id: string;
  amount: string | number;
  paymentDate: string;
  paymentMethod: string;
  transactionRef?: string | null;
  notes?: string | null;
  assignment?: { id: string; role: string; status: string; shoot?: { id: string; title: string; shootDate: string; project?: PortalProjectSummary } | null } | null;
}

export interface PortalProjectSummary {
  id: string;
  projectNumber: string;
  name: string;
  type: string;
  status: string;
  weddingDate?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
}

export interface PortalShootSummary {
  id: string;
  title: string;
  shootType: string;
  shootDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  city?: string | null;
  status: string;
  project?: PortalProjectSummary;
  assignment?: { id: string; role: string; status: string; callTime?: string | null; assignedAt?: string | null };
  crew?: Array<{ id: string; role: string; status: string; isSelf: boolean; displayName?: string | null }>;
}

export interface PortalTaskSummary {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  project?: PortalProjectSummary | null;
  shoot?: Omit<PortalShootSummary, 'project' | 'assignment' | 'crew'> | null;
}

export interface PortalNotification {
  id: string;
  type: string;
  channel?: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface PortalList<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface PortalDashboard {
  profile: PortalMe;
  subscription: PortalSubscription | null;
  upcomingShoots: PortalShootSummary[];
  todaysWork: { shoots: PortalShootSummary[]; tasks: PortalTaskSummary[] };
  tasks: PortalTaskSummary[];
  payments: { recent: PortalPayout[]; summary: { paidAmount: number; currency: string } };
  notifications: PortalNotification[];
}

export interface PortalFreelancer {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  addressLine?: string | null;
  primarySkill: string;
  skills: string[];
  experienceYears?: number | null;
  rate?: string | number | null;
  rateType?: string | null;
  status: PortalStatus;
  travelAvailable: boolean;
  maxShootsPerDay: number;
  equipmentNotes?: string | null;
  notes?: string | null;
  subscriptions: PortalSubscription[];
  availability: PortalAvailability[];
  portfolioItems: PortalPortfolioItem[];
  applications: PortalApplication[];
  connections: PortalConnection[];
  assignments: PortalAssignment[];
  payouts: PortalPayout[];
}

export interface PortalMe {
  freelancer: PortalFreelancer;
  searchable: boolean;
}

export interface PublicApplicationInput {
  organizationSlug?: string;
  fullName: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  email?: string;
  city?: string;
  primarySkill?: string;
  skills?: string[];
  experienceYears?: number;
  portfolioUrl?: string;
  expectedRate?: string;
  notes?: string;
}

export interface OnboardingValidation {
  valid: boolean;
  status: 'valid' | 'invalid' | 'expired' | 'used' | 'revoked';
  freelancer?: {
    displayName: string;
    email?: string | null;
  };
  expiresAt?: string;
}

interface Envelope<T> { success: boolean; data: T; meta?: ApiMeta; error?: { message?: string; code?: string; details?: unknown[] } }
type PortalShootDetail = PortalShootSummary & { notes?: string | null; event?: { id: string; name: string; eventDate: string; venueName?: string | null; city?: string | null; status: string } | null; tasks: PortalTaskSummary[] };

export function setFreelancerSessionMarker(active: boolean, maxAge = 60 * 60 * 24 * 7) {
  if (typeof window === 'undefined') return;
  if (!active) {
    document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

async function portalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  const response = await fetch(`${apiBaseUrl()}/freelancer-portal${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiError(response.status, payload?.error?.message ?? 'The request could not be completed.', payload?.error?.code, payload?.error?.details);
  }
  return payload.data;
}

export const freelancerPortalApi = {
  submitApplication: (input: PublicApplicationInput) => portalRequest<PortalApplication>('/applications', { method: 'POST', body: JSON.stringify(input) }),
  validateOnboarding: (token: string) => portalRequest<OnboardingValidation>(`/onboarding/${encodeURIComponent(token)}`),
  setOnboardingPassword: (token: string, input: { password: string; confirmPassword: string }) =>
    portalRequest<{ passwordSet: boolean }>(`/onboarding/${encodeURIComponent(token)}/password`, { method: 'POST', body: JSON.stringify(input) }),
  login: async (input: { identifier: string; password: string }) => {
    const result = await portalRequest<{ me: PortalMe; session: { expiresIn?: number } }>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
    setFreelancerSessionMarker(true, result.session.expiresIn);
    return result.me;
  },
  logout: async () => {
    try {
      await portalRequest('/auth/logout', { method: 'POST' });
    } finally {
      setFreelancerSessionMarker(false);
    }
  },
  me: () => portalRequest<PortalMe>('/me'),
  dashboard: () => portalRequest<PortalDashboard>('/dashboard'),
  projects: (query = '') => portalRequest<PortalList<PortalProjectSummary & { shoots?: Array<{ id: string; title: string; shootDate: string; status: string }> }>>(`/projects${query}`),
  project: (id: string) => portalRequest<PortalProjectSummary & { venueAddress?: string | null; shoots: PortalShootSummary[]; tasks: PortalTaskSummary[] }>(`/projects/${encodeURIComponent(id)}`),
  shoots: (query = '') => portalRequest<PortalList<PortalShootSummary>>(`/shoots${query}`),
  shoot: (id: string) => portalRequest<PortalShootDetail>(`/shoots/${encodeURIComponent(id)}`),
  tasks: (query = '') => portalRequest<PortalList<PortalTaskSummary>>(`/tasks${query}`),
  updateTaskStatus: (id: string, status: string) => portalRequest<PortalTaskSummary>(`/tasks/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  payments: (query = '') => portalRequest<PortalList<PortalPayout>>(`/payments${query}`),
  notifications: (query = '') => portalRequest<PortalList<PortalNotification>>(`/notifications${query}`),
  updateProfile: (input: Partial<PortalFreelancer>) => portalRequest<PortalFreelancer>('/profile', { method: 'PATCH', body: JSON.stringify(input) }),
  setPassword: (password: string) => portalRequest<{ passwordSet: boolean }>('/password', { method: 'POST', body: JSON.stringify({ password }) }),
  saveAvailability: (input: { date: string; status: AvailabilityStatus; startTime?: string | null; endTime?: string | null; notes?: string | null }) =>
    portalRequest<PortalAvailability>('/availability', { method: 'PUT', body: JSON.stringify(input) }),
  availability: (query = '') => portalRequest<PortalList<PortalAvailability>>(`/availability${query}`),
  updateAvailability: (date: string, input: Partial<Omit<PortalAvailability, 'id' | 'date'>>) =>
    portalRequest<PortalAvailability>(`/availability/${encodeURIComponent(date)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteAvailability: (date: string) =>
    portalRequest<void>(`/availability/${encodeURIComponent(date)}`, { method: 'DELETE' }),
  respondToConnection: (id: string, input: { status: 'ACCEPTED' | 'DECLINED'; notes?: string | null }) =>
    portalRequest<PortalConnection>(`/connections/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  createPortfolioItem: (input: { fileObjectId: string; title: string; description?: string; category?: string; sortOrder?: number; isPublished?: boolean }) =>
    portalRequest<PortalPortfolioItem>('/portfolio', { method: 'POST', body: JSON.stringify(input) }),
  updatePortfolioItem: (id: string, input: Partial<PortalPortfolioItem>) =>
    portalRequest<PortalPortfolioItem>(`/portfolio/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deletePortfolioItem: (id: string) => portalRequest<void>(`/portfolio/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  plans: () => portalRequest<PortalPlan[]>('/plans'),
};
