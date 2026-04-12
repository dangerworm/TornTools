import type { PurchaseOutlet, SaleOutlet } from '../types/markets';
import type { ProfitableListing } from '../types/profitableListings';

export const SALE_TAX: Record<SaleOutlet, number> = {
  city: 0,
  bazaar: 0,
  market: 0.05,
  anonymousMarket: 0.15,
};

export function getBuyPrice(listing: ProfitableListing, outlet: PurchaseOutlet): number | null {
  switch (outlet) {
    case 'city': return listing.isFoundInCity ? listing.cityBuyPrice : null;
    case 'bazaar': return listing.weav3rMinPrice;
    case 'market': return listing.tornMinPrice;
  }
}

export function getSellRevenue(listing: ProfitableListing, outlet: SaleOutlet): number | null {
  switch (outlet) {
    case 'city': return listing.citySellPrice;
    case 'bazaar': return listing.weav3rMinPrice;
    case 'market': return listing.marketPrice !== null ? Math.floor(listing.marketPrice * (1 - SALE_TAX.market)) : null;
    case 'anonymousMarket': return listing.marketPrice !== null ? Math.floor(listing.marketPrice * (1 - SALE_TAX.anonymousMarket)) : null;
  }
}

export function getProfit(
  listing: ProfitableListing,
  purchaseOutlet: PurchaseOutlet,
  saleOutlet: SaleOutlet,
): number | null {
  const buyPrice = getBuyPrice(listing, purchaseOutlet);
  const sellRevenue = getSellRevenue(listing, saleOutlet);
  if (buyPrice === null || sellRevenue === null) return null;
  return sellRevenue - buyPrice;
}

export function getQuantity(listing: ProfitableListing, outlet: PurchaseOutlet): number {
  switch (outlet) {
    case 'city': return 1;
    case 'bazaar': return listing.weav3rQuantity ?? 1;
    case 'market': return listing.tornQuantity ?? 1;
  }
}

export function getTotalProfit(
  listing: ProfitableListing,
  purchaseOutlet: PurchaseOutlet,
  saleOutlet: SaleOutlet,
): number | null {
  const profit = getProfit(listing, purchaseOutlet, saleOutlet);
  if (profit === null) return null;
  return profit * getQuantity(listing, purchaseOutlet);
}

export function getLastUpdated(listing: ProfitableListing, outlet: PurchaseOutlet): Date | null {
  switch (outlet) {
    case 'city': return null;
    case 'bazaar': return listing.weav3rLastUpdated;
    case 'market': return listing.tornLastUpdated;
  }
}
