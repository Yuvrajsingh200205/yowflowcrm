'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackendFreelancer,
  FreelancerInput,
  FreelancerListQuery,
  freelancersApi,
} from '@/lib/api/freelancers';
import { ApiError, ApiMeta } from '@/lib/api/client';

export function useFreelancers(query: FreelancerListQuery = {}, enabled = true) {
  const [data, setData] = useState<BackendFreelancer[]>([]);
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
    const id = ++latest.current; // ignore answers to superseded requests
    setLoading(true);
    setError(null);
    try {
      const response = await freelancersApi.list(query);
      if (id !== latest.current) return;
      setData(response.data);
      setMeta(response.meta);
    } catch (error) {
      if (id !== latest.current) return;
      setError(error instanceof ApiError ? error : new ApiError(0, 'Unable to load freelancers.'));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [enabled, queryKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, meta, error, loading, retry: load };
}

export function useFreelancerMutation(refresh?: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const run = useCallback(async <T,>(work: () => Promise<T>) => {
    setPending(true);
    setError(null);
    try {
      const result = await work();
      await refresh?.();
      return result;
    } catch (error) {
      const failure = error instanceof ApiError ? error : new ApiError(0, 'Unable to save freelancer.');
      setError(failure);
      throw failure;
    } finally {
      setPending(false);
    }
  }, [refresh]);

  return {
    pending,
    error,
    create: (input: FreelancerInput) => run(() => freelancersApi.create(input)),
    update: (id: string, input: Partial<FreelancerInput>) => run(() => freelancersApi.update(id, input)),
    remove: (id: string) => run(() => freelancersApi.remove(id)),
  };
}
