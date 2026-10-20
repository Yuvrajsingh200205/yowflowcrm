'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { navItems } from '../data/landingContent';
import { BRAND } from '@/config/brand';

/**
 * Landing navigation.
 *
 * A maroon glass bar that sits *on* the hero rather than floating above it:
 * translucent and blurred at rest, more opaque with a warm border and a shadow
 * once scrolled, moving 80px → 72px and nothing else. Hierarchy is brand →
 * navigation → primary CTA, established by weight and colour rather than by
 * making everything brighter.
 *
 * All styling lives in the .ed-nav layer in globals.css, using the brand
 * palette (#3D1F2B / #4A2438 / #C9A55A / #A8456B / #F5F0EA). Motion is CSS
 * only — the public surface ships no animation library.
 */

/** Aperture mark: a hairline gold ring with blades that turn on hover. */
function ApertureMark() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Ring, plus the faintest maroon body so the mark reads as an object
          rather than as line art floating on the glass. */}
      <circle cx="17" cy="17" r="15.25" fill="#4A2438" fillOpacity="0.6" />
      <circle cx="17" cy="17" r="15.25" stroke="#C9A55A" strokeOpacity="0.5" strokeWidth="1" />
      {/* The iris is a single hexagon. Six crossing blades turned to visual
          noise at 34px; one clean opening still reads unmistakably as a lens. */}
      <g className="ed-nav-blades">
        <path
          d="M23.5 17 L20.25 22.63 L13.75 22.63 L10.5 17 L13.75 11.37 L20.25 11.37 Z"
          stroke="#C9A55A"
          strokeOpacity="0.92"
          strokeWidth="1.1"
          strokeLinejoin="round"
        />
      </g>
      <circle className="ed-nav-iris" cx="17" cy="17" r="1.9" fill="#F5F0EA" fillOpacity="0.7" />
    </svg>
  );
}

export function LandingNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const frame = useRef(0);
  const burgerRef = useRef<HTMLButtonElement | null>(null);

  // Scroll state + reading progress, read once per frame.
  useEffect(() => {
    const read = () => {
      frame.current = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 24);
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
      // Returning to the top does not necessarily fire an intersection entry,
      // so Home is reclaimed here rather than in the observer alone.
      if (y < 120) setActive('home');
    };
    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  /**
   * Scroll spy for the current-section indicator. Watches a band just under
   * the bar, so the active item changes as a section reaches the header rather
   * than when it merely enters the viewport.
   */
  useEffect(() => {
    const sections = navItems
      .map((item) => ('section' in item && item.section ? document.getElementById(item.section) : null))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        // Above the first tracked section, Home is the current item.
        if (window.scrollY < 120) setActive('home');
        else if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.15, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // Lock the page, close on Escape, and hand focus back to the toggle.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        burgerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <header className="ed-nav" data-scrolled={scrolled} data-open={open}>
      <div className="ed-nav-bar">
        {/* ---- Brand ---- */}
        <Link href="/" className="ed-nav-lockup" aria-label={`${BRAND.name} — home`}>
          <ApertureMark />
          <span className="ed-nav-wordmark">{BRAND.name}</span>
        </Link>

        {/* ---- Navigation ---- */}
        <nav className="ed-nav-links" aria-label="Primary">
          {navItems.map((item) => {
            const section = 'section' in item ? item.section : 'home';
            const itemPath = item.href.split('#')[0].replace(/\/$/, '') || '/';
            const currentPath = pathname.replace(/\/$/, '') || '/';
            const isActive = currentPath === itemPath || Boolean(currentPath === '/' && section && section === active);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="ed-nav-link"
                data-active={isActive}
                aria-current={isActive ? 'true' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ---- Actions ---- */}
        <div className="ed-nav-actions">
          <Link href="/login" className="ed-nav-login">
            Login
          </Link>
          <Link href="/contact" className="ed-nav-cta">
            <span>Get Started</span>
            <ArrowRight className="ed-nav-cta-icon" aria-hidden="true" />
          </Link>

          <button
            ref={burgerRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="landing-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="ed-nav-burger relative grid h-11 w-11 place-items-center"
          >
            <span aria-hidden="true" className="relative block h-2.5 w-6">
              <span
                className={`absolute inset-x-0 h-px bg-[#F5F0EA] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
                  open ? 'top-1 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute inset-x-0 h-px bg-[#F5F0EA] transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
                  open ? 'top-1 -rotate-45' : 'top-2.5'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Reading progress, shown only once the bar has compacted. */}
      <div
        className="ed-nav-progress"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden="true"
      />

      </header>

      {/* ---- Mobile panel ----
          A sibling of the header, not a child: see the note beside
          .ed-nav-panel in globals.css. */}
      <div
        id="landing-menu"
        className="ed-nav-panel"
        data-open={open}
        inert={!open || undefined}
      >
        <nav
          className="flex h-full flex-col overflow-y-auto px-[clamp(1.25rem,5vw,2.5rem)] pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8"
          aria-label="Mobile"
        >
          <ul className="border-t border-[rgba(245,240,234,0.12)]">
            {navItems.map((item, i) => (
              <li
                key={item.href}
                className="ed-nav-panel-item border-b border-[rgba(245,240,234,0.12)]"
                style={{ '--i': i } as React.CSSProperties}
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-5 py-4"
                >
                  <span className="ed-numeral text-[0.6875rem] text-[#C9A55A]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="ed-display ed-d3 text-white">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div
            className="ed-nav-panel-item mt-auto grid gap-3 pt-10"
            style={{ '--i': navItems.length } as React.CSSProperties}
          >
            <Link href="/contact" onClick={() => setOpen(false)} className="ed-nav-cta w-full">
              <span>Get Started</span>
              <ArrowRight className="ed-nav-cta-icon" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center justify-center rounded-[2px] border border-[rgba(201,165,90,0.35)] text-[0.8125rem] font-medium tracking-[0.02em] text-[#F5F0EA] transition-colors hover:bg-[rgba(201,165,90,0.10)]"
            >
              Login
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
