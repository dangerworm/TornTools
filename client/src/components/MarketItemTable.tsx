import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  rgbToHex,
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

const getSecondsSinceLastUpdate = (lastUpdated: Date): number => {
  const d = new Date(lastUpdated);
  return (Date.now() - d.getTime()) / 1000;
};

const rowColor = (lastUpdated: Date): string => {
  const diffSeconds = getSecondsSinceLastUpdate(lastUpdated);
  const colorValue = Math.min(Math.max(Math.floor(diffSeconds / 6), 0), 171);
  return `rgba(${colorValue}, ${colorValue}, ${colorValue}, 0.87)`; // default color
};

const timeAgo = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (d.getTime() - Date.now()) / 1000; // seconds difference

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, secondsInUnit] of units) {
    if (unit === "second" && Math.abs(diff) < 5) {
      return "just now";
    }

    if (unit === "second" && Math.abs(diff) < 60) {
      return "< 1 minute ago";
    }

    const value = diff / secondsInUnit;
    if (Math.abs(value) >= 1) {
      return rtf.format(Math.round(value), unit);
    }
  }

  return "";
};

type RowClickAction = "none" | "generate-autobuy-script" | "visit-market-page";

const MotionTableRow = motion(TableRow);

interface MarketItemsTableProps {
  rows: ProfitableListing[];
  minProfit?: number;
  maxBuyPrice?: number;
  maxTimeSinceLastUpdate?: number;
  error: string | null;
  sellPriceColumnNameOverride?: string;
  rowClickAction?: RowClickAction;
}

export default function MarketItemsTable({
  rows,
  minProfit = 500,
  maxBuyPrice = 500000,
  maxTimeSinceLastUpdate = 5,
  error,
  sellPriceColumnNameOverride = "Sell Price",
  rowClickAction = "none",
}: MarketItemsTableProps) {
  const seenIdsRef = useRef<Set<number | string>>(new Set());

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
        <TableContainer component={Paper} sx={{ mt: 2, width: "95%" }}>
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
                <TableCell align="right">Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AnimatePresence initial={false}>
                {rows
                  .filter(
                    (r) =>
                      r.profit >= minProfit &&
                      r.maxPrice <= maxBuyPrice &&
                      getSecondsSinceLastUpdate(r.lastUpdated) <= maxTimeSinceLastUpdate * 60
                  )
                  .map((r) => {
                    const seenIds = seenIdsRef.current;
                    const isNew = !seenIds.has(r.itemId);
                    if (isNew) {
                      seenIds.add(r.itemId);
                    }

                    return (
                      <MotionTableRow
                        key={r.itemId}
                        hover
                        onClick={() => onRowClick(r)}
                        // Only animate in for brand-new rows
                        initial={
                          isNew ? false : { height: 0, opacity: 0, y: -12 } // don't replay enter animation
                        }
                        animate={{ height: "2.3em", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -12 }} // fade/slide out on removal
                        transition={{ duration: 0.5 }}
                      >
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <img
                              alt=""
                              src={`https://www.torn.com/images/items/${r.itemId}/small.png`}
                              width={24}
                              height={24}
                              style={{ borderRadius: 4 }}
                              onError={(e) => {
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.display = "none";
                              }}
                            />
                            <Typography
                              variant="body2"
                              style={{
                                color: rgbToHex(rowColor(r.lastUpdated)),
                              }}
                            >
                              {r.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          ${r.minPrice?.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="left"
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          ${r.maxPrice?.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          ${r.sellPrice.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          {r.quantity.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          ${r.profit.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          {timeAgo(r.lastUpdated)}
                        </TableCell>
                      </MotionTableRow>
                    );
                  })}
              </AnimatePresence>
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
