'use client';

import * as React from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, Input } from '@/components/ui';
import { cn } from '@/lib/cn';

/** Small pieces shared by the sales screens, kept on the design system's tokens. */

export function Panel({ title, description, icon: Icon, actions, children, className }: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex-wrap">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-brand" aria-hidden="true"><Icon className="size-4" /></span>}
          <div className="min-w-0"><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</div>
        </div>
        {actions}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** An on/off setting with its explanation next to it. Exposed as a switch to assistive technology. */
export function Toggle({ checked, onChange, label, description, disabled, id }: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}) {
  const auto = React.useId();
  const tid = id ?? auto;
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={tid} className="block cursor-pointer text-sm font-medium text-fg">{label}</label>
        {description && <p id={`${tid}-d`} className="mt-0.5 text-[13px] leading-relaxed text-fg-muted">{description}</p>}
      </div>
      <button
        id={tid}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${tid}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-[var(--dur-base)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'border-transparent bg-brand' : 'border-line-strong bg-surface-sunken',
        )}
      >
        <span className={cn('absolute left-0.5 top-0.5 size-[18px] rounded-full shadow-sm transition-transform duration-[var(--dur-base)] motion-reduce:transition-none', checked ? 'translate-x-5 bg-on-brand' : 'translate-x-0 bg-fg-subtle')} aria-hidden="true" />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}

/** Rupee amount field: digits and one decimal point, with the symbol inside the box. */
export const MoneyInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> & { value: string; onChange: (value: string) => void; invalid?: boolean }>(
  function MoneyInput({ value, onChange, className, invalid, ...props }, ref) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-subtle" aria-hidden="true">₹</span>
        <Input
          ref={ref}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          invalid={invalid}
          onChange={(e) => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) onChange(e.target.value); }}
          className={cn('pl-7 tabular-nums', className)}
          {...props}
        />
      </div>
    );
  },
);

/** Whole number (or empty) in a text box, so users can clear it while typing. */
export const NumberInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> & { value: string; onChange: (value: string) => void; invalid?: boolean }>(
  function NumberInput({ value, onChange, className, invalid, ...props }, ref) {
    return (
      <Input
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        invalid={invalid}
        onChange={(e) => { if (/^\d*$/.test(e.target.value)) onChange(e.target.value); }}
        className={cn('tabular-nums', className)}
        {...props}
      />
    );
  },
);

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', destructive, busy, onConfirm, onClose, children }: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <DialogContent
        title={title}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button variant={destructive ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
          </>
        }
      >
        {children ?? <p className="text-sm text-fg-muted">{description}</p>}
      </DialogContent>
    </Dialog>
  );
}

/** Loads something on mount and on demand; the newest request wins so a slow older one cannot overwrite it. */
export function useLoad<T>(load: () => Promise<T>, deps: React.DependencyList, enabled = true) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(enabled);
  const latest = React.useRef(0);
  const loadRef = React.useRef(load);
  loadRef.current = load;

  const reload = React.useCallback(async () => {
    const id = ++latest.current;
    setError('');
    setLoading(true);
    try {
      const result = await loadRef.current();
      if (id === latest.current) setData(result);
    } catch (e) {
      if (id === latest.current) setError(e instanceof Error && e.message ? e.message : 'Something went wrong. Please try again.');
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reload, ...deps]);

  return { data, setData, error, loading, reload };
}

/** Copies text and tells the user, falling back to a selected prompt when the clipboard is blocked. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Opens a PDF blob in a new tab, or downloads it when the browser blocks the pop-up. */
export function openBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  // A blob URL is our own origin, so no "noopener" (which would also make window.open always return null).
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
