
export interface ProfitableListing {
  itemId: number;
  name: string;
  minPrice: number;
  maxPrice: number;
  sellPrice: number;
  quantity: number;
  profit: number;
  lastUpdated: Date;
}

export type ProfitableListingsMap = Record<number, ProfitableListing>;
