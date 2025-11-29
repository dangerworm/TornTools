import { BAZAAR_SOURCE_URL } from "../constants/ApiConstants";
import type { BazaarListingSubmission } from "../types/bazaar";
import { postBazaarListings } from "./dotnetapi";

function normalizeListing(
  listing: Record<string, unknown>,
  index: number
): BazaarListingSubmission | null {
  const itemId =
    (listing["itemId"] as number | undefined) ??
    (listing["item_id"] as number | undefined) ??
    (listing["id"] as number | undefined);

  const price =
    (listing["price"] as number | undefined) ??
    (listing["cost"] as number | undefined);

  if (!Number.isFinite(itemId) || !Number.isFinite(price)) {
    return null;
  }

  const quantity = (listing["quantity"] as number | undefined) ??
    (listing["qty"] as number | undefined) ??
    1;

  const playerId =
    (listing["playerId"] as number | undefined) ??
    (listing["sellerId"] as number | undefined) ??
    (listing["seller_id"] as number | undefined);

  const listingPosition =
    (listing["listingPosition"] as number | undefined) ??
    (listing["position"] as number | undefined) ??
    index;

  const timeSeen =
    (listing["timeSeen"] as string | undefined) ??
    (listing["time_seen"] as string | undefined) ??
    (listing["timestamp"] as string | undefined) ??
    (listing["seen_at"] as string | undefined);

  return {
    itemId: Number(itemId),
    price: Number(price),
    quantity: Number(quantity ?? 1),
    listingPosition: listingPosition !== undefined ? Number(listingPosition) : undefined,
    playerId: playerId !== undefined ? Number(playerId) : undefined,
    timeSeen: timeSeen ? new Date(timeSeen) : undefined,
  };
}

function normalizeListings(rawListings: unknown): BazaarListingSubmission[] {
  const listingsArray = Array.isArray(rawListings)
    ? rawListings
    : (rawListings as Record<string, unknown> | null)?.listings ??
      (rawListings as Record<string, unknown> | null)?.bazaar ??
      [];

  if (!Array.isArray(listingsArray)) {
    return [];
  }

  return listingsArray
    .map((entry, index) => normalizeListing(entry as Record<string, unknown>, index))
    .filter((entry): entry is BazaarListingSubmission => entry !== null);
}

export async function collectAndSubmitBazaarListings(): Promise<number> {
  if (!BAZAAR_SOURCE_URL) {
    return 0;
  }

  const response = await fetch(BAZAAR_SOURCE_URL, { credentials: "include" });

  if (!response.ok) {
    throw new Error(`Failed to fetch bazaar listings (HTTP ${response.status}).`);
  }

  const payload = await response.json();
  const listings = normalizeListings(payload);

  if (listings.length === 0) {
    return 0;
  }

  await postBazaarListings(listings);
  return listings.length;
}

export function hasBrowserBazaarSource(): boolean {
  return Boolean(BAZAAR_SOURCE_URL);
}
