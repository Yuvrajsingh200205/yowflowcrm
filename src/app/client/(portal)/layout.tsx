import { PortalShell } from '@/features/portal/PortalShell';

export const metadata = { title: { default: 'Client portal', template: '%s · Client portal' }, robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
