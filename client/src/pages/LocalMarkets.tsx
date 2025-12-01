import { Fragment, useEffect, useMemo, useState } from "react";
import { useItems } from "../hooks/useItems";
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import Loading from "../components/Loading";
import LocalMarketItemsTable from "../components/LocalMarketItemsTable";
import { isItemProfitable } from "../types/items";

const LocalMarkets = () => {
  const { items, refresh } = useItems();

  const [showProfitableOnly, setShowProfitableOnly] = useState(true);
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const countries = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.valueVendorCountry)))
      .filter((country: string | undefined) => !country || country === "Torn")
      .sort();
  }, [items]);

  const itemTypes = useMemo(() => {
    if (!items) return [];
    return Array.from(
      new Set(items.map((i) => i.type).filter((type) => type))
    ).sort();
  }, [items]);

  if (!items) return <Loading message="Loading items..." />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        City Markets
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={showProfitableOnly}
              onChange={() => setShowProfitableOnly(!showProfitableOnly)}
            />
          }
          label="Show Profitable Items Only"
        />
      </FormGroup>

      <Box>
        <Chip
          label="All Item Types"
          variant={selectedItemTypes.length === 0 ? "filled" : "outlined"}
          onClick={() => setSelectedItemTypes([])}
          sx={{ mb: 1, mr: 1 }}
        />
        {itemTypes.map((type) => (
          <Chip
            key={type}
            label={type}
            color={"primary"}
            variant={selectedItemTypes.includes(type!) ? "filled" : "outlined"}
            onClick={() => {
              if (!type) return;
              setSelectedItemTypes((prev) =>
                prev.includes(type!)
                  ? prev.filter((t) => t !== type)
                  : [...prev, type]
              );
            }}
            sx={{ mb: 1, mr: 1 }}
          />
        ))}
      </Box>

      {countries.map((country: string | undefined) => (
        <Fragment key={country}>
          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4, width: "95%" }}>
            <Typography variant="h5" gutterBottom>
              {country?.replace("Torn", "Torn City") ?? "No Vendor"}
            </Typography>

            <LocalMarketItemsTable
              items={items.filter(
                (i) =>
                  (i.valueVendorCountry === country) &&
                  (!showProfitableOnly || isItemProfitable(i)) &&
                  (selectedItemTypes.length === 0 ||
                    selectedItemTypes.includes(i.type!))
              )}
              showCityPrice={!!country}
              showVendor={!!country}
            />
          </Box>
        </Fragment>
      ))}
    </Box>
  );
};

export default LocalMarkets;
