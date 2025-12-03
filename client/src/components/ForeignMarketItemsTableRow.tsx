import { useNavigate } from "react-router-dom";
import {
  TableRow,
  TableCell,
  Box,
  Typography,
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
import { useState } from "react";
import ItemDetails from "../pages/ItemDetails";
import { getFormattedText } from "../lib/textFormat";
import {
  isForeignStockItemProfitable,
  type ForeignStockItem,
} from "../types/foreignStockItems";
import { timeAgo } from "../lib/time";

const openTornMarketPage = (itemId: number) => {
  window.open(
    `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
    "_blank"
  );
};

interface ForeignMarketItemsTableRowProps {
  item: ForeignStockItem;
}

const ForeignMarketItemsTableRow = ({
  item,
}: ForeignMarketItemsTableRowProps) => {
  const navigate = useNavigate();
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser();

  const [open, setOpen] = useState(false);

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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <img
              alt=""
              src={`https://www.torn.com/images/items/${item.itemId}/small.png`}
              width={38}
              height={19}
              style={{ borderRadius: 4 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <Typography variant="body2">{item.itemName}</Typography>
          </Box>
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
          {item.item.valueMarketPrice ? (
            <span>{getFormattedText("$", item.item.valueMarketPrice, "")}</span>
          ) : (
            <span>&mdash;</span>
          )}
        </TableCell>

        <TableCell
          align="right"
          onClick={() => navigate(`/item/${item.itemId}`)}
        >
          {isForeignStockItemProfitable(item) ? (
            <Chip
              label={getFormattedText(
                "$",
                (item.item.valueMarketPrice ?? 0) - (item.cost ?? 0),
                ""
              )}
              color={"success"}
              size="small"
            />
          ) : item.cost && item.item.valueMarketPrice ? (
            <span>
              {getFormattedText(
                "$",
                item.item.valueMarketPrice - item.cost,
                ""
              )}
            </span>
          ) : (
            <span>&mdash;</span>
          )}
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
