import type { ReactNode } from 'react';
import { Container, Display } from './Editorial';
import { Reveal } from './Reveal';

/**
 * Masthead for the secondary public pages.
 *
 * Ink, deep top padding to clear the fixed navigation, and an index mark that
 * keeps these pages inside the same editorial system as the landing page
 * instead of the centred placeholder hero they used before.
 */
export function PageHeader({
  mark,
  title,
  lead,
  children,
}: {
  mark: string;
  title: ReactNode;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <header className="ed-ink relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(52rem_34rem_at_88%_-14%,rgba(185,154,94,.15),transparent_70%),radial-gradient(40rem_30rem_at_2%_18%,rgba(79,85,76,.18),transparent_72%)]"
      />
      <Container className="pb-[clamp(3.5rem,7vw,6rem)] pt-[clamp(8.5rem,13vw,12rem)]">
        <Reveal className="flex items-center gap-4">
          <span className="h-px w-10 bg-[var(--ed-brass)]" aria-hidden="true" />
          <span className="ed-label text-[var(--ed-brass)]">{mark}</span>
        </Reveal>
        <Reveal delay={80}>
          <Display as="h1" step="ed-d1" className="mt-8 max-w-[24ch] text-[var(--ed-on-ink)]">
            {title}
          </Display>
        </Reveal>
        {lead && (
          <Reveal delay={160}>
            <p className="mt-8 max-w-[48ch] text-[0.9375rem] leading-[1.78] text-[var(--ed-on-ink-dim)] sm:text-base">
              {lead}
            </p>
          </Reveal>
        )}
        {children && (
          <Reveal delay={240} className="mt-10">
            {children}
          </Reveal>
        )}
      </Container>
    </header>
  );
}

/** Prose block for legal and long-form pages, on paper. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="ed-prose max-w-[64ch] text-[0.9375rem] leading-[1.8] text-[var(--ed-on-paper-dim)]">
      {children}
    </div>
  );
}
