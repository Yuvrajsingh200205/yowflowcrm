import { Suspense } from 'react';
import { OnboardingPageClient } from '@/features/freelancer-portal/components/OnboardingPageClient';

export default function FreelancerOnboardingPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#FBFDF6] px-5 text-sm font-bold text-slate-600">Loading invitation...</main>}>
      <OnboardingPageClient />
    </Suspense>
  );
}
