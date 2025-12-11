import { WEAV3R_API_BASE_URL } from "../constants/apiConstants";
import type { Weav3rMarketplacePayload } from "../types/weav3r";

const URL_MARKETPLACE = `${WEAV3R_API_BASE_URL}/marketplace`;

export async function fetchMarketplace(itemId: number): Promise<Weav3rMarketplacePayload | null> {
  const url = `${URL_MARKETPLACE}/${itemId}`;
  const headers: Record<string, string> = {
    "accept": "application/json",
    "accept-encoding": "gzip,deflate,br",
    "connection": "keep-alive",
    "user-agent": "vite/dwtt"
  };

  const res = await fetch(url, { headers });
  let data: Weav3rMarketplacePayload | null = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

