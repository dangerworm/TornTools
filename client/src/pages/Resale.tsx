import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Loading from "../components/Loading";
import { useMarketScan } from "../hooks/useMarketScan";
import { Link } from "react-router-dom";
import { useItems } from "../contexts/ItemsContext";

function StatusChip({ s }: { s: import("../hooks/useMarketScan").RowStatus }) {
  const map: Record<
    string,
    {
      label: string;
      color: "default" | "info" | "warning" | "success" | "error";
    }
  > = {
    queued: { label: "Queued", color: "default" },
    fetching: { label: "Fetching", color: "info" },
    cached: { label: "Cached", color: "warning" },
    done: { label: "Done", color: "success" },
    error: { label: "Error", color: "error" },
  };
  const { label, color } = map[s];
  return <Chip size="small" color={color} label={label} />;
}

export default function Resale() {
  const { apiKey, items } = useItems();

  const { rows, status, error } = useMarketScan(apiKey, items, {
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

      {status === "running" && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Scanning items by sale price… this may take a minute or two.
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Any items which can be sold in the city for profit will be moved to the top of the list automatically.
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
              <TableCell>Item</TableCell>
              <TableCell align="right">Best Buy</TableCell>
              <TableCell align="right">Sell Price</TableCell>
              <TableCell align="right">Profit Each</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover selected={r.interesting}>
                <TableCell>
                  <StatusChip s={r.status} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <img
                      alt=""
                      src={`https://www.torn.com/images/items/${r.id}/small.png`}
                      width={24}
                      height={24}
                      style={{ borderRadius: 4 }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                    <Typography variant="body2">{r.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {r.best_price?.toLocaleString() ?? "—"}
                </TableCell>
                <TableCell align="right">
                  {r.sell_price.toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  {r.interesting ? (
                    <Chip
                      label={r.profit_each!.toLocaleString()}
                      color="success"
                      size="small"
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell align="right">{r.best_amount ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
