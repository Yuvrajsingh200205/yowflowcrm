import { BRAND } from '@/config/brand';
/** Answers state what exists today and what is still being built. No promises
 *  about backend functionality that has not shipped. */
export const faqs = [
  {
    question: `What is ${BRAND.name}?`,
    answer:
      'A studio operations product for wedding photography businesses. The admin CRM is live and in use. A freelancer portal and a client gallery are being built on the same data foundation.',
  },
  {
    question: 'What can I actually use today?',
    answer:
      'The CRM: leads, clients, projects, shoots, tasks, attendance, freelancers, payments, role-based access and the dashboards that sit over them. Nine modules, all writing to the same project record.',
  },
  {
    question: 'Who is it for?',
    answer:
      'Studio owners and their internal teams first. Freelance photographers, cinematographers and editors who work with those studios second. Couples receiving the finished work third.',
  },
  {
    question: 'How do freelancers join?',
    answer:
      'The join route is open and studios can already hold freelancer records, assignments and payouts in the CRM. Freelancer sign-in, portfolio and availability tools are still in build.',
  },
  {
    question: 'How do clients reach their galleries?',
    answer:
      'Client routes and the delivery foundation exist, and studios track client assets against each project. Client authentication, per-project access rules and the gallery view itself are in build.',
  },
  {
    question: 'Can a gallery be shared with family?',
    answer:
      'That is the intent, and it needs secure share links and permissions that have not been implemented yet. We would rather say so than ship a link that leaks a wedding.',
  },
  {
    question: 'Can studios manage freelancers and payouts?',
    answer:
      'Yes, today. Freelancer records, shoot assignments and payout tracking are part of the live CRM.',
  },
  {
    question: 'What does it cost?',
    answer:
      'Commercial terms are still being set. The product is structured around three access tiers — studio, freelancer and client. Talk to us and we will quote against your volume.',
  },
];
