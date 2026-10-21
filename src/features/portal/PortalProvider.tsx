'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api/client';
import { Spinner } from '@/components/ui/Spinner';
import { portalApi, type PortalMe } from './api';

interface Ctx { me: PortalMe; unread: number; setUnread: (n: number) => void; logout: () => Promise<void> }
const PortalContext = React.createContext<Ctx | null>(null);

export const usePortal = () => {
  const c = React.useContext(PortalContext);
  if (!c) throw new Error('usePortal must be used inside <PortalGate>');
  return c;
};

/** Loads the signed-in couple once; anyone without a session is sent to the portal login. */
export function PortalGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = React.useState<PortalMe | null>(null);
  const [unread, setUnread] = React.useState(0);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    portalApi.me().then((m) => { if (live) setMe(m); }).catch((e) => {
      if (!live) return;
      if (e instanceof ApiError && e.status === 401) router.replace(`/client/login?returnTo=${encodeURIComponent(pathname)}`);
      else setFailed(true);
    });
    return () => { live = false; };
  }, [router, pathname]);

  const logout = React.useCallback(async () => {
    try { await portalApi.logout(); } catch { /* the cookies are cleared server-side either way */ }
    router.replace('/client/login');
  }, [router]);

  if (failed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
        <div role="alert" className="max-w-sm">
          <h1 className="font-display text-xl font-semibold text-fg">We couldn’t load your portal</h1>
          <p className="mt-2 text-sm text-fg-muted">Check your connection and try again.</p>
          <button type="button" onClick={() => { setFailed(false); location.reload(); }} className="mt-4 cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-on-brand">Retry</button>
        </div>
      </div>
    );
  }
  if (!me) return <div className="grid min-h-dvh place-items-center bg-canvas"><Spinner label="Loading your portal" /></div>;
  return <PortalContext.Provider value={{ me, unread, setUnread, logout }}>{children}</PortalContext.Provider>;
}
