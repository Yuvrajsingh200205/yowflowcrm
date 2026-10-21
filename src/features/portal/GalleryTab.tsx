'use client';

import * as React from 'react';
import { BookOpen, CheckCircle2, Clock, Film, Heart, ImageIcon, Play } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/cn';
import { portalApi, errorMessage, fmtDate, type GalleryOverview, type MediaItem } from './api';
import { Lightbox } from './Lightbox';

const PAGE = 48;
const FILTERS = [
  { id: '', label: 'All' }, { id: 'favorites', label: 'Favourites' }, { id: 'album', label: 'Album picks' }, { id: 'photos', label: 'Photos' }, { id: 'videos', label: 'Videos' },
] as const;

const chip = (active: boolean) => cn('inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]', active ? 'border-transparent bg-fg text-canvas' : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg');

export function GalleryTab({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [overview, setOverview] = React.useState<GalleryOverview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sectionId, setSectionId] = React.useState('');
  const [subFolderId, setSubFolderId] = React.useState('');
  const [filter, setFilter] = React.useState('');
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState<number | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const sentinel = React.useRef<HTMLDivElement>(null);
  const generation = React.useRef(0);
  const inFlight = React.useRef(false);

  const loadOverview = React.useCallback(() => portalApi.gallery(projectId).then(setOverview), [projectId]);
  React.useEffect(() => { loadOverview().catch((e) => setError(errorMessage(e))); }, [loadOverview]);

  const fetchPage = React.useCallback(async (after: string | null, gen: number) => {
    if (inFlight.current && after) return;
    inFlight.current = true; setLoading(true); setListError(null);
    try {
      const page = await portalApi.media(projectId, { sectionId, subFolderId, filter, cursor: after ?? undefined, limit: PAGE });
      if (gen !== generation.current) return;
      setItems((cur) => (after ? [...cur, ...page.items.filter((n) => !cur.some((c) => c.id === n.id))] : page.items));
      setCursor(page.nextCursor);
    } catch (e) { if (gen === generation.current) setListError(errorMessage(e)); }
    finally { if (gen === generation.current) { setLoading(false); inFlight.current = false; } }
  }, [projectId, sectionId, subFolderId, filter]);

  const available = overview?.available;
  React.useEffect(() => {
    if (!available) return;
    generation.current += 1; inFlight.current = false;
    setItems([]); setCursor(null); setOpen(null);
    void fetchPage(null, generation.current);
  }, [available, fetchPage]);

  const loadMore = React.useCallback(() => { if (cursor && !inFlight.current) void fetchPage(cursor, generation.current); }, [cursor, fetchPage]);

  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadMore(); }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loadMore, items.length]);

  const sel = overview?.selection;
  const albumFull = Boolean(sel && sel.albumTarget > 0 && sel.album >= sel.albumTarget);

  const toggle = React.useCallback(async (item: MediaItem, kind: 'FAVORITE' | 'ALBUM') => {
    const key = kind === 'FAVORITE' ? 'isFavorite' : 'isAlbumPick';
    const on = !item[key];
    if (kind === 'ALBUM' && on && albumFull) { toast({ tone: 'warning', title: 'Your album is full', description: 'Remove a photograph to add another.' }); return; }
    const apply = (value: boolean) => {
      setItems((cur) => cur.map((m) => (m.id === item.id ? { ...m, [key]: value } : m)));
      setOverview((o) => (o && o.selection ? { ...o, selection: { ...o.selection, [kind === 'FAVORITE' ? 'favorites' : 'album']: o.selection[kind === 'FAVORITE' ? 'favorites' : 'album'] + (value ? 1 : -1) } } : o));
    };
    apply(on);
    try { await portalApi.select(item.id, kind, on); }
    catch (e) { apply(!on); toast({ tone: 'error', title: kind === 'ALBUM' ? 'Couldn’t update your album' : 'Couldn’t update favourites', description: errorMessage(e) }); }
  }, [albumFull, toast]);

  const submitAlbum = async () => {
    setSubmitting(true);
    try {
      await portalApi.submitAlbum(projectId);
      await loadOverview();
      toast({ tone: 'success', title: 'Album selection sent', description: 'Your studio has been notified.' });
    } catch (e) { toast({ tone: 'error', title: 'Couldn’t send your selection', description: errorMessage(e) }); }
    finally { setSubmitting(false); }
  };

  if (error) return <ErrorState title="We couldn’t load the gallery" description={error} action={{ label: 'Try again', onClick: () => { setError(null); loadOverview().catch((e) => setError(errorMessage(e))); } }} />;
  if (!overview) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full" />)}</div></div>;
  if (!overview.available) {
    return <EmptyState icon={<Clock />} title="Your gallery isn’t ready yet" description={overview.gallery?.expectedDeliveryDate ? `Your photographers expect to share it around ${fmtDate(overview.gallery.expectedDeliveryDate)}. We’ll email you the moment it’s live.` : 'We’ll email you the moment your photographs are ready to view.'} />;
  }

  const section = overview.sections.find((s) => s.id === sectionId);
  return (
    <div>
      {overview.gallery?.welcomeMessage && <p className="mb-5 max-w-2xl rounded-[var(--radius-lg)] border border-line-soft bg-surface p-4 text-[15px] leading-relaxed text-fg-muted">{overview.gallery.welcomeMessage}</p>}

      {sel && (
        <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[var(--radius-lg)] border border-line-soft bg-surface p-4">
          <p className="flex items-center gap-2 text-sm text-fg"><Heart className="size-4 text-brand" aria-hidden="true" /><strong>{sel.favorites}</strong> favourite{sel.favorites === 1 ? '' : 's'}</p>
          {(sel.albumTarget ?? 0) > 0 && (
            <>
              <p className="flex items-center gap-2 text-sm text-fg" aria-live="polite"><BookOpen className="size-4 text-brand" aria-hidden="true" /><strong>{sel.album}</strong> of {sel.albumTarget} album photographs</p>
              <div className="ml-auto flex items-center gap-3">
                {sel.submittedAt && <Badge tone="success"><CheckCircle2 className="size-3.5" aria-hidden="true" />Sent {fmtDate(sel.submittedAt)}</Badge>}
                <Button size="sm" onClick={submitAlbum} loading={submitting} disabled={sel.album === 0}>{sel.submittedAt ? 'Send updated selection' : 'Send selection to studio'}</Button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Sections">
          <button type="button" className={chip(!sectionId)} aria-pressed={!sectionId} onClick={() => { setSectionId(''); setSubFolderId(''); }}>All sections <span className="text-xs opacity-70">{overview.totals.media}</span></button>
          {overview.sections.map((s) => <button key={s.id} type="button" className={chip(sectionId === s.id)} aria-pressed={sectionId === s.id} onClick={() => { setSectionId(s.id); setSubFolderId(''); }}>{s.name} <span className="text-xs opacity-70">{s.mediaCount}</span></button>)}
        </div>
        {section && section.subFolders.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Folders">
            <button type="button" className={chip(!subFolderId)} aria-pressed={!subFolderId} onClick={() => setSubFolderId('')}>Everything</button>
            {section.subFolders.map((f) => <button key={f.id} type="button" className={chip(subFolderId === f.id)} aria-pressed={subFolderId === f.id} onClick={() => setSubFolderId(f.id)}>{f.name} <span className="text-xs opacity-70">{f.mediaCount}</span></button>)}
          </div>
        )}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter photographs">
          {FILTERS.map((f) => <button key={f.id} type="button" className={chip(filter === f.id)} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>)}
        </div>
      </div>

      {section?.description && <p className="mt-4 text-sm text-fg-muted">{section.description}</p>}

      <div className="mt-5">
        {listError && <ErrorState title="Couldn’t load photographs" description={listError} action={{ label: 'Try again', onClick: () => void fetchPage(cursor, generation.current) }} />}
        {!listError && !loading && items.length === 0 && <EmptyState icon={filter === 'favorites' ? <Heart /> : <ImageIcon />} title={filter === 'favorites' ? 'No favourites yet' : filter === 'album' ? 'No album picks yet' : 'Nothing here yet'} description={filter ? 'Tap the heart on any photograph to see it here.' : 'Photographs will appear here as your studio adds them.'} />}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4" aria-label="Photographs">
          {items.map((m, i) => (
            <li key={m.id} className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken [content-visibility:auto] [contain-intrinsic-size:auto_220px]">
              <button type="button" onClick={() => setOpen(i)} aria-label={`Open ${m.title || 'photograph'} ${i + 1}`} className="block aspect-[4/3] w-full cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumbUrl} alt={m.title || 'Wedding photograph'} width={m.width ?? 400} height={m.height ?? 300} loading={i < 8 ? 'eager' : 'lazy'} decoding="async" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
                {m.mediaType === 'VIDEO' && <span className="absolute inset-0 grid place-items-center bg-black/25"><span className="grid size-12 place-items-center rounded-full bg-white/90 text-black"><Play className="size-5 fill-current" aria-hidden="true" /></span></span>}
              </button>
              <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end gap-1.5 bg-gradient-to-b from-black/45 to-transparent p-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <button type="button" aria-pressed={m.isAlbumPick} aria-label={m.isAlbumPick ? 'Remove from album' : 'Add to album'} onClick={() => toggle(m, 'ALBUM')} className={cn('pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-full backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-white', m.isAlbumPick ? 'bg-lime text-on-lime' : 'bg-black/40 text-white hover:bg-black/60')}><BookOpen className="size-4" aria-hidden="true" /></button>
                <button type="button" aria-pressed={m.isFavorite} aria-label={m.isFavorite ? 'Remove from favourites' : 'Add to favourites'} onClick={() => toggle(m, 'FAVORITE')} className={cn('pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-full backdrop-blur transition-colors focus-visible:outline-2 focus-visible:outline-white', m.isFavorite ? 'bg-lime text-on-lime' : 'bg-black/40 text-white hover:bg-black/60')}><Heart className={cn('size-4', m.isFavorite && 'fill-current')} aria-hidden="true" /></button>
              </div>
              {m.mediaType === 'VIDEO' && <Film className="pointer-events-none absolute bottom-2 left-2 size-4 text-white drop-shadow" aria-hidden="true" />}
            </li>
          ))}
        </ul>
        {loading && <div className="grid place-items-center py-8 text-fg-muted"><Spinner label="Loading photographs" /></div>}
        <div ref={sentinel} className="h-px" aria-hidden="true" />
      </div>

      {open !== null && <Lightbox items={items} index={open} hasMore={Boolean(cursor)} onIndex={setOpen} onClose={() => setOpen(null)} onLoadMore={loadMore} onToggle={toggle} albumFull={albumFull} />}
    </div>
  );
}
