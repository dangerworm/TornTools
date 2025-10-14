import { useItems } from "../contexts/ItemsContext";
import { useTradingScan } from "../hooks/useTradingScan";
import MarketItemsTable from "../components/MarketItemTable";

interface TradingScannerProps {
  budget: number;
}

export default function TradingScanner({ budget }: TradingScannerProps) {
  const { apiKey, items, itemsById } = useItems();

  const { rows, status, error } = useTradingScan(apiKey, items, itemsById, {
    budget,
    maxItems: 1000,
    limitPerCall: 20,
    ttlSeconds: 60,
    intervalMs: 750, // ~80/min
  });

   return (
      <MarketItemsTable 
        rows={rows}
        status={status}
        error={error}
        sellPriceColumnNameOverride="Market Price"
        rowClickAction={"generate-autobuy-script"}
      />
    );
   
}
