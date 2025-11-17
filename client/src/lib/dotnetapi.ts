import { API_BASE_URL } from "../constants/ApiConstants";
import type { Item } from "../types/items";
import type { ProfitableListing } from "../types/profitableListings";

const URL_ITEMS = `${API_BASE_URL}/GetItems`;
const URL_PROFITABLE_LISTINGS = `${API_BASE_URL}/GetProfitableListings`;

export async function fetchItems(): Promise<Item[]> {
  const url = URL_ITEMS;
  const headers: Record<string, string> = {
    accept: "application/json"
  };
  const res = await fetch(url, { headers });
  let data: Item[] = [];
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function fetchProfitableListings(): Promise<ProfitableListing[]> {
  const url = URL_PROFITABLE_LISTINGS;
  const headers: Record<string, string> = {
    accept: "application/json"
  };
  const res = await fetch(url, { headers });
  let data: ProfitableListing[] = [];
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}
