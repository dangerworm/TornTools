import { API_BASE_URL } from "../constants/apiConstants";
import type { ForeignStockItem } from "../types/foreignStockItems";
import type { Item } from "../types/items";
import type { HistoryResult, HistoryWindow } from "../types/history";
import type { BazaarSummary } from "../types/bazaarSummaries";
import type { ProfitableListing } from "../types/profitableListings";
import type { ThemeDefinition, ThemeInput } from "../types/themes";

export interface DotNetUserDetails {
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
const URL_BAZAAR_SUMMARIES = `${API_BASE_URL}/GetBazaarSummaries`;
const URL_POST_TOGGLE_USER_FAVOURITE = `${API_BASE_URL}/PostToggleUserFavourite`;
const URL_GET_THEMES = `${API_BASE_URL}/GetThemes`;
const URL_POST_THEME = `${API_BASE_URL}/PostTheme`;
const URL_POST_USER_THEME_SELECTION = `${API_BASE_URL}/PostUserThemeSelection`;
const URL_ITEM_HISTORY_BASE = `${API_BASE_URL}/items`;
const URL_AUTH_LOGIN = `${API_BASE_URL.replace(/\/api$/, '')}/auth/login`;
const URL_AUTH_ME = `${API_BASE_URL.replace(/\/api$/, '')}/auth/me`;
const URL_AUTH_LOGOUT = `${API_BASE_URL.replace(/\/api$/, '')}/auth/logout`;

export async function login(apiKey: string): Promise<DotNetUserDetails | null> {
  const res = await fetch(URL_AUTH_LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`);
  return res.json();
}

export async function getMe(): Promise<DotNetUserDetails | null> {
  const res = await fetch(URL_AUTH_ME, {
    credentials: "include",
  });
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(`getMe failed: HTTP ${res.status}`);
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(URL_AUTH_LOGOUT, {
    method: "POST",
    credentials: "include",
  });
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(URL_ITEMS, { headers: { accept: "application/json" } });
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
  const res = await fetch(url, { headers: { accept: "application/json" } });
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
  const res = await fetch(url, { headers: { accept: "application/json" } });
  let data: HistoryResult[] = [];
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function fetchForeignStockItems(): Promise<ForeignStockItem[]> {
  const res = await fetch(URL_FOREIGN_STOCK_ITEMS, { headers: { accept: "application/json" } });
  let data: ForeignStockItem[] = [];
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function fetchBazaarSummaries(): Promise<BazaarSummary[]> {
  const res = await fetch(URL_BAZAAR_SUMMARIES, { headers: { accept: "application/json" } });
  let data: BazaarSummary[] = [];
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}

export async function fetchProfitableListings(): Promise<ProfitableListing[]> {
  const res = await fetch(URL_PROFITABLE_LISTINGS, { headers: { accept: "application/json" } });
  let data: ProfitableListing[] = [];
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
  const res = await fetch(URL_POST_TOGGLE_USER_FAVOURITE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, itemId, add }),
    credentials: "include",
  });
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
  const res = await fetch(url, { headers: { accept: "application/json" } });
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
  const res = await fetch(URL_POST_THEME, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(themeInput),
    credentials: "include",
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
  const res = await fetch(URL_POST_USER_THEME_SELECTION, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, themeId }),
    credentials: "include",
  });
  let data: DotNetUserDetails | null = null;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  return data;
}
