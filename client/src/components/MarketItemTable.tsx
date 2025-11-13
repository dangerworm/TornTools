import { useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import type { ProfitableListing } from "../types/profitableListings";

type RowClickAction = "none" | "generate-autobuy-script" | "visit-market-page";

interface MarketItemsTableProps {
  rows: ProfitableListing[];
  minProfit?: number;
  maxBuyPrice?: number;
  error: string | null;
  sellPriceColumnNameOverride?: string;
  rowClickAction?: RowClickAction;
}

export default function MarketItemsTable({
  rows,
  minProfit = 0,
  maxBuyPrice = Number.MAX_SAFE_INTEGER,
  error,
  sellPriceColumnNameOverride = "Sell Price",
  rowClickAction = "none",
}: MarketItemsTableProps) {
  const [autoBuyScript, setAutoBuyScript] = useState<string | null>(null);
  const [lastClickedRow, setLastClickedRow] =
    useState<ProfitableListing | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const onRowClick = (row: ProfitableListing) => {
    if (rowClickAction === "generate-autobuy-script") {
      return generateAutoBuyScript(row);
    }

    if (rowClickAction === "visit-market-page") {
      window.open(
        `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${row.itemId}&sortField=price&sortOrder=ASC`,
        "_blank"
      );
    }
  };

  const generateAutoBuyScript = (row: ProfitableListing) => {
    if (rowClickAction !== "generate-autobuy-script") {
      return;
    }

    const lowestPrice = Math.max(Math.floor(row.minPrice * 0.6), row.sellPrice);

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
      let lowestPriceString = row.eq(2).text().substring(1).replace(/,/g, "");
      let lowestPrice = parseInt(lowestPriceString);
      console.log("New price:", lowestPrice);

      if (lowestPrice <= ${lowestPrice * 1.05}) {
        await row.eq(4).children(0).children(0).children(0).children(0).children("input").eq(0).click()
        await row.eq(4).children(0).children("button").eq(0).click()

        let yesButton = li.find("div.confirmButtons___Imp8D button:contains('Yes')");
        yesButton.click();
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
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell align="right">Current Lowest Price</TableCell>
                <TableCell align="left">Max Under Sell Price</TableCell>
                <TableCell align="right">
                  {sellPriceColumnNameOverride}
                </TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.filter(r => r.profit >= minProfit && r.maxPrice <= maxBuyPrice).map((r) => (
                <TableRow key={r.itemId} hover onClick={() => onRowClick(r)}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <img
                        alt=""
                        src={`https://www.torn.com/images/items/${r.itemId}/small.png`}
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
                    ${r.minPrice?.toLocaleString()}
                  </TableCell>
                  <TableCell align="left">
                    ${r.maxPrice?.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    ${r.sellPrice.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {r.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    ${r.profit.toLocaleString()}
                  </TableCell>
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
                  href={`https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${lastClickedRow?.itemId}`}
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
