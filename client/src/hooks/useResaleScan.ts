import { useEffect, useRef, useState } from "react";
import { fetchProfitableListings } from "../lib/dotnetapi";
import type { ProfitableListing } from "../types/profitableListings";

interface ResaleScanOptions {
  intervalMs?: number;
}

export function useResaleScan(opts?: ResaleScanOptions) {
  const { intervalMs = 5000 } = opts || {};

  const [rows, setRows] = useState<ProfitableListing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setError(null);

    const tick = async () => {
      fetchProfitableListings()
        .then((data: ProfitableListing[]) => {
          setRows(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          setError(err.message);
          setRows([]);
        });
    };

    timerRef.current = window.setInterval(tick, intervalMs);
    void tick();

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [intervalMs]);

  return { rows, error };
}
