
export interface ProfitableListingResponse {
  itemId: number;
  name: string;
  minPrice: number;
  maxPrice: number;
  quantity: number;
  totalCost: number;
  cityPrice: number;
  marketPrice: number;
  lastUpdated: Date;
}

export interface ProfitableListing {
  itemId: number;
  name: string;
  minPrice: number;
  maxPrice: number;
  quantity: number;
  totalCost: number;
  cityPrice: number;
  marketPrice: number;
  cityProfit: number;
  marketProfit: (tax: number) => number;
  lastUpdated: Date;
}

export type ProfitableListingsMap = Record<number, ProfitableListing>;
