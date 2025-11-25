import { useMemo } from "react";
import { useItems } from "../hooks/useItems";
import { Box, Divider, Typography } from "@mui/material";
import Loading from "../components/Loading";
import ItemsTable from "../components/ItemTable";

const Markets = () => {
  const { items } = useItems();

  const countries = useMemo(() => {
    if (!items) return [];
    return Array
      .from(new Set(items.map((i) => i.valueVendorCountry)))
      .filter((c): c is string => c !== "Torn")
      .sort();
  }, [items]);

  if (!items) return <Loading message="Loading items..." />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Markets
      </Typography>

      {["Torn", ...countries].map((country: string | undefined) => (
        <Box key={country} sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            {country}
          </Typography>

          <ItemsTable
            items={items.filter((i) => i.valueVendorCountry === country)}
            showVendor={items.some(i => !!i.valueVendorCountry)}
          />
        </Box>
      ))}

      <Divider sx={{ my: 4 }} />
    </Box>
  );
};

export default Markets;
