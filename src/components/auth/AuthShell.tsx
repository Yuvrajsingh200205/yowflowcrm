import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { Logo } from '@/components/ui/Logo';

const POINTS = [
  'Capture every enquiry and follow it to a booking',
  'Schedule crews and freelancers without clashes',
  'Invoice, collect and deliver from one record',
];

/**
 * Split layout for every authentication screen. The brand side is always dark;
 * the form side follows the page theme (light by default).
 */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-canvas text-fg lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside data-theme="dark" className="relative hidden overflow-hidden bg-canvas text-fg lg:flex lg:flex-col lg:justify-between lg:p-12" aria-hidden="false">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-24 top-1/3 size-[34rem] rounded-full bg-[radial-gradient(circle,rgba(180,240,60,.22),transparent_62%)]" />
          <div className="absolute -right-32 -top-32 size-[28rem] rounded-full border border-[rgba(180,240,60,.14)] shadow-[0_0_0_70px_rgba(180,240,60,.03),0_0_0_150px_rgba(180,240,60,.02)]" />
        </div>
        <Link href="/" className="relative w-fit rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]"><Logo priority /></Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-balance xl:text-5xl">Run the business of your studio, calmly.</h2>
          <ul className="mt-8 space-y-3.5">
            {POINTS.map((p) => <li key={p} className="flex gap-3 text-[15px] text-fg-muted"><Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />{p}</li>)}
          </ul>
        </div>
        <p className="relative text-xs text-fg-subtle">© {new Date().getFullYear()} {BRAND.name}</p>
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8 lg:px-14">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-md text-sm text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]"><ArrowLeft className="size-4" aria-hidden="true" />Back to site</Link>
          <span className="lg:hidden"><Logo showName={false} markClassName="size-8" /></span>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-fg-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
