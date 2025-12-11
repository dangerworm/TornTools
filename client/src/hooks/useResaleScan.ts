import { useEffect, useRef, useState } from "react";
import { fetchProfitableListings } from "../lib/dotnetapi";
import type { ProfitableListing, ProfitableListingResponse } from "../types/profitableListings";

export type RowStatus = "queued" | "fetching" | "cached" | "done" | "error";

interface ResaleScanOptions {
  intervalMs?: number; // one call per interval (keeps us <100/min by default)
}

export function useResaleScan(
  opts?: ResaleScanOptions
) {
  const { intervalMs = 5000 } = opts || {};

  const [rows, setRows] = useState<ProfitableListing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setError(null);

    const tick = async () => {
      fetchProfitableListings()
        .then((data: ProfitableListingResponse[]) => {
          const newRows = data.map(listing => ({
            ...listing,
            cityProfit: (listing.cityPrice * listing.quantity) - listing.totalCost,
            marketProfit: (tax: number) => (listing.marketPrice * listing.quantity * (1 - tax)) - listing.totalCost,
          } as ProfitableListing));
          setRows(newRows)
        })
        .catch(err => {
          setError(err.message);
          setRows([]);
        });
    };

    // Start interval
    timerRef.current = window.setInterval(tick, intervalMs);
    void tick();

    // Cleanup on unmount or when deps change
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

  }, [intervalMs]);

  return { rows, error };
}