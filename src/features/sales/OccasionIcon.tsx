import { Aperture, Baby, Briefcase, Cake, Camera, Flower2, Gem, Heart, LayoutGrid, Music, PartyPopper, Puzzle, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Wedding: Heart, 'Pre-wedding': Camera, 'Engagement & Roka': Gem, 'Haldi & Mehendi': Flower2, 'Sangeet & Reception': Music, 'Birthday & Kids': Cake,
  'Baby & Family': Baby, Anniversary: PartyPopper, 'Corporate & Events': Briefcase, 'Product & Portfolio': Aperture, 'Add-ons': Puzzle,
};

/** A small picture for an occasion, so people who read slowly can still find "Wedding" or "Birthday" at a glance. */
export function OccasionIcon({ occasion, className }: { occasion: string; className?: string }) {
  const Icon = ICONS[occasion] ?? LayoutGrid;
  return <Icon className={className} aria-hidden="true" />;
}
