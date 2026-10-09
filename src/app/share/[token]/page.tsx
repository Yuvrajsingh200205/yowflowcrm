import type { Metadata } from 'next';
import { SharedGalleryScreen } from '@/features/client-portal/SharedGalleryScreen';

export const metadata: Metadata = {
  title: 'Shared Wedding Gallery',
  // A shared link is private to whoever holds it; keep it out of search results.
  robots: { index: false, follow: false },
};

export default async function SharedGalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedGalleryScreen token={decodeURIComponent(token)} />;
}
