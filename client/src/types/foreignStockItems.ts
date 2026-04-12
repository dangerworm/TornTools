import type { Item } from "./items";
import type { SaleOutlet } from "./markets";
import { SALE_TAX } from "../lib/profitCalculations";

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

export const isForeignStockItemProfitable = (item: ForeignStockItem, saleOutlet: SaleOutlet): boolean => {
  return (
    item.cost !== undefined &&
    item.item.isTradable &&
    item.item.valueMarketPrice !== undefined &&
    (item.item.valueMarketPrice * (1 - SALE_TAX[saleOutlet])) > item.cost
  );
}