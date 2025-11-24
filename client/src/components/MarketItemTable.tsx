import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Alert,
  Box,
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
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import { OpenInNew } from "@mui/icons-material";
import type { ProfitableListing } from "../types/profitableListings";
import { useUser } from "../hooks/useUser";

const getSecondsSinceLastUpdate = (lastUpdated: Date): number => {
  const d = new Date(lastUpdated);
  return (Date.now() - d.getTime()) / 1000;
};

const rowColor = (lastUpdated: Date): string => {
  const diffSeconds = getSecondsSinceLastUpdate(lastUpdated);
  const colorValue = Math.min(Math.max(Math.floor(diffSeconds / 3), 0), 171);
  return `rgba(${colorValue}, ${colorValue}, ${colorValue}, 0.87)`; // default color
};

const timeAgo = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (d.getTime() - Date.now()) / 1000; // seconds difference

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, secondsInUnit] of units) {
    const value = Math.min(diff, 0) / secondsInUnit;
    if (Math.abs(value) >= 1) {
      return rtf
        .format(Math.round(value), unit)
        .replace("hour", "hr")
        .replace("minute", "min")
        .replace("second", "sec");
    }
  }

  return "";
};

const MotionTableRow = motion(TableRow);

interface MarketItemsTableProps {
  rows: ProfitableListing[];
  minProfit?: number;
  maxBuyPrice?: number;
  maxTimeSinceLastUpdate?: number;
  error: string | null;
  sellPriceColumnNameOverride?: string;
}

export default function MarketItemsTable({
  rows,
  minProfit = 500,
  maxBuyPrice = 500000,
  maxTimeSinceLastUpdate = 5,
  error,
  sellPriceColumnNameOverride = "Sell Price",
}: MarketItemsTableProps) {
  const navigate = useNavigate();
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser();

  const seenIdsRef = useRef<Set<number | string>>(new Set());

  const openTornMarketPage = (itemId: number) => {
    window.open(
      `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
      "_blank"
    );
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
                {dotNetUserDetails && <TableCell>Favourite</TableCell>}
                <TableCell>Item</TableCell>
                <TableCell align="right">Buy Price/Range</TableCell>
                <TableCell align="right">
                  {sellPriceColumnNameOverride}
                </TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Total Profit</TableCell>
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
                      getSecondsSinceLastUpdate(r.lastUpdated) <=
                        maxTimeSinceLastUpdate * 60
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
                        // Only animate in for brand-new rows
                        initial={
                          isNew ? false : { height: 0, opacity: 0, y: -12 } // don't replay enter animation
                        }
                        animate={{ height: "2.3em", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -12 }} // fade/slide out on removal
                        transition={{ duration: 0.5 }}
                      >
                        {dotNetUserDetails && (
                          <TableCell align="left" onClick={() => toggleFavouriteItemAsync(r.itemId)}>
                            {dotNetUserDetails.favouriteItems?.includes(r.itemId) ? (
                              <Favorite sx={{ cursor: "pointer", color: "#1976d2" }} />
                            ) : (
                              <FavoriteBorder sx={{ cursor: "pointer", color: "gray" }} />
                            )}
                          </TableCell>
                        )}

                        <TableCell onClick={() => navigate(`/market/${r.itemId}`)}>
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
                          onClick={() => navigate(`/market/${r.itemId}`)}
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          {r.minPrice === r.maxPrice
                            ? `$${r.minPrice.toLocaleString()}`
                            : `$${r.minPrice?.toLocaleString()} - $${r.maxPrice?.toLocaleString()}`}
                        </TableCell>
                        <TableCell
                          align="right"
                          onClick={() => navigate(`/market/${r.itemId}`)}
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          ${r.sellPrice.toLocaleString()}
                        </TableCell>
                        <TableCell
                          align="right"
                          onClick={() => (r)}
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          {r.quantity.toLocaleString()}
                        </TableCell>

                        {/* This should navigate to /market/{itemId} when clicked, not use onRowClick */}
                        <TableCell
                          align="right"
                          onClick={() => navigate(`/market/${r.itemId}`)}
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
                        <TableCell
                          align="right"
                          style={{ color: rgbToHex(rowColor(r.lastUpdated)) }}
                        >
                          {timeAgo(r.lastUpdated)}
                        </TableCell>
                        <TableCell
                          align="right"
                          onClick={() => openTornMarketPage(r.itemId)}
                        >
                          <OpenInNew />
                        </TableCell>
                      </MotionTableRow>
                    );
                  })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      
    </>
  );
}
