import type { CatalogItem, EventType } from '@/lib/api/sales';

/**
 * The occasions a studio quotes for. A package's category is the occasion's label, which is how the ready-made
 * library files its packages and how "What is the function?" narrows the list for someone making a quote.
 */
export const OCCASION_ORDER = [
  'Wedding', 'Pre-wedding', 'Engagement & Roka', 'Haldi & Mehendi', 'Sangeet & Reception', 'Birthday & Kids', 'Baby & Family', 'Anniversary', 'Corporate & Events', 'Product & Portfolio',
] as const;

const EVENT_TYPE: Record<string, EventType> = {
  Wedding: 'WEDDING', 'Pre-wedding': 'PRE_WEDDING', 'Engagement & Roka': 'ENGAGEMENT', 'Haldi & Mehendi': 'HALDI_MEHENDI', 'Sangeet & Reception': 'SANGEET',
  'Birthday & Kids': 'OTHER', 'Baby & Family': 'OTHER', Anniversary: 'ANNIVERSARY', 'Corporate & Events': 'CORPORATE', 'Product & Portfolio': 'OTHER',
};

/** The studio's own packages that have no occasion are listed under this. */
export const OTHER_OCCASION = 'My packages';

export const occasionOf = (item: Pick<CatalogItem, 'category'>): string => item.category?.trim() || OTHER_OCCASION;

/** The system's name for the event, from the occasion when we know it, otherwise from what the package says it is for. */
export function eventTypeFor(occasion: string, item?: Pick<CatalogItem, 'eventTypes'>): EventType | null {
  return EVENT_TYPE[occasion] ?? item?.eventTypes?.[0] ?? null;
}

/** One chip per occasion that has at least one package: known occasions in a fixed order, then the studio's own. */
export function occasionChips(packages: Array<Pick<CatalogItem, 'category'>>): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const p of packages) counts.set(occasionOf(p), (counts.get(occasionOf(p)) ?? 0) + 1);
  const rank = (label: string) => { const i = (OCCASION_ORDER as readonly string[]).indexOf(label); return i === -1 ? 1000 : i; };
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => rank(a.label) - rank(b.label) || a.label.localeCompare(b.label));
}

/** "₹85,000 per day" style suffix for a price. */
export const unitSuffix = (i: { pricingType: string; unitLabel: string | null }) =>
  i.pricingType === 'PER_DAY' ? 'per day' : i.pricingType === 'PER_PERSON' ? 'per guest' : i.unitLabel ? `per ${i.unitLabel}` : '';
