import { useQuery } from "../lib/react-query";
import type { Item } from "../types/items";
import { fetchProfitableListings } from "../lib/dotnetapi";
import type { ProfitableListing } from "../types/profitableListings";

export type RowStatus = "queued" | "fetching" | "cached" | "done" | "error";

interface Options {
  intervalMs?: number; // one call per interval (keeps us <100/min by default)
}

export function useResaleScan(
  items: Item[] | null,
  opts?: Options
) {
  const { intervalMs = 1000 } = opts || {};

  const query = useQuery<ProfitableListing[]>({
    queryKey: ["profitableListings"],
    queryFn: fetchProfitableListings,
    enabled: Boolean(items && items.length),
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
