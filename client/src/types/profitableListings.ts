export interface ProfitableListing {
  itemId: number;
  name: string;
  isFoundInCity: boolean;
  cityBuyPrice: number | null;
  citySellPrice: number | null;
  marketPrice: number | null;
  tornMinPrice: number | null;
  tornQuantity: number | null;
  tornLastUpdated: Date | null;
  weav3rMinPrice: number | null;
  weav3rQuantity: number | null;
  weav3rLastUpdated: Date | null;
}
