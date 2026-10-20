'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from './Dropdown';
import { Button } from './Button';

type Mode = 'light' | 'dark' | 'system';
const KEY = `${BRAND.cookiePrefix}-theme`;

function apply(mode: Mode) {
  const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.dataset.theme = dark ? 'dark' : 'light';
}

/**
 * Switches the theme for the current page by setting <body data-theme>. Screens
 * that are not dark-ready simply never render this toggle, and it restores
 * light on unmount so dark can never leak into the app shell.
 */
export function ThemeToggle() {
  const [mode, setMode] = React.useState<Mode>('system');
  React.useEffect(() => {
    let stored: Mode = 'system';
    try { stored = (localStorage.getItem(KEY) as Mode) || 'system'; } catch { /* storage unavailable */ }
    setMode(stored);
    apply(stored);
    return () => { document.body.dataset.theme = 'light'; };
  }, []);
  React.useEffect(() => {
    if (mode !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => apply('system');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [mode]);
  const choose = (m: Mode) => {
    setMode(m);
    try { localStorage.setItem(KEY, m); } catch { /* ignore */ }
    apply(m);
  };
  const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change colour theme"><Icon /></Button>
      </DropdownTrigger>
      <DropdownContent align="end">
        <DropdownItem onSelect={() => choose('light')}><Sun />Light</DropdownItem>
        <DropdownItem onSelect={() => choose('dark')}><Moon />Dark</DropdownItem>
        <DropdownItem onSelect={() => choose('system')}><Monitor />System</DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
