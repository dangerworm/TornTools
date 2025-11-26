import { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, Typography } from "@mui/material";
import Loading from "../components/Loading";
import ForeignMarketItemsTable from "../components/ForeignMarketItemsTable";
import { useForeignStockItems } from "../hooks/useForeignStockItems";
import { useUser } from "../hooks/useUser";

const itemTypesOfInterest = [
  "Drug",
  "Flower",
  "Plushie"
];

const ForeignMarkets = () => {
  const { items } = useForeignStockItems();
  const { apiKey, tornUserProfile, fetchTornProfileAsync } = useUser();

  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>(itemTypesOfInterest);

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    // Fetch the latest Torn profile data on component mount
    fetchTornProfileAsync(apiKey);
  }, [apiKey, fetchTornProfileAsync]);

  useEffect(() => {
    // Reset selected countries if user logs out
    if (!tornUserProfile) {
      return;
    }

    console.log("Torn user status:", tornUserProfile.status);

    if (tornUserProfile.status.state === "Traveling" &&
        !tornUserProfile.status.description.startsWith("Returning to")
    ) {
      const destination = tornUserProfile.status.description.replace(
        "Traveling to ",
        ""
      );
      setSelectedCountries([destination]);
    }
  }, [tornUserProfile]);

  const countries = useMemo(() => {
    if (!items) return [];
    return Array.from(new Set(items.map((i) => i.country)))
      .filter((country: string | undefined) => country && country !== "Torn")
      .sort();
  }, [items]);

  const itemTypes = useMemo(() => {
    if (!items) return [];
    return Array.from(
      new Set(items.map((i) => i.item.type).filter((type) => type))
    ).sort();
  }, [items]);

  const handleCountryFilterChange = (country: string) => {
    setSelectedCountries((prevSelected) => {
      if (prevSelected.includes(country)) {
        return prevSelected.filter((c) => c !== country);
      } else {
        return [...prevSelected, country];
      }
    });
  };

  if (!items) return <Loading message="Loading items..." />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Foreign Markets
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <Box>
        {countries.map((country: string | undefined) => (
          <Box
            key={country}
            sx={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              mr: 2,
              mb: 2,
            }}
          >
            <img
              src={`/${country?.toLowerCase().replace(" ", "-")}.svg`}
              alt={`Flag of ${country}`}
              style={{
                border: selectedCountries.includes(country || "")
                  ? "4px solid #0966c2"
                  : "2px solid transparent",
                borderRadius: "3em",
                cursor: "pointer",
                maxWidth: "3em",
                height: "3em",
                objectFit: "cover",
              }}
              onClick={() => handleCountryFilterChange(country || "")}
            />
            <Typography variant="caption">{country}</Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Show Item Types
      </Typography>

      <Box>
        <Chip
          label="All Item Types"
          variant={selectedItemTypes.length === 0 ? "filled" : "outlined"}
          onClick={() => setSelectedItemTypes([])}
        />
        {itemTypes.map((type) => (
          <Chip
            key={type}
            label={type}
            color={itemTypesOfInterest.includes(type!) ? "success" : "primary"}
            variant={selectedItemTypes.includes(type!) ? "filled" : "outlined"}
            onClick={() => {
              if (!type) return;
              setSelectedItemTypes((prev) =>
                prev.includes(type!)
                  ? prev.filter((t) => t !== type)
                  : [...prev, type]
              );
            }}
            sx={{ mb: 1, ml: 1 }}
          />
        ))}
      </Box>

      <Divider sx={{ my: 4 }} />

      {countries
        .filter(
          (country) =>
            selectedCountries.length === 0 ||
            selectedCountries.includes(country || "")
        )
        .map((country: string | undefined) => (
          <Box key={country} sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              <img
                src={`/${country?.toLowerCase().replace(" ", "-")}.svg`}
                alt={`Flag of ${country}`}
                style={{
                  maxWidth: "1em",
                  height: "auto",
                  marginRight: 8,
                  top: 3,
                  position: "relative",
                }}
              />
              {country}
            </Typography>

            <ForeignMarketItemsTable
              items={items.filter(
                (i) =>
                  i.country === country &&
                  (selectedItemTypes.length === 0 ||
                    selectedItemTypes.includes(i.item.type!))
              )}
            />
          </Box>
        ))}

      <Divider sx={{ my: 4 }} />
    </Box>
  );
};

export default ForeignMarkets;
