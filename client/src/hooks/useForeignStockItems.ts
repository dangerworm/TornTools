import { createContext, useContext } from "react";
import type { ForeignStockItem, ForeignStockItemsMap } from "../types/foreignStockItems";

interface ForeignStockItemsContextModel {
  items: ForeignStockItem[];
  itemsById: ForeignStockItemsMap;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const ForeignStockItemsContext = createContext<ForeignStockItemsContextModel | null>(null);

export const useForeignStockItems = () => {
  const context = useContext(ForeignStockItemsContext);
  if (!context) {
    throw new Error("useForeignStockItems must be used inside ForeignStockItemsProvider");
  }
  return context;
};
