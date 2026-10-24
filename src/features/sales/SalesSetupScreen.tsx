'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { GettingStarted, type SetupTab } from './GettingStarted';
import { AvailabilityTab } from './setup/AvailabilityTab';
import { BookingPageTab } from './setup/BookingPageTab';
import { BusinessTab } from './setup/BusinessTab';
import { PackagesTab } from './setup/PackagesTab';
import { RemindersTab } from './setup/RemindersTab';

interface Props {
  /** The signed-in user's permission keys. */
  permissions: string[];
  /** Open on this tab (for example when a checklist elsewhere sent the user here). */
  initialTab?: SetupTab | null;
  onTabHandled?: () => void;
}

/**
 * Where a studio sets up everything its quotes and booking page are built from. Reading the price list is open to
 * anyone who can quote; changing it needs CATALOG_MANAGE, and the rest of the setup needs BOOKING_SETUP_MANAGE.
 */
export function SalesSetupScreen({ permissions, initialTab, onTabHandled }: Props) {
  const has = (key: string) => permissions.includes(key);
  const canManageCatalog = has('CATALOG_MANAGE');
  const canSetup = has('BOOKING_SETUP_MANAGE');
  const [tab, setTab] = React.useState<string>(initialTab ?? 'packages');
  // Bumped whenever something is saved, so the checklist above recounts what is still to do.
  const [changes, setChanges] = React.useState(0);
  const changed = React.useCallback(() => setChanges((n) => n + 1), []);
  React.useEffect(() => { if (initialTab) { setTab(initialTab); onTabHandled?.(); } }, [initialTab, onTabHandled]);

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h2 className="font-display text-2xl font-semibold tracking-tight">Sales setup</h2>
        <p className="mt-1 text-sm text-fg-muted">Set your packages and prices once. Your booking page and every quote are built from them, so a customer gets an answer in seconds.</p>
      </header>
      <GettingStarted canAct={canManageCatalog || canSetup} onGo={(t) => setTab(t)} version={`${tab}-${changes}`} />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList aria-label="Sales setup sections" className="w-max">
            <TabsTrigger value="packages">Packages &amp; pricing</TabsTrigger>
            {canSetup && <TabsTrigger value="booking">Booking page</TabsTrigger>}
            {canSetup && <TabsTrigger value="availability">Availability</TabsTrigger>}
            {canSetup && <TabsTrigger value="business">Business &amp; payments</TabsTrigger>}
            {canSetup && <TabsTrigger value="reminders">Reminders</TabsTrigger>}
          </TabsList>
        </div>
        <TabsContent value="packages"><PackagesTab canManage={canManageCatalog} onChanged={changed} /></TabsContent>
        {canSetup && <TabsContent value="booking"><BookingPageTab onNavigate={setTab} onChanged={changed} /></TabsContent>}
        {canSetup && <TabsContent value="availability"><AvailabilityTab /></TabsContent>}
        {canSetup && <TabsContent value="business"><BusinessTab onChanged={changed} /></TabsContent>}
        {canSetup && <TabsContent value="reminders"><RemindersTab /></TabsContent>}
      </Tabs>
    </div>
  );
}
