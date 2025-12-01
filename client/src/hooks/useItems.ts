import { createContext, useContext } from "react";
import type { Item, ItemsMap } from "../types/items";

export interface ItemsContextModel {
  items: Item[];
  itemsById: ItemsMap;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const ItemsContext = createContext<ItemsContextModel | null>(null);

export const useItems = () => {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error("useItemsContext must be used inside ItemsProvider");
  }
  return context;
};
