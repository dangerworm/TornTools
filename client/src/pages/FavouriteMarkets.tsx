import { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Box,
  Button,
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
import { Link as RouterLink } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import { useItems } from "../hooks/useItems";

const FavouriteMarkets = () => {
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser();
  const { itemsById } = useItems();

  const favouriteItems = useRef(dotNetUserDetails?.favouriteItems ?? []);

  useEffect(() => {
    if (favouriteItems.current.length === 0 && dotNetUserDetails?.favouriteItems) {
      favouriteItems.current = dotNetUserDetails.favouriteItems;
    }
  }, [dotNetUserDetails?.favouriteItems]);

  if (!dotNetUserDetails) {
    return (
      <Alert severity="info" sx={{ width: "95%" }}>
        Please sign in to see your favourite markets.
      </Alert>
    );
  }

  if (!dotNetUserDetails?.favouriteItems.length) {
    return (
      <Alert severity="info" sx={{ width: "95%" }}>
        You have not saved any favourite markets yet. Use the heart icon in the
        markets tables to add favourites.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Favourite Markets
      </Typography>
      <Typography variant="body1" gutterBottom>
        Quickly jump back to the items you follow the most.
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 2, width: "95%" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {dotNetUserDetails && <TableCell>Favourite</TableCell>}
              <TableCell>Item</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {favouriteItems.current.map((id) => {
              const item = itemsById[id];
              return (
                <TableRow key={id} hover>
                  {dotNetUserDetails && (
                    <TableCell
                      align="left"
                      onClick={() => toggleFavouriteItemAsync(id)}
                    >
                      {dotNetUserDetails.favouriteItems?.includes(id) ? (
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
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <img
                        alt=""
                        src={`https://www.torn.com/images/items/${id}/small.png`}
                        width={24}
                        height={24}
                        style={{ borderRadius: 4 }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                      <Typography variant="body2">
                        {item?.name ?? `Item ${id}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      component={RouterLink}
                      to={`/item/${id}`}
                      size="small"
                      variant="outlined"
                    >
                      View details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FavouriteMarkets;
