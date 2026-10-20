'use client';

import * as React from 'react';
import * as M from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn';

export const Dropdown = M.Root;
export const DropdownTrigger = M.Trigger;

export const DropdownContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof M.Content>>(function DropdownContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <M.Portal>
      <M.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-[var(--z-dropdown)] min-w-44 overflow-hidden rounded-[var(--radius-lg)] border border-line-soft bg-surface-raised p-1 shadow-[var(--elev-3)]',
          'data-[state=open]:animate-[ui-pop-in_var(--dur-base)_var(--ease-out)]',
          className,
        )}
        {...props}
      />
    </M.Portal>
  );
});

export const DropdownItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof M.Item> & { destructive?: boolean }>(function DropdownItem({ className, destructive, ...props }, ref) {
  return (
    <M.Item
      ref={ref}
      className={cn(
        'flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 text-[13px] outline-none transition-colors [&_svg]:size-4 [&_svg]:text-fg-subtle',
        'data-[highlighted]:bg-[var(--hover)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        destructive ? 'text-bad [&_svg]:text-bad' : 'text-fg',
        className,
      )}
      {...props}
    />
  );
});

export const DropdownLabel = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof M.Label>) => (
  <M.Label className={cn('px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle', className)} {...props} />
);
export const DropdownSeparator = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof M.Separator>) => (
  <M.Separator className={cn('-mx-1 my-1 h-px bg-line-soft', className)} {...props} />
);
