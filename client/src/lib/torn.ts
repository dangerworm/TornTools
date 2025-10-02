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

const BASE = "https://api.torn.com/v2/market/{id}/itemmarket";

export async function fetchItemmarket(
  apiKey: string,
  itemId: number,
  limit = 20,
  offset = 0
): Promise<TornItemMarketPayload> {
  const url = BASE.replace("{id}", String(itemId));
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
