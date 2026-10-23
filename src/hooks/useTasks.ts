'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { tasksApi, type BackendTask, type BackendTaskStatus, type CreateTaskInput, type TaskListQuery } from '@/lib/api/tasks';
import type { ApiMeta } from '@/lib/api/client';

export function useTasks(query: TaskListQuery, enabled: boolean) {
  const [data, setData] = useState<BackendTask[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({});
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
  const queryKey = JSON.stringify(query);
  const latest = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const id = ++latest.current; // ignore answers to superseded requests
    setLoading(true);
    setError(null);
    try {
      const result = await tasksApi.list(query);
      if (id !== latest.current) return;
      setData(result.items);
      setMeta(result.meta);
    } catch (reason) {
      if (id !== latest.current) return;
      setError(reason instanceof Error ? reason : new Error('Unable to load tasks.'));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [enabled, queryKey]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { data, meta, loading, error, refresh };
}

export function useTaskMutations(refresh: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const execute = useCallback(async <T,>(operation: () => Promise<T>) => {
    setPending(true);
    try {
      const result = await operation();
      await refresh();
      return result;
    } finally {
      setPending(false);
    }
  }, [refresh]);

  return {
    pending,
    create: (input: CreateTaskInput) => execute(() => tasksApi.create(input)),
    updateStatus: (id: string, status: BackendTaskStatus) => execute(() => tasksApi.changeStatus(id, status)),
    remove: (id: string) => execute(() => tasksApi.remove(id)),
  };
}
