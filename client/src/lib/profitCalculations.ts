import type { PurchaseOutlet, SaleOutlet } from '../types/markets';
import type { ProfitableListing } from '../types/profitableListings';

export const SALE_TAX: Record<SaleOutlet, number> = {
  city: 0,
  bazaar: 0,
  market: 0.05,
  anonymousMarket: 0.15,
};

export interface BuyPriceRange {
  min: number;
  max: number;
}

export function getBuyPriceRange(
  listing: ProfitableListing,
  purchaseOutlet: PurchaseOutlet,
  saleOutlet: SaleOutlet,
): BuyPriceRange | null {
  switch (purchaseOutlet) {
    case 'city':
      return listing.cityBuyPrice != null
        ? { min: listing.cityBuyPrice, max: listing.cityBuyPrice }
        : null;
    case 'market':
      switch (saleOutlet) {
        case 'city':
          return listing.tornCityMinPrice != null
            ? { min: listing.tornCityMinPrice, max: listing.tornCityMaxPrice! }
            : null;
        case 'bazaar':
          return listing.tornBazaarMinPrice != null
            ? { min: listing.tornBazaarMinPrice, max: listing.tornBazaarMaxPrice! }
            : null;
        default: return null;
      }
    case 'bazaar':
      switch (saleOutlet) {
        case 'city':
          return listing.weav3rCityMinPrice != null
            ? { min: listing.weav3rCityMinPrice, max: listing.weav3rCityMaxPrice! }
            : null;
        case 'market':
          return listing.weav3rMarketMinPrice != null
            ? { min: listing.weav3rMarketMinPrice, max: listing.weav3rMarketMaxPrice! }
            : null;
        case 'anonymousMarket':
          return listing.weav3rAnonMinPrice != null
            ? { min: listing.weav3rAnonMinPrice, max: listing.weav3rAnonMaxPrice! }
            : null;
        default: return null;
      }
  }
}

export function getSellRevenue(listing: ProfitableListing, outlet: SaleOutlet): number | null {
  switch (outlet) {
    case 'city': return listing.citySellPrice;
    case 'bazaar': return listing.weav3rGlobalMinPrice;
    case 'market': return listing.marketPrice !== null ? Math.floor(listing.marketPrice * (1 - SALE_TAX.market)) : null;
    case 'anonymousMarket': return listing.marketPrice !== null ? Math.floor(listing.marketPrice * (1 - SALE_TAX.anonymousMarket)) : null;
  }
}

export function getTotalProfit(
  listing: ProfitableListing,
  purchaseOutlet: PurchaseOutlet,
  saleOutlet: SaleOutlet,
): number | null {
  switch (purchaseOutlet) {
    case 'city': {
      if (!listing.isFoundInCity || listing.cityBuyPrice == null) return null;
      const sellRevenue = getSellRevenue(listing, saleOutlet);
      if (sellRevenue == null) return null;
      return sellRevenue - listing.cityBuyPrice;
    }
    case 'market':
      switch (saleOutlet) {
        case 'city': return listing.tornCityTotalProfit ?? null;
        case 'bazaar': return listing.tornBazaarTotalProfit ?? null;
        default: return null;
      }
    case 'bazaar':
      switch (saleOutlet) {
        case 'city': return listing.weav3rCityTotalProfit ?? null;
        case 'market': return listing.weav3rMarketTotalProfit ?? null;
        case 'anonymousMarket': return listing.weav3rAnonTotalProfit ?? null;
        default: return null;
      }
  }
}

export function getQuantity(
  listing: ProfitableListing,
  purchaseOutlet: PurchaseOutlet,
  saleOutlet: SaleOutlet,
): number {
  switch (purchaseOutlet) {
    case 'city': return 1;
    case 'market':
      switch (saleOutlet) {
        case 'city': return listing.tornCityQuantity ?? 1;
        case 'bazaar': return listing.tornBazaarQuantity ?? 1;
        default: return 1;
      }
    case 'bazaar':
      switch (saleOutlet) {
        case 'city': return listing.weav3rCityQuantity ?? 1;
        case 'market': return listing.weav3rMarketQuantity ?? 1;
        case 'anonymousMarket': return listing.weav3rAnonQuantity ?? 1;
        default: return 1;
      }
  }
}

export function getLastUpdated(listing: ProfitableListing, outlet: PurchaseOutlet): Date | null {
  switch (outlet) {
    case 'city': return null;
    case 'bazaar': return listing.weav3rLastUpdated;
    case 'market': return listing.tornLastUpdated;
  }
}
