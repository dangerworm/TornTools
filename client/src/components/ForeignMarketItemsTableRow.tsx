import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Favorite,
  FavoriteBorder,
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInNew,
} from "@mui/icons-material";
import { useUser } from "../hooks/useUser";
import { useBazaarSummaries } from "../hooks/useBazaarSummaries";
import { getFormattedText } from "../lib/textFormat";
import { timeAgo } from "../lib/time";
import { SALE_TAX } from "../lib/profitCalculations";
import ItemDetails from "../pages/ItemDetails";
import { type ForeignStockItem } from "../types/foreignStockItems";
import type { SaleOutlet } from "../types/markets";
import ItemCell from "./ItemCell";

const ProfitChip = ({ profit }: { profit: number | null }) => {
  if (profit === null) return <Chip label="N/A" size="small" sx={{ opacity: 0.3, whiteSpace: 'nowrap' }} />;
  return (
    <Chip
      label={getFormattedText("$", profit, "")}
      color={profit >= 0 ? "success" : "error"}
      size="small"
      sx={{ whiteSpace: 'nowrap' }}
    />
  );
};

const openTornMarketPage = (itemId: number) => {
  window.open(
    `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
    "_blank"
  );
};

interface ForeignMarketItemsTableRowProps {
  item: ForeignStockItem;
  saleOutlet: SaleOutlet;
}

const ForeignMarketItemsTableRow = ({
  item,
  saleOutlet,
}: ForeignMarketItemsTableRowProps) => {
  const navigate = useNavigate();
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser();
  const { summaries: bazaarSummaries } = useBazaarSummaries();

  const [open, setOpen] = useState(false);

  const sellPrice = (() => {
    if (saleOutlet === 'bazaar') {
      const s = bazaarSummaries[item.itemId]
      return s ? s.minPrice : null
    }
    return item.item.valueMarketPrice != null
      ? Math.floor(item.item.valueMarketPrice * (1 - SALE_TAX[saleOutlet]))
      : null
  })()

  const profit = sellPrice != null ? sellPrice - item.cost : null

  return (
    <>
      <TableRow hover key={item.itemId}>

        <TableCell align="center">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>

        {dotNetUserDetails && (
          <TableCell
            align="center"
            onClick={() => toggleFavouriteItemAsync(item.itemId)}
          >
            {dotNetUserDetails.favouriteItems?.includes(item.itemId) ? (
              <Favorite sx={{ cursor: "pointer", color: "#1976d2" }} />
            ) : (
              <FavoriteBorder sx={{ cursor: "pointer", color: "gray" }} />
            )}
          </TableCell>
        )}

        <TableCell onClick={() => navigate(`/item/${item.itemId}`)}>
          <ItemCell
            itemId={item.itemId}
            itemName={item.item?.name ?? `Item ${item.itemId}`}
          />
        </TableCell>

        <TableCell onClick={() => navigate(`/item/${item.itemId}`)}>
          {item.item.type}
        </TableCell>

        <TableCell
          align="right"
          onClick={() => navigate(`/item/${item.itemId}`)}
        >
          {item.cost ? (
            <span>{getFormattedText("$", item.cost!, "")}</span>
          ) : (
            <span>&mdash;</span>
          )}
        </TableCell>

        <TableCell
          align="right"
          onClick={() => navigate(`/item/${item.itemId}`)}
        >
          {sellPrice != null ? (
            <span>{getFormattedText("$", sellPrice, "")}</span>
          ) : (
            <span>&mdash;</span>
          )}
        </TableCell>

        <TableCell align="right" onClick={() => navigate(`/item/${item.itemId}`)}>
          <ProfitChip profit={profit} />
        </TableCell>

        <TableCell
          align="right"
          onClick={() => navigate(`/item/${item.itemId}`)}
        >
          {item.quantity === 0 ? (
            <Chip label="Out of Stock" color="error" size="small" />
          ) : (
            <span>{getFormattedText("", item.quantity ?? 0, "")}</span>
          )}
        </TableCell>

        <TableCell
          align="right"
          onClick={() => navigate(`/item/${item.itemId}`)}
        >
          {item.lastUpdated ? timeAgo(item.lastUpdated) : <span>&ndash;</span>}
        </TableCell>

        <TableCell
          align="center"
          onClick={() => openTornMarketPage(item.itemId)}
        >
          <OpenInNew />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <ItemDetails inputItem={item.item} inlineView={true} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default ForeignMarketItemsTableRow;
