export type HistoryWindow =
  | "1h"
  | "4h"
  | "1d"
  | "1w"
  | "1m"
  | "3m"
  | "1y";

export interface HistoryResult {
  timestamp: string;
  price?: number;
  velocity?: number;
}

export interface ItemHistoryPoint {
  timestamp: number;
  value: number;
}

export const HISTORY_WINDOWS_SMALL: { label: string; value: HistoryWindow }[] = [
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
  { label: "1w", value: "1w" },
  { label: "1m", value: "1m" },
  { label: "3m", value: "3m" },
  { label: "1y", value: "1y" },
];

export const HISTORY_WINDOWS_LARGE: { label: string; value: HistoryWindow }[] = [
  { label: "1 hr", value: "1h" },
  { label: "4 hrs", value: "4h" },
  { label: "1 day", value: "1d" },
  { label: "1 wk", value: "1w" },
  { label: "1 mth", value: "1m" },
  { label: "3 mths", value: "3m" },
  { label: "1 yr", value: "1y" },
];