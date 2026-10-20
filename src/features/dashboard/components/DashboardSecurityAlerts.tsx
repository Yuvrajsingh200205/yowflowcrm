import { Lock, ShieldAlert } from 'lucide-react';
import { TeamMember } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function DashboardSecurityAlerts({ team, onTeam }: { team: TeamMember[]; onTeam: () => void }) {
  const alerts = team.filter((m) => (m.unauthorizedMinutes || 0) >= 5 || m.isLoggedOut);
  if (!alerts.length) return null;
  return (
    <section role="alert" aria-label="Security alerts" className="rounded-[var(--radius-lg)] border border-warn/40 bg-warn-bg p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg"><ShieldAlert className="size-4 text-warn" aria-hidden="true" />Software and auto-logout alerts ({alerts.length})</h4>
        <Button variant="secondary" size="sm" onClick={onTeam}>Manage team</Button>
      </div>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {alerts.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line-soft bg-surface p-3 text-[13px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-fg">{m.name}</strong>
                <Badge tone={m.isLoggedOut ? 'danger' : 'warning'} dot>{m.isLoggedOut ? <><Lock className="size-3" aria-hidden="true" />Auto logged out</> : `${m.unauthorizedMinutes} min unauthorized`}</Badge>
              </div>
              <p className="mt-1 truncate text-fg-muted">Current app: <strong className="text-fg">{m.currentSoftware}</strong> · assigned {m.assignedSoftwares?.join(', ') || m.assignedSoftware || 'none'}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
