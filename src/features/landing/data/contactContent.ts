import { BRAND } from '@/config/brand';
/** Contact details. Edit them in `src/config/brand.ts`. */
export const contactChannels = [
  { label: 'Email', value: `${BRAND.supportEmail}`, href: `mailto:${BRAND.supportEmail}` },
  ...(BRAND.supportPhone
    ? [{ label: 'Phone', value: BRAND.supportPhone, href: `tel:${BRAND.supportPhone.replace(/[^+\d]/g, '')}` }]
    : []),
];

/** Every destination here is a route that already exists in the app. */
export const contactDoors = [
  {
    index: '01',
    title: 'You run a studio',
    description:
      'Ask for access to the CRM, or sign in if your studio is already set up. We will walk through leads, projects, shoots and payments with you.',
    href: '/login',
    cta: 'Sign in to the CRM',
  },
  {
    index: '02',
    title: 'You freelance',
    description:
      'Register your interest as a photographer, cinematographer or editor. Studios already track freelancer assignments and payouts in the CRM.',
    href: '/freelancers',
    cta: 'View freelancer page',
  },
  {
    index: '03',
    title: 'You are getting married',
    description:
      'Your photographs come from your studio, not from us. If you are waiting on a gallery, your studio is the fastest way to reach it.',
    href: '/client/login',
    cta: 'Client sign-in',
  },
];
