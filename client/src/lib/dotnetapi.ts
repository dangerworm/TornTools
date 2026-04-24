import { API_BASE_URL } from '../constants/apiConstants'
import type { ForeignStockItem } from '../types/foreignStockItems'
import type { Item } from '../types/items'
import type { HistoryResult, HistoryWindow } from '../types/history'
import type { BazaarSummary } from '../types/bazaarSummaries'
import type { ProfitableListing } from '../types/profitableListings'
import type {
  KeyInfo,
  TornInventoryPayload,
  TornUserBasicPayload,
  TornUserProfile,
} from '../types/torn'

export interface DotNetUserDetails {
  id: number
  name: string
  level: number
  accessLevel: number
  gender: string
  favouriteItems: number[]
}

const URL_ITEMS = `${API_BASE_URL}/GetItems`
const URL_ITEM_VOLATILITY = `${API_BASE_URL}/items/volatility`
const URL_FOREIGN_STOCK_ITEMS = `${API_BASE_URL}/GetForeignStockItems`
const URL_PROFITABLE_LISTINGS = `${API_BASE_URL}/GetProfitableListings`
const URL_BAZAAR_SUMMARIES = `${API_BASE_URL}/GetBazaarSummaries`
const URL_POST_WEAV3R_LISTINGS = `${API_BASE_URL}/PostWeav3rListings`
const URL_POST_TOGGLE_USER_FAVOURITE = `${API_BASE_URL}/PostToggleUserFavourite`
const URL_ITEM_HISTORY_BASE = `${API_BASE_URL}/items`
const URL_AUTH_LOGIN = `${API_BASE_URL.replace(/\/api$/, '')}/auth/login`
const URL_AUTH_ME = `${API_BASE_URL.replace(/\/api$/, '')}/auth/me`
const URL_AUTH_LOGOUT = `${API_BASE_URL.replace(/\/api$/, '')}/auth/logout`
const URL_TORN_USER_BASIC = `${API_BASE_URL}/torn/user/basic`
const URL_TORN_USER_INVENTORY = `${API_BASE_URL}/torn/user/inventory`
const URL_TORN_KEY_VALIDATE = `${API_BASE_URL}/torn/key/validate`

export async function login(apiKey: string): Promise<DotNetUserDetails | null> {
  const res = await fetch(URL_AUTH_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
    credentials: 'include',
  })
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`)
  return res.json()
}

export async function getMe(): Promise<DotNetUserDetails | null> {
  const res = await fetch(URL_AUTH_ME, {
    credentials: 'include',
  })
  if (res.status === 401 || res.status === 404) return null
  if (!res.ok) throw new Error(`getMe failed: HTTP ${res.status}`)
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch(URL_AUTH_LOGOUT, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch(URL_ITEMS, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export type HistorySource = 'Torn' | 'Weav3r'

export async function fetchItemPriceHistory(
  itemId: number,
  window: HistoryWindow,
  source: HistorySource = 'Torn',
): Promise<HistoryResult[]> {
  const url = `${URL_ITEM_HISTORY_BASE}/${itemId}/history/price?window=${encodeURIComponent(window)}&source=${source}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchItemVelocityHistory(
  itemId: number,
  window: HistoryWindow,
  source: HistorySource = 'Torn',
): Promise<HistoryResult[]> {
  const url = `${URL_ITEM_HISTORY_BASE}/${itemId}/history/velocity?window=${encodeURIComponent(window)}&source=${source}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export type VolatilitySortKey = 'changes_1d' | 'changes_1w' | 'price_change_1d' | 'price_change_1w'

export interface ItemVolatilityStats {
  itemId: number
  source: string
  computedAt: string
  changes1d: number
  changes1w: number
  currentPrice: number | null
  priceChange1d: number | null
  priceChange1w: number | null
}

export async function fetchTopVolatileItems(params: {
  source?: 'Torn' | 'Weav3r'
  sort?: VolatilitySortKey
  limit?: number
  ascending?: boolean
}): Promise<ItemVolatilityStats[]> {
  const qs = new URLSearchParams()
  if (params.source) qs.set('source', params.source)
  if (params.sort) qs.set('sort', params.sort)
  if (params.limit != null) qs.set('limit', String(params.limit))
  if (params.ascending != null) qs.set('ascending', String(params.ascending))
  const url = `${URL_ITEM_VOLATILITY}?${qs.toString()}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchForeignStockItems(): Promise<ForeignStockItem[]> {
  const res = await fetch(URL_FOREIGN_STOCK_ITEMS, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function postWeav3rListings(
  itemId: number,
  listings: Array<{ playerId: number; quantity: number; price: number }>,
): Promise<void> {
  await fetch(URL_POST_WEAV3R_LISTINGS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, listings }),
  })
}

export async function fetchBazaarSummaries(): Promise<BazaarSummary[]> {
  const res = await fetch(URL_BAZAAR_SUMMARIES, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchProfitableListings(): Promise<ProfitableListing[]> {
  const res = await fetch(URL_PROFITABLE_LISTINGS, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function postAddUserFavourite(
  userId: number,
  itemId: number,
): Promise<DotNetUserDetails | null> {
  return await postToggleUserFavourite(userId, itemId, true)
}

export async function postRemoveUserFavourite(
  userId: number,
  itemId: number,
): Promise<DotNetUserDetails | null> {
  return await postToggleUserFavourite(userId, itemId, false)
}

// Server-side proxy for Torn API calls the browser used to make directly.
// The authenticated session cookie is enough — the backend resolves the
// user's decrypted key per call. /key/validate is the only path that still
// takes a plaintext key from the browser, used during sign-in preview.

export async function proxyTornUserBasic(signal?: AbortSignal): Promise<TornUserBasicPayload> {
  const res = await fetch(URL_TORN_USER_BASIC, {
    credentials: 'include',
    headers: { accept: 'application/json' },
    signal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function proxyTornUserInventory(
  cat: string,
  signal?: AbortSignal,
): Promise<TornInventoryPayload> {
  const url = `${URL_TORN_USER_INVENTORY}?cat=${encodeURIComponent(cat)}`
  const res = await fetch(url, {
    credentials: 'include',
    headers: { accept: 'application/json' },
    signal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export interface ValidatedKey {
  info: KeyInfo
  profile: TornUserProfile
}

export async function proxyTornKeyValidate(
  apiKey: string,
  signal?: AbortSignal,
): Promise<ValidatedKey> {
  const res = await fetch(URL_TORN_KEY_VALIDATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ apiKey }),
    signal,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const payload: {
    info?: KeyInfo
    profile?: TornUserProfile
    error?: { code: number; error: string }
  } = await res.json()
  if (payload.error) {
    throw new Error(payload.error.error)
  }
  if (!payload.info || !payload.profile) {
    throw new Error('Key validation returned an incomplete payload')
  }
  return { info: payload.info, profile: payload.profile }
}

async function postToggleUserFavourite(
  userId: number,
  itemId: number,
  add: boolean,
): Promise<DotNetUserDetails | null> {
  const res = await fetch(URL_POST_TOGGLE_USER_FAVOURITE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, itemId, add }),
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
