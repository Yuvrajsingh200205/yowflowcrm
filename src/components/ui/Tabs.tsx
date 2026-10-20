'use client';

import * as React from 'react';
import * as T from '@radix-ui/react-tabs';
import { cn } from '@/lib/cn';

export const Tabs = T.Root;

export const TabsList = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof T.List>>(function TabsList({ className, ...props }, ref) {
  return <T.List ref={ref} className={cn('inline-flex items-center gap-1 rounded-[var(--radius-lg)] border border-line-soft bg-surface-sunken p-1', className)} {...props} />;
});

export const TabsTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<typeof T.Trigger>>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <T.Trigger
      ref={ref}
      className={cn(
        'h-8 cursor-pointer rounded-[var(--radius-md)] px-3.5 text-[13px] font-medium text-fg-muted transition-[background-color,color,box-shadow] duration-[var(--dur-base)]',
        'hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-[var(--elev-1)]',
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof T.Content>>(function TabsContent({ className, ...props }, ref) {
  return <T.Content ref={ref} className={cn('mt-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]', className)} {...props} />;
});
