import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/** Status is never colour-only: always pair the badge with text (and an optional dot). */
const badge = cva('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      neutral: 'border-line bg-surface-sunken text-fg-muted',
      brand: 'border-transparent bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-brand',
      success: 'border-transparent bg-ok-bg text-ok',
      warning: 'border-transparent bg-warn-bg text-warn',
      danger: 'border-transparent bg-bad-bg text-bad',
      info: 'border-transparent bg-note-bg text-note',
      gold: 'border-transparent bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[color-mix(in_srgb,var(--accent)_55%,var(--text-primary))]',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export function Badge({ tone, dot, className, children, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge> & { dot?: boolean }) {
  return (
    <span className={cn(badge({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
