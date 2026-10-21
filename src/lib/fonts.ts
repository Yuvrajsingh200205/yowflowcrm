import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';

/**
 * Editorial type pairing for the public marketing surface only.
 *
 * Fraunces carries the display voice: a high-contrast, slightly wonky old-style
 * face that reads as printed matter rather than product UI. Inter
 * (now Inter) handles body, navigation and UI at small sizes; JetBrains Mono
 * is for IDs, amounts and data labels. All three are attached to <html>.
 */
export const displayFont = Space_Grotesk({
  subsets: ['latin'],
  // `optional` + the automatic size-matched fallback means headings never re-flow when the
  // font arrives, which keeps LCP and CLS stable. The font is preloaded, so it is used almost always.
  display: 'optional',
  weight: ['500', '600', '700'],
  variable: '--font-display-face',
});

export const sansFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-face',
});

export const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  preload: false, // only used for IDs and figures, never above the fold
  variable: '--font-mono-face',
});
