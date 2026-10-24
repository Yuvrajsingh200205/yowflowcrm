'use client';

import { Dialog, DialogContent, ErrorState, Skeleton } from '@/components/ui';
import { quotesApi } from '@/lib/api/sales';
import { QuoteBody } from '../../public-sales/QuoteBody';
import { PublicShell } from '../../public-sales/PublicShell';
import { useLoad } from '../ui';

/** The quote exactly as the customer sees it, without counting as a view. */
export function PreviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, error, loading, reload } = useLoad(() => quotesApi.preview(id), [id]);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent size="lg" className="sm:max-w-3xl" title="Customer preview" description="This is what your customer sees. Add-on switches and the accept button work on their page.">
        {loading && !data ? <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-48" /></div>
          : error || !data ? <ErrorState title="Couldn’t load the preview" description={error} action={{ label: 'Try again', onClick: () => void reload() }} />
            : <PublicShell brandColor={data.studio.brandColor} className="min-h-0 rounded-[var(--radius-lg)] bg-canvas p-4 sm:p-6"><QuoteBody data={data} /></PublicShell>}
      </DialogContent>
    </Dialog>
  );
}
