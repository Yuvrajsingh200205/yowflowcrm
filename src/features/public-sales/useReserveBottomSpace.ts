'use client';

import { useEffect } from 'react';

/**
 * A bar fixed to the bottom of the screen must not hide the field someone is typing in. Scroll padding makes the
 * browser keep focused controls (and anchors) clear of it.
 */
export function useReserveBottomSpace(rem = 7) {
  useEffect(() => {
    const root = document.documentElement;
    const before = root.style.scrollPaddingBottom;
    root.style.scrollPaddingBottom = `${rem}rem`;
    return () => { root.style.scrollPaddingBottom = before; };
  }, [rem]);
}
