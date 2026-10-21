'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ApiError } from '@/lib/api/client';
import { portalApi, errorMessage, fmtDate, type GalleryOverview, type ProjectDetail } from './api';
import { GalleryTab } from './GalleryTab';
import { OverviewTab, PaymentsTab, RequestsTab, SharingTab } from './ProjectTabs';

const TABS = ['overview', 'gallery', 'payments', 'requests', 'sharing'] as const;
type Tab = (typeof TABS)[number];

export function ProjectScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = params.get('tab') as Tab | null;
  const tab: Tab = requested && TABS.includes(requested) ? requested : 'overview';
  const [data, setData] = React.useState<ProjectDetail | null>(null);
  const [gallery, setGallery] = React.useState<GalleryOverview | null>(null);
  const [error, setError] = React.useState<{ message: string; notFound: boolean } | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    portalApi.project(projectId).then(setData).catch((e) => setError({ message: errorMessage(e), notFound: e instanceof ApiError && e.status === 404 }));
    portalApi.gallery(projectId).then(setGallery).catch(() => undefined);
  }, [projectId]);
  React.useEffect(load, [load]);

  const select = (next: string) => router.replace(`${pathname}?tab=${next}`, { scroll: false });

  if (error) {
    return <ErrorState title={error.notFound ? 'We couldn’t find that project' : 'We couldn’t load this project'} description={error.message} action={error.notFound ? { label: 'Back to my projects', href: '/client' } : { label: 'Try again', onClick: load }} />;
  }
  if (!data) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-5 w-48" /><Skeleton className="mt-6 h-64 w-full" /></div>;

  const { project } = data;
  return (
    <div>
      <Link href="/client" className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ring)]"><ArrowLeft className="size-4" aria-hidden="true" />All projects</Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">{project.name}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-fg-muted">
        <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden="true" />{fmtDate(project.weddingDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        {(project.venueName || project.venueCity) && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{[project.venueName, project.venueCity].filter(Boolean).join(', ')}</span>}
      </p>
      <Tabs value={tab} onValueChange={select} className="mt-6">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList aria-label="Project sections">
            {TABS.map((t) => <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>)}
          </TabsList>
        </div>
        <TabsContent value="overview"><OverviewTab d={data} /></TabsContent>
        <TabsContent value="gallery">{tab === 'gallery' && <GalleryTab projectId={projectId} />}</TabsContent>
        <TabsContent value="payments"><PaymentsTab d={data} /></TabsContent>
        <TabsContent value="requests">{tab === 'requests' && <RequestsTab projectId={projectId} />}</TabsContent>
        <TabsContent value="sharing">{tab === 'sharing' && <SharingTab projectId={projectId} gallery={gallery} />}</TabsContent>
      </Tabs>
    </div>
  );
}
