import { Project } from '@/types';
import { ClientUser } from './clientPortalTypes';

export const COUPLE_PHOTO_ASSETS = [
  {
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1920&q=85',
  },
  {
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85',
  },
  {
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1920&q=85',
  },
  {
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1920&q=85',
  },
  {
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85',
  },
];

/**
 * Extracts the clean client couple names from the project wedding title.
 * e.g. "Rohan & Ananya Royal Wedding" -> "Rohan & Ananya"
 * e.g. "Aakash & Simran Destination Engagement" -> "Aakash & Simran"
 */
export function extractClientNames(weddingTitle: string): string {
  if (!weddingTitle) return 'Wedding Client';
  const cleaned = weddingTitle
    .replace(/\s+(Royal Wedding|Destination Wedding|Pre-Wedding & Wedding|Destination Engagement|Destination Pre-Wedding|Sangeet & Haldi|Wedding & Reception|Wedding Function|Wedding Shoot|Pre-Wedding Shoot|Pre-Wedding|Wedding|Engagement|Sangeet|Haldi|Reception|Ceremony|Shoot)$/i, '')
    .trim();
  return cleaned || weddingTitle;
}

/**
 * Derives a ClientUser object directly from a CRM Project.
 */
export function projectToClientUser(
  project: Project, 
  index = 0, 
  existingClient?: ClientUser
): ClientUser {
  const extractedNames = extractClientNames(project.clientWeddingTitle);
  const emailSlug = extractedNames.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || 'client';
  const asset = COUPLE_PHOTO_ASSETS[index % COUPLE_PHOTO_ASSETS.length];

  return {
    id: existingClient?.id || `client-${project.id}`,
    projectId: project.id,
    clientNames: extractedNames,
    primaryEmail: `${emailSlug}@example.com`,
    mobile: project.clientContactMobile || '+91 98000 00000',
    weddingDate: project.weddingFunctionDates || '2026',
    venue: project.venueLocation || 'Venue TBD',
    coverPhotoUrl: existingClient?.coverPhotoUrl || asset.cover,
    avatarUrl: existingClient?.avatarUrl || asset.avatar,
    lastLoginAt: existingClient?.lastLoginAt || '2026-08-20 18:30',
    createdAt: project.createdAt || '2026-07-01',
    isActive: true,
  };
}
