'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Native table semantics, wrapped for horizontal scroll on small screens. */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-lg)] border border-line-soft bg-surface">
      <table className={cn('w-full min-w-[34rem] border-collapse text-left text-sm', className)} {...props} />
    </div>
  );
}
export const THead = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className="bg-surface-sunken" {...p} />;
export const TBody = (p: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className="[&_tr:last-child_td]:border-b-0" {...p} />;
export const TR = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn('transition-colors hover:bg-[var(--hover)]', className)} {...p} />
);
export const TH = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th scope="col" className={cn('whitespace-nowrap border-b border-line-soft px-4 py-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle', className)} {...p} />
);
export const TD = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn('border-b border-line-soft px-4 py-3 text-fg', className)} {...p} />
);

export type SortDir = 'asc' | 'desc' | null;

/** Sortable column header: exposes aria-sort and a real button for keyboard users. */
export function SortableTH({ children, dir, onSort, className, align = 'left' }: { children: React.ReactNode; dir: SortDir; onSort: () => void; className?: string; align?: 'left' | 'right' }) {
  const Icon = dir === 'asc' ? ArrowUp : dir === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <th scope="col" aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'} className={cn('border-b border-line-soft px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle', align === 'right' && 'text-right', className)}>
      <button type="button" onClick={onSort} className={cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2 uppercase tracking-wide transition-colors hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--ring)]', dir && 'text-fg')}>
        {children}
        <Icon className="size-3.5" aria-hidden="true" />
      </button>
    </th>
  );
}
