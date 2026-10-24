'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { GettingStarted, type SetupTab } from './GettingStarted';
import { QuickQuoteDialog } from './quotes/QuickQuoteDialog';
import { QuoteDetail } from './quotes/QuoteDetail';
import { QuoteList } from './quotes/QuoteList';
import { TodayPanel } from './quotes/TodayPanel';

/** Sent from elsewhere in the app (for example a lead row) to open this screen already pointed at something. */
export type QuoteIntent = { kind: 'create'; leadId: string } | { kind: 'list'; leadId: string; leadName: string } | { kind: 'open'; quoteId: string };

interface Props {
  /** The signed-in user's permission keys. */
  permissions: string[];
  intent?: QuoteIntent | null;
  onIntentHandled?: () => void;
  onOpenProject?: (projectId: string) => void;
  /** Go to Sales setup, optionally on a particular tab. */
  onOpenSalesSetup?: (tab: SetupTab) => void;
}

export function QuotesScreen({ permissions, intent, onIntentHandled, onOpenProject, onOpenSalesSetup }: Props) {
  const canCreate = permissions.includes('QUOTATION_CREATE');
  const canPayments = permissions.includes('PAYMENT_VIEW');
  const canSetUp = permissions.includes('CATALOG_MANAGE') || permissions.includes('BOOKING_SETUP_MANAGE');
  const [tab, setTab] = React.useState('today');
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState<{ leadId: string | null } | null>(null);
  const [leadFilter, setLeadFilter] = React.useState<{ id: string; name: string } | null>(null);
  const [version, setVersion] = React.useState(0);
  const bump = React.useCallback(() => setVersion((v) => v + 1), []);

  // An intent from another screen is acted on once, then cleared so going back and forth does not repeat it.
  React.useEffect(() => {
    if (!intent) return;
    if (intent.kind === 'create') { if (canCreate) setCreating({ leadId: intent.leadId }); }
    else if (intent.kind === 'list') { setLeadFilter({ id: intent.leadId, name: intent.leadName }); setTab('all'); }
    else setDetailId(intent.quoteId);
    onIntentHandled?.();
  }, [intent, canCreate, onIntentHandled]);

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Quotes</h2>
          <p className="mt-1 text-sm text-fg-muted">See who needs a reply today, what has been opened, and what was accepted.</p>
        </div>
        {canCreate && <Button size="lg" onClick={() => setCreating({ leadId: null })}><Plus />Make a quote</Button>}
      </header>

      {onOpenSalesSetup && <GettingStarted canAct={canSetUp} onGo={onOpenSalesSetup} version={version} />}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Quote views">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="all">All quotes</TabsTrigger>
        </TabsList>
        <TabsContent value="today"><TodayPanel version={version} canPayments={canPayments} onOpen={setDetailId} onOpenLead={canCreate ? (leadId) => setCreating({ leadId }) : undefined} /></TabsContent>
        <TabsContent value="all"><QuoteList version={version} onOpen={setDetailId} leadFilter={leadFilter} onClearLead={() => setLeadFilter(null)} /></TabsContent>
      </Tabs>

      {detailId && <QuoteDetail id={detailId} permissions={permissions} onClose={() => setDetailId(null)} onChanged={bump} onOpenProject={onOpenProject} />}
      {creating && (
        <QuickQuoteDialog
          initialLeadId={creating.leadId}
          canAddTemplates={permissions.includes('CATALOG_MANAGE')}
          onClose={() => { setCreating(null); bump(); }}
          onCreated={(id) => { setCreating(null); bump(); setDetailId(id); }}
          onOpenPrices={() => { setCreating(null); onOpenSalesSetup?.('packages'); }}
        />
      )}
    </div>
  );
}
