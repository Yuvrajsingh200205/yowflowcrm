import { BRAND } from './brand';

/**
 * All marketing copy lives here so a reseller can re-position the product
 * without touching components. No invented customer names, logos or metrics:
 * replace `testimonials` with real, permissioned quotes before launch.
 */
export const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
] as const;

export const HERO = {
  eyebrow: 'Studio operations, finally in one place',
  title: 'Every lead, shoot and delivery. One calm workspace.',
  subtitle: `${BRAND.name} runs the business side of your photo and video studio — from the first enquiry to the gallery your client keeps — so your team can spend its time behind the camera.`,
  primary: { href: '/signup', label: 'Start free trial' },
  secondary: { href: '/contact', label: 'Book a demo' },
  note: 'No credit card required · 14-day trial · Cancel anytime',
} as const;

export const PROOF_POINTS = [
  { value: 'One record', label: 'per project, from enquiry to final payment' },
  { value: 'Real-time', label: 'crew schedules, payments and delivery status' },
  { value: 'Role-based', label: 'access so every teammate sees only what they should' },
  { value: 'Your data', label: 'exportable at any time, hosted on PostgreSQL' },
] as const;

export const PROBLEM = {
  title: 'Studios run on spreadsheets, chat threads and memory.',
  points: [
    'Enquiries land in DMs, calls and forms, and half of them go cold.',
    'Quotes, invoices and balances live in different files nobody trusts.',
    'Crew availability is a WhatsApp group and a calendar that disagrees with it.',
    'Clients ask “where are our photos?” and nobody can say in ten seconds.',
  ],
} as const;

export const SOLUTION = {
  title: `${BRAND.name} turns that into one record per project.`,
  points: [
    'Capture every lead automatically and follow it to a booked project.',
    'Quote, invoice and collect against payment milestones in one place.',
    'Assign crew and freelancers to shoots, with clashes caught early.',
    'Deliver galleries through a private client portal with selections and share links.',
  ],
} as const;

export type Feature = { id: string; title: string; body: string; icon: string; span?: 'wide' | 'tall' };
export const FEATURES: Feature[] = [
  { id: 'leads', icon: 'Target', title: 'Lead pipeline', body: 'Capture enquiries from forms and Meta Lead Ads, follow up with reminders, and convert to a project in one click.', span: 'wide' },
  { id: 'projects', icon: 'FolderKanban', title: 'Projects and milestones', body: 'Events, deliverables, deadlines and payment schedules on a single record the whole team can read.' },
  { id: 'shoots', icon: 'Film', title: 'Shoot scheduling', body: 'Plan every day of every wedding, assign roles, and see conflicts before they become phone calls.' },
  { id: 'freelancers', icon: 'UserCheck', title: 'Freelancer network', body: 'Invite, onboard and book freelancers by city, craft and availability — and track what you owe them.', span: 'tall' },
  { id: 'finance', icon: 'Banknote', title: 'Quotes, invoices, finance', body: 'Branded quotations and invoices as PDFs, payment tracking, expenses and monthly profit and loss.', span: 'wide' },
  { id: 'portal', icon: 'Images', title: 'Client portal and galleries', body: 'Private galleries with album selection, comments and expiring share links for family.' },
  { id: 'team', icon: 'Users', title: 'Team, attendance, payroll', body: 'Attendance, leave and salary records with reports your accountant can use.' },
  { id: 'access', icon: 'ShieldCheck', title: 'Roles and permissions', body: 'Fine-grained access so editors, sales and accounts each see exactly what they need. Every sensitive action is audited.' },
];

export const STEPS = [
  { n: '01', title: 'Capture', body: 'Enquiries arrive from your website and Meta forms, already tagged with source and event date.' },
  { n: '02', title: 'Book', body: 'Send a quotation, agree the package, and turn the lead into a project with milestones.' },
  { n: '03', title: 'Shoot', body: 'Schedule days, assign photographers and videographers, share call sheets, track attendance.' },
  { n: '04', title: 'Deliver', body: 'Upload to the client portal, collect selections, and mark deliverables complete.' },
  { n: '05', title: 'Get paid', body: 'Invoices, receipts and balances stay attached to the project until the last rupee is in.' },
] as const;

export const USE_CASES = [
  { title: 'Wedding studios', body: 'Multi-day events, big crews, album workflows and instalment payments handled without a spreadsheet.' },
  { title: 'Film and video teams', body: 'Shoot, edit and delivery stages with editor workloads you can actually see.' },
  { title: 'Event and commercial', body: 'Quotes, recurring clients and fast turnaround, with approvals and invoices in one trail.' },
  { title: 'Freelance collectives', body: 'Share a roster, split assignments and keep payouts transparent across partners.' },
] as const;

