import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import type { Item } from "../types/items";
import { useUser } from "../hooks/useUser";
import LocalMarketItemsTableRow from "./LocalMarketItemsTableRow";

interface LocalMarketItemsTableProps {
  items: Item[];
  showCityPrice?: boolean;
  showVendor?: boolean;
}

const LocalMarketItemsTable = ({
  items,
  showCityPrice = true,
  showVendor = true,
}: LocalMarketItemsTableProps) => {
  const { dotNetUserDetails } = useUser();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(lowerSearchTerm) ||
      item.type?.toLowerCase().includes(lowerSearchTerm) ||
      item.valueVendorName?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [items, searchTerm]);

  const pagedItems = useMemo(
    () => filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredItems, page, rowsPerPage]
  );

  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= filteredItems.length) {
      setPage(Math.max(0, Math.ceil(filteredItems.length / rowsPerPage) - 1));
    }
  }, [filteredItems, page, rowsPerPage]);

  return (
    <>
      <Box>
        <Grid container spacing={2} sx={{ mb: 1 }}>
           <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: "left" }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 400, mt: 1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: "right" }}>
            <TablePagination
              component="div"
              count={filteredItems.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(1);
              }}
              sx={{ ml: 0 }}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
                <TableCell>Info</TableCell>
                {dotNetUserDetails && <TableCell>Fav</TableCell>}
                <TableCell>Item</TableCell>
                <TableCell>Type</TableCell>
                {showVendor && <TableCell align="right">Vendor</TableCell>}
                {showCityPrice && <TableCell align="right">City Price</TableCell>}
                <TableCell align="right">Market Price</TableCell>
                {showCityPrice && <TableCell align="right">Profit</TableCell>}
                {showCityPrice && <TableCell align="right">Profit/Cost</TableCell>}
                <TableCell align="right">Circulation</TableCell>
                <TableCell align="right">Torn</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => (
                <LocalMarketItemsTableRow
                  key={item.id}
                  item={item}
                  showVendor={showVendor}
                  showCityPrice={showCityPrice}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};

export default LocalMarketItemsTable;
