/**
 * Contract for a future Freelancer Portal (separate app).
 * Admin CRM remains the source of truth. Do not invent a messaging UI here.
 */
import { Freelancer, FreelancerAssignment, FreelancerPayment } from '@/types';
import { BRAND } from '@/config/brand';

export type FreelancerPortalAuth = {
  freelancerId: string;
  mobile: string;
  email: string;
};

export type FreelancerRegistrationDraft = Pick<
  Freelancer,
  'name' | 'mobile' | 'email' | 'city' | 'mainCategory' | 'subCategory' | 'skills' | 'experienceYears' | 'bio'
> & {
  passwordOrOtp?: string;
};

export type FreelancerPortalDashboard = {
  upcoming: FreelancerAssignment[];
  today: FreelancerAssignment[];
  invitations: FreelancerAssignment[];
  pendingPayments: number;
  recentPayments: FreelancerPayment[];
};

export type FreelancerNotificationType =
  | 'invitation'
  | 'assignment_confirmed'
  | 'rescheduled'
  | 'cancelled'
  | 'payment_released'
  | 'payment_pending'
  | 'verification'
  | 'document_required'
  | 'availability_conflict';

export type FreelancerMatchQuery = {
  role?: string;
  city?: string;
  dateKey?: string;
  minExperience?: number;
  minRating?: number;
  maxBudget?: number;
};

export const FREELANCER_APPLICATIONS_STORAGE_KEY = `${BRAND.cookiePrefix}_freelancer_public_applications`;

export type PublicFreelancerApplicationInput = {
  name: string;
  email: string;
  phone: string;
  headline: string;
  bio: string;
  role: string;
  experience: string;
  skills: string;
  city: string;
  travel: boolean;
  availability: string;
  from: string;
  until: string;
  dailyRate: string;
  eventRate: string;
  negotiable: boolean;
};

export function readStoredFreelancerApplications(): Freelancer[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FREELANCER_APPLICATIONS_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isFreelancerLike) : [];
  } catch {
    return [];
  }
}

export function saveStoredFreelancerApplications(applications: Freelancer[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FREELANCER_APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
}

export function storePublicFreelancerApplication(input: PublicFreelancerApplicationInput): Freelancer {
  const application = createFreelancerApplication(input);
  const existing = readStoredFreelancerApplications();
  const duplicateIndex = existing.findIndex((item) => {
    const sameMobile = item.mobile.replace(/\D/g, '') === application.mobile;
    const sameEmail = item.email && application.email && item.email.toLowerCase() === application.email.toLowerCase();
    return sameMobile || sameEmail;
  });
  const next = duplicateIndex >= 0
    ? existing.map((item, index) => (index === duplicateIndex ? { ...item, ...application, id: item.id, freelancerId: item.freelancerId } : item))
    : [application, ...existing];
  saveStoredFreelancerApplications(next);
  return duplicateIndex >= 0 ? next[duplicateIndex] : application;
}

export function createFreelancerApplication(input: PublicFreelancerApplicationInput): Freelancer {
  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];
  const mobile = input.phone.replace(/\D/g, '').slice(0, 10);
  const roleInfo = roleToCategory(input.role);
  const skills = input.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  const notes = [
    input.headline ? `Headline: ${input.headline.trim()}` : '',
    input.availability ? `Availability: ${input.availability}` : '',
    input.from || input.until ? `Available window: ${input.from || 'Any'} to ${input.until || 'Open'}` : '',
    input.negotiable ? 'Rates negotiable by project.' : 'Rates marked fixed by applicant.',
  ].filter(Boolean).join('\n');

  return {
    id: `fl-public-${now.getTime()}`,
    freelancerId: `FL-${String(now.getTime()).slice(-6)}`,
    name: input.name.trim(),
    mobile,
    whatsapp: mobile,
    email: input.email.trim(),
    address: '',
    city: input.city.trim(),
    emergencyContact: '',
    joiningDate: dateKey,
    status: 'inactive',
    applicationStatus: 'applied',
    workingStatus: 'inactive',
    preferredTier: 'under_review',
    bio: input.bio.trim(),
    travelAvailability: input.travel,
    mainCategory: roleInfo.mainCategory,
    subCategory: roleInfo.subCategory,
    experienceYears: Number(input.experience) || 0,
    skills,
    equipmentAvailable: '',
    cameraDetails: '',
    lensDetails: '',
    otherEquipment: '',
    perDayCharges: Number(input.dailyRate) || 0,
    halfDayCharges: 0,
    eventCharges: Number(input.eventRate) || 0,
    overtimeCharges: 0,
    extraHourCharges: 0,
    travelCharges: 0,
    otherCharges: 0,
    notes,
    internalNotes: `Public freelancer application submitted on ${dateKey}.`,
    paymentMethod: 'UPI',
    availabilityStatus: input.availability === 'Unavailable' || input.availability === 'Not Looking' ? 'Unavailable' : 'Available',
    verification: { mobile: Boolean(mobile), email: input.email.includes('@') },
    documents: [],
  };
}

function roleToCategory(role: string) {
  const normalized = role.toLowerCase();
  if (/drone/.test(normalized)) return { mainCategory: 'Drone Operator', subCategory: role };
  if (/video|cinema/.test(normalized)) return { mainCategory: 'Videographer', subCategory: role };
  if (/editor/.test(normalized)) return { mainCategory: 'Editor', subCategory: role };
  if (/album|design/.test(normalized)) return { mainCategory: 'Design', subCategory: role };
  if (/assistant/.test(normalized)) return { mainCategory: 'Assistant', subCategory: role };
  return { mainCategory: 'Photographer', subCategory: role || 'Wedding Photographer' };
}

function isFreelancerLike(value: unknown): value is Freelancer {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value && 'mobile' in value;
}
