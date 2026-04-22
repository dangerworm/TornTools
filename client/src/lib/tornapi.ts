export interface TornUserBasicPayload {
  profile?: TornUserProfile;
  error?: {
    code: number;
    error: string;
  };
  code?: number;
}

export interface TornUserProfile {
  id: number;
  name: string;
  level: number;
  gender: string;
  status: {
    description: string;
    details: string | null;
    state: string;
    color: string;
    until: string | null;
    travel_type: string;
    plane_image_type: string;
  };
}

export interface TornKeyInfoPayload {
  info?: KeyInfo
  error?: {
    code: number;
    error: string;
  };
}

export interface KeyInfo {
  access: KeyAccess
}

export interface KeyAccess {
  level: number;
  type: string;
}

const accessLevelMap: Record<number, string> = {
  1: "Public Only",
  2: "Minimal Access",
  3: "Limited Access",
  4: "Full Access",
};

const TORN_API_ENDPOINT_USER_BASIC = "https://api.torn.com/v2/user/basic";
const TORN_API_ENDPOINT_KEY_INFO = "https://api.torn.com/v2/key/info";
const TORN_API_ENDPOINT_USER_INVENTORY = "https://api.torn.com/v2/user/inventory";

export async function fetchTornUserDetails(
  apiKey: string,
  signal?: AbortSignal
): Promise<TornUserBasicPayload> {
  const url = TORN_API_ENDPOINT_USER_BASIC;
  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `ApiKey ${apiKey}`
  };
  const params = new URLSearchParams({ stripTags: "false", comment: "dangerworm's Tools" });
  const res = await fetch(`${url}?${params.toString()}`, { headers, signal });
  let data: TornUserBasicPayload = {};
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  if (data.error || (typeof data.code === "number" && data.code !== 200)) {
    throw new Error(`API error for basic user details with API key ${apiKey}: ${JSON.stringify(data.error!.error)}`);
  }
  return data;
}

export async function fetchTornKeyInfo(
  apiKey: string,
  signal?: AbortSignal
): Promise<KeyInfo> {
  const url = TORN_API_ENDPOINT_KEY_INFO;
  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `ApiKey ${apiKey}`
  };
  const params = new URLSearchParams({ comment: "dangerworm's Tools" });
  const res = await fetch(`${url}?${params.toString()}`, { headers, signal });
  let data: TornKeyInfoPayload = {};
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  }
  if (data.error) {
    throw new Error(`API error for basic user details with API key ${apiKey}: ${JSON.stringify(data.error!.error)}`);
  }
  if (!data.info) {
    throw new Error("No key info returned from Torn API");
  }
  if (data.info.access.level < 1 || data.info.access.level > 4) {
    throw new Error(`Unsupported API key access level: ${accessLevelMap[data.info.access.level] ?? data.info.access.level} (${data.info.access.level})`);
  }
  if (data.info.access.type === "Custom") {
    throw new Error("Custom API keys are not supported. Please use a Public, Minimal, Limited, or Full key.");
  }

  return data.info;
}

export interface TornInventoryItem {
  id: number;
  amount: number;
  equipped: boolean;
  faction_owned: boolean;
  name: string;
  uid: number;
}

export interface TornInventoryPayload {
  inventory?: {
    items: TornInventoryItem[];
    timestamp: number;
  };
  _metadata?: {
    links: { next: string | null; prev: string | null };
    total: number;
  };
  error?: { code: number; error: string };
  code?: number;
}

export async function fetchTornInventory(
  apiKey: string,
  cat: string,
  signal?: AbortSignal
): Promise<TornInventoryPayload> {
  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `ApiKey ${apiKey}`
  };

  const allItems: TornInventoryItem[] = [];
  let nextUrl: string | null = `${TORN_API_ENDPOINT_USER_INVENTORY}?${new URLSearchParams({
    cat,
    offset: "0",
    limit: "250",
    comment: "dangerworm's Tools",
  }).toString()}`;
  let lastPayload: TornInventoryPayload = {};

  while (nextUrl) {
    const res = await fetch(nextUrl, { headers, signal });
    let data: TornInventoryPayload = {};
    try {
      data = await res.json();
    } catch {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
    if (data.error) {
      throw new Error(`Torn inventory API error (${cat}): ${data.error.error}`);
    }
    allItems.push(...(data.inventory?.items ?? []));
    lastPayload = data;
    nextUrl = data._metadata?.links.next ?? null;
  }

  return {
    ...lastPayload,
    inventory: lastPayload.inventory
      ? { ...lastPayload.inventory, items: allItems }
      : undefined,
  };
}