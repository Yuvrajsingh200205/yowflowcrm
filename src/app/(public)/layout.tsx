import type { ReactNode } from 'react';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { LandingNavbar } from '@/features/landing/components/LandingNavbar';
import { displayFont, sansFont } from '@/lib/fonts';
import { PublicRevealBootstrap } from './PublicRevealBootstrap';

/**
 * Public marketing shell.
 *
 * The editorial font variables and the `.ui-ed` token scope are applied here
 * rather than on <html>, so the authenticated CRM keeps its existing
 * system-font rendering and token set untouched.
 */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div
      suppressHydrationWarning
      className={`${displayFont.variable} ${sansFont.variable} ui-ed min-h-screen`}
    >
      <PublicRevealBootstrap />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-[var(--ed-brass)] focus:px-4 focus:py-2 focus:text-[0.8125rem] focus:font-semibold focus:text-[var(--ed-ink)]"
      >
        Skip to content
      </a>
      <LandingNavbar />
      <main id="main">{children}</main>
      <LandingFooter />
    </div>
  );
}
