import { useMemo } from "react";
import { useItems } from "../hooks/useItems";
import { Box, Divider, Typography } from "@mui/material";
import Loading from "../components/Loading";
import LocalMarketItemsTable from "../components/LocalMarketItemsTable";

const LocalMarkets = () => {
  const { items } = useItems();

  const countries = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.valueVendorCountry)))
      .filter((country: string | undefined) => !country || country === "Torn")
      .sort();
  }, [items]);

  if (!items) return <Loading message="Loading items..." />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Local Markets
      </Typography>

      {countries.map((country: string | undefined) => (
        <Box key={country} sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {country?.replace("Torn", "Torn City") ?? "No Vendor"}
          </Typography>

          <LocalMarketItemsTable
            items={items.filter((i) => i.valueVendorCountry === country)}
            showVendor={false}
          />
        </Box>
      ))}

      <Divider sx={{ my: 4 }} />
    </Box>
  );
};

export default LocalMarkets;
