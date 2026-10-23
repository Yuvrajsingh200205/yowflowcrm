import type { ReactNode } from 'react';
import { AuthShell } from './AuthShell';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * What an auth page shows in the static HTML while its form hydrates. The heading is real text, so the
 * largest paint happens with the first response instead of after the JavaScript has loaded.
 */
export function AuthFallback({ title, subtitle, fields = 2, footer, heading, points }: { title: string; subtitle?: ReactNode; fields?: number; footer?: ReactNode; heading?: string; points?: string[] }) {
  return (
    <AuthShell title={title} subtitle={subtitle} footer={footer} {...(heading ? { heading } : {})} {...(points ? { points } : {})}>
      <div className="space-y-5" aria-hidden="true">
        {Array.from({ length: fields }, (_, i) => <Skeleton key={i} className="h-[4.1rem] w-full" />)}
        <Skeleton className="h-12 w-full" />
      </div>
    </AuthShell>
  );
}
