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

const COMMENT = "dangerworm%27s%20Torn%20Tools";

const URL_ITEMS = `https://api.torn.com/v2/torn/items?comment=${COMMENT}`;
const URL_ITEMMARKET = `https://api.torn.com/v2/market/{id}/itemmarket?comment=${COMMENT}`;

export async function fetchItems(
  apiKey: string
): Promise<TornItemsPayload> {
  const url = URL_ITEMS;
  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `ApiKey ${apiKey}`
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

export async function fetchItemMarket(
  apiKey: string,
  itemId: number,
  limit = 20,
  offset = 0
): Promise<TornItemMarketPayload> {
  const url = URL_ITEMMARKET.replace("{id}", String(itemId));
  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `ApiKey ${apiKey}`
  };
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const res = await fetch(`${url}?${params.toString()}`, { headers });
  let data: TornItemMarketPayload = {};
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  if (data.error || (typeof data.code === "number" && data.code !== 200)) {
    throw new Error(`API error for item ${itemId}: ${JSON.stringify(data)}`);
  }
  return data;
}
