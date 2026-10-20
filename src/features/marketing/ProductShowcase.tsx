'use client';

import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { SectionHead } from './Sections';
import { BRAND } from '@/config/brand';

const VIEWS = [
  { id: 'dashboard', label: 'Dashboard', src: '/marketing/dashboard.webp', note: 'Revenue, deliveries and upcoming shoots at a glance.' },
  { id: 'leads', label: 'Leads', src: '/marketing/leads.webp', note: 'Every enquiry from first message to confirmed booking.' },
  { id: 'projects', label: 'Projects', src: '/marketing/projects.webp', note: 'One record per project: crew, milestones and deliverables.' },
] as const;

export function ProductShowcase() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <SectionHead eyebrow="See it in action" title="A workspace your whole team will actually open." center />
      <Tabs defaultValue="dashboard" className="mt-12">
        <div className="flex justify-center"><TabsList aria-label="Product views">{VIEWS.map((v) => <TabsTrigger key={v.id} value={v.id}>{v.label}</TabsTrigger>)}</TabsList></div>
        {VIEWS.map((v) => (
          <TabsContent key={v.id} value={v.id} className="mt-8">
            <p className="mb-5 text-center text-sm text-fg-muted">{v.note}</p>
            <div className="overflow-hidden rounded-[1.2rem] border border-line bg-surface shadow-[0_30px_90px_-30px_rgba(0,0,0,.7)]">
              <Image src={v.src} alt={`${BRAND.name} ${v.label} screen`} width={1440} height={900} sizes="(min-width:1024px) 1024px, 100vw" className="h-auto w-full" />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
