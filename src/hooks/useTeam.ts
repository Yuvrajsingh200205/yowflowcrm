'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiMeta } from '@/lib/api/client';
import { usersApi, type BackendUser, type CreateUserInput, type UpdateUserInput, type UserListQuery } from '@/lib/api/users';

export function useTeam(query: UserListQuery = {}, enabled = true) {
  const [data, setData] = useState<BackendUser[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const queryKey = JSON.stringify(query);
  const latest = useRef(0);
  const load = useCallback(async () => {
    if (!enabled) return;
    const id = ++latest.current; // ignore answers to superseded requests
    setLoading(true); setError(null);
    try { const result = await usersApi.list(query); if (id !== latest.current) return; setData(result.items); setMeta(result.meta); }
    catch (reason) { if (id !== latest.current) return; setError(reason instanceof Error ? reason : new Error('Unable to load team.')); }
    finally { if (id === latest.current) setLoading(false); }
  }, [enabled, queryKey]);
  useEffect(() => { if (enabled) void load(); }, [enabled, load]);
  return { data, meta, loading, error, refresh: load };
}

export function useTeamMutation(refresh: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const execute = useCallback(async <T,>(operation: () => Promise<T>) => {
    setPending(true);
    try { const value = await operation(); await refresh(); return value; }
    finally { setPending(false); }
  }, [refresh]);
  return {
    pending,
    create: (input: CreateUserInput) => execute(() => usersApi.create(input)),
    update: (id: string, input: UpdateUserInput) => execute(() => usersApi.update(id, input)),
    setRoles: (id: string, roleIds: string[]) => execute(() => usersApi.setRoles(id, roleIds)),
    remove: (id: string) => execute(() => usersApi.remove(id)),
  };
}
