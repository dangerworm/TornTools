import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import CopyWithSuccess from "./CopyWithSuccess";

function StatusChip({ s }: { s: import("../hooks/useResaleScan").RowStatus }) {
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

interface MarketItemsTableProps {
  rows: import("../hooks/useResaleScan").ScanRow[];
  status: "idle" | "running" | "done" | "error";
  error: string | null;
  sellPriceColumnNameOverride?: string;
  allowAutoBuyScriptGeneration?: boolean;
}

export default function MarketItemsTable({
  rows,
  status,
  error,
  sellPriceColumnNameOverride = "Sell Price",
  allowAutoBuyScriptGeneration = false,
}: MarketItemsTableProps) {
  const [autoBuyScript, setAutoBuyScript] = useState<string | null>(null);
  const [lastClickedRow, setLastClickedRow] = useState<
    import("../hooks/useResaleScan").ScanRow | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const generateAutoBuyScript = (
    row: import("../hooks/useResaleScan").ScanRow
  ) => {
    if (
      row.status !== "done" ||
      !row.best_price ||
      !allowAutoBuyScriptGeneration
    ) {
      return;
    }

    const lowestPrice = Math.max(Math.floor(row.best_price * 0.6), row.sell_price);

    const script = `let lastText = "";
const checkInterval = 200; // ms
const selector = "ul.sellerList___kgAh_ > li:first .honorWrap___BHau4.flexCenter___bV1QP.honorWrapSmall___oFibH .honor-text-wrap .honor-text";

const intervalId = setInterval(async () => {
  const el = $(selector).last().text();
  if (!el) return;

  const currentText = el.trim();
  if (currentText !== lastText) {
    if (lastText !== "") {
      let li = $("ul.sellerList___kgAh_ > li:first")
      let row = li.children(0).children(0)
      let lowestPriceString = row.eq(2).text().substring(1).replace(",", "");
      let lowestPrice = parseInt(lowestPriceString);
      console.log("New price:", lowestPrice);

      if (lowestPrice <= ${lowestPrice * 1.05}) {
        await row.eq(4).children(0).children(0).children(0).children(0).children("input").eq(0).click()
        await row.eq(4).children(0).children("button").eq(0).click()

        let yesButton = li.find("div.confirmButtons___Imp8D button:contains('Yes')");
        yesButton.click();
        //yesButton.css("border", "solid red 2px");
      }
    }
    lastText = currentText;
  }
}, checkInterval);`;

    setAutoBuyScript(script);
    setLastClickedRow(row);
    setDialogOpen(true);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <>
      <Box>
        {status === "running" && (
          <Box sx={{ my: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Scanning items by sale price… this may take a minute or two.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              Any items which can be sold for profit will be moved
              to the top of the list automatically.
            </Typography>
          </Box>
        )}

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align="right">Best Buy</TableCell>
                <TableCell align="right">
                  {sellPriceColumnNameOverride}
                </TableCell>
                <TableCell align="right">Profit Each</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  selected={r.interesting}
                  onClick={() => generateAutoBuyScript(r)}
                >
                  <TableCell>
                    <StatusChip s={r.status} />
                    {r.status === "error" && r.error && (
                      <Typography variant="caption" color="error">
                        {r.error}
                      </Typography>
                    )}
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
          Auto-Buy Script
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setDialogOpen(false)}
          sx={(theme) => ({
            position: "absolute",
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Typography gutterBottom>
            <CopyWithSuccess
              label="Copy script"
              textToCopy={autoBuyScript || ""}
            />
            <ul>
              <li>Copy the code using the button above</li>
              <li>
                Open{" "}
                <Link
                  href={`https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${lastClickedRow?.id}`}
                  target="_blank"
                  rel="noopener"
                >
                  the market
                </Link>{" "}
                for '{lastClickedRow?.name}' (opens in new tab)
              </li>
              <li>Open the developer console</li>
              <li>Switch to the 'Console' tab</li>
              <li>Press Enter</li>
            </ul>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            <pre>
              <code>
                {autoBuyScript?.split("\n").map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </code>
            </pre>
          </Typography>
        </DialogContent>
        <DialogActions>
          <CopyWithSuccess textToCopy={autoBuyScript || ""} />
        </DialogActions>
      </Dialog>
    </>
  );
}
