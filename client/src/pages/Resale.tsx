import { Box, Grid, Slider, Typography } from "@mui/material";
import Loading from "../components/Loading";
import { useResaleScan } from "../hooks/useResaleScan";
import { useItems } from "../hooks/useItemsContext";
import MarketItemsTable from "../components/MarketItemTable";
import { useState } from "react";

export default function Resale() {
  const { items } = useItems();

  const sliderValues = [
    1,
    10,
    50,
    100,
    500,
    1000,
    5000,
    10000,
    50000,
    100000,
    500000,
    1000000,
    5000000,
    10000000,
    50000000,
    100000000,
    500000000,
    1000000000
  ];

  const [minProfitIndex, setMinProfitIndex] = useState(0);
  const [maxBuyPriceIndex, setMaxBuyPriceIndex] = useState(sliderValues.length - 1);

  const { rows, error } = useResaleScan(items, {
    minProfit: sliderValues[minProfitIndex],
    maxBuyPrice: sliderValues[maxBuyPriceIndex],
    margin: Number(import.meta.env.VITE_TORN_MARGIN ?? 500),
    intervalMs: 1000,
  });

  const handleMinProfitSliderValueChange = (
    _: Event,
    newValue: number | number[]
  ) => {
    setMinProfitIndex(newValue as number);
  };

  const handleMaxBuyPriceSliderValueChange = (
    _: Event,
    newValue: number | number[]
  ) => {
    setMaxBuyPriceIndex(newValue as number);
  };

  if (!items) return <Loading />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Resale Opportunities
      </Typography>

      <Typography variant="body1" gutterBottom>
        This tool scans the market for profitable resale listings. It looks for
        items being sold below the sell price in the city, allowing you to buy
        low and sell high.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 6 }} alignItems="center">
          <Typography gutterBottom>
            Minimum Profit: ${sliderValues[minProfitIndex].toLocaleString()}
          </Typography>
          <Slider
            value={minProfitIndex}
            onChange={handleMinProfitSliderValueChange}
            max={sliderValues.length - 1}
            min={0}
            step={1}
            valueLabelDisplay="off"
            style={{ width: "80%" }}
          />

        </Grid>
        <Grid size={{ xs: 12, sm: 6 }} alignItems="center">
          <Typography gutterBottom>
            Maximum Buy Price: ${sliderValues[maxBuyPriceIndex].toLocaleString()}
          </Typography>
          <Slider
            value={maxBuyPriceIndex}
            onChange={handleMaxBuyPriceSliderValueChange}
            max={sliderValues.length - 1}
            min={0}
            step={1}
            valueLabelDisplay="off"
            style={{ width: "80%" }}
          />
        </Grid>
      </Grid>

      <MarketItemsTable
        rows={rows}
        minProfit={sliderValues[minProfitIndex]}
        maxBuyPrice={sliderValues[maxBuyPriceIndex]}
        error={error}
        rowClickAction={"visit-market-page"}
      />
    </Box>
  );
}
