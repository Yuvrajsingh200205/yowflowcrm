import { apiRequest } from './client';

export type PlanId = 'starter' | 'studio' | 'scale';
export type Interval = 'monthly' | 'yearly';

export interface BillingState {
  configured: boolean;
  mode: 'test' | 'live' | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'trial_expired';
  plan: PlanId;
  interval: Interval | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  seatsUsed: number;
  plans: Array<{ id: PlanId; name: string; monthly: number; yearly: number; seats: number | null }>;
}

export interface Checkout { orderId: string; amount: number; currency: string; keyId: string; mode: string; name: string; description: string }

export interface ApiKeyRow { id: string; name: string; prefix: string; scope: 'READ_ONLY' | 'FULL'; lastUsedAt: string | null; expiresAt: string | null; revokedAt: string | null; createdAt: string; createdBy: string | null }

export const billingApi = {
  get: async () => (await apiRequest<BillingState>('/billing', { fresh: true })).data,
  checkout: async (plan: PlanId, interval: Interval) => (await apiRequest<Checkout>('/billing/checkout', { method: 'POST', body: JSON.stringify({ plan, interval }) })).data,
  verify: async (input: { orderId: string; paymentId: string; signature: string }) => (await apiRequest<BillingState>('/billing/verify', { method: 'POST', body: JSON.stringify(input) })).data,
};

export const apiKeysApi = {
  list: async () => (await apiRequest<ApiKeyRow[]>('/settings/api-keys', { fresh: true })).data,
  create: async (input: { name: string; scope: ApiKeyRow['scope']; expiresInDays?: number }) => (await apiRequest<ApiKeyRow & { key: string }>('/settings/api-keys', { method: 'POST', body: JSON.stringify(input) })).data,
  revoke: async (id: string) => { await apiRequest<{ revoked: boolean }>(`/settings/api-keys/${id}`, { method: 'DELETE' }); },
};

/** Loads Razorpay's hosted checkout script once. */
let scriptPromise: Promise<void> | null = null;
export function loadRazorpay(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Checkout is only available in the browser'));
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error('Could not load the payment window. Check your connection.')); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}
