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
import type { ForeignStockItem } from "../types/foreignStockItems";
import { timeAgo } from "../lib/time";

interface ForeignMarketItemsTableProps {
  items: ForeignStockItem[];
}

const ForeignMarketItemsTable = ({ items }: ForeignMarketItemsTableProps) => {
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
                <TableCell align="right">Buy Price</TableCell>
                <TableCell align="right">Market Price</TableCell>
                <TableCell align="right">Profit</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Last Updated</TableCell>
                <TableCell align="right">Market</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow hover key={item.itemId}>
                  {dotNetUserDetails && (
                    <TableCell
                      align="left"
                      onClick={() => toggleFavouriteItemAsync(item.itemId)}
                    >
                      {dotNetUserDetails.favouriteItems?.includes(item.itemId) ? (
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
                        width={24}
                        height={24}
                        style={{ borderRadius: 4 }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
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
                      <span>${item.cost!.toLocaleString()}</span>
                    ) : (
                      <span>&mdash;</span>
                    )}
                  </TableCell>

                  <TableCell
                    align="right"
                    onClick={() => navigate(`/item/${item.itemId}`)}
                  >
                    {item.item.valueMarketPrice ? (
                      <span>${item.item.valueMarketPrice.toLocaleString()}</span>
                    ) : (
                      <span>&mdash;</span>
                    )}
                  </TableCell>

                  <TableCell
                    align="right"
                    onClick={() => navigate(`/item/${item.itemId}`)}
                  >
                    {item.cost &&
                    item.item.valueMarketPrice &&
                    item.item.valueMarketPrice > item.cost ? (
                      <Chip
                        label={`$${(item.item.valueMarketPrice - item.cost).toLocaleString()}`}
                        color={"success"}
                        size="small"
                      />
                    ) : item.cost && item.item.valueMarketPrice ? (
                      <span>${(item.item.valueMarketPrice - item.cost).toLocaleString()}</span>
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
                      <span>{item.quantity?.toLocaleString()}</span>
                    )}
                  </TableCell>

                  <TableCell
                    align="right"
                    onClick={() => navigate(`/item/${item.itemId}`)}
                  >
                    {item.lastUpdated
                      ? timeAgo(item.lastUpdated)
                      : <span>&ndash;</span>}
                  </TableCell>

                  <TableCell
                    align="right"
                    onClick={() => openTornMarketPage(item.itemId)}
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

export default ForeignMarketItemsTable;
