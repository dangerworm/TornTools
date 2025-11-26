import type { Item } from "./items";

export interface ForeignStockItem {
  itemId: number;
  item: Item;
  country: string;
  itemName: string;
  quantity: number;
  cost: number;
  lastUpdated: Date;
}

export type ForeignStockItemsMap = Record<string, ForeignStockItem>;
