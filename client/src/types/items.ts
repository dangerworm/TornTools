import type { SaleOutlet } from "./markets";
import type { Weav3rMarketplaceListing } from "./weav3r";
import { SALE_TAX } from "../lib/profitCalculations";

export interface Item {
  id: number;
  name: string;
  description?: string;
  effect?: string;
  requirement?: string;
  image?: string;
  type?: string;  
  subType?: string;
  isMasked: boolean;
  isTradable: boolean;
  isFoundInCity: boolean;
  valueVendorCountry?: string;
  valueVendorName?: string;
  valueBuyPrice?: number;
  valueSellPrice?: number;
  valueMarketPrice?: number;
  circulation?: number;
  detailsCategory?: string;
  detailsStealthLevel?: number;
  detailsBaseStatsDamage?: number;
  detailsBaseStatsAccuracy?: number;
  detailsBaseStatsArmor?: number;
  detailsAmmoId?: number;
  detailsAmmoName?: string;
  detailsAmmoMagazineRounds?: number;
  detailsAmmoRateOfFireMinimum?: number;
  detailsAmmoRateOfFireMaximum?: number;
}

export type ItemsMap = Record<number, Item>;

export type SortableItem = Item & {
  sellPrice: number | null
  profit: number
  profitPerCost: number
}

export const isItemProfitableOnMarket = (item: Item, saleOutlet: SaleOutlet): boolean => {
  return (
    item.isTradable &&
    !!item.valueBuyPrice &&
    !!item.valueMarketPrice &&
    (item.valueMarketPrice * (1 - SALE_TAX[saleOutlet])) > item.valueBuyPrice
  );
}

export const isItemProfitableInBazaar = (item: Item, listing: Weav3rMarketplaceListing): boolean => {
  return (
    item.isTradable &&  
    !!item.valueBuyPrice &&
    !!listing.price &&
    listing.price > item.valueBuyPrice
  );
}