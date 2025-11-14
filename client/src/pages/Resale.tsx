import { Box, Grid, Typography } from "@mui/material";
import Loading from "../components/Loading";
import { useResaleScan } from "../hooks/useResaleScan";
import { useItems } from "../hooks/useItemsContext";
import MarketItemsTable from "../components/MarketItemTable";
import { useState } from "react";
import SteppedSlider from "../components/SteppedSlider";

export default function Resale() {
  const { items } = useItems();

  const minuteRangeValues = [
    1, 2, 3, 5, 10, 30, 60, 120, 240, 480, 720, 1440,
  ];

  const priceRangeValues = [
    1, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000,
    5000000, 10000000, 50000000, 100000000, 500000000, 1000000000,
  ];

  const initialMinProfitIndex = 4; // 500
  const initialMaxBuyPriceIndex = 12; // 500000
  const initialMaxTimeSinceLastUpdateIndex = 3; // 5 minutes

  const [minProfit, setMinProfit] = useState(priceRangeValues[initialMinProfitIndex]);
  const [maxBuyPrice, setMaxBuyPrice] = useState(priceRangeValues[initialMaxBuyPriceIndex]);
  const [maxTimeSinceLastUpdate, setMaxTimeSinceLastUpdate] = useState(minuteRangeValues[initialMaxTimeSinceLastUpdateIndex]);

  const { rows, error } = useResaleScan(items, { intervalMs: 1000 });

  const handleMinProfitSliderValueChange = (newValue: number) => {
    setMinProfit(newValue);
  };

  const handleMaxBuyPriceSliderValueChange = (newValue: number) => {
    setMaxBuyPrice(newValue);
  };
    
  const handleMaxTimeSinceLastUpdateSliderValueChange = (newValue: number) => {
    setMaxTimeSinceLastUpdate(newValue);
  }

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
        <Grid size={{ xs: 12, sm: 4 }} alignItems="center">
          <SteppedSlider
            label="Minimum Profit"
            prefixUnit="$"
            suffixUnit=""
            sliderValues={priceRangeValues}
            initialValueIndex={initialMinProfitIndex}
            onValueChange={handleMinProfitSliderValueChange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }} alignItems="center">
          <SteppedSlider
            label="Maximum Buy Price"
            prefixUnit="$"
            suffixUnit=""
            sliderValues={priceRangeValues}
            initialValueIndex={initialMaxBuyPriceIndex}
            onValueChange={handleMaxBuyPriceSliderValueChange}
          />
        </Grid>
         <Grid size={{ xs: 12, sm: 4 }} alignItems="center">
          <SteppedSlider
            label="Max Time Since Last Update"
            prefixUnit=""
            suffixUnit=" minutes"
            sliderValues={minuteRangeValues}
            initialValueIndex={initialMaxTimeSinceLastUpdateIndex}
            onValueChange={handleMaxTimeSinceLastUpdateSliderValueChange}
          />
        </Grid>
      </Grid>

      <MarketItemsTable
        rows={rows}
        minProfit={minProfit}
        maxBuyPrice={maxBuyPrice}
        maxTimeSinceLastUpdate={maxTimeSinceLastUpdate}
        error={error}
        rowClickAction={"visit-market-page"}
      />
    </Box>
  );
}
