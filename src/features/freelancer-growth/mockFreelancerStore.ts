'use client';

import { plans, type BillingCycle } from './data';
import { BRAND } from '@/config/brand';

export type MockFreelancerAccount = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  studioName: string;
  password: string;
  planId: string;
  billingCycle: BillingCycle;
  purchasedAt: string;
  headline?: string;
  bio?: string;
  role?: string;
  experienceYears?: number;
  skills?: string[];
  availability?: string;
  availableFrom?: string;
  availableUntil?: string;
  travelAvailable?: boolean;
  dailyRate?: string;
  eventRate?: string;
  negotiable?: boolean;
  portfolioLinks?: string;
  profilePhoto?: string;
  applicationSubmittedAt?: string;
};

const ACCOUNT_KEY = `${BRAND.cookiePrefix}_mock_freelancer_account`;
const SESSION_KEY = `${BRAND.cookiePrefix}_mock_freelancer_session`;
const CLIENT_COOKIE = `${BRAND.cookiePrefix}_client_session`;

const DEMO_FREELANCER_ACCOUNT: MockFreelancerAccount = {
  fullName: 'Freelancer Demo',
  email: 'freelancer@gmail.com',
  phone: '9876543210',
  city: 'Delhi',
  studioName: 'Freelancer Panel',
  password: 'password123',
  planId: 'pro',
  billingCycle: 'monthly',
  purchasedAt: '2026-09-25T00:00:00.000Z',
};

export function saveMockFreelancerAccount(account: MockFreelancerAccount) {
  window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

export function updateMockFreelancerAccount(update: Partial<MockFreelancerAccount>) {
  const current = getMockFreelancerAccount() ?? DEMO_FREELANCER_ACCOUNT;
  const next = { ...current, ...update };
  saveMockFreelancerAccount(next);
  return next;
}

export function getMockFreelancerAccount(): MockFreelancerAccount | null {
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) as MockFreelancerAccount : null;
  } catch {
    return null;
  }
}

export function getCurrentMockFreelancer(): MockFreelancerAccount | null {
  if (typeof window === 'undefined' || window.localStorage.getItem(SESSION_KEY) !== '1') return null;
  return getMockFreelancerAccount();
}

export function loginMockFreelancer(identifier: string, password: string) {
  const savedAccount = getMockFreelancerAccount();
  const demoIdentifier = [DEMO_FREELANCER_ACCOUNT.email, DEMO_FREELANCER_ACCOUNT.studioName].some((value) => value.toLowerCase() === identifier.toLowerCase());
  const account = savedAccount ?? (demoIdentifier ? DEMO_FREELANCER_ACCOUNT : null);
  if (!account) return null;
  const matchesIdentifier = [account.email, account.studioName].some((value) => value.toLowerCase() === identifier.toLowerCase());
  if (!matchesIdentifier || account.password !== password) return null;
  if (!savedAccount) saveMockFreelancerAccount(account);
  window.localStorage.setItem(SESSION_KEY, '1');
  document.cookie = `${CLIENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  return account;
}

export function logoutMockFreelancer() {
  window.localStorage.removeItem(SESSION_KEY);
  document.cookie = `${CLIENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getMockPlan(planId: string) {
  return plans.find((plan) => plan.id === planId) ?? plans[1];
}
