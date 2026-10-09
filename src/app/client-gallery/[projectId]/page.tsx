import type { Metadata } from 'next';
import { ClientGalleryScreen } from '@/features/client-portal/ClientGalleryScreen';

export const metadata: Metadata = {
  title: 'Luxury Client Gallery',
  description: 'Your Wedding Photo Planet wedding collection — events, films, album selection and delivery.',
};

export default async function ClientGalleryPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <ClientGalleryScreen projectId={decodeURIComponent(projectId)} />;
}
