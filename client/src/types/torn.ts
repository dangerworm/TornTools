// Types shared with the /api/torn proxy responses. Previously lived in
// client/src/lib/tornapi.ts alongside direct fetch() helpers; the helpers
// are gone (the browser no longer talks to api.torn.com directly) and the
// types moved here.

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

export interface KeyAccess {
  level: number;
  type: string;
}

export interface KeyInfo {
  access: KeyAccess;
}

export interface TornKeyInfoPayload {
  info?: KeyInfo;
  error?: {
    code: number;
    error: string;
  };
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
