'use client';

import * as React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from './Dropdown';
import { Button } from './Button';

type Mode = 'light' | 'dark' | 'system';
const KEY = `${BRAND.cookiePrefix}-theme`;

/** Inline script (render in <head>) that applies the stored theme before paint: no flash. */
export const themeInitScript = `try{var m=localStorage.getItem('${KEY}');var d=m==='dark'||((!m||m==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}`;

function apply(mode: Mode) {
  const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [mode, setMode] = React.useState<Mode>('system');
  React.useEffect(() => {
    try { setMode((localStorage.getItem(KEY) as Mode) || 'system'); } catch { /* storage unavailable */ }
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
