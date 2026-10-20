'use client';

import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'success' | 'error' | 'warning' | 'info';
type ToastInput = { title: string; description?: string; tone?: Tone; action?: { label: string; onClick: () => void }; duration?: number };
type ToastItem = ToastInput & { id: number };

const Ctx = React.createContext<{ toast: (t: ToastInput) => number; dismiss: (id: number) => void } | null>(null);

const ICON = { success: CheckCircle2, error: AlertCircle, warning: TriangleAlert, info: Info } as const;
const TONE = { success: 'text-ok', error: 'text-bad', warning: 'text-warn', info: 'text-note' } as const;

/**
 * Toasts never steal focus: they announce through a polite live region and
 * auto-dismiss after 5s (errors stay 8s). Pass `action` for "Undo".
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const seq = React.useRef(0);
  const timers = React.useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: number) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  }, []);

  const toast = React.useCallback((t: ToastInput) => {
    const id = ++seq.current;
    setItems((xs) => [...xs.slice(-3), { ...t, id }]);
    timers.current.set(id, setTimeout(() => dismiss(id), t.duration ?? (t.tone === 'error' ? 8000 : 5000)));
    return id;
  }, [dismiss]);

  React.useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <Ctx.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[var(--z-toast)] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        {items.map((t) => {
          const Icon = ICON[t.tone ?? 'info'];
          return (
            <div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-lg)] border border-line-soft bg-surface-raised p-4 shadow-[var(--elev-3)] animate-[ui-toast-in_var(--dur-slow)_var(--ease-out)]"
            >
              <Icon className={cn('mt-0.5 size-[18px] shrink-0', TONE[t.tone ?? 'info'])} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] text-fg-muted">{t.description}</p>}
                {t.action && (
                  <button
                    type="button"
                    onClick={() => { t.action?.onClick(); dismiss(t.id); }}
                    className="mt-2 cursor-pointer text-[13px] font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="-m-1 grid size-7 cursor-pointer place-items-center rounded-md text-fg-subtle hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error('useToast must be used inside <ToastProvider>');
  return c;
}
