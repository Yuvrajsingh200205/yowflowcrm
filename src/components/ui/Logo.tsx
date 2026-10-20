import Image from 'next/image';
import { BRAND } from '@/config/brand';
import { cn } from '@/lib/cn';

/**
 * The Yowflow mark sits on its own near-black tile, so it reads correctly on
 * both light and dark pages. Swap the file at BRAND.logo.mark to re-skin.
 */
export function LogoMark({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src={BRAND.logo.mark}
      alt={BRAND.name}
      width={64}
      height={64}
      priority={priority}
      className={cn('size-9 shrink-0 rounded-[24%] bg-[#030406] ring-1 ring-black/10 dark:ring-white/10', className)}
    />
  );
}

export function Logo({ className, markClassName, showName = true, priority }: { className?: string; markClassName?: string; showName?: boolean; priority?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} priority={priority} />
      {showName && <span className="font-display text-[1.35rem] font-bold leading-none tracking-tight text-fg">{BRAND.name}</span>}
    </span>
  );
}
