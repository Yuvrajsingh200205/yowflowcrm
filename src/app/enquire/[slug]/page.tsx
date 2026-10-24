import type { Metadata } from 'next';
import { EnquiryScreen } from '@/features/public-sales/EnquiryScreen';

export const metadata: Metadata = {
  title: 'Check your date and get a quote',
  description: 'Pick your date, choose a package and get your quotation in seconds.',
  // The page is filled in by the browser after load, so there is nothing for a crawler to index yet.
  robots: { index: false, follow: false },
};

export default async function EnquirePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EnquiryScreen slug={decodeURIComponent(slug).toLowerCase()} />;
}
