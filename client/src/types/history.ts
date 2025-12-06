export type HistoryWindow =
  | "30m"
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

export const HISTORY_WINDOWS: { label: string; value: HistoryWindow }[] = [
  { label: "30m", value: "30m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "Day", value: "1d" },
  { label: "Week", value: "1w" },
  { label: "Month", value: "1m" },
  { label: "3m", value: "3m" },
  { label: "Year", value: "1y" },
];
