import { Alert, Box, Typography } from "@mui/material";
import Loading from "../components/Loading";
import { useResaleScan } from "../hooks/useResaleScan";
import { Link } from "react-router-dom";
import { useItems } from "../contexts/ItemsContext";
import MarketItemsTable from "../components/MarketItemTable";

export default function Resale() {
  const { apiKey, items } = useItems();

  const { rows, status, error } = useResaleScan(apiKey, items, {
    maxItems: 200,
    minSellPrice: 3000,
    margin: Number(import.meta.env.VITE_TORN_MARGIN ?? 500),
    minAmount: 1,
    limitPerCall: 20,
    ttlSeconds: 60,
    intervalMs: 750, // ~80/min
  });

  if (!items) return <Loading />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Resale Opportunities
      </Typography>

      {!apiKey && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Link to="/">Set your API key</Link> to scan the market for profitable
          listings.
        </Alert>
      )}

      {apiKey && <MarketItemsTable rows={rows} status={status} error={error} />}
    </Box>
  );
}
