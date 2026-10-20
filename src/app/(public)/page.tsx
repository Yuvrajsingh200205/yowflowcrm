import type { Metadata } from 'next';
import { LandingPage } from '@/features/landing/components/LandingPage';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — ${BRAND.tagline}` },
  description: BRAND.description,
  openGraph: {
    title: BRAND.name,
    description: BRAND.description,
    images: ['/images/studio-light.svg'],
  },
};

export default function PublicHomePage() {
  return <LandingPage />;
}
