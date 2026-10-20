import type { MetadataRoute } from 'next';
import { BRAND } from '@/config/brand';

const PAGES: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/features', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/changelog', priority: 0.5, changeFrequency: 'weekly' },
  { path: '/signup', priority: 0.8, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = BRAND.siteUrl.replace(/\/$/, '');
  return PAGES.map((p) => ({ url: `${base}${p.path}`, lastModified: new Date(), changeFrequency: p.changeFrequency, priority: p.priority }));
}
