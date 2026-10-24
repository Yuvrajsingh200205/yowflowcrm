import type { Metadata } from 'next';
import { QuoteScreen } from '@/features/public-sales/QuoteScreen';

export const metadata: Metadata = {
  title: 'Your quotation',
  // A quotation is private to whoever holds the link; keep it out of search results and previews.
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <QuoteScreen token={decodeURIComponent(token)} />;
}
