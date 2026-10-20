import { 
  Freelancer, 
  FreelancerCategory, 
  FreelancerAssignment, 
  FreelancerPayment, 
  FreelancerAttendance, 
  FreelancerDataReceived, 
  FreelancerActivityLog 
} from '@/types';
import { DEFAULT_FREELANCER_CATEGORIES } from '@/features/freelancers/freelancerDomain';

export const INITIAL_FREELANCER_CATEGORIES: FreelancerCategory[] = DEFAULT_FREELANCER_CATEGORIES;

/**
 * Frontend-only seed data.  It deliberately lives in this data layer (rather
 * than inside views) so the UI can later swap this module for an API adapter.
 */
const seed = (overrides: Partial<Freelancer> & Pick<Freelancer, 'id' | 'name' | 'mainCategory' | 'subCategory'>): Freelancer => ({
  freelancerId: `FL-${overrides.id.replace(/\D/g, '').padStart(4, '0') || '1000'}`,
  mobile: '9876543210', whatsapp: '9876543210', email: '', address: '', city: 'Jaipur',
  emergencyContact: '', joiningDate: '2026-08-12', status: 'active', applicationStatus: 'approved', workingStatus: 'active',
  experienceYears: 3, skills: [], equipmentAvailable: '', cameraDetails: '', lensDetails: '', otherEquipment: '',
  perDayCharges: 0, halfDayCharges: 0, eventCharges: 0, overtimeCharges: 0, extraHourCharges: 0, travelCharges: 0, otherCharges: 0,
  paymentMethod: 'UPI', availabilityStatus: 'Available', preferredTier: 'new',
  ...overrides,
});

export const INITIAL_FREELANCERS: Freelancer[] = [
  seed({ id: 'fl-1001', name: 'Aarav Mehta', mainCategory: 'Photographer', subCategory: 'Wedding Photographer', city: 'Jaipur', email: 'aarav@example.com', experienceYears: 7, rating: 4.8, skills: ['Candid', 'Portraits', 'Lightroom'], cameraDetails: 'Sony A7 IV', lensDetails: '24–70mm, 85mm', perDayCharges: 12000, halfDayCharges: 7000, eventCharges: 18000, travelAvailability: true, preferredTier: 'preferred' }),
  seed({ id: 'fl-1002', name: 'Meera Kapoor', mainCategory: 'Videographer', subCategory: 'Cinematographer', city: 'Delhi', email: 'meera@example.com', experienceYears: 5, rating: 4.7, skills: ['Wedding films', 'Gimbal', 'DaVinci Resolve'], equipmentAvailable: 'Sony FX3, DJI RS 3', perDayCharges: 14000, halfDayCharges: 8500, eventCharges: 22000, availabilityStatus: 'Busy' }),
  seed({ id: 'fl-1003', name: 'Kabir Singh', mainCategory: 'Drone Operator', subCategory: 'FPV Pilot', city: 'Udaipur', email: 'kabir@example.com', experienceYears: 4, rating: 4.6, skills: ['FPV', 'Aerial', 'Licensed drone pilot'], equipmentAvailable: 'DJI Mavic 3 Pro, FPV kit', perDayCharges: 9000, eventCharges: 15000, travelAvailability: true }),
  seed({ id: 'fl-1004', name: 'Naina Sharma', mainCategory: 'Editor', subCategory: 'Photo Editor', city: 'Mumbai', email: 'naina@example.com', experienceYears: 6, rating: 4.9, skills: ['Photoshop', 'Retouching', 'Album culling'], perDayCharges: 6000, availabilityStatus: 'Available', preferredTier: 'preferred' }),
  seed({ id: 'fl-1005', name: 'Taylor Brooks', mainCategory: 'Editor', subCategory: 'Video Editor', city: 'Chandigarh', email: 'rohan@example.com', experienceYears: 3, skills: ['Premiere Pro', 'Reels', 'Color grading'], perDayCharges: 7500, applicationStatus: 'under_review', workingStatus: 'inactive', status: 'inactive', availabilityStatus: 'Unavailable' }),
  seed({ id: 'fl-1006', name: 'Isha Malhotra', mainCategory: 'Design', subCategory: 'Album Designer', city: 'Jaipur', email: 'isha@example.com', experienceYears: 4, skills: ['Canvera', 'Album design', 'InDesign'], perDayCharges: 5000, applicationStatus: 'shortlisted', workingStatus: 'inactive', status: 'inactive' }),
  seed({ id: 'fl-1007', name: 'Dev Arora', mainCategory: 'Photographer', subCategory: 'Second Photographer', city: 'Delhi', email: 'dev@example.com', experienceYears: 2, skills: ['Traditional', 'Flash', 'Second shooter'], perDayCharges: 5500, applicationStatus: 'changes_requested', workingStatus: 'inactive', status: 'inactive' }),
  seed({ id: 'fl-1008', name: 'Sara Khan', mainCategory: 'Assistant', subCategory: 'Production Assistant', city: 'Jodhpur', email: 'sara@example.com', experienceYears: 2, skills: ['Lighting', 'Production', 'Coordination'], perDayCharges: 3500, applicationStatus: 'applied', workingStatus: 'inactive', status: 'inactive' }),
];

export const INITIAL_FREELANCER_ASSIGNMENTS: FreelancerAssignment[] = [];

export const INITIAL_FREELANCER_PAYMENTS: FreelancerPayment[] = [];

export const INITIAL_FREELANCER_ATTENDANCE: FreelancerAttendance[] = [];

export const INITIAL_FREELANCER_DATA_RECEIVED: FreelancerDataReceived[] = [];

export const INITIAL_FREELANCER_LOGS: FreelancerActivityLog[] = [];
