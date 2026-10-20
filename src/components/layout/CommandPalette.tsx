'use client';

import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { CornerDownLeft, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export type Command = { id: string; label: string; group: string; icon?: React.ComponentType<{ className?: string }>; hint?: string; keywords?: string; run: () => void };

/**
 * Cmd/Ctrl+K palette. Fully keyboard operable (↑ ↓ Enter Esc); the list is a
 * listbox with aria-activedescendant so screen readers follow the selection.
 */
export function CommandPalette({ commands, open, onOpenChange }: { commands: Command[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  const results = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((c) => `${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(needle));
  }, [q, commands]);

  React.useEffect(() => { setActive(0); }, [q, open]);
  React.useEffect(() => { if (!open) setQ(''); }, [open]);
  React.useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (c?: Command) => { if (!c) return; onOpenChange(false); c.run(); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[active]); }
  };

  let lastGroup = '';
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--scrim)] backdrop-blur-[3px] data-[state=open]:animate-[ui-overlay-in_var(--dur-base)_ease-out]" />
        <D.Content
          aria-label="Command palette"
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[14vh] z-[var(--z-modal)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface-raised shadow-[var(--elev-3)] focus:outline-none data-[state=open]:animate-[ui-pop-in_var(--dur-slow)_var(--ease-out)]"
        >
          <D.Title className="sr-only">Command palette</D.Title>
          <D.Description className="sr-only">Search pages and actions. Use arrow keys to move and Enter to run.</D.Description>
          <div className="flex items-center gap-3 border-b border-line-soft px-4">
            <Search className="size-4 text-fg-subtle" aria-hidden="true" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              role="combobox"
              aria-expanded="true"
              aria-controls="cmdk-list"
              aria-activedescendant={results[active] ? `cmdk-${results[active].id}` : undefined}
              placeholder="Search pages and actions…"
              aria-label="Search pages and actions"
              className="h-14 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-subtle"
            />
            <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">ESC</kbd>
          </div>
          <div ref={listRef} id="cmdk-list" role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
            {results.length === 0 && <p className="px-3 py-10 text-center text-sm text-fg-muted">No results for “{q}”.</p>}
            {results.map((c, i) => {
              const header = c.group !== lastGroup ? c.group : null; lastGroup = c.group;
              const Icon = c.icon;
              return (
                <React.Fragment key={c.id}>
                  {header && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle first:pt-1">{header}</p>}
                  <div
                    id={`cmdk-${c.id}`}
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(c)}
                    className={cn('flex h-10 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm text-fg', i === active && 'bg-[var(--hover)]')}
                  >
                    {Icon && <Icon className={cn('size-4', i === active ? 'text-brand' : 'text-fg-subtle')} />}
                    <span className="flex-1 truncate">{c.label}</span>
                    {c.hint && <span className="text-xs text-fg-subtle">{c.hint}</span>}
                    {i === active && <CornerDownLeft className="size-3.5 text-fg-subtle" aria-hidden="true" />}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Registers the global ⌘K / Ctrl+K shortcut. */
export function useCommandShortcut(toggle: () => void) {
  React.useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggle(); }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [toggle]);
}
