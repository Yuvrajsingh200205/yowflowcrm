import {
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';

export type BillingCycle = 'monthly' | 'yearly';

export type FreelancerPlan = {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  badge?: string;
  description: string;
  audience: string;
  features: string[];
};

export type Vendor = {
  id: string;
  name: string;
  category: string;
  location: string;
  contact: string;
  status: 'Preferred' | 'New' | 'Active';
  scopeOwnerId: string;
};

export type FreelancerProject = {
  id: string;
  name: string;
  client: string;
  date: string;
  location: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  shoots: number;
  progress: number;
};

export type FreelancerShoot = {
  id: string;
  date: string;
  project: string;
  location: string;
  status: 'Scheduled' | 'Completed';
  role: string;
};

export type FinanceEntry = {
  id: string;
  date: string;
  label: string;
  amount: number;
  status: 'Received' | 'Pending';
};

export const freelancerId = 'fl-demo-001';

export const plans: FreelancerPlan[] = [
  {
    id: 'starter',
    name: 'Starter Lens',
    monthly: 999,
    yearly: 9990,
    description: 'For solo creators building a reliable wedding pipeline.',
    audience: 'New freelancers',
    features: ['Profile listing', '10 active projects', 'Basic vendor network', 'Payment tracker', 'Profile analytics'],
  },
  {
    id: 'pro',
    name: 'Cinematic Pro',
    monthly: 2499,
    yearly: 24990,
    badge: 'Most Popular',
    description: 'For photographers and cinematographers managing repeat work.',
    audience: 'Growing creators',
    features: ['Priority discovery', 'Unlimited projects', 'Scoped vendor search', 'Finance dashboard', 'Portfolio highlights', 'Shoot calendar'],
  },
  {
    id: 'studio',
    name: 'Creator Studio',
    monthly: 4999,
    yearly: 49990,
    description: 'For teams that run multi-city shoots and vendor networks.',
    audience: 'Small studios',
    features: ['Team seats', 'Advanced finance view', 'Premium support', 'Shoot calendar', 'Client network tools', 'Multi-city vendor pools'],
  },
];

export const comparisonRows = [
  { feature: 'Profile listing', starter: 'Standard', pro: 'Priority', studio: 'Featured' },
  { feature: 'Active projects', starter: '10', pro: 'Unlimited', studio: 'Unlimited + team view' },
  { feature: 'Vendor search', starter: 'Basic city filter', pro: 'Scoped network', studio: 'Multi-city scoped network' },
  { feature: 'Finance dashboard', starter: 'Tracker', pro: 'Dashboard', studio: 'Advanced dashboard' },
  { feature: 'Portfolio highlights', starter: '3 highlights', pro: 'Unlimited', studio: 'Unlimited + team credits' },
  { feature: 'Support', starter: 'Email', pro: 'Priority chat', studio: 'Premium support' },
];

export const testimonials = [
  { quote: 'The panel keeps my shoots, dues and vendor list in one view. I stopped chasing three spreadsheets before every wedding.', name: 'Alex Morgan', role: 'Candid Photographer, Delhi' },
  { quote: 'Pricing, client follow-ups and shoot planning feel much cleaner now. It gives a solo creator a studio-grade system.', name: 'Ayesha Khan', role: 'Wedding Filmmaker, Jaipur' },
  { quote: 'I can see what is pending, who is assigned and which vendors are trusted in each city. That clarity is worth it.', name: 'Kabir Anand', role: 'Freelance Editor, Gurugram' },
];

export const landingStats = [
  { label: 'Freelancers onboarded', value: '2,500+' },
  { label: 'Wedding shoots managed', value: '15,000+' },
  { label: 'Creator payouts tracked', value: '₹8.4cr+' },
  { label: 'Studio partners', value: '500+' },
];

export const freelancerValues = [
  { icon: Search, label: 'Find Work' },
  { icon: IndianRupee, label: 'Get Paid' },
  { icon: CalendarDays, label: 'Manage Shoots' },
  { icon: Users, label: 'Grow Network' },
];

export const featureSteps = [
  {
    icon: Camera,
    eyebrow: 'Project Control',
    title: 'Every booking, shoot and handover in one quiet workspace.',
    body: 'Track assignments, call times, client names, locations and completion status without keeping a separate sheet for every wedding.',
  },
  {
    icon: MapPin,
    eyebrow: 'Scoped Vendor Network',
    title: 'Search vendors by city inside your own purchased-plan network.',
    body: 'The frontend models the scoped rule with freelancer-owned vendor data, so one creator never sees another creator pool.',
  },
  {
    icon: CreditCard,
    eyebrow: 'Finance Clarity',
    title: 'Know what is received, what is pending and what needs follow-up.',
    body: 'A freelancer-focused finance panel mirrors the studio dashboard language: earned, received, due and payment history.',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Professional Profile',
    title: 'Turn your experience into a polished operating identity.',
    body: 'Portfolio links, specialties, base city and vendor relationships are ready as frontend state for API wiring later.',
  },
];

export const vendors: Vendor[] = [
  { id: 'v1', name: 'Delhi Bloom Decor', category: 'Decorator', location: 'Delhi', contact: '+91 98765 44120', status: 'Preferred', scopeOwnerId: freelancerId },
  { id: 'v2', name: 'Noor Makeup Studio', category: 'Makeup Artist', location: 'Delhi', contact: '+91 98111 20304', status: 'Active', scopeOwnerId: freelancerId },
  { id: 'v3', name: 'Jaipur Palace Venues', category: 'Venue', location: 'Jaipur', contact: '+91 99222 11880', status: 'New', scopeOwnerId: freelancerId },
  { id: 'v4', name: 'LensCart Crew Van', category: 'Transport', location: 'Gurugram', contact: '+91 90000 33445', status: 'Active', scopeOwnerId: freelancerId },
  { id: 'hidden', name: 'Other Creator Decor Pool', category: 'Decorator', location: 'Delhi', contact: '+91 99999 11111', status: 'New', scopeOwnerId: 'other-freelancer' },
];

export const projects: FreelancerProject[] = [
  { id: 'p1', name: 'Aarav & Meera Wedding', client: 'Meera Sharma', date: '2026-10-12', location: 'Delhi', status: 'Ongoing', shoots: 4, progress: 64 },
  { id: 'p2', name: 'Riya Sangeet Night', client: 'Riya Malhotra', date: '2026-10-22', location: 'Jaipur', status: 'Upcoming', shoots: 2, progress: 18 },
  { id: 'p3', name: 'Kabir Pre-Wedding', client: 'Kabir Anand', date: '2026-09-08', location: 'Gurugram', status: 'Completed', shoots: 1, progress: 100 },
];

export const shoots: FreelancerShoot[] = [
  { id: 's1', date: '2026-10-12', project: 'Aarav & Meera Wedding', location: 'Delhi', status: 'Scheduled', role: 'Lead Photographer' },
  { id: 's2', date: '2026-10-13', project: 'Aarav & Meera Wedding', location: 'Delhi', status: 'Scheduled', role: 'Candid Photographer' },
  { id: 's3', date: '2026-09-08', project: 'Kabir Pre-Wedding', location: 'Gurugram', status: 'Completed', role: 'Cinematographer' },
];

export const finance: FinanceEntry[] = [
  { id: 'f1', date: '2026-09-08', label: 'Kabir Pre-Wedding', amount: 18000, status: 'Received' },
  { id: 'f2', date: '2026-10-12', label: 'Aarav & Meera Wedding advance', amount: 22000, status: 'Received' },
  { id: 'f3', date: '2026-10-22', label: 'Riya Sangeet balance', amount: 16000, status: 'Pending' },
];

export const panelNav = [
  { href: '/panel', label: 'Dashboard', icon: BriefcaseBusiness },
  { href: '/panel/profile', label: 'My Profile', icon: Camera },
  { href: '/panel/my-vendors', label: 'My Vendors', icon: Users },
  { href: '/panel/find-vendor', label: 'Find Vendor', icon: Search },
  { href: '/panel/projects', label: 'Projects', icon: CalendarDays },
  { href: '/panel/shoots', label: 'Shoots', icon: Video },
  { href: '/panel/finance', label: 'Finance', icon: Banknote },
];

export const statusTone = {
  Upcoming: 'border-amber-200 bg-amber-50 text-amber-700',
  Ongoing: 'border-blue-200 bg-blue-50 text-blue-700',
  Completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Scheduled: 'border-amber-200 bg-amber-50 text-amber-700',
  Received: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Pending: 'border-red-200 bg-red-50 text-red-700',
  Preferred: 'border-amber-200 bg-amber-50 text-amber-700',
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  New: 'border-slate-200 bg-slate-50 text-slate-700',
} as const;

export const activity = [
  { icon: CheckCircle2, title: 'Profile boosted', meta: 'Portfolio refreshed for Delhi searches' },
  { icon: Clock3, title: 'Shoot call pending', meta: 'Aarav & Meera Wedding, 12 Oct' },
  { icon: Sparkles, title: 'Vendor added', meta: 'Noor Makeup Studio added to network' },
];
