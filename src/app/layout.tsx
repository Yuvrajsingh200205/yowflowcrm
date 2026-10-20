import type { Metadata, Viewport } from 'next';
import { AuthSessionProvider } from '@/components/auth/AuthSessionProvider';
import './globals.css';
import { displayFont, monoFont, sansFont } from '@/lib/fonts';
import { ToastProvider } from '@/components/ui/Toast';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { BRAND } from '@/config/brand';

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: { default: `${BRAND.name} — ${BRAND.tagline}`, template: `%s | ${BRAND.shortName}` },
  description: BRAND.description,
  applicationName: BRAND.name,
  openGraph: { type: 'website', siteName: BRAND.name, locale: 'en_IN', images: [{ url: '/brand/og.png', width: 1200, height: 630, alt: `${BRAND.name} — ${BRAND.tagline}` }] },
  twitter: { card: 'summary_large_image', images: ['/brand/og.png'] },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#F5FBEA' }, { media: '(prefers-color-scheme: dark)', color: '#0D1411' }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
      <body data-theme="light">
        <TooltipProvider>
          <ToastProvider>
            <AuthSessionProvider>{children}</AuthSessionProvider>
          </ToastProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
