'use client';

import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Modal + side Drawer on one accessible primitive (focus trap, Escape, scroll
 * lock, return-focus are handled by Radix). `title` is required for screen readers.
 */
export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

const panel = cva(
  'fixed z-[var(--z-modal)] flex max-h-[90dvh] flex-col border border-line-soft bg-surface-raised shadow-[var(--elev-3)] focus:outline-none',
  {
    variants: {
      kind: {
        modal:
          'left-1/2 top-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] data-[state=open]:animate-[ui-pop-in_var(--dur-slow)_var(--ease-out)] data-[state=closed]:animate-[ui-pop-out_var(--dur-base)_var(--ease-in)]',
        drawer:
          'right-0 top-0 h-dvh max-h-none w-full max-w-md rounded-l-[var(--radius-xl)] data-[state=open]:animate-[ui-slide-in-right_var(--dur-slow)_var(--ease-out)] data-[state=closed]:animate-[ui-slide-out-right_var(--dur-base)_var(--ease-in)]',
      },
      size: { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' },
    },
    compoundVariants: [{ kind: 'drawer', size: 'sm', class: 'max-w-sm' }],
    defaultVariants: { kind: 'modal', size: 'md' },
  },
);

type ContentProps = Omit<React.ComponentPropsWithoutRef<typeof D.Content>, 'title'> &
  VariantProps<typeof panel> & { title: string; description?: string; footer?: React.ReactNode; hideTitle?: boolean };

export const DialogContent = React.forwardRef<HTMLDivElement, ContentProps>(function DialogContent(
  { className, kind, size, title, description, footer, hideTitle, children, ...props },
  ref,
) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--scrim)] backdrop-blur-[2px] data-[state=open]:animate-[ui-overlay-in_var(--dur-base)_ease-out]" />
      <D.Content ref={ref} className={cn(panel({ kind, size }), className)} aria-describedby={description ? undefined : undefined} {...props}>
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-6 py-4">
          <div>
            <D.Title className={cn('text-base font-semibold tracking-tight text-fg', hideTitle && 'sr-only')}>{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-[13px] text-fg-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
          <D.Close
            aria-label="Close"
            className="-mr-2 grid size-9 shrink-0 cursor-pointer place-items-center rounded-[var(--radius-md)] text-fg-muted transition-colors hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
          >
            <X className="size-4" aria-hidden="true" />
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line-soft px-6 py-4">{footer}</div>}
      </D.Content>
    </D.Portal>
  );
});
