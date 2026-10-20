import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Page not found', robots: { index: false } };

export default function NotFound() {
  return (
    <main data-theme="dark" className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-canvas px-6 text-center text-fg">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(180,240,60,.2),transparent_62%)]" aria-hidden="true" />
      <div>
        <Link href="/" aria-label="Home" className="inline-block"><Logo /></Link>
        <p className="mt-12 font-mono text-sm text-brand">404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">This page took a different shot.</h1>
        <p className="mx-auto mt-4 max-w-md text-fg-muted">The page you’re looking for doesn’t exist or has moved.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="accent" size="lg"><Link href="/">Back to home</Link></Button>
          <Button asChild variant="secondary" size="lg"><Link href="/dashboard">Open workspace</Link></Button>
        </div>
      </div>
    </main>
  );
}
