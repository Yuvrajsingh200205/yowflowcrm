import { apiRequest, hasStoredSession, setAuthTokens } from './client';
import { BRAND } from '@/config/brand';

const FREELANCER_SESSION_COOKIE = `${BRAND.cookiePrefix}_freelancer_session`;

function clearFreelancerSessionMarker(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${FREELANCER_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export interface SessionUser {
  id: string;
  organizationId: string;
  branchId: string | null;
  email: string;
  fullName: string;
  employeeCode: string | null;
  status: string;
  roles: string[];
  permissions: string[];
  organization: { id: string; name: string; slug: string; currency: string; timezone: string };
  freelancerProfile: { id: string; status: string } | null;
}

export interface LoginInput {
  email: string;
  password: string;
  organizationSlug?: string;
}

export const authApi = {
  async login(input: LoginInput): Promise<SessionUser> {
    const { data } = await apiRequest<{
      user: SessionUser;
      tokens?: { accessToken?: string; refreshToken?: string; accessTokenExpiresIn?: number; refreshTokenExpiresIn?: number };
    }>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
    setAuthTokens(data.tokens ?? null);
    return data.user;
  },
  /** True when this browser still believes it holds a session. */
  hasSession(): boolean {
    return hasStoredSession();
  },
  async me(init?: RequestInit): Promise<SessionUser> {
    const { data } = await apiRequest<SessionUser>('/auth/me', { ...init, fresh: true });
    return data;
  },
  async logout(): Promise<void> {
    try {
      await apiRequest<void>('/auth/logout', { method: 'POST' });
    } catch {
      return;
    } finally {
      setAuthTokens(null);
      clearFreelancerSessionMarker();
    }
  },
};
