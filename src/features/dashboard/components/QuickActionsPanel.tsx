'use client';

import Link from 'next/link';
import { Camera, CreditCard, FolderPlus, Receipt } from 'lucide-react';
import { usePermission } from '@/features/access';

export function QuickActionsPanel() {
  const { can } = usePermission();
  const actions = [
    { label: 'New project', icon: FolderPlus, href: '/projects/new', show: can('weddings.create') },
    { label: 'Schedule shoot', icon: Camera, href: '/shoots', show: can('shoots.create') || can('shoots.view') },
    { label: 'Record payment', icon: CreditCard, href: '/expenses', show: can('finance.record_payment') },
    { label: 'Add expense', icon: Receipt, href: '/expenses', show: can('finance.manage_expenses') },
  ].filter((a) => a.show);

  if (!actions.length) return null;

  return (
    <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map(({ label, icon: Icon, href }) => (
        <Link
          key={label}
          href={href}
          prefetch
          className="group flex h-14 items-center gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-surface px-4 text-sm font-medium text-fg shadow-[var(--elev-1)] transition-[transform,border-color,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-[var(--ring)] hover:shadow-[var(--elev-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-lime text-on-lime transition-transform group-hover:scale-105 motion-reduce:transition-none"><Icon className="size-4" aria-hidden="true" /></span>
          {label}
        </Link>
      ))}
    </section>
  );
}
