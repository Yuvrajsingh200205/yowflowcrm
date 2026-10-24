'use client';

import * as React from 'react';
import { EyeOff, Package, Pencil, Plus, Puzzle, Sparkles, Star, Trash2 } from 'lucide-react';
import { Badge, Button, Dialog, DialogContent, EmptyState, ErrorState, Field, Input, Select, Skeleton, Textarea, useToast } from '@/components/ui';
import { catalogApi, EVENT_TYPE_LABELS, EVENT_TYPES, type CatalogInput, type CatalogItem, type CatalogKind, type EventType, type PricingType } from '@/lib/api/sales';
import { errorMessage, fieldErrors, inr } from '../format';
import { ConfirmDialog, MoneyInput, NumberInput, Panel, Toggle, useLoad } from '../ui';

export const priceSuffix = (i: Pick<CatalogItem, 'pricingType' | 'unitLabel'>) =>
  i.pricingType === 'PER_DAY' ? 'per day' : i.pricingType === 'PER_PERSON' ? 'per guest' : i.unitLabel ? `per ${i.unitLabel}` : '';

const PRICING_HELP: Record<PricingType, string> = {
  FIXED: 'One price for the whole item.',
  PER_DAY: 'Price × number of event days (a 2-day wedding is charged twice).',
  PER_PERSON: 'Price × number of guests, never below the minimum you set.',
};

interface FormState {
  name: string;
  description: string;
  category: string;
  inclusions: string;
  pricingType: PricingType;
  unitPrice: string;
  unitLabel: string;
  taxRate: string;
  allowQuantity: boolean;
  minQuantity: string;
  maxQuantity: string;
  eventTypes: EventType[];
  isActive: boolean;
  isPublic: boolean;
  isPopular: boolean;
}

const blank = (): FormState => ({
  name: '', description: '', category: '', inclusions: '', pricingType: 'FIXED', unitPrice: '', unitLabel: '', taxRate: '18',
  allowQuantity: false, minQuantity: '1', maxQuantity: '', eventTypes: [], isActive: true, isPublic: true, isPopular: false,
});

const fromItem = (i: CatalogItem): FormState => ({
  name: i.name, description: i.description ?? '', category: i.category ?? '', inclusions: i.inclusions.join('\n'), pricingType: i.pricingType,
  unitPrice: String(i.unitPrice), unitLabel: i.unitLabel ?? '', taxRate: String(i.taxRate), allowQuantity: i.allowQuantity,
  minQuantity: String(i.minQuantity), maxQuantity: i.maxQuantity === null ? '' : String(i.maxQuantity), eventTypes: i.eventTypes,
  isActive: i.isActive, isPublic: i.isPublic, isPopular: i.isPopular,
});

function validate(kind: CatalogKind, f: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.name.trim().length < 2) e.name = 'Give it a name of at least 2 letters.';
  if (f.unitPrice === '' || Number.isNaN(Number(f.unitPrice))) e.unitPrice = 'Enter the price (0 if it is included free).';
  const tax = Number(f.taxRate);
  if (f.taxRate === '' || tax < 0 || tax > 100) e.taxRate = 'Enter a tax rate between 0 and 100.';
  const min = Number(f.minQuantity || 1);
  if (min < 1) e.minQuantity = 'The minimum is at least 1.';
  if (f.maxQuantity !== '' && Number(f.maxQuantity) < min) e.maxQuantity = 'The maximum cannot be below the minimum.';
  if (kind === 'ADDON' && f.allowQuantity && f.pricingType !== 'FIXED') e.allowQuantity = 'Only fixed-price items can have a chosen quantity.';
  return e;
}

function toInput(kind: CatalogKind, f: FormState): Partial<CatalogInput> {
  const quantityMatters = f.pricingType === 'PER_PERSON' || (kind === 'ADDON' && f.allowQuantity);
  return {
    kind,
    name: f.name.trim(),
    description: f.description.trim() || null,
    category: f.category.trim() || null,
    inclusions: f.inclusions.split('\n').map((l) => l.trim()).filter(Boolean),
    pricingType: f.pricingType,
    unitPrice: Number(f.unitPrice),
    unitLabel: f.pricingType === 'FIXED' ? f.unitLabel.trim() || null : null,
    taxRate: Number(f.taxRate),
    allowQuantity: kind === 'ADDON' && f.pricingType === 'FIXED' && f.allowQuantity,
    minQuantity: quantityMatters ? Math.max(1, Number(f.minQuantity || 1)) : 1,
    maxQuantity: quantityMatters && f.maxQuantity !== '' ? Number(f.maxQuantity) : null,
    eventTypes: f.eventTypes,
    isActive: f.isActive,
    isPublic: f.isPublic,
    isPopular: kind === 'PACKAGE' && f.isPopular,
  };
}

