'use client';

import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Clock, Download, Link2Off, Lock, Play, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { ApiError, apiBaseUrl } from '@/lib/api/client';
import { cn } from '@/lib/cn';

interface Overview {
  title: string; galleryTitle: string; projectName: string; accessType: string; downloadAllowed: boolean; watermarkEnabled: boolean; total: number;
  studio: { name: string; phone: string | null; email: string | null };
  sections: Array<{ id: string; name: string; mediaCount: number }>;
}
interface Item { id: string; sectionId: string; title: string; mediaType: 'IMAGE' | 'VIDEO'; thumbUrl: string; previewUrl: string; width: number | null; height: number | null; downloadAllowed: boolean }
interface Page { items: Item[]; nextCursor: string | null }

const PAGE = 48;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Anonymous, same-origin calls (the password rides in a header, never in the URL). */
async function get<T>(token: string, path: string, password: string | undefined, attempt = 0): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}/shared-galleries/${encodeURIComponent(token)}${path}`, { headers: { Accept: 'application/json', ...(password ? { 'x-share-password': password } : {}) } });
  } catch {
    if (attempt < 2) { await wait(400 * 3 ** attempt); return get(token, path, password, attempt + 1); }
    throw new ApiError(0, 'We could not reach the server. Check your connection and try again.');
  }
  if ([502, 503, 504].includes(res.status) && attempt < 2) { await wait(400 * 3 ** attempt + Math.random() * 200); return get(token, path, password, attempt + 1); }
  const body = await res.json().catch(() => null) as { success?: boolean; data?: T; error?: { message?: string } } | null;
  if (!res.ok || !body?.success) throw new ApiError(res.status, body?.error?.message ?? 'This gallery could not be opened.');
  return body.data as T;
}

const chip = (active: boolean) => cn('inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]', active ? 'border-transparent bg-lime text-on-lime' : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg');
const pwKey = (t: string) => `share-pw:${t}`;

function Frame({ children }: { children: React.ReactNode }) {
  return <div data-theme="dark" className="min-h-dvh bg-canvas text-fg">{children}</div>;
}
function Message({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <Frame>
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="w-full max-w-sm text-center">
          <Logo className="mx-auto mb-8 w-fit" />
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-surface-sunken text-brand [&_svg]:size-6" aria-hidden="true">{icon}</span>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-[15px] text-fg-muted">{text}</p>
          {children}
        </div>
      </main>
    </Frame>
  );
}

export function SharedGalleryScreen({ token }: { token: string }) {
  const [password, setPassword] = React.useState<string | undefined>(undefined);
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [state, setState] = React.useState<'loading' | 'ready' | 'password' | 'gone' | 'error'>('loading');
  const [message, setMessage] = React.useState('');
  const [pwInput, setPwInput] = React.useState('');
  const [pwError, setPwError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);

  const [sectionId, setSectionId] = React.useState('');
  const [items, setItems] = React.useState<Item[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState<number | null>(null);
  const sentinel = React.useRef<HTMLDivElement>(null);
  const generation = React.useRef(0);
  const inFlight = React.useRef(false);

  const load = React.useCallback(async (pw?: string) => {
    setState('loading');
    try {
      const o = await get<Overview>(token, '/overview', pw);
      setOverview(o); setPassword(pw); setState('ready');
      if (pw) { try { sessionStorage.setItem(pwKey(token), pw); } catch { /* private mode */ } }
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      const msg = e instanceof Error ? e.message : '';
      if (status === 401) { setState('password'); setPwError(pw ? 'That password isn’t correct.' : undefined); try { sessionStorage.removeItem(pwKey(token)); } catch { /* ignore */ } }
      else if (status === 403 || status === 404) { setState('gone'); setMessage(status === 404 ? 'not-found' : /expired/i.test(msg) ? 'expired' : 'off'); }
      else { setState('error'); setMessage(msg); }
    } finally { setBusy(false); }
  }, [token]);

  React.useEffect(() => {
    let saved: string | undefined;
    try { saved = sessionStorage.getItem(pwKey(token)) ?? undefined; } catch { /* ignore */ }
    void load(saved);
  }, [load, token]);

  const fetchPage = React.useCallback(async (after: string | null, gen: number) => {
    if (inFlight.current && after) return;
    inFlight.current = true; setLoading(true); setListError(null);
    try {
      const q = new URLSearchParams({ limit: String(PAGE) });
      if (sectionId) q.set('sectionId', sectionId);
      if (after) q.set('cursor', after);
      const page = await get<Page>(token, `/media?${q}`, password);
      if (gen !== generation.current) return;
      setItems((cur) => (after ? [...cur, ...page.items.filter((n) => !cur.some((c) => c.id === n.id))] : page.items));
      setCursor(page.nextCursor);
    } catch (e) { if (gen === generation.current) setListError(e instanceof Error ? e.message : 'Couldn’t load photographs.'); }
    finally { if (gen === generation.current) { setLoading(false); inFlight.current = false; } }
  }, [token, password, sectionId]);

  React.useEffect(() => {
    if (state !== 'ready') return;
    generation.current += 1; inFlight.current = false;
    setItems([]); setCursor(null); setOpen(null);
    void fetchPage(null, generation.current);
  }, [state, fetchPage]);

  const loadMore = React.useCallback(() => { if (cursor && !inFlight.current) void fetchPage(cursor, generation.current); }, [cursor, fetchPage]);
  React.useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadMore(); }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loadMore, items.length]);

  const download = React.useCallback(async (item: Item) => {
    try {
      const { url, fileName } = await get<{ url: string; fileName: string }>(token, `/media/${item.id}/download`, password);
      const a = document.createElement('a'); a.href = url; a.download = fileName; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    } catch { /* the button stays; nothing to leak */ }
  }, [token, password]);

  if (state === 'loading') return <Frame><div className="grid min-h-dvh place-items-center"><Spinner label="Opening the gallery" className="[&_svg]:size-6" /></div></Frame>;
  if (state === 'gone') {
    return message === 'expired'
      ? <Message icon={<Clock />} title="This link has expired" text="Ask the person who shared it for a fresh link." />
      : message === 'off'
        ? <Message icon={<Link2Off />} title="This link was turned off" text="The owner has stopped sharing this gallery." />
        : <Message icon={<Link2Off />} title="We couldn’t find this gallery" text="Check the link, or ask the person who shared it to send it again." />;
  }
  if (state === 'error') return <Message icon={<Link2Off />} title="We couldn’t open the gallery" text={message || 'Please try again in a moment.'}><Button className="mt-6" onClick={() => void load(password)}>Try again</Button></Message>;
  if (state === 'password') {
    return (
      <Message icon={<Lock />} title="This gallery is private" text="Enter the password you were given to view the photographs.">
        <form onSubmit={(e) => { e.preventDefault(); if (!pwInput) return; setBusy(true); void load(pwInput); }} className="mt-6 space-y-4 text-left" noValidate>
          <Field label="Password" error={pwError} required>{(a) => <Input id={a.id} type="password" autoComplete="current-password" value={pwInput} onChange={(e) => { setPwInput(e.target.value); setPwError(undefined); }} aria-describedby={a.describedBy} invalid={a.invalid} autoFocus />}</Field>
          <Button type="submit" size="lg" className="w-full" loading={busy}>View gallery</Button>
        </form>
      </Message>
    );
  }

  const o = overview!;
  return (
    <Frame>
      <header className="border-b border-line-soft">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Logo showName={false} markClassName="size-8" />
          <p className="truncate text-sm text-fg-muted">Shared by <span className="text-fg">{o.studio.name}</span></p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-brand">{o.title}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{o.projectName}</h1>
        <p className="mt-3 text-[15px] text-fg-muted">{o.total} {o.total === 1 ? 'photograph' : 'photographs and films'}{o.downloadAllowed ? ' · downloads enabled' : ''}</p>

        {o.sections.length > 1 && (
          <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Sections">
            <button type="button" className={chip(!sectionId)} aria-pressed={!sectionId} onClick={() => setSectionId('')}>All <span className="text-xs opacity-70">{o.total}</span></button>
            {o.sections.map((s) => <button key={s.id} type="button" className={chip(sectionId === s.id)} aria-pressed={sectionId === s.id} onClick={() => setSectionId(s.id)}>{s.name} <span className="text-xs opacity-70">{s.mediaCount}</span></button>)}
          </div>
        )}

        <div className="mt-6">
          {listError && <div role="alert" className="rounded-lg border border-bad/40 bg-bad-bg p-4 text-sm text-bad">{listError} <button type="button" className="ml-2 cursor-pointer underline" onClick={() => void fetchPage(cursor, generation.current)}>Try again</button></div>}
          {!listError && !loading && items.length === 0 && <p className="py-16 text-center text-fg-muted">Nothing to show here yet.</p>}
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4" aria-label="Photographs">
            {items.map((m, i) => (
              <li key={m.id} className="group relative overflow-hidden rounded-[var(--radius-lg)] bg-surface-sunken [content-visibility:auto] [contain-intrinsic-size:auto_220px]">
                <button type="button" onClick={() => setOpen(i)} aria-label={`Open ${m.title || 'photograph'} ${i + 1}`} className="block aspect-[4/3] w-full cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ring)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumbUrl} alt={m.title || 'Wedding photograph'} width={m.width ?? 400} height={m.height ?? 300} loading={i < 8 ? 'eager' : 'lazy'} decoding="async" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
                  {m.mediaType === 'VIDEO' && <span className="absolute inset-0 grid place-items-center bg-black/25"><span className="grid size-12 place-items-center rounded-full bg-white/90 text-black"><Play className="size-5 fill-current" aria-hidden="true" /></span></span>}
                </button>
              </li>
            ))}
          </ul>
          {loading && <div className="grid place-items-center py-8 text-fg-muted"><Spinner label="Loading photographs" /></div>}
          <div ref={sentinel} className="h-px" aria-hidden="true" />
        </div>
      </main>
      <footer className="border-t border-line-soft py-6 text-center text-xs text-fg-subtle">
        {o.studio.name}{o.studio.phone ? ` · ${o.studio.phone}` : ''}{o.studio.email ? ` · ${o.studio.email}` : ''}
      </footer>

      {open !== null && items[open] && (
        <Viewer items={items} index={open} hasMore={Boolean(cursor)} onIndex={setOpen} onClose={() => setOpen(null)} onLoadMore={loadMore} onDownload={download} />
      )}
    </Frame>
  );
}

function Viewer({ items, index, hasMore, onIndex, onClose, onLoadMore, onDownload }: { items: Item[]; index: number; hasMore: boolean; onIndex: (i: number) => void; onClose: () => void; onLoadMore: () => void; onDownload: (i: Item) => void }) {
  const item = items[index];
  const go = (d: number) => { const n = index + d; if (n >= 0 && n < items.length) onIndex(n); };
  React.useEffect(() => { if (hasMore && index >= items.length - 4) onLoadMore(); }, [hasMore, index, items.length, onLoadMore]);
  React.useEffect(() => { for (const d of [1, -1]) { const n = items[index + d]; if (n?.mediaType === 'IMAGE') new Image().src = n.previewUrl; } }, [index, items]);
  const btn = 'grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40';
  return (
    <D.Root open onOpenChange={(o) => !o && onClose()}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[var(--z-modal,60)] bg-black/95" />
        <D.Content aria-describedby={undefined} onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); }} className="fixed inset-0 z-[var(--z-modal,60)] flex flex-col text-white focus:outline-none">
          <D.Title className="sr-only">{item.title || 'Photograph'} — {index + 1} of {items.length}{hasMore ? '+' : ''}</D.Title>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-white/70" aria-hidden="true">{index + 1} / {items.length}{hasMore ? '+' : ''}</p>
            <div className="flex gap-2">
              {item.downloadAllowed && <button type="button" className={btn} aria-label="Download original" onClick={() => onDownload(item)}><Download className="size-5" aria-hidden="true" /></button>}
              <D.Close className={btn} aria-label="Close viewer"><X className="size-5" aria-hidden="true" /></D.Close>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-16">
            {item.mediaType === 'VIDEO'
              ? <video key={item.id} src={item.previewUrl} controls playsInline className="max-h-full max-w-full rounded-md" />
              // eslint-disable-next-line @next/next/no-img-element
              : <img key={item.id} src={item.previewUrl} alt={item.title || 'Wedding photograph'} className="max-h-full max-w-full select-none rounded-md object-contain" draggable={false} />}
            <button type="button" className={cn(btn, 'absolute left-2 top-1/2 -translate-y-1/2 sm:left-4')} aria-label="Previous photograph" disabled={index === 0} onClick={() => go(-1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
            <button type="button" className={cn(btn, 'absolute right-2 top-1/2 -translate-y-1/2 sm:right-4')} aria-label="Next photograph" disabled={index >= items.length - 1} onClick={() => go(1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
