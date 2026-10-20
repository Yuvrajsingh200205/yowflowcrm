import { cn } from '@/lib/cn';

/** Shimmer placeholder. Reserve the final size to avoid layout shift. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-[var(--radius-md)] bg-[linear-gradient(90deg,var(--border-soft),var(--surface-sunken),var(--border-soft))] bg-[length:200%_100%] animate-[ui-shimmer_1.4s_linear_infinite] motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}
