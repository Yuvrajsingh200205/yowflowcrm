'use client';

import * as React from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import { cn } from '@/lib/cn';

/** Mirrors the backend password rule (10+ chars, upper, lower, digit). */
export const passwordChecks = (v: string) => [
  { ok: v.length >= 10, label: '10 or more characters' },
  { ok: /[a-z]/.test(v), label: 'A lowercase letter' },
  { ok: /[A-Z]/.test(v), label: 'An uppercase letter' },
  { ok: /\d/.test(v), label: 'A number' },
];
export const isStrongPassword = (v: string) => passwordChecks(v).every((c) => c.ok);

export function PasswordField({
  label = 'Password', value, onChange, error, autoComplete, showRules, name = 'password', hint, required = true,
}: {
  label?: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: 'current-password' | 'new-password'; showRules?: boolean; name?: string; hint?: string; required?: boolean;
}) {
  const [shown, setShown] = React.useState(false);
  const checks = passwordChecks(value);
  return (
    <div>
      <Field label={label} error={error} hint={hint} required={required}>
        {(a) => (
          <div className="relative">
            <Input id={a.id} name={name} type={shown ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-describedby={a.describedBy} invalid={a.invalid} className="pr-11" />
            <button type="button" onClick={() => setShown((s) => !s)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown} className="absolute right-1 top-1 grid size-8 cursor-pointer place-items-center rounded-md text-fg-subtle hover:bg-[var(--hover)] hover:text-fg focus-visible:outline-2 focus-visible:outline-[var(--ring)]">
              {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        )}
      </Field>
      {showRules && (
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1" aria-label="Password requirements">
          {checks.map((c) => (
            <li key={c.label} className={cn('flex items-center gap-1.5 text-xs', c.ok ? 'text-ok' : 'text-fg-subtle')}>
              <Check className={cn('size-3.5', !c.ok && 'opacity-30')} aria-hidden="true" />
              <span><span className="sr-only">{c.ok ? 'Met: ' : 'Not met: '}</span>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
