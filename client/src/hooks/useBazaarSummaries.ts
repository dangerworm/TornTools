import { createContext, useContext } from "react";
import type { BazaarSummariesMap } from "../types/bazaarSummaries";

export interface BazaarSummariesContextModel {
  summaries: BazaarSummariesMap;
  loading: boolean;
  error: string | null;
}

export const BazaarSummariesContext = createContext<BazaarSummariesContextModel | null>(null);

export const useBazaarSummaries = () => {
  const context = useContext(BazaarSummariesContext);
  if (!context) {
    throw new Error("useBazaarSummaries must be used inside BazaarSummariesProvider");
  }
  return context;
};
