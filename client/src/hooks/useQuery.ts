import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QueryState, UseQueryOptions, UseQueryResult } from "../lib/react-query";
import { useQueryClient } from "./useQueryClient";


export function useQuery<T>(options: UseQueryOptions<T>): UseQueryResult<T> {
  const {
    queryKey,
    queryFn,
    enabled = true,
    staleTime = 0,
    initialData,
    refetchInterval,
  } = options;
  const client = useQueryClient();
  const [state, setState] = useState<QueryState<T>>(() =>
    client.getQueryState<T>(queryKey, initialData)
  );

  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  useEffect(() =>
    client.subscribe(queryKey, () => {
      if (!mountedRef.current) return;
      setState(client.getQueryState<T>(queryKey, initialData));
    }),
    [client, initialData, queryKey]);

  const execute = useCallback(
    () =>
      client.executeQuery<T>(queryKey, queryFn, {
        staleTime,
        initialData,
      }),
    [client, queryFn, queryKey, staleTime, initialData]
  );

  useEffect(() => {
    if (!enabled) return;
    execute();
  }, [enabled, execute]);

  useEffect(() => {
    if (!enabled || !refetchInterval) return;
    const id = window.setInterval(() => {
      void client.executeQuery<T>(queryKey, queryFn, {
        initialData,
        force: true,
        staleTime,
      });
    }, refetchInterval);
    return () => window.clearInterval(id);
  }, [client, enabled, queryFn, queryKey, refetchInterval, initialData, staleTime]);

  return {
    data: state.data,
    error: state.error,
    status: state.status,
    isPending: state.status === "pending" && state.data === undefined,
    isLoading: state.status === "pending" && state.data === undefined,
    isFetching: state.status === "pending",
    refetch: () =>
      client.executeQuery<T>(queryKey, queryFn, {
        staleTime,
        initialData,
        force: true,
      }),
  };
}
