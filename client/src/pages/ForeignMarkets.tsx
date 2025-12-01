import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Divider,
  FormGroup,
  FormLabel,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import ForeignMarketItemsTable from "../components/ForeignMarketItemsTable";
import { useUser } from "../hooks/useUser";
import { useForeignMarketsScan } from "../hooks/useForeignMarketsScan";
import Loading from "../components/Loading";

const itemTypesOfInterest = ["Drug", "Flower", "Plushie"];

const ForeignMarkets = () => {
  const { rows, error } = useForeignMarketsScan({ intervalMs: 60000 });
  const { apiKey, tornUserProfile, fetchTornProfileAsync } = useUser();

  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedItemTypes, setSelectedItemTypes] =
    useState<string[]>(itemTypesOfInterest);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return rows.filter(
      (row) =>
        (selectedItemTypes.length === 0 ||
          selectedItemTypes.includes(row.item.type!)) &&
        row.itemName.toLowerCase().includes(lowerSearchTerm)
    );
  }, [rows, searchTerm, selectedItemTypes]);

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

    if (
      tornUserProfile.status.state === "Traveling" &&
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
    if (!rows) return [];
    return Array.from(new Set(rows.map((i) => i.country)))
      .filter((country: string | undefined) => country && country !== "Torn")
      .sort();
  }, [rows]);

  const itemTypes = useMemo(() => {
    if (!rows) return [];
    return Array.from(
      new Set(rows.map((i) => i.item.type).filter((type) => type))
    ).sort();
  }, [rows]);

  const handleCountryFilterChange = (country: string) => {
    setSelectedCountries((prevSelected) => {
      if (prevSelected.includes(country)) {
        return prevSelected.filter((c) => c !== country);
      } else {
        return [...prevSelected, country];
      }
    });
  };

  if (!rows) return <Loading message="Loading foreign markets..." />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: "95%" }}>
      <Typography variant="h4" gutterBottom>
        Foreign Markets
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <Box>
        <Grid container spacing={2}>
          {countries.map((country: string | undefined) => (
            <Grid key={country} size="auto">
              <Box
                key={country}
                sx={{
                  alignItems: "center",
                  display: "inline-flex",
                  flexDirection: "column",
                  minWidth: "4em",
                  mb: 2,
                  mr: 2,
                  textAlign: "center",
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
                <Typography variant="caption">
                  {country?.split(" ").map((countryPart) => (
                    <>
                      {countryPart}
                      <br />
                    </>
                  ))}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

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

      <Box sx={{ my: 2 }}>
        <FormGroup>
          <FormLabel sx={{ mb: 1 }}>Search items:</FormLabel>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 400 }}
          />
        </FormGroup>
      </Box>

      {countries
        .filter(
          (country) =>
            selectedCountries.length === 0 ||
            selectedCountries.includes(country || "")
        )
        .map((country: string | undefined) => (
          <>
            {filteredItems.filter((i) => i.country === country).length > 0 && (
              <Box key={country} sx={{ mb: 4 }}>
                <Divider sx={{ my: 4 }} />
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
                  items={filteredItems.filter((i) => i.country === country)}
                />
              </Box>
            )}
          </>
        ))}
    </Box>
  );
};

export default ForeignMarkets;
