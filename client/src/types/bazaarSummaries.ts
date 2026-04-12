export interface BazaarSummary {
  itemId: number;
  minPrice: number;
  quantity: number;
  lastUpdated: string;
}

export type BazaarSummariesMap = Record<number, BazaarSummary>;
