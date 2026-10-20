import { BRAND } from '@/config/brand';
import { cn } from '@/lib/cn';

/** Inline mark (follows the theme) + live wordmark so the display font renders correctly. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-8', className)} role="img" aria-label={BRAND.name}>
      <rect width="64" height="64" rx="15" className="fill-[var(--primary-dark)]" style={{ fill: 'light-dark(#1F3A34, #2A4A42)' }} />
      <g fill="none" stroke="#F4EFE6" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 25V19a3 3 0 0 1 3-3h6" /><path d="M48 25V19a3 3 0 0 0-3-3h-6" />
        <path d="M16 39v6a3 3 0 0 0 3 3h6" /><path d="M48 39v6a3 3 0 0 1-3 3h-6" />
      </g>
      <circle cx="32" cy="32" r="8.5" fill="none" stroke="#C8A15A" strokeWidth="3.6" />
      <circle cx="32" cy="32" r="2.6" fill="#C8A15A" />
    </svg>
  );
}

export function Logo({ className, markClassName, showName = true }: { className?: string; markClassName?: string; showName?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      {showName && <span className="font-display text-xl font-semibold tracking-tight text-fg">{BRAND.name}</span>}
    </span>
  );
}
