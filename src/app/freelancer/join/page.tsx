import { Suspense } from 'react';
import { PublicFreelancerRegistration } from '@/features/freelancers/components/PublicFreelancerRegistration';

export const metadata = { title: 'Join as a Freelancer' };

export default function FreelancerJoinPage() {
  return <Suspense fallback={null}><PublicFreelancerRegistration /></Suspense>;
}
