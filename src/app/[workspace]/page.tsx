import { notFound } from 'next/navigation';
import { CrmClient } from '@/components/app/CrmClient';

const WORKSPACES = new Set([
  'dashboard',
  'owner-workspace',
  'equipment',
  'workspaces',
  'leads',
  'projects',
  'shoots',
  'expenses',
  'data-management',
  'team',
  'freelancers',
  'clients',
  'deliveries',
  'roles-permissions',
  'settings',
  'quotes',
  'sales-setup',
]);

export function generateStaticParams() {
  return [...WORKSPACES].map((workspace) => ({ workspace }));
}

export default async function WorkspacePage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  if (!WORKSPACES.has(workspace)) notFound();
  return <CrmClient />;
}
