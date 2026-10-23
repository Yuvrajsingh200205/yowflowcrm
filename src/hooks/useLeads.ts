'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, ApiMeta } from '@/lib/api/client';
import { BackendLead, LeadListQuery, leadsApi } from '@/lib/api/leads';

export function useLeads(query: LeadListQuery = {}, enabled = true) {
  const [data, setData] = useState<BackendLead[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const queryKey = useMemo(() => JSON.stringify(query), [query]);
  const latest = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    // Only the newest request may update the screen: a slow answer to an older filter must not overwrite a newer list.
    const id = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const response = await leadsApi.list(query);
      if (id !== latest.current) return;
      setData(response.data);
      setMeta(response.meta);
    } catch (error) {
      if (id !== latest.current) return;
      setError(error instanceof ApiError ? error : new ApiError(0, 'Unable to load leads.'));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [enabled, queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, meta, error, loading, retry: load };
}
