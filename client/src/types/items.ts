
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

export const isItemProfitable = (item: Item): boolean => {
  return (
    item.isTradable &&  
    !!item.valueBuyPrice &&
    !!item.valueMarketPrice &&
    item.valueMarketPrice > item.valueBuyPrice
  );
}