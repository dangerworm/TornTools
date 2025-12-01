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
  ShoppingCart,
  Storefront,
} from "@mui/icons-material";
import { useUser } from "../hooks/useUser";
import { isItemProfitable, type Item } from "../types/items";
import { useState } from "react";
import ItemDetails from "../pages/ItemDetails";
import { getFormattedText } from "../lib/textFormat";

const shopUrls: Map<string, string> = new Map([
  ["Big Al's Gun Shop", "https://www.torn.com/bigalgunshop.php"],
  ["Bits 'n' Bobs", "https://www.torn.com/shops.php?step=bitsnbobs"],
  ["Sally's Sweet Shop", "https://www.torn.com/shops.php?step=candy"],
  ["the Docks", "https://www.torn.com/shops.php?step=docks"],
  ["the Jewelry Store", "https://www.torn.com/shops.php?step=jewelry"],
  ["the Post Office", "https://www.torn.com/shops.php?step=postoffice"],
  ["the Print Shop", "https://www.torn.com/shops.php?step=printstore"],
  ["the Pharmacy", "https://www.torn.com/shops.php?step=pharmacy"],
  ["the Recycling Center", "https://www.torn.com/shops.php?step=recyclingcenter"],
  ["the Super Store", "https://www.torn.com/shops.php?step=super"],
  ["TC Clothing", "https://www.torn.com/shops.php?step=clothes"],
]);

const openTornMarketPage = (itemId: number) => {
  window.open(
    `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
    "_blank"
  );
};

const openTornShopPage = (vendorName: string) => {
  if (shopUrls.has(vendorName)) {  
    window.open(shopUrls.get(vendorName)!, "_blank");
    return;
  }
};

interface LocalMarketItemsTableRowProps {
  item: Item;
  showCityPrice: boolean;
  showVendor: boolean;
}

const LocalMarketItemsTableRow = ({
  item,
  showCityPrice,
  showVendor,
}: LocalMarketItemsTableRowProps) => {
  const navigate = useNavigate();
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser();

  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow hover key={item.id}>
        <TableCell>
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
            align="left"
            onClick={() => toggleFavouriteItemAsync(item.id)}
          >
            {dotNetUserDetails.favouriteItems?.includes(item.id) ? (
              <Favorite sx={{ cursor: "pointer", color: "#1976d2" }} />
            ) : (
              <FavoriteBorder sx={{ cursor: "pointer", color: "gray" }} />
            )}
          </TableCell>
        )}

        <TableCell onClick={() => navigate(`/item/${item.id}`)}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <img
              alt=""
              src={`https://www.torn.com/images/items/${item.id}/small.png`}
              width={24}
              height={24}
              style={{ borderRadius: 4 }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <Typography variant="body2">{item.name}</Typography>
          </Box>
        </TableCell>

        <TableCell onClick={() => navigate(`/item/${item.id}`)}>
          {item.type}
        </TableCell>

        {showVendor && (
          <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
            {item.valueVendorName?.startsWith("the")
              ? item.valueVendorName.substring(4)
              : item.valueVendorName}
          </TableCell>
        )}

        {showCityPrice && (
          <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
            {item.valueBuyPrice ? (
              <span>{getFormattedText("$", item.valueBuyPrice!, "")}</span>
            ) : (
              <span>&mdash;</span>
            )}
          </TableCell>
        )}

        <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
          {item.valueMarketPrice ? (
            <span>{getFormattedText("$", item.valueMarketPrice, "")}</span>
          ) : (
            <span>&mdash;</span>
          )}
        </TableCell>

        {showCityPrice && (
          <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
            {isItemProfitable(item) &&
            item.valueBuyPrice &&
            item.valueMarketPrice ? (
              <Chip
                label={getFormattedText(
                  "$",
                  item.valueMarketPrice - item.valueBuyPrice,
                  ""
                )}
                color={"success"}
                size="small"
              />
            ) : (
              <span>&mdash;</span>
            )}
          </TableCell>
        )}

        {showCityPrice && (
          <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
            {isItemProfitable(item) &&
            item.valueBuyPrice &&
            item.valueMarketPrice ? (
              getFormattedText(
                "",
                ((item.valueMarketPrice - item.valueBuyPrice) /
                  item.valueBuyPrice) *
                  100,
                "%"
              )
            ) : (
              <span>&mdash;</span>
            )}
          </TableCell>
        )}

        <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
          {getFormattedText("", item.circulation ?? 0, "")}
        </TableCell>

        <TableCell
          align="right"
          onClick={() =>
            showVendor &&
            item.valueVendorName &&
            shopUrls.has(item.valueVendorName)
              ? openTornShopPage(item.valueVendorName)
              : openTornMarketPage(item.id)
          }
        >
          {showVendor &&
          item.valueVendorName &&
          shopUrls.has(item.valueVendorName) ? (
            <ShoppingCart />
          ) : (
            <Storefront />
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <ItemDetails inputItem={item} inlineView={true} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default LocalMarketItemsTableRow;
