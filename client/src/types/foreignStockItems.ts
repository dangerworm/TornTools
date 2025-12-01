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

export const isForeignStockItemProfitable = (item: ForeignStockItem): boolean => {
  return (
    item.cost !== undefined &&
    item.item.isTradable && 
    item.item.valueMarketPrice !== undefined &&
    item.item.valueMarketPrice > item.cost
  );
}