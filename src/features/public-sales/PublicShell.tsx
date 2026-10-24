import * as React from 'react';
import { Mail, Phone } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { cn } from '@/lib/cn';
import { brandStyle } from './brandTheme';

interface Studio { name: string; phone?: string | null; email?: string | null; city?: string | null; brandColor?: string | null }

/** Wraps a customer-facing page in the studio's own colours. Everything inside uses the normal design tokens. */
export function PublicShell({ brandColor, children, className }: { brandColor?: string | null; children: React.ReactNode; className?: string }) {
  return (
    <div data-theme="light" style={brandStyle(brandColor)} className={cn('min-h-dvh bg-canvas text-fg', className)}>
      {children}
    </div>
  );
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export function StudioHeader({ studio, subtitle }: { studio: Studio; subtitle?: string }) {
  return (
    <header className="border-b border-line-soft bg-surface">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-semibold tracking-tight text-fg sm:text-2xl">{studio.name}</p>
          {(subtitle || studio.city) && <p className="text-[13px] text-fg-muted">{subtitle ?? studio.city}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          {studio.phone && <a href={telHref(studio.phone)} className="inline-flex min-h-8 items-center gap-1.5 text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"><Phone className="size-3.5" aria-hidden="true" />{studio.phone}</a>}
          {studio.email && <a href={`mailto:${studio.email}`} className="inline-flex min-h-8 items-center gap-1.5 text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"><Mail className="size-3.5" aria-hidden="true" />{studio.email}</a>}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 text-center text-xs text-fg-subtle sm:px-6">
      Powered by <a href={`https://${BRAND.domain}`} target="_blank" rel="noopener noreferrer" className="font-medium text-fg-muted underline-offset-2 hover:underline">{BRAND.name}</a>
    </footer>
  );
}

/** The page for a link that does not lead anywhere, kept neutral so it never reveals what exists. */
export function LinkProblem({ title, body }: { title: string; body: string }) {
  return (
    <PublicShell>
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">{body}</p>
        </div>
      </main>
    </PublicShell>
  );
}
