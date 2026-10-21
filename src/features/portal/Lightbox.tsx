'use client';

import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Download, Heart, MessageSquare, Send, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { portalApi, errorMessage, fmtDate, type MediaItem, type PortalComment } from './api';

interface Props {
  items: MediaItem[];
  index: number;
  hasMore: boolean;
  onIndex: (i: number) => void;
  onClose: () => void;
  onLoadMore: () => void;
  onToggle: (item: MediaItem, kind: 'FAVORITE' | 'ALBUM') => void;
  albumFull: boolean;
}

/** Full-screen viewer: keyboard (←/→/Esc), focus-trapped, preloads neighbours, loads more near the end. */
export function Lightbox({ items, index, hasMore, onIndex, onClose, onLoadMore, onToggle, albumFull }: Props) {
  const { toast } = useToast();
  const item = items[index];
  const [comments, setComments] = React.useState<PortalComment[] | null>(null);
  const [note, setNote] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [panel, setPanel] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const go = React.useCallback((d: number) => { const n = index + d; if (n >= 0 && n < items.length) onIndex(n); }, [index, items.length, onIndex]);

  React.useEffect(() => { if (hasMore && index >= items.length - 4) onLoadMore(); }, [hasMore, index, items.length, onLoadMore]);

  React.useEffect(() => {
    for (const d of [1, -1]) { const n = items[index + d]; if (n && n.mediaType === 'IMAGE') { const img = new Image(); img.src = n.previewUrl; } }
  }, [index, items]);

  const itemId = item?.id;
  React.useEffect(() => {
    if (!itemId || !panel) return;
    let live = true;
    setComments(null);
    portalApi.mediaDetail(itemId).then((d) => live && setComments(d.comments)).catch(() => live && setComments([]));
    return () => { live = false; };
  }, [itemId, panel]);

  if (!item) return null;

  const send = async () => {
    if (!note.trim()) return;
    setSending(true);
    try {
      await portalApi.comment(item.id, note.trim(), 'GENERAL');
      setNote('');
      const d = await portalApi.mediaDetail(item.id);
      setComments(d.comments);
      toast({ tone: 'success', title: 'Note sent to your studio' });
    } catch (e) { toast({ tone: 'error', title: 'Couldn’t send your note', description: errorMessage(e) }); }
    finally { setSending(false); }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const { url, fileName } = await portalApi.download(item.id);
      const a = document.createElement('a');
      a.href = url; a.download = fileName; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { toast({ tone: 'error', title: 'Download unavailable', description: errorMessage(e) }); }
    finally { setDownloading(false); }
  };

  const iconBtn = 'grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40';

  return (
    <D.Root open onOpenChange={(o) => !o && onClose()}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[var(--z-modal,60)] bg-black/95" />
        <D.Content
          aria-describedby={undefined}
          onKeyDown={(e) => { if (e.target instanceof HTMLTextAreaElement) return; if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); }}
          className="fixed inset-0 z-[var(--z-modal,60)] flex flex-col text-white focus:outline-none"
        >
          <D.Title className="sr-only">{item.title || 'Photograph'} — {index + 1} of {items.length}{hasMore ? '+' : ''}</D.Title>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="truncate text-sm text-white/70" aria-hidden="true">{index + 1} / {items.length}{hasMore ? '+' : ''}</p>
            <div className="flex items-center gap-2">
              <button type="button" className={cn(iconBtn, item.isFavorite && 'bg-lime text-on-lime hover:bg-lime')} aria-pressed={item.isFavorite} aria-label={item.isFavorite ? 'Remove from favourites' : 'Add to favourites'} onClick={() => onToggle(item, 'FAVORITE')}><Heart className={cn('size-5', item.isFavorite && 'fill-current')} aria-hidden="true" /></button>
              <button type="button" className={cn(iconBtn, item.isAlbumPick && 'bg-lime text-on-lime hover:bg-lime')} aria-pressed={item.isAlbumPick} disabled={!item.isAlbumPick && albumFull} aria-label={item.isAlbumPick ? 'Remove from album' : albumFull ? 'Album is full' : 'Add to album'} onClick={() => onToggle(item, 'ALBUM')}><BookOpen className="size-5" aria-hidden="true" /></button>
              <button type="button" className={cn(iconBtn, panel && 'bg-white/30')} aria-pressed={panel} aria-label="Notes for the studio" onClick={() => setPanel((v) => !v)}><MessageSquare className="size-5" aria-hidden="true" /></button>
              {item.downloadAllowed && <button type="button" className={iconBtn} aria-label="Download original" disabled={downloading} onClick={download}>{downloading ? <Spinner /> : <Download className="size-5" aria-hidden="true" />}</button>}
              <D.Close className={iconBtn} aria-label="Close viewer"><X className="size-5" aria-hidden="true" /></D.Close>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1">
            <div className="relative flex min-w-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
              {item.mediaType === 'VIDEO'
                ? <video key={item.id} src={item.previewUrl} controls playsInline className="max-h-full max-w-full rounded-md" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img key={item.id} src={item.previewUrl} alt={item.title || 'Wedding photograph'} className="max-h-full max-w-full select-none rounded-md object-contain" draggable={false} />}
              <button type="button" className={cn(iconBtn, 'absolute left-2 top-1/2 -translate-y-1/2 sm:left-4')} aria-label="Previous photograph" disabled={index === 0} onClick={() => go(-1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
              <button type="button" className={cn(iconBtn, 'absolute right-2 top-1/2 -translate-y-1/2 sm:right-4')} aria-label="Next photograph" disabled={index >= items.length - 1} onClick={() => go(1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
            </div>

            {panel && (
              <aside aria-label="Notes" className="absolute inset-x-0 bottom-0 z-10 flex max-h-[70%] flex-col gap-3 rounded-t-2xl bg-surface-raised p-4 text-fg shadow-[var(--elev-3)] sm:static sm:max-h-none sm:w-80 sm:rounded-none sm:border-l sm:border-line-soft">
                <h2 className="text-sm font-semibold">Notes for this photograph</h2>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto" aria-live="polite">
                  {comments === null && <Spinner label="Loading notes" />}
                  {comments?.length === 0 && <p className="text-[13px] text-fg-muted">Ask for a retouch, a crop or a removal — your studio will see it right away.</p>}
                  {comments?.map((c) => (
                    <div key={c.id} className={cn('rounded-lg px-3 py-2 text-[13px]', c.fromStudio ? 'bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]' : 'bg-surface-sunken')}>
                      <p className="mb-0.5 text-xs font-medium text-fg-muted">{c.author} · {fmtDate(c.createdAt, { day: 'numeric', month: 'short' })}</p>
                      <p className="whitespace-pre-wrap text-fg">{c.body}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <label htmlFor="lb-note" className="sr-only">Your note</label>
                  <Textarea id="lb-note" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note…" />
                  <Button size="sm" className="w-full" onClick={send} loading={sending} disabled={!note.trim()}><Send />Send to studio</Button>
                </div>
              </aside>
            )}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
