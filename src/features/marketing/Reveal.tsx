'use client';

import * as React from 'react';

/**
 * Scroll-in reveal without a runtime animation library.
 *
 * Server-rendered content is fully visible (good for LCP, SEO and no-JS). After
 * hydration, only blocks that start *below* the fold are hidden and then eased
 * in as they enter the viewport. Reduced-motion users never see any of it.
 */
export function Reveal({ children, delay = 0, y = 18, className }: { children: React.ReactNode; delay?: number; y?: number; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<'visible' | 'hidden' | 'shown'>('visible');

  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return; // already on screen
    setState('hidden');
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setState('shown'); io.disconnect(); }
    }, { rootMargin: '0px 0px -60px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style: React.CSSProperties | undefined =
    state === 'hidden'
      ? { opacity: 0, transform: `translateY(${y}px)` }
      : state === 'shown'
        ? { opacity: 1, transform: 'none', transition: `opacity 600ms var(--ease-out) ${delay}s, transform 600ms var(--ease-out) ${delay}s` }
        : undefined;

  return <div ref={ref} className={className} style={style}>{children}</div>;
}
