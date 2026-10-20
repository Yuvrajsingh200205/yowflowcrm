'use client';

import * as React from 'react';
import * as T from '@radix-ui/react-tooltip';
import { cn } from '@/lib/cn';

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => (
  <T.Provider delayDuration={250} skipDelayDuration={300}>{children}</T.Provider>
);

/** Supplementary text only; never the sole carrier of essential information. */
export function Tooltip({ content, children, side = 'top', className }: { content: React.ReactNode; children: React.ReactElement; side?: 'top' | 'right' | 'bottom' | 'left'; className?: string }) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className={cn(
            'z-[var(--z-toast)] max-w-xs rounded-[var(--radius-md)] bg-[var(--text-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--background)] shadow-[var(--elev-2)]',
            'data-[state=delayed-open]:animate-[ui-pop-in_var(--dur-fast)_var(--ease-out)]',
            className,
          )}
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
