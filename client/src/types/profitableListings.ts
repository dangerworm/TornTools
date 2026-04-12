export interface ProfitableListing {
  itemId: number;
  name: string;
  isFoundInCity: boolean;
  cityBuyPrice: number | null;
  citySellPrice: number | null;
  marketPrice: number | null;

  tornCityMinPrice: number | null;
  tornCityMaxPrice: number | null;
  tornCityQuantity: number | null;
  tornCityTotalProfit: number | null;

  tornBazaarMinPrice: number | null;
  tornBazaarMaxPrice: number | null;
  tornBazaarQuantity: number | null;
  tornBazaarTotalProfit: number | null;

  tornLastUpdated: Date | null;

  weav3rGlobalMinPrice: number | null;

  weav3rCityMinPrice: number | null;
  weav3rCityMaxPrice: number | null;
  weav3rCityQuantity: number | null;
  weav3rCityTotalProfit: number | null;

  weav3rMarketMinPrice: number | null;
  weav3rMarketMaxPrice: number | null;
  weav3rMarketQuantity: number | null;
  weav3rMarketTotalProfit: number | null;

  weav3rAnonMinPrice: number | null;
  weav3rAnonMaxPrice: number | null;
  weav3rAnonQuantity: number | null;
  weav3rAnonTotalProfit: number | null;

  weav3rLastUpdated: Date | null;
}
