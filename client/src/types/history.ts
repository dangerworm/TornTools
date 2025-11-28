export type HistoryWindow =
  | "30m"
  | "1h"
  | "4h"
  | "1d"
  | "1w"
  | "1m"
  | "3m"
  | "1y";

export interface ItemHistoryPoint {
  timestamp: string;
  price?: number;
  velocity?: number;
}
