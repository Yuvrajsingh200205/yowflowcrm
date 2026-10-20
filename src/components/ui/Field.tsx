'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Form primitives. A visible label is always required (never placeholder-only);
 * errors render under the field and are linked with aria-describedby.
 */
const control = [
  'w-full rounded-[var(--radius-md)] border bg-surface px-3 text-sm text-fg',
  'placeholder:text-fg-subtle transition-[border-color,box-shadow] duration-[var(--dur-base)]',
  'hover:border-line-strong focus-visible:border-[var(--ring)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--ring)_22%,transparent)]',
  'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-60',
  'read-only:bg-surface-sunken',
].join(' ');

const stateBorder = (invalid?: boolean) => (invalid ? 'border-bad' : 'border-line');

export function Label({ className, required, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('mb-1.5 block text-[13px] font-medium text-fg', className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-bad" aria-hidden="true">*</span>}
    </label>
  );
}

type FieldShellProps = {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (a: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
};

/** Wrap any control: handles label, hint, error and the aria wiring. */
export function Field({ id, label, hint, error, required, className, children }: FieldShellProps) {
  const auto = React.useId();
  const fid = id ?? auto;
  const hintId = hint ? `${fid}-hint` : undefined;
  const errId = error ? `${fid}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <Label htmlFor={fid} required={required}>{label}</Label>
      {children({ id: fid, describedBy, invalid: !!error })}
      {hint && !error && <p id={hintId} className="mt-1.5 text-xs text-fg-subtle">{hint}</p>}
      {error && <p id={errId} role="alert" className="mt-1.5 text-xs font-medium text-bad">{error}</p>}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, 'h-10', stateBorder(invalid), className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} aria-invalid={invalid || undefined} className={cn(control, 'min-h-24 py-2.5', stateBorder(invalid), className)} {...props} />;
  },
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <div className="relative">
        <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, 'h-10 appearance-none pr-9', stateBorder(invalid), className)} {...props}>
          {children}
        </select>
        <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" fill="none" aria-hidden="true">
          <path d="m5 8 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  },
);

export const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }>(
  function Checkbox({ className, label, id, ...props }, ref) {
    const auto = React.useId();
    const cid = id ?? auto;
    return (
      <span className="inline-flex items-center gap-2.5">
        <input ref={ref} id={cid} type="checkbox" className={cn('size-[18px] cursor-pointer accent-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] disabled:opacity-50', className)} {...props} />
        <label htmlFor={cid} className="cursor-pointer text-sm text-fg">{label}</label>
      </span>
    );
  },
);
