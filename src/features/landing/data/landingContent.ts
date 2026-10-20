import { BRAND } from '@/config/brand';
/**
 * Copy for the public marketing surface.
 *
 * Two rules govern this file:
 *  1. Be specific. No "all-in-one platform", no invented customer counts.
 *  2. Be honest. The modules under `shippedModules` exist in the CRM today.
 *     Anything still being built is labelled as such, rather than hedged with
 *     the word "direction" — which is how the previous copy leaked internal
 *     phase language onto a customer-facing page.
 *
 * No icon imports: the redesign carries hierarchy with type and hairlines
 * instead of a decorative icon grid.
 */

/**
 * Header navigation. `section` is the element id the scroll-spy watches to mark
 * the current item; Home has none because it is the page itself.
 *
 * Every href resolves to a standalone public route, so the primary navigation
 * reads in one predictable sequence instead of jumping between page anchors.
 */
export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features', section: 'capabilities' },
  { href: '/studios', label: 'For Studios', section: 'studios' },
  { href: '/freelancers/', label: 'For Freelancers', section: 'freelancers' },
  { href: '/clients', label: 'For Clients', section: 'clients' },
  { href: '/pricing', label: 'Pricing', section: 'pricing' },
  { href: '/contact', label: 'Contact', section: 'contact' },
];

export const hero = {
  eyebrow: `${BRAND.name}`,
  headline: ['A season of weddings.', 'One place that knows', 'where each one stands.'],
  standfirst:
    'A working CRM for wedding photography studios — inquiries, projects, shoots, crew, freelancers and payments held on a single record. The client gallery and freelancer portal are being built on the same foundation.',
  caption: {
    label: 'In build',
    text: 'The client gallery: one quiet place where a couple finds the photographs they will keep.',
  },
};

/** Structural facts about the product — not testimonials, not invented metrics. */
export const heroMeta = [
  { value: 'Nine', label: 'operational modules, live today' },
  { value: 'Three', label: 'audiences on one dataset' },
  { value: 'One', label: 'thread from inquiry to payout' },
];

export const standfirst = {
  mark: { index: '00', label: 'The premise' },
  lines: ['A studio’s hardest work happens', 'between the photographs.'],
  body: [
    'The follow-up nobody logged. The second shooter nobody confirmed. The balance nobody chased. The album sitting at ninety percent while the couple waits.',
    `None of it is photography, and all of it decides whether the studio survives the season. ${BRAND.name} is built for that part of the work — so the rest can be about the pictures.`,
  ],
};

/** The nine modules that exist in the CRM today. */
export const shippedModules = [
  { title: 'Leads', description: 'Wedding inquiries, follow-ups and conversion tracking.' },
  { title: 'Projects', description: 'Wedding production, budgets, milestones and delivery status.' },
  { title: 'Shoots', description: 'Schedules, venues, crew and day-of assignments.' },
  { title: 'Freelancers', description: 'Records, assignments and payout history.' },
  { title: 'Team & Attendance', description: 'Staff attendance, leave and daily activity.' },
  { title: 'Tasks', description: 'Operational work assigned and tracked across the team.' },
  { title: 'Payments', description: 'Invoices, receipts, expenses and freelancer payouts.' },
  { title: 'Client Delivery', description: 'Delivery workflow and project client assets.' },
  { title: 'Notifications', description: 'Workspace activity surfaced to the right role.' },
];

export const capabilities = {
  mark: { index: '01', label: 'What ships today' },
  heading: ['Nine modules,', 'one production record.'],
  note: 'Every module writes to the same project record, so a shoot, a payout and a delivery status are three views of one wedding rather than three spreadsheets.',
};

export const studios = {
  mark: { index: '02', label: 'For studios' },
  heading: ['Run the studio.', 'Not the spreadsheet.'],
  lead: 'Leads, projects, shoots, crew, freelancers and payments in one workspace, with role-based access for everyone who touches a wedding.',
  bullets: [
    'Track inquiries through to a booked project',
    'Hold every wedding’s budget, balance and milestones',
    'Schedule shoots and assign the crew for the day',
    'Bring freelancers onto a project and record the payout',
    'See attendance, tasks and collections in one dashboard',
  ],
  cta: { href: '/studios', label: 'View Studio' },
};

export const freelancers = {
  mark: { index: '03', label: 'For freelancers' },
  heading: ['One profile.', 'Every studio that needs you.'],
  lead: 'Studios already manage freelancer records, assignments and payouts inside the CRM. The portal gives that same record back to you.',
  pullquote: 'Stop re-introducing yourself to every studio in the city.',
  bullets: [
    'One professional profile studios can find',
    'Portfolio and availability you control',
    'Assignments visible as studios book them',
    'Payout history you can check yourself',
  ],
  status:
    'Freelancer records, assignments and payouts run in the CRM today. Dedicated freelancer sign-in, portfolio and availability are in build.',
  cta: { href: '/freelancers', label: 'View Freelancer' },
};

export const clients = {
  mark: { index: '04', label: 'For clients' },
  heading: ['The last thing you are handed', 'is the thing you keep.'],
  lead: 'A gallery for the couple and their family: the photographs, the albums, the favourites, and a download when the studio allows it.',
  bullets: [
    'Your wedding photographs and films in one place',
    'Albums and galleries as the studio arranged them',
    'Mark favourites when the studio enables it',
    'Download and share with family when permitted',
  ],
  status:
    'Client routes and the delivery foundation exist in the CRM. Client sign-in, access rules and the gallery itself are in build.',
  cta: { href: '/clients', label: 'View Client' },
};

export const process = {
  mark: { index: '05', label: 'The thread' },
  heading: ['Manage. Connect. Deliver.'],
  steps: [
    { step: '01', title: 'Manage', description: 'Inquiries, projects, shoots, teams and payments run inside the studio CRM.' },
    { step: '02', title: 'Connect', description: 'Studios bring freelancers onto projects through assignment and payout workflows.' },
    { step: '03', title: 'Deliver', description: 'Finished work reaches the couple through the client gallery being built on the same record.' },
  ],
};

export const pricing = {
  mark: { index: '06', label: 'Pricing' },
  heading: ['Priced per role,', 'not per seat you never open.'],
  note: 'Commercial terms are still being set. These are the three access tiers the product is structured around — talk to us and we will quote against your studio’s volume.',
};

export const faqSection = {
  mark: { index: '07', label: 'Questions' },
  heading: ['Before you ask.'],
};

export const finalCta = {
  heading: ['Your work deserves', 'a better workspace.'],
  lead: 'Bring the studio, the team, the freelancers and the couple onto one record.',
  primary: { href: '/contact', label: 'Request access' },
  secondary: { href: '/features', label: 'See what ships today' },
};
