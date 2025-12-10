export interface Weav3rMarketplacePayload {
  item_id: number;
  item_name: string;
  market_price: number;
  bazaar_average: number;
  total_listings: string;
  listings: Weav3rMarketplaceListing[];
}

export interface Weav3rMarketplaceListing {
  item_id: number;
  player_id: number;
  player_name: string;
  quantity: number;
  price: number;
  content_updated: number;
  last_checked: number;
  content_updated_relative: string;
  last_checked_relative: string;
}