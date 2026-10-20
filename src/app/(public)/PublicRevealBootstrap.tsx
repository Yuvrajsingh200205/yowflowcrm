'use client';

import { useEffect } from 'react';

export function PublicRevealBootstrap() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.ui-ed');
    if (!root) return;
    root.setAttribute('data-ed-js', 'true');
    const timeout = window.setTimeout(() => {
      if (!root.querySelector('[data-shown="true"]')) root.removeAttribute('data-ed-js');
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, []);

  return null;
}
