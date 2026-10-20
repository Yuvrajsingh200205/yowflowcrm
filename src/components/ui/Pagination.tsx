'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

function windowed(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  if (page > 3) out.push('…');
  for (let p = Math.max(2, page - 1); p <= Math.min(total - 1, page + 1); p++) out.push(p);
  if (page < total - 2) out.push('…');
  out.push(total);
  return out;
}

export function Pagination({ page, pageCount, onPageChange, className }: { page: number; pageCount: number; onPageChange: (p: number) => void; className?: string }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-between gap-3', className)}>
      <p className="hidden text-[13px] text-fg-muted sm:block" aria-live="polite">Page {page} of {pageCount}</p>
      <ul className="flex items-center gap-1">
        <li><Button variant="secondary" size="icon" className="size-9" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft /></Button></li>
        {windowed(page, pageCount).map((p, i) => (
          <li key={`${p}-${i}`}>
            {p === '…' ? (
              <span className="grid size-9 place-items-center text-fg-subtle" aria-hidden="true">…</span>
            ) : (
              <button
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={cn('grid size-9 cursor-pointer place-items-center rounded-[var(--radius-md)] text-[13px] font-medium tabular transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]', p === page ? 'bg-brand text-on-brand' : 'text-fg-muted hover:bg-[var(--hover)] hover:text-fg')}
              >
                {p}
              </button>
            )}
          </li>
        ))}
        <li><Button variant="secondary" size="icon" className="size-9" aria-label="Next page" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight /></Button></li>
      </ul>
    </nav>
  );
}
