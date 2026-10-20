'use client';

import * as React from 'react';
import { Calendar, Inbox, Plus, Search, Trash2, TriangleAlert } from 'lucide-react';
import {
  Badge, BarChart, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Dialog, DialogContent, DialogTrigger,
  Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger, EmptyState, ErrorState, Field, Input, LineChart, Logo,
  Pagination, Select, Skeleton, SortableTH, Table, TBody, TD, Textarea, THead, ThemeToggle, TR, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip, useToast,
  type SortDir,
} from '@/components/ui';
import { BRAND } from '@/config/brand';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const money = (n: number) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;

const SWATCHES: [string, string][] = [
  ['canvas', '--background'], ['surface', '--surface'], ['sunken', '--surface-sunken'], ['line', '--border'],
  ['fg', '--text-primary'], ['fg-muted', '--text-secondary'], ['fg-subtle', '--text-muted'],
  ['brand', '--primary'], ['brand-hover', '--primary-hover'], ['brand-deep', '--primary-dark'], ['gold', '--accent'],
  ['ok', '--success'], ['warn', '--warning'], ['bad', '--danger'], ['note', '--info'],
];

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-line-soft py-12 first:border-t-0">
      <h2 id={`${id}-h`} className="font-display text-2xl font-semibold tracking-tight text-fg">{title}</h2>
      {note && <p className="mt-2 max-w-2xl text-sm text-fg-muted">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

const ROWS = [
  { id: 'PRJ-0142', client: 'Aanya & Rohan', status: 'Editing', amount: 285000 },
  { id: 'PRJ-0139', client: 'Meera & Kabir', status: 'Shooting', amount: 410000 },
  { id: 'PRJ-0136', client: 'Studio Lumen', status: 'Delivered', amount: 96000 },
  { id: 'PRJ-0131', client: 'Tara & Dev', status: 'Booked', amount: 175000 },
];
const TONE: Record<string, 'brand' | 'warning' | 'success' | 'info'> = { Editing: 'warning', Shooting: 'brand', Delivered: 'success', Booked: 'info' };

export function DesignSystemDemo() {
  const { toast } = useToast();
  const [page, setPage] = React.useState(3);
  const [sort, setSort] = React.useState<{ key: 'client' | 'amount'; dir: SortDir }>({ key: 'amount', dir: 'desc' });
  const [loading, setLoading] = React.useState(false);
  const rows = [...ROWS].sort((a, b) => {
    const d = sort.dir === 'asc' ? 1 : -1;
    return (a[sort.key] > b[sort.key] ? 1 : -1) * d;
  });
  const toggleSort = (key: 'client' | 'amount') => setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }));

  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-line-soft bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Badge tone="gold">Design system</Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">{BRAND.name} · v1</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl">A calm, precise interface for studios that run on deadlines.</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-fg-muted">Tokens first, components second. Every component ships with hover, focus, active, disabled, loading and error behaviour, and respects reduced motion.</p>

        <Section id="colors" title="Colour" note="Semantic tokens switch between light and dark. Components never use raw hex.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {SWATCHES.map(([name, v]) => (
              <li key={name} className="overflow-hidden rounded-[var(--radius-lg)] border border-line-soft bg-surface">
                <div className="h-14 border-b border-line-soft" style={{ background: `var(${v})` }} aria-hidden="true" />
                <div className="px-3 py-2"><p className="text-[13px] font-medium">{name}</p><p className="font-mono text-[11px] text-fg-subtle">{v}</p></div>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="type" title="Typography" note="Fraunces for display, Inter for UI, JetBrains Mono for IDs and figures. Body is 16px at 1.6; data uses tabular numerals.">
          <div className="space-y-4">
            <p className="font-display text-5xl font-semibold tracking-tight">Display 48 / Fraunces</p>
            <p className="font-display text-3xl font-semibold tracking-tight">Heading 30 / Fraunces</p>
            <p className="text-xl font-semibold tracking-tight">Title 20 / Inter 600</p>
            <p className="max-w-prose text-base leading-relaxed text-fg-muted">Body 16 — Plan, shoot, collect and deliver every project from one record, with the whole crew looking at the same truth.</p>
            <p className="text-[13px] text-fg-subtle">Caption 13 / Inter 400</p>
            <p className="font-mono text-sm tabular">PRJ-2026-0142 · ₹2,85,000 · 12:45</p>
          </div>
        </Section>

        <Section id="buttons" title="Buttons" note="One primary action per screen. States shown: default, disabled, loading.">
          <div className="space-y-4">
            {(['primary', 'secondary', 'ghost', 'danger', 'gold'] as const).map((v) => (
              <div key={v} className="flex flex-wrap items-center gap-3">
                <span className="w-20 text-xs font-medium capitalize text-fg-subtle">{v}</span>
                <Button variant={v}><Plus />New project</Button>
                <Button variant={v} size="sm">Small</Button>
                <Button variant={v} disabled>Disabled</Button>
                <Button variant={v} loading>Saving</Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-20 text-xs font-medium text-fg-subtle">icon / link</span>
              <Tooltip content="Search"><Button variant="secondary" size="icon" aria-label="Search"><Search /></Button></Tooltip>
              <Button variant="link">Read the docs</Button>
            </div>
          </div>
        </Section>

        <Section id="forms" title="Forms" note="Visible labels, hints, and errors linked with aria-describedby. Errors say what to do next.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Client name" required hint="As it should appear on the invoice.">{(a) => <Input id={a.id} aria-describedby={a.describedBy} placeholder="Aanya Kapoor" />}</Field>
            <Field label="Email" error="Enter a valid email, like name@studio.com." required>{(a) => <Input id={a.id} aria-describedby={a.describedBy} invalid={a.invalid} defaultValue="aanya@" />}</Field>
            <Field label="Package">{(a) => <Select id={a.id}><option>Wedding · 3 days</option><option>Pre-wedding</option><option>Commercial</option></Select>}</Field>
            <Field label="Disabled field">{(a) => <Input id={a.id} disabled defaultValue="Locked after invoicing" />}</Field>
            <Field className="sm:col-span-2" label="Notes">{(a) => <Textarea id={a.id} placeholder="Venue access, family dynamics, must-have shots…" />}</Field>
            <Checkbox label="Send the client a booking confirmation" defaultChecked />
          </div>
        </Section>

        <Section id="badges" title="Badges & cards">
          <div className="mb-6 flex flex-wrap gap-2">
            <Badge>Draft</Badge><Badge tone="brand" dot>Shooting</Badge><Badge tone="success" dot>Paid</Badge><Badge tone="warning" dot>Due in 3 days</Badge><Badge tone="danger" dot>Overdue</Badge><Badge tone="info">Lead</Badge><Badge tone="gold">VIP</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Active projects', '24', '+3 this week'], ['Outstanding', '₹4.2L', '5 invoices'], ['Shoots this week', '9', '2 need crew']].map(([t, v, d]) => (
              <Card key={t} interactive>
                <CardHeader><div><CardDescription className="mt-0">{t}</CardDescription><p className="mt-2 font-display text-3xl font-semibold tabular">{v}</p></div></CardHeader>
                <CardContent className="pt-2 text-[13px] text-fg-muted">{d}</CardContent>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="table" title="Table & pagination" note="Sortable headers expose aria-sort and are real buttons. The table scrolls horizontally on small screens.">
          <Table>
            <THead>
              <tr>
                <SortableTH dir={null} onSort={() => undefined}>Project</SortableTH>
                <SortableTH dir={sort.key === 'client' ? sort.dir : null} onSort={() => toggleSort('client')}>Client</SortableTH>
                <th scope="col" className="border-b border-line-soft px-4 text-left text-xs font-semibold uppercase tracking-wide text-fg-subtle">Status</th>
                <SortableTH align="right" dir={sort.key === 'amount' ? sort.dir : null} onSort={() => toggleSort('amount')}>Value</SortableTH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="font-mono text-[13px] text-fg-muted">{r.id}</TD>
                  <TD className="font-medium">{r.client}</TD>
                  <TD><Badge tone={TONE[r.status]} dot>{r.status}</Badge></TD>
                  <TD className="text-right tabular">{money(r.amount)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination className="mt-4" page={page} pageCount={12} onPageChange={setPage} />
        </Section>

        <Section id="overlays" title="Overlays" note="Dialog, drawer, dropdown, tooltip and toast. Focus is trapped and restored; Escape always closes.">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild><Button variant="secondary">Open dialog</Button></DialogTrigger>
              <DialogContent title="Archive this project?" description="It moves out of active views but invoices and files are kept." footer={<><Button variant="ghost">Cancel</Button><Button variant="danger"><Trash2 />Archive</Button></>}>
                <p className="text-sm text-fg-muted">The client portal link stays valid for 30 days so family can still download their gallery.</p>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild><Button variant="secondary">Open drawer</Button></DialogTrigger>
              <DialogContent kind="drawer" title="Project details" description="PRJ-0142 · Aanya & Rohan" footer={<Button>Save changes</Button>}>
                <div className="space-y-4"><Field label="Venue">{(a) => <Input id={a.id} defaultValue="The Leela, Udaipur" />}</Field><Field label="Lead photographer">{(a) => <Input id={a.id} defaultValue="Alex Morgan" />}</Field></div>
              </DialogContent>
            </Dialog>
            <Dropdown>
              <DropdownTrigger asChild><Button variant="secondary">Actions</Button></DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>Project</DropdownLabel>
                <DropdownItem><Calendar />Schedule shoot</DropdownItem>
                <DropdownItem><Plus />Add invoice</DropdownItem>
                <DropdownSeparator />
                <DropdownItem destructive><Trash2 />Delete</DropdownItem>
              </DropdownContent>
            </Dropdown>
            <Button variant="secondary" onClick={() => toast({ tone: 'success', title: 'Invoice sent', description: 'INV-0207 emailed to Aanya Kapoor.' })}>Success toast</Button>
            <Button variant="secondary" onClick={() => toast({ tone: 'error', title: 'Could not save', description: 'Check your connection and try again.', action: { label: 'Retry', onClick: () => undefined } })}>Error toast</Button>
            <Button variant="secondary" onClick={() => toast({ title: 'Project archived', action: { label: 'Undo', onClick: () => undefined } })}>Undo toast</Button>
          </div>
        </Section>

        <Section id="tabs" title="Tabs">
          <Tabs defaultValue="overview">
            <TabsList aria-label="Project sections"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="shoots">Shoots</TabsTrigger><TabsTrigger value="billing">Billing</TabsTrigger></TabsList>
            <TabsContent value="overview"><p className="text-sm text-fg-muted">Timeline, crew and notes for the whole project.</p></TabsContent>
            <TabsContent value="shoots"><p className="text-sm text-fg-muted">Every day, call time and assignment.</p></TabsContent>
            <TabsContent value="billing"><p className="text-sm text-fg-muted">Milestones, invoices and payments.</p></TabsContent>
          </Tabs>
        </Section>

        <Section id="states" title="Loading, empty & error" note="Every screen needs all three. Skeletons reserve the final size to prevent layout shift.">
          <div className="mb-4"><Button variant="secondary" size="sm" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1600); }}>Simulate loading</Button></div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-5">
              {loading ? <div className="space-y-3" role="status" aria-label="Loading"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-full" /></div> : <><p className="text-[13px] text-fg-muted">Revenue</p><p className="mt-1 font-display text-3xl font-semibold tabular">₹12.4L</p><p className="mt-2 text-[13px] text-ok">▲ 8.2% vs last month</p></>}
            </Card>
            <Card><EmptyState icon={<Inbox />} title="No leads yet" description="Connect your Meta lead form or add your first inquiry by hand." action={{ label: 'Add a lead' }} /></Card>
            <Card><ErrorState icon={<TriangleAlert />} title="Couldn't load invoices" description="This is usually a dropped connection. Your data is safe." action={{ label: 'Try again' }} /></Card>
          </div>
        </Section>

        <Section id="charts" title="Charts" note="Thin marks, one axis, a legend, hover and keyboard tooltips, and a table view. Series colours are validated for colour-blind readers.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Revenue</CardTitle></CardHeader><CardContent><LineChart title="Revenue by month" labels={months} series={[{ name: 'Revenue', values: [180000, 220000, 260000, 240000, 310000, 380000, 350000, 420000] }]} format={money} /></CardContent></Card>
            <Card><CardHeader><CardTitle>Bookings by source</CardTitle></CardHeader><CardContent><BarChart title="Bookings by source" labels={months.slice(0, 6)} series={[{ name: 'Referral', values: [8, 10, 9, 12, 14, 16] }, { name: 'Instagram', values: [5, 7, 9, 8, 11, 13] }, { name: 'Meta ads', values: [3, 4, 6, 7, 6, 9] }]} /></CardContent></Card>
          </div>
        </Section>
      </main>
    </div>
  );
}
