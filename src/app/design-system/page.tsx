import type { Metadata } from 'next';
import { BRAND } from '@/config/brand';
import { DesignSystemDemo } from './DesignSystemDemo';

export const metadata: Metadata = {
  title: 'Design system',
  description: `${BRAND.name} design tokens and components.`,
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return <DesignSystemDemo />;
}
