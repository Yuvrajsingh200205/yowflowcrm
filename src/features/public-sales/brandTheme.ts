import type { CSSProperties } from 'react';

/**
 * A studio's brand colour re-skins its public pages (booking page and quote). Studios pick any colour, so the
 * text on top of it, the hover shade and the focus ring are derived to stay readable instead of trusting the pick.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;
const INK = '#11160F';
const WHITE = '#FFFFFF';

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const rgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

export const luminance = (hex: string): number => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Ink or white, whichever reads better on this colour. */
export const readableOn = (hex: string): string => (contrast(hex, WHITE) >= contrast(hex, INK) ? WHITE : INK);

const mix = (hex: string, target: string, amount: number): string => {
  const a = rgb(hex);
  const b = rgb(target);
  const out = a.map((v, i) => Math.round(v + (b[i] - v) * amount));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

export const isBrandColor = (value: string | null | undefined): value is string => Boolean(value && HEX.test(value));

/** CSS variables to set on the page wrapper; an empty object keeps the product's own look. */
export function brandStyle(color: string | null | undefined): CSSProperties {
  if (!isBrandColor(color)) return {};
  const on = readableOn(color);
  const dark = luminance(color) < 0.4;
  // Focus ring and link-like text sit on the page background, so they need contrast against it, not against the button.
  const ring = contrast(color, WHITE) >= 3 ? color : INK;
  return {
    '--primary': color,
    '--primary-hover': dark ? mix(color, WHITE, 0.14) : mix(color, INK, 0.14),
    '--primary-dark': mix(color, INK, 0.35),
    '--on-primary': on,
    '--accent': color,
    '--on-accent': on,
    '--ring': ring,
    '--brand-text': contrast(color, WHITE) >= 4.5 ? color : INK,
  } as CSSProperties;
}
