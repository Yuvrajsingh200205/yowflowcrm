'use client';

import * as React from 'react';
import { BarChart3 } from 'lucide-react';
import { dashboardApi, type DashboardTrends } from '@/lib/api/dashboard';
import { BarChart, Card, CardContent, CardDescription, CardHeader, CardTitle, ErrorState, LineChart, Skeleton } from '@/components/ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthLabel = (key: string) => MONTHS[Number(key.slice(5, 7)) - 1] ?? key;
const inr = (n: number) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;
const count = (n: number) => String(Math.round(n));

/** Revenue and pipeline trends. Money charts disappear for roles without finance access. */
export function DashboardCharts({ showFinancial }: { showFinancial: boolean }) {
  const [data, setData] = React.useState<DashboardTrends | null>(null);
  const [error, setError] = React.useState(false);
  const load = React.useCallback(() => { setError(false); dashboardApi.trends(8).then(setData).catch(() => setError(true)); }, []);
  React.useEffect(() => { load(); }, [load]);

  if (error) return <Card><ErrorState title="Couldn’t load trends" description="Your numbers are safe; this chart just couldn’t be fetched." action={{ label: 'Try again', onClick: load }} /></Card>;
  const labels = data?.months.map(monthLabel) ?? [];
  const hasMoney = showFinancial && !!data?.revenue;

  return (
    <section aria-label="Trends" className="grid gap-4 lg:grid-cols-2">
      {hasMoney || !data ? (
        <Card>
          <CardHeader><div><CardTitle>Revenue and expenses</CardTitle><CardDescription>Payments received against money spent, last 8 months</CardDescription></div></CardHeader>
          <CardContent>
            {!data ? <Skeleton className="h-60" /> : (
              <LineChart
                title="Revenue and expenses by month"
                labels={labels}
                series={[{ name: 'Revenue', values: data.revenue ?? [] }, ...(data.expenses ? [{ name: 'Expenses', values: data.expenses }] : [])]}
                format={inr}
              />
            )}
          </CardContent>
        </Card>
      ) : null}
      <Card className={hasMoney || !data ? '' : 'lg:col-span-2'}>
        <CardHeader><div><CardTitle className="flex items-center gap-2"><BarChart3 className="size-4 text-brand" aria-hidden="true" />Leads and bookings</CardTitle><CardDescription>New enquiries and projects created each month</CardDescription></div></CardHeader>
        <CardContent>
          {!data ? <Skeleton className="h-60" /> : <BarChart title="Leads and bookings by month" labels={labels} series={[{ name: 'Leads', values: data.leads }, { name: 'Bookings', values: data.bookings }]} format={count} />}
        </CardContent>
      </Card>
    </section>
  );
}
