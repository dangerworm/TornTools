import { type ReactNode } from "react";
import { QueryClientContext } from "../hooks/useQueryClient";

// Lightweight, local implementation of a TanStack Query–style client to
// provide caching and deduplicated server-state fetching without relying on
// external dependencies.

export type QueryKey = readonly unknown[];

export type QueryStatus = "idle" | "pending" | "success" | "error";

type InitialData<T> = T | undefined | (() => T | undefined);

export type QueryState<T> = {
  data?: T;
  error?: unknown;
  promise?: Promise<T>;
  status: QueryStatus;
  updatedAt?: number;
};

export interface UseQueryOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  initialData?: InitialData<T>;
  refetchInterval?: number;
}

export interface UseQueryResult<T> {
  data: T | undefined;
  error: unknown;
  status: QueryStatus;
  isPending: boolean;
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<T | undefined>;
}

const resolveInitialData = <T,>(initialData: InitialData<T>) =>
  typeof initialData === "function"
    ? (initialData as () => T | undefined)()
    : initialData;

class QueryCache {
  private cache = new Map<string, QueryState<any>>();
  private listeners = new Map<string, Set<() => void>>();

  subscribe(key: string, listener: () => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const set = this.listeners.get(key)!;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  private notify(key: string) {
    const set = this.listeners.get(key);
    if (!set) return;
    set.forEach((listener) => listener());
  }

  get<T>(key: string, initialData?: InitialData<T>) {
    if (!this.cache.has(key)) {
      const resolved = initialData ? resolveInitialData(initialData) : undefined;
      this.cache.set(key, {
        data: resolved,
        status: resolved !== undefined ? "success" : "idle",
        updatedAt: resolved !== undefined ? Date.now() : undefined,
      });
    }
    return this.cache.get(key) as QueryState<T>;
  }

  set<T>(key: string, updater: (prev: QueryState<T>) => QueryState<T>) {
    const prev = this.cache.get(key) as QueryState<T> | undefined;
    const next = updater(prev ?? { status: "idle" });
    this.cache.set(key, next);
    this.notify(key);
  }
}

export class QueryClient {
  private cache = new QueryCache();

  private keyToString(key: QueryKey) {
    return JSON.stringify(key);
  }

  getQueryState<T>(key: QueryKey, initialData?: InitialData<T>) {
    return this.cache.get<T>(this.keyToString(key), initialData);
  }

  subscribe(key: QueryKey, listener: () => void) {
    return this.cache.subscribe(this.keyToString(key), listener);
  }

  private updateState<T>(key: QueryKey, updater: (prev: QueryState<T>) => QueryState<T>) {
    this.cache.set<T>(this.keyToString(key), updater);
  }

  async executeQuery<T>(
    key: QueryKey,
    queryFn: () => Promise<T>,
    options: { staleTime?: number; initialData?: InitialData<T>; force?: boolean }
  ) {
    const state = this.getQueryState<T>(key, options.initialData);
    const now = Date.now();
    if (
      !options.force &&
      state.status === "success" &&
      state.updatedAt &&
      options.staleTime !== undefined &&
      now - state.updatedAt < options.staleTime
    ) {
      return state.data;
    }

    if (state.promise) return state.promise;

    const promise = queryFn()
      .then((data) => {
        this.updateState<T>(key, (prev) => ({
          ...prev,
          data,
          error: undefined,
          status: "success",
          promise: undefined,
          updatedAt: Date.now(),
        }));
        return data;
      })
      .catch((error) => {
        this.updateState<T>(key, (prev) => ({
          ...prev,
          error,
          status: "error",
          promise: undefined,
        }));
        throw error;
      });

    this.updateState<T>(key, (prev) => ({
      ...prev,
      status: "pending",
      error: undefined,
      promise,
    }));

    return promise;
  }

  async refetchQueries<T>(key: QueryKey, queryFn: () => Promise<T>) {
    return this.executeQuery<T>(key, queryFn, { force: true });
  }
}

export const QueryClientProvider = ({
  children,
  client,
}: {
  children: ReactNode;
  client: QueryClient;
}) => {
  return (
    <QueryClientContext.Provider value={client}>
      {children}
    </QueryClientContext.Provider>
  );
};
