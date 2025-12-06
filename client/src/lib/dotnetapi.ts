import { API_BASE_URL } from "../constants/ApiConstants";
import type { ForeignStockItem } from "../types/foreignStockItems";
import type { Item } from "../types/items";
import type { HistoryResult, HistoryWindow, ItemHistoryPoint } from "../types/history";
import type { ProfitableListing } from "../types/profitableListings";
import type { ThemeDefinition, ThemeInput } from "../types/themes";
import type { TornUserProfile } from "./tornapi";

export interface DotNetUserDetails {
  apiKey: string;
  apiKeyLastUsed: Date;
  id: number;
  name: string;
  level: number;
  gender: string;
  favouriteItems: number[];
  preferredThemeId?: number | null;
  preferredTheme?: ThemeDefinition | null;
}

const URL_ITEMS = `${API_BASE_URL}/GetItems`;
const URL_FOREIGN_STOCK_ITEMS = `${API_BASE_URL}/GetForeignStockItems`;
const URL_PROFITABLE_LISTINGS = `${API_BASE_URL}/GetProfitableListings`;
const URL_POST_TOGGLE_USER_FAVOURITE = `${API_BASE_URL}/PostToggleUserFavourite`;
const URL_POST_USER_DETAILS = `${API_BASE_URL}/PostUserDetails`;
const URL_GET_THEMES = `${API_BASE_URL}/GetThemes`;
const URL_POST_THEME = `${API_BASE_URL}/PostTheme`;
const URL_POST_USER_THEME_SELECTION = `${API_BASE_URL}/PostUserThemeSelection`;
const URL_ITEM_HISTORY_BASE = `${API_BASE_URL}/items`;

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

export async function fetchItemPriceHistory(
  itemId: number,
  window: HistoryWindow
): Promise<HistoryResult[]> {
  const url = `${URL_ITEM_HISTORY_BASE}/${itemId}/history/price?window=${encodeURIComponent(window)}`;
  const headers: Record<string, string> = {
    accept: "application/json",
  };

  const res = await fetch(url, { headers });
  let data: HistoryResult[] = [];
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function fetchItemVelocityHistory(
  itemId: number,
  window: HistoryWindow
): Promise<HistoryResult[]> {
  const url = `${URL_ITEM_HISTORY_BASE}/${itemId}/history/velocity?window=${encodeURIComponent(window)}`;
  const headers: Record<string, string> = {
    accept: "application/json",
  };

  const res = await fetch(url, { headers });
  let data: HistoryResult[] = [];
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function fetchForeignStockItems(): Promise<ForeignStockItem[]> {
  const url = URL_FOREIGN_STOCK_ITEMS;
  const headers: Record<string, string> = {
    accept: "application/json"
  };
  const res = await fetch(url, { headers });
  let data: ForeignStockItem[] = [];
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

export async function fetchThemes(
  userId?: number | null
): Promise<ThemeDefinition[]> {
  const url = userId
    ? `${URL_GET_THEMES}?userId=${encodeURIComponent(userId)}`
    : URL_GET_THEMES;
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  const res = await fetch(url, { headers });
  let data: ThemeDefinition[] = [];
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function postThemeDefinition(
  themeInput: ThemeInput
): Promise<ThemeDefinition | null> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const res = await fetch(URL_POST_THEME, {
    method: "POST",
    headers,
    body: JSON.stringify(themeInput),
  });

  let data: ThemeDefinition | null = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function postUserThemeSelection(
  userId: number,
  themeId: number | null
): Promise<DotNetUserDetails | null> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({ userId, themeId });
  const res = await fetch(URL_POST_USER_THEME_SELECTION, {
    method: "POST",
    headers,
    body,
  });

  let data: DotNetUserDetails | null = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

