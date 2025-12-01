import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useUser } from "../hooks/useUser";
import { type ForeignStockItem } from "../types/foreignStockItems";
import ForeignMarketItemsTableRow from "./ForeignMarketItemsTableRow";
import { useMemo } from "react";

interface ForeignMarketItemsTableProps {
  items: ForeignStockItem[];
}

const ForeignMarketItemsTable = ({ items }: ForeignMarketItemsTableProps) => {
  const { dotNetUserDetails } = useUser();

  return (
    <>
      <Box>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Info</TableCell>
                {dotNetUserDetails && <TableCell>Fav</TableCell>}
                <TableCell>Item</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Buy Price</TableCell>
                <TableCell align="right">Market Price</TableCell>
                <TableCell align="right">Profit</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Last Updated</TableCell>
                <TableCell align="right">Torn</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <ForeignMarketItemsTableRow key={item.itemId} item={item} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default ForeignMarketItemsTable;
