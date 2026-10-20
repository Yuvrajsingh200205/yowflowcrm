import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

/**
 * One primary action per screen; everything else is secondary/ghost.
 * Every variant defines hover, active, focus-visible, disabled and loading.
 */
export const buttonStyles = cva(
  [
    'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-medium',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-out)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress',
    '[&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer motion-reduce:transition-none motion-reduce:active:translate-y-0',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-on-brand shadow-[var(--elev-1)] hover:bg-brand-hover',
        secondary:
          'border border-line bg-surface text-fg shadow-[var(--elev-1)] hover:border-line-strong hover:bg-[var(--hover)]',
        ghost: 'text-fg-muted hover:bg-[var(--hover)] hover:text-fg',
        danger: 'bg-bad text-[var(--on-danger)] shadow-[var(--elev-1)] hover:brightness-95',
        accent: 'bg-lime text-on-lime shadow-[var(--elev-1)] hover:shadow-[var(--glow)] hover:brightness-105',
        link: 'h-auto rounded-sm p-0 text-brand underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-[13px]',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-[15px]',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild, loading, disabled, children, type = 'button', ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner />}
          {children}
        </>
      )}
    </Comp>
  );
});
