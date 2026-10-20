import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';

/**
 * Editorial type pairing for the public marketing surface only.
 *
 * Fraunces carries the display voice: a high-contrast, slightly wonky old-style
 * face that reads as printed matter rather than product UI. Inter
 * (now Inter) handles body, navigation and UI at small sizes; JetBrains Mono
 * is for IDs, amounts and data labels. All three are attached to <html>.
 */
export const displayFont = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  axes: ['SOFT', 'WONK', 'opsz'],
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
  variable: '--font-mono-face',
});
