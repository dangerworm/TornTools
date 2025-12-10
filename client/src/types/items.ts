import type { Weav3rMarketplaceListing } from "./weav3r";

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
  profit: number | null
  profitPerCost: number | null
}

export const isItemProfitableOnMarket = (item: Item): boolean => {
  return (
    item.isTradable &&  
    !!item.valueBuyPrice &&
    !!item.valueMarketPrice &&
    item.valueMarketPrice > item.valueBuyPrice
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