function ItemDialog({ kind, item, onClose, onSaved }: { kind: CatalogKind; item: CatalogItem | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [f, setF] = React.useState<FormState>(() => (item ? fromItem(item) : blank()));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => { setF((s) => ({ ...s, [key]: value })); setErrors((e) => ({ ...e, [key]: '' })); };
  const noun = kind === 'PACKAGE' ? 'package' : 'add-on';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(kind, f);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      if (item) await catalogApi.update(item.id, toInput(kind, f));
      else await catalogApi.create(toInput(kind, f));
      toast({ tone: 'success', title: item ? `${item.name} updated` : `${f.name.trim()} added` });
      onSaved();
    } catch (error) {
      const server = fieldErrors(error);
      if (Object.keys(server).length) setErrors(server);
      toast({ tone: 'error', title: `Couldn’t save the ${noun}`, description: errorMessage(error, 'Please check the details and try again.') });
    } finally {
      setBusy(false);
    }
  };

  const toggleType = (t: EventType) => set('eventTypes', f.eventTypes.includes(t) ? f.eventTypes.filter((x) => x !== t) : [...f.eventTypes, t]);
  const quantityMatters = f.pricingType === 'PER_PERSON' || (kind === 'ADDON' && f.allowQuantity);

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent
        size="lg"
        title={item ? `Edit ${noun}` : `New ${noun}`}
        description={kind === 'PACKAGE' ? 'A package is the main thing a customer buys, such as “Wedding – Signature”.' : 'An add-on is an optional extra a customer can switch on, such as a drone or an extra album.'}
        footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" form="catalog-form" loading={busy}>{item ? 'Save changes' : `Add ${noun}`}</Button></>}
      >
        <form id="catalog-form" onSubmit={submit} noValidate className="grid gap-5">
          <Field label="Name" required error={errors.name}>{(a) => <Input id={a.id} value={f.name} onChange={(e) => set('name', e.target.value)} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={160} placeholder={kind === 'PACKAGE' ? 'Wedding – Signature' : 'Drone coverage'} autoFocus />}</Field>
          <Field label="Short description" hint="Shown to the customer under the name.">{(a) => <Textarea id={a.id} rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} aria-describedby={a.describedBy} />}</Field>
          {kind === 'PACKAGE' && (
            <Field label="What’s included" hint="One item per line. These appear as a checklist on the quote.">{(a) => <Textarea id={a.id} rows={5} value={f.inclusions} onChange={(e) => set('inclusions', e.target.value)} aria-describedby={a.describedBy} placeholder={'2 photographers + 1 cinematographer\nHighlight film (3–5 min)\n300 edited photos in an online gallery'} />}</Field>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="How is it priced?" hint={PRICING_HELP[f.pricingType]}>{(a) => (
              <Select id={a.id} value={f.pricingType} onChange={(e) => { const next = e.target.value as PricingType; setF((s) => ({ ...s, pricingType: next, allowQuantity: next === 'FIXED' ? s.allowQuantity : false })); }} aria-describedby={a.describedBy}>
                <option value="FIXED">Fixed price</option><option value="PER_DAY">Per event day</option><option value="PER_PERSON">Per guest</option>
              </Select>
            )}</Field>
            <Field label={f.pricingType === 'PER_DAY' ? 'Price per day' : f.pricingType === 'PER_PERSON' ? 'Price per guest' : 'Price'} required error={errors.unitPrice}>{(a) => <MoneyInput id={a.id} value={f.unitPrice} onChange={(v) => set('unitPrice', v)} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
            <Field label="GST / tax %" hint="Added on top of the price. Use 0 if you do not charge GST." error={errors.taxRate}>{(a) => <NumberInput id={a.id} value={f.taxRate} onChange={(v) => set('taxRate', v)} invalid={a.invalid} aria-describedby={a.describedBy} maxLength={3} />}</Field>
            {f.pricingType === 'FIXED' && (
              <Field label="Unit name (optional)" hint="For example “copy”, so the quote reads “₹5,000 per copy”.">{(a) => <Input id={a.id} value={f.unitLabel} onChange={(e) => set('unitLabel', e.target.value)} maxLength={30} aria-describedby={a.describedBy} />}</Field>
            )}
          </div>

          {kind === 'ADDON' && f.pricingType === 'FIXED' && (
            <Toggle checked={f.allowQuantity} onChange={(v) => set('allowQuantity', v)} label="Customer can choose a quantity" description="For items like extra albums or prints, where more than one can be bought." />
          )}
          {quantityMatters && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={f.pricingType === 'PER_PERSON' ? 'Minimum guests charged' : 'Minimum quantity'} error={errors.minQuantity}>{(a) => <NumberInput id={a.id} value={f.minQuantity} onChange={(v) => set('minQuantity', v)} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
              <Field label="Maximum (optional)" error={errors.maxQuantity}>{(a) => <NumberInput id={a.id} value={f.maxQuantity} onChange={(v) => set('maxQuantity', v)} invalid={a.invalid} aria-describedby={a.describedBy} />}</Field>
            </div>
          )}

          <fieldset>
            <legend className="mb-1.5 text-[13px] font-medium text-fg">Offered for</legend>
            <p className="mb-2 text-xs text-fg-subtle">Leave everything unselected to offer it for every kind of event.</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => {
                const on = f.eventTypes.includes(t);
                return (
                  <button key={t} type="button" aria-pressed={on} onClick={() => toggleType(t)} className={`h-8 cursor-pointer rounded-full border px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${on ? 'border-transparent bg-brand text-on-brand' : 'border-line bg-surface text-fg-muted hover:bg-[var(--hover)]'}`}>
                    {EVENT_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 rounded-[var(--radius-lg)] border border-line-soft bg-surface-sunken p-4">
            <Toggle checked={f.isActive} onChange={(v) => set('isActive', v)} label="Active" description="Inactive items stay in your list but cannot be added to new quotes." />
            <Toggle checked={f.isPublic} onChange={(v) => set('isPublic', v)} label="Show on my booking page" description="When off, only your team can add it to a quote." />
            {kind === 'PACKAGE' && <Toggle checked={f.isPopular} onChange={(v) => set('isPopular', v)} label="Mark as most popular" description="Adds a “Most popular” label to draw attention to it." />}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Row({ item, canManage, onEdit, onDelete }: { item: CatalogItem; canManage: boolean; onEdit: () => void; onDelete: () => void }) {
  const suffix = priceSuffix(item);
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-4 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-fg">{item.name}</p>
          {item.isPopular && <Badge tone="accent"><Star className="size-3" aria-hidden="true" />Most popular</Badge>}
          {!item.isActive && <Badge tone="neutral">Inactive</Badge>}
          {item.isActive && !item.isPublic && <Badge tone="neutral"><EyeOff className="size-3" aria-hidden="true" />Team only</Badge>}
        </div>
        <p className="mt-0.5 text-sm text-fg-muted">
          <span className="font-medium text-fg tabular-nums">{inr(item.unitPrice)}</span>{suffix && ` ${suffix}`}
          {item.taxRate > 0 ? ` + ${item.taxRate}% GST` : ' · no GST'}
          {item.kind === 'PACKAGE' && item.inclusions.length > 0 && ` · ${item.inclusions.length} inclusion${item.inclusions.length === 1 ? '' : 's'}`}
          {item.allowQuantity && ` · quantity ${item.minQuantity}${item.maxQuantity ? `–${item.maxQuantity}` : '+'}`}
          {item.eventTypes.length > 0 && ` · ${item.eventTypes.map((t) => EVENT_TYPE_LABELS[t]).join(', ')}`}
        </p>
      </div>
      {canManage && (
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${item.name}`}><Pencil />Edit</Button>
          <Button variant="ghost" size="icon" className="size-8 text-bad hover:text-bad" onClick={onDelete} aria-label={`Delete ${item.name}`}><Trash2 /></Button>
        </div>
      )}
    </li>
  );
}

export function PackagesTab({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const { data, error, loading, reload } = useLoad(() => catalogApi.list(), []);
  const [editing, setEditing] = React.useState<{ kind: CatalogKind; item: CatalogItem | null } | null>(null);
  const [deleting, setDeleting] = React.useState<CatalogItem | null>(null);
  const [busy, setBusy] = React.useState(false);

  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (error && !data) return <ErrorState title="Couldn’t load your price list" description={error} action={{ label: 'Try again', onClick: () => void reload() }} />;

  const items = data ?? [];
  const packages = items.filter((i) => i.kind === 'PACKAGE');
  const addons = items.filter((i) => i.kind === 'ADDON');

  const seed = async () => {
    setBusy(true);
    try { await catalogApi.seedStarter(); toast({ tone: 'success', title: 'Starter packages added', description: 'Edit the names and prices to match your studio.' }); await reload(); }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t add the starter packages', description: errorMessage(e, 'Please try again.') }); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try { await catalogApi.remove(deleting.id); toast({ tone: 'success', title: `${deleting.name} deleted`, description: 'Quotes that already used it are not affected.' }); setDeleting(null); await reload(); }
    catch (e) { toast({ tone: 'error', title: 'Couldn’t delete it', description: errorMessage(e, 'Please try again.') }); }
    finally { setBusy(false); }
  };

  if (items.length === 0) {
    return (
      <>
        <div className="rounded-[var(--radius-lg)] border border-dashed border-line bg-surface">
          <EmptyState
            icon={<Package />}
            title="Your price list is empty"
            description={canManage ? 'Add the packages and extras you sell. Quotes and your booking page are built from this list, so a customer gets a price in seconds.' : 'Ask an admin to add your packages and extras.'}
          />
          {canManage && (
            <div className="flex flex-wrap justify-center gap-2 pb-10">
              <Button onClick={() => void seed()} loading={busy}><Sparkles />Use starter packages</Button>
              <Button variant="secondary" onClick={() => setEditing({ kind: 'PACKAGE', item: null })}><Plus />Add my own package</Button>
            </div>
          )}
        </div>
        {editing && <ItemDialog kind={editing.kind} item={editing.item} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void reload(); }} />}
      </>
    );
  }

  const group = (title: string, description: string, icon: React.ComponentType<{ className?: string }>, kind: CatalogKind, rows: CatalogItem[]) => (
    <Panel
      title={title}
      description={description}
      icon={icon}
      actions={canManage && <Button size="sm" onClick={() => setEditing({ kind, item: null })}><Plus />{kind === 'PACKAGE' ? 'Add package' : 'Add add-on'}</Button>}
    >
      {rows.length === 0 ? (
        <p className="rounded-[var(--radius-md)] bg-surface-sunken px-4 py-6 text-center text-sm text-fg-muted">{kind === 'PACKAGE' ? 'No packages yet.' : 'No add-ons yet. Extras such as a drone or an album let customers build their own quote.'}</p>
      ) : (
        <ul className="-mx-5 -my-5 divide-y-0">
          {rows.map((i) => <Row key={i.id} item={i} canManage={canManage} onEdit={() => setEditing({ kind: i.kind, item: i })} onDelete={() => setDeleting(i)} />)}
        </ul>
      )}
    </Panel>
  );

  return (
    <div className="space-y-6">
      {group('Packages', 'The main things you sell. A customer picks one when they enquire.', Package, 'PACKAGE', packages)}
      {group('Add-ons', 'Optional extras. Customers can switch them on or off on their quote.', Puzzle, 'ADDON', addons)}
      {editing && <ItemDialog kind={editing.kind} item={editing.item} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void reload(); }} />}
      <ConfirmDialog open={Boolean(deleting)} title={`Delete “${deleting?.name ?? ''}”?`} description="Quotes you have already made keep their own copy of this item. It will no longer appear on your booking page or in new quotes." confirmLabel="Delete" destructive busy={busy} onConfirm={() => void remove()} onClose={() => setDeleting(null)} />
    </div>
  );
}
