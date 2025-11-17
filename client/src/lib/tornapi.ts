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

export interface TornUserBasicPayload {
  profile?: TornUserProfile;
  error?: {
    code: number;
    error: string;
  };
  code?: number;
}

const BASE = "https://api.torn.com/v2/user/basic";

export async function fetchUserDetails(
  apiKey: string,
  signal?: AbortSignal
): Promise<TornUserBasicPayload> {
  const url = BASE;
  const headers: Record<string, string> = {
    accept: "application/json",
    Authorization: `ApiKey ${apiKey}`
  };
  const params = new URLSearchParams({ stripTags: "false", comment: "dangerworm's Torn Tools" });
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
