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
  if (data.info.access.level > 1) {
    throw new Error(`API key access level too high: ${accessLevelMap[data.info.access.level]} (${data.info.access.level})`);
  }
  if (data.info.access.type === "Custom") {
    throw new Error("Only public API keys are supported");
  }
  
  return data.info;
}