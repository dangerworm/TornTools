import { useQuery } from "./useQuery";
import type { Item } from "../types/items";
import { fetchProfitableListings } from "../lib/dotnetapi";
import type { ProfitableListing } from "../types/profitableListings";

export type RowStatus = "queued" | "fetching" | "cached" | "done" | "error";

interface Options {
  intervalMs?: number; // one call per interval (keeps us <100/min by default)
}

export const PROFITABLE_LISTINGS_QUERY_KEY = ["profitableListings"] as const;

export function useResaleScan(
  opts?: Options
) {
  const { intervalMs = 1000 } = opts || {};

  const query = useQuery<ProfitableListing[]>({
    queryKey: PROFITABLE_LISTINGS_QUERY_KEY,
    queryFn: async () => {
      const payload = await fetchProfitableListings();
      return payload;
    },
    refetchInterval: intervalMs,
    staleTime: intervalMs,
    initialData: [],
  });

  const error = query.error
    ? query.error instanceof Error
      ? query.error.message
      : "Failed to load listings"
    : null;

  return { rows: query.data ?? [], error };
}
