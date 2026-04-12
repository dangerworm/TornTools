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

export type SortableForeignStockItem = ForeignStockItem & {
  itemType: string | undefined
  sellPrice: number | null
  profit: number | null
}

export type ForeignStockItemsMap = Record<string, ForeignStockItem>;

export const isForeignStockItemProfitable = (
  item: ForeignStockItem,
  saleOutlet: SaleOutlet,
  bazaarMinPrice?: number | null,
): boolean => {
  if (!item.cost || !item.item.isTradable) return false

  if (saleOutlet === 'bazaar') {
    return bazaarMinPrice != null && bazaarMinPrice > item.cost
  }

  return (
    item.item.valueMarketPrice !== undefined &&
    Math.floor(item.item.valueMarketPrice * (1 - SALE_TAX[saleOutlet])) > item.cost
  )
}