/** PLACEHOLDERS — replace with real, permissioned customer quotes before launch. */
export const TESTIMONIALS = [
  { quote: 'We stopped asking “who has the latest sheet?” the week we moved enquiries and payments into one place.', who: 'Studio owner', where: 'Six-person wedding studio (sample)' },
  { quote: 'Call sheets and crew assignments used to take an evening. Now they take minutes.', who: 'Operations lead', where: 'Photo and film team (sample)' },
  { quote: 'Clients love the private gallery link. I love not chasing balances over chat.', who: 'Lead photographer', where: 'Boutique studio (sample)' },
] as const;

export const INTEGRATIONS = [
  { name: 'Meta Lead Ads', body: 'Instagram and Facebook instant forms flow straight into your pipeline.' },
  { name: 'Object storage', body: 'Cloudflare R2, Amazon S3 or Supabase for galleries, with signed, expiring links.' },
  { name: 'PostgreSQL', body: 'Your data in a standard, exportable database — no lock-in.' },
  { name: 'WhatsApp sharing', body: 'Send payment schedules, receipts and gallery links in one tap.' },
  { name: 'PDF documents', body: 'Quotations, invoices and reports generated on your letterhead.' },
] as const;

export type Plan = { id: string; name: string; tagline: string; monthly: number; features: string[]; cta: string; highlight?: boolean };
export const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', tagline: 'For solo photographers and new studios', monthly: 1499, cta: 'Start free trial', features: ['2 team members', '25 active projects', 'Lead pipeline and quotations', 'Invoices and payment tracking', 'Client portal (5 GB per project)', 'Email support'] },
  { id: 'studio', name: 'Studio', tagline: 'For growing teams that live on deadlines', monthly: 3999, cta: 'Start free trial', highlight: true, features: ['10 team members', 'Unlimited projects', 'Freelancer network and payouts', 'Shoot scheduling and crew assignments', 'Finance, expenses and reports', 'Meta Lead Ads integration', 'Roles, permissions and audit log', 'Priority support'] },
  { id: 'scale', name: 'Scale', tagline: 'For multi-branch studios and agencies', monthly: 8999, cta: 'Talk to sales', features: ['Unlimited team members', 'Multiple branches', 'API access and webhooks', 'Custom branding on portal and documents', 'Dedicated onboarding', 'SLA and a named contact'] },
];
/** Yearly billing = 10 months (two months free). */
export const YEARLY_MONTHS_CHARGED = 10;

export const FAQS = [
  { q: `What is ${BRAND.name}?`, a: 'A workspace for photo and video studios that brings leads, projects, shoots, freelancers, invoices and client galleries into one system, so nothing lives in a spreadsheet or a chat thread.' },
  { q: 'Is it only for wedding studios?', a: 'It is built around wedding workflows (multi-day events, instalment payments, albums) but works for any studio that sells projects: events, commercial, films and portraits.' },
  { q: 'Can I import my existing clients and projects?', a: 'Yes. You can export from your current spreadsheets as CSV and our team will help you import them during onboarding. Imports are included on every paid plan.' },
  { q: 'Who owns my data?', a: 'You do. Your data is stored in a standard PostgreSQL database and can be exported at any time. Client files sit in object storage under signed, expiring links.' },
  { q: 'How do payments from clients work?', a: 'You record payments against milestones and invoices, and clients see their balance in the portal. Online collection through a payment gateway is on the roadmap.' },
  { q: 'Do my freelancers need to pay?', a: 'No. Studios invite freelancers into the network for free. Freelancers who want to be discovered by other studios can choose an optional subscription.' },
  { q: 'Is there a free trial?', a: 'Yes — 14 days on any plan, no credit card required.' },
  { q: 'How secure is it?', a: 'Sessions use HttpOnly cookies, access is role-based, sensitive actions are written to an audit log, and uploads are served through signed, expiring URLs.' },
] as const;

export const FOOTER_COLUMNS = [
  { title: 'Product', links: [{ href: '/features', label: 'Features' }, { href: '/pricing', label: 'Pricing' }, { href: '/changelog', label: 'Changelog' }, { href: '/#how-it-works', label: 'How it works' }] },
  { title: 'Company', links: [{ href: '/about', label: 'About' }, { href: '/contact', label: 'Contact' }] },
  { title: 'Sign in', links: [{ href: '/login', label: 'Studio login' }, { href: '/freelancer/login', label: 'Freelancer login' }, { href: '/client/login', label: 'Client portal' }] },
  { title: 'Legal', links: [{ href: '/privacy', label: 'Privacy policy' }, { href: '/terms', label: 'Terms of service' }] },
] as const;
