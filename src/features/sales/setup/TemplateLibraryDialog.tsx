'use client';

import * as React from 'react';
import { Check, Plus, Star } from 'lucide-react';
import { Badge, Button, Dialog, DialogContent, ErrorState, Skeleton, useToast } from '@/components/ui';
import { templatesApi, type TemplateItem } from '@/lib/api/sales';
import { cn } from '@/lib/cn';
import { errorMessage, inr } from '../format';
import { OccasionIcon } from '../OccasionIcon';
import { unitSuffix } from '../occasions';
import { useLoad } from '../ui';

/**
 * Ready-made packages and add-ons. Nobody has to write a price list from nothing: tick what you offer, add them,
 * then change the prices to your own.
 */
export function TemplateLibraryDialog({ preselectDefaults, onClose, onAdded }: { preselectDefaults?: boolean; onClose: () => void; onAdded: () => void }) {
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad(() => templatesApi.list(), []);
  const [group, setGroup] = React.useState<string>('all');
  const [picked, setPicked] = React.useState<Set<string> | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Start with the everyday set ticked when the price list is still empty; otherwise nothing is.
  React.useEffect(() => {
    if (data && picked === null) setPicked(new Set(preselectDefaults ? data.items.filter((i) => i.inDefaultKit && !i.added).map((i) => i.key) : []));
  }, [data, picked, preselectDefaults]);

  const selected = picked ?? new Set<string>();
  const toggle = (key: string) => setPicked((prev) => { const next = new Set(prev ?? []); if (next.has(key)) next.delete(key); else next.add(key); return next; });

  const visible: TemplateItem[] = (data?.items ?? []).filter((i) => group === 'all' || i.group === group);
  const addable = visible.filter((i) => !i.added);
  const allTicked = addable.length > 0 && addable.every((i) => selected.has(i.key));

  const add = async () => {
    setBusy(true);
    try {
      const r = await templatesApi.add([...selected]);
      toast({ tone: 'success', title: `${r.added} ${r.added === 1 ? 'item' : 'items'} added`, description: 'The prices are examples. Open each one and change it to your own price.' });
      onAdded();
    } catch (e) {
      toast({ tone: 'error', title: 'Couldn’t add them', description: errorMessage(e, 'Please try again.') });
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent
        size="lg"
        className="sm:max-w-3xl"
        title="Ready-made packages"
        description="Tick the ones you offer and press Add. Prices here are only examples: you can change every price afterwards."
        footer={
          <>
            <p className="mr-auto text-sm text-fg-muted" aria-live="polite">{selected.size === 0 ? 'Nothing ticked yet' : `${selected.size} ticked`}</p>
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button size="lg" onClick={() => void add()} loading={busy} disabled={selected.size === 0}>Add {selected.size > 0 ? selected.size : ''} to my price list</Button>
          </>
        }
      >
        {loading && !data ? <div className="space-y-3"><Skeleton className="h-10" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          : error || !data ? <ErrorState title="Couldn’t load the list" description={error} action={{ label: 'Try again', onClick: () => void reload() }} />
            : (
              <div className="space-y-5">
                <div className="-mx-1 overflow-x-auto px-1 pb-1">
                  <div role="group" aria-label="Show templates for" className="flex w-max gap-2">
                    {[{ id: 'all', label: 'Everything' }, ...data.groups].map((g) => {
                      const count = data.items.filter((i) => g.id === 'all' || i.group === g.id).length;
                      const on = group === g.id;
                      return (
                        <button key={g.id} type="button" aria-pressed={on} onClick={() => setGroup(g.id)} className={cn('flex h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]', on ? 'border-transparent bg-brand text-on-brand' : 'border-line bg-surface text-fg hover:bg-[var(--hover)]')}>
                          {g.id !== 'all' && <OccasionIcon occasion={g.label} className="size-4" />}
                          {g.label}<span className={cn('text-xs', on ? 'text-on-brand/80' : 'text-fg-subtle')}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {addable.length > 1 && (
                  <button type="button" onClick={() => setPicked((prev) => { const next = new Set(prev ?? []); for (const i of addable) { if (allTicked) next.delete(i.key); else next.add(i.key); } return next; })} className="min-h-11 cursor-pointer text-sm font-medium text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">
                    {allTicked ? 'Untick all shown' : `Tick all ${addable.length} shown`}
                  </button>
                )}

                <ul className="grid gap-3">
                  {visible.map((t) => {
                    const on = selected.has(t.key);
                    return (
                      <li key={t.key}>
                        <label className={cn('flex gap-3 rounded-[var(--radius-lg)] border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ring)]', t.added ? 'cursor-default border-line-soft bg-surface-sunken' : on ? 'cursor-pointer border-brand bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'cursor-pointer border-line bg-surface hover:bg-[var(--hover)]')}>
                          <input type="checkbox" checked={on || t.added} disabled={t.added} onChange={() => toggle(t.key)} className="mt-0.5 size-6 shrink-0 accent-[var(--primary)]" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                              <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-fg">
                                {t.name}
                                {t.isPopular && <Badge tone="accent"><Star className="size-3" aria-hidden="true" />Popular</Badge>}
                                {t.kind === 'ADDON' && <Badge tone="info">Add-on</Badge>}
                                {t.added && <Badge tone="success"><Check className="size-3" aria-hidden="true" />Already added</Badge>}
                              </span>
                              <span className="text-sm tabular-nums"><strong className="text-fg">{inr(t.unitPrice)}</strong> <span className="text-fg-muted">{unitSuffix(t)}</span></span>
                            </span>
                            <span className="mt-1 block text-[13px] leading-relaxed text-fg-muted">{t.description}</span>
                            {t.inclusions.length > 0 && (
                              <span className="mt-2 block text-[13px] text-fg-muted">
                                {t.inclusions.slice(0, 3).join(' · ')}{t.inclusions.length > 3 ? ` · +${t.inclusions.length - 3} more` : ''}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {visible.length === 0 && <p className="text-center text-sm text-fg-muted">Nothing here.</p>}
                <p className="flex items-center gap-2 text-[13px] text-fg-subtle"><Plus className="size-3.5" aria-hidden="true" />Your own packages can be added any time with “Add my own”.</p>
              </div>
            )}
      </DialogContent>
    </Dialog>
  );
}
