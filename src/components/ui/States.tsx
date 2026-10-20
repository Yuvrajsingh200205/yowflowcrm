import * as React from 'react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

type StateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
};

function Shell({ icon, title, description, action, className, tone }: StateProps & { tone: 'empty' | 'error' }) {
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      {icon && (
        <div className={cn('mb-4 grid size-12 place-items-center rounded-full [&_svg]:size-5', tone === 'error' ? 'bg-bad-bg text-bad' : 'bg-[var(--hover)] text-brand')} aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-fg-muted">{description}</p>}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Button asChild variant={tone === 'error' ? 'secondary' : 'primary'}><a href={action.href}>{action.label}</a></Button>
          ) : (
            <Button variant={tone === 'error' ? 'secondary' : 'primary'} onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  );
}

/** First-run and no-results screens: say what belongs here and offer the next step. */
export const EmptyState = (p: StateProps) => <Shell tone="empty" {...p} />;
/** Failures always include a recovery path (retry, edit or help). */
export const ErrorState = (p: StateProps) => <Shell tone="error" {...p} />;
