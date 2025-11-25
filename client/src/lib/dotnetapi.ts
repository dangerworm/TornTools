import { API_BASE_URL } from "../constants/ApiConstants";
import type { Item } from "../types/items";
import type { ProfitableListing } from "../types/profitableListings";
import type { TornUserProfile } from "./tornapi";

export interface DotNetUserDetails {
  apiKey: string;
  apiKeyLastUsed: Date;
  id: number;
  name: string;
  level: number;
  gender: string;
  favouriteItems: number[];
}

const URL_ITEMS = `${API_BASE_URL}/GetItems`;
const URL_PROFITABLE_LISTINGS = `${API_BASE_URL}/GetProfitableListings`;
const URL_POST_TOGGLE_USER_FAVOURITE = `${API_BASE_URL}/PostToggleUserFavourite`;
const URL_POST_USER_DETAILS = `${API_BASE_URL}/PostUserDetails`;

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

export async function postUserDetails(
  apiKey: string,
  userProfile: TornUserProfile
): Promise<DotNetUserDetails | null> {
  const url = URL_POST_USER_DETAILS;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const content = {
    apiKey,
    userProfile,
  };
  const body = JSON.stringify(content);
  const res = await fetch(url, { method: "POST", headers, body });
  let data: DotNetUserDetails | null = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function postAddUserFavourite(
  userId: number,
  itemId: number
): Promise<DotNetUserDetails | null> {
  return await postToggleUserFavourite(userId, itemId, true);
}

export async function postRemoveUserFavourite(
  userId: number,
  itemId: number
): Promise<DotNetUserDetails | null> {
  return await postToggleUserFavourite(userId, itemId, false);
}

async function postToggleUserFavourite(
  userId: number,
  itemId: number,
  add: boolean
): Promise<DotNetUserDetails | null> {
  const url = URL_POST_TOGGLE_USER_FAVOURITE;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const content = {
    userId,
    itemId,
    add
  };
  const body = JSON.stringify(content);
  const res = await fetch(url, { method: "POST", headers, body });
  let data: DotNetUserDetails | null = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

