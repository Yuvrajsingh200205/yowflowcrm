import type { ReactNode } from 'react';
import { MarketingFooter, MarketingNav } from '@/features/marketing/MarketingChrome';

/** Public marketing shell: always the dark, lime-accented Yowflow look. */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div data-theme="dark" className="min-h-screen bg-canvas text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-lime focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-lime">Skip to content</a>
      <MarketingNav />
      <main id="main">{children}</main>
      <MarketingFooter />
    </div>
  );
}
