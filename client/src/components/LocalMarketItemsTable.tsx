import { useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  Paper,
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
import { useUser } from "../hooks/useUser";
import type { Item } from "../types/items";

interface LocalMarketItemsTableProps {
  items: Item[];
  showVendor?: boolean;
}

const LocalMarketItemsTable = ({ items, showVendor = true }: LocalMarketItemsTableProps) => {
  const navigate = useNavigate();
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser();

  const openTornMarketPage = (itemId: number) => {
    window.open(
      `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
      "_blank"
    );
  };

  return (
    <>
      <Box>
        <TableContainer component={Paper} sx={{ mt: 2, width: "95%" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {dotNetUserDetails && <TableCell>Fav</TableCell>}
                <TableCell>Item</TableCell>
                <TableCell>Type</TableCell>
                {showVendor && <TableCell align="right">Vendor</TableCell>}
                <TableCell align="right">City Price</TableCell>
                <TableCell align="right">Sell Price</TableCell>
                <TableCell align="right">Market Price</TableCell>
                <TableCell align="right">Circulation</TableCell>
                <TableCell align="right">Market</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow hover key={item.id}>
                  {dotNetUserDetails && (
                    <TableCell
                      align="left"
                      onClick={() => toggleFavouriteItemAsync(item.id)}
                    >
                      {dotNetUserDetails.favouriteItems?.includes(item.id) ? (
                        <Favorite
                          sx={{ cursor: "pointer", color: "#1976d2" }}
                        />
                      ) : (
                        <FavoriteBorder
                          sx={{ cursor: "pointer", color: "gray" }}
                        />
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
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                  </TableCell>

                  <TableCell onClick={() => navigate(`/item/${item.id}`)}>
                    {item.type}
                  </TableCell>

                  {showVendor && (
                    <TableCell
                      align="right"
                      onClick={() => navigate(`/item/${item.id}`)}
                    >
                      {item.valueVendorName?.startsWith("the")
                        ? item.valueVendorName.substring(4)
                        : item.valueVendorName}
                    </TableCell>
                  )}

                  <TableCell
                    align="right"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    {item.valueBuyPrice &&
                    item.valueMarketPrice &&
                    item.valueMarketPrice > item.valueBuyPrice ? (
                      <Chip
                        label={`$${item.valueBuyPrice.toLocaleString()}`}
                        color={"success"}
                        size="small"
                      />
                    ) : item.valueBuyPrice ? (
                      <span>${item.valueBuyPrice!.toLocaleString()}</span>
                    ) : (
                      <span>&mdash;</span>
                    )}
                  </TableCell>

                  <TableCell
                    align="right"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    {item.valueSellPrice ? (
                      `$${item.valueSellPrice.toLocaleString()}`
                    ) : (
                      <span>&mdash;</span>
                    )}
                  </TableCell>

                  <TableCell
                    align="right"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    {item.valueBuyPrice &&
                    item.valueMarketPrice &&
                    item.valueMarketPrice > item.valueBuyPrice ? (
                      <Chip
                        label={`$${item.valueMarketPrice.toLocaleString()}`}
                        color={"success"}
                        size="small"
                      />
                    ) : item.valueMarketPrice ? (
                      <span>${item.valueMarketPrice.toLocaleString()}</span>
                    ) : (
                      <span>&mdash;</span>
                    )}
                  </TableCell>

                  <TableCell
                    align="right"
                    onClick={() => navigate(`/item/${item.id}`)}
                  >
                    {item.circulation?.toLocaleString()}
                  </TableCell>

                  <TableCell
                    align="right"
                    onClick={() => openTornMarketPage(item.id)}
                  >
                    <OpenInNew />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default LocalMarketItemsTable;
