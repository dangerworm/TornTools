import type { Item } from "../types/items";

export interface TornItemsPayload {
  items?: Item[]
  error?: unknown;
  code?: number;
}

export interface TornListing {
  price: number;
  amount: number;
}

export interface TornItemMarketPayload {
  item?: { id: number; name: string; type?: string; average_price?: number };
  itemmarket?: { item?: unknown; listings?: TornListing[] };
  error?: unknown;
  code?: number;
}

const URL_ITEMS = `https://localhost:7012/api/GetItems`;

export async function fetchItems(): Promise<TornItemsPayload> {
  const url = URL_ITEMS;
  const headers: Record<string, string> = {
    accept: "application/json"
  };
  const res = await fetch(url, { headers });
  let data: TornItemsPayload = {};
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  if (data.error || (typeof data.code === "number" && data.code !== 200)) {
    throw new Error(`API error fetching items}: ${JSON.stringify(data)}`);
  }
  return data;
}
