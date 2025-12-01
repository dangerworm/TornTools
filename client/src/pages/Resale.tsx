import { useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { useResaleScan } from "../hooks/useResaleScan";
import MarketItemsTable from "../components/MarketItemTable";
import SteppedSlider from "../components/SteppedSlider";

const Resale = () => {
  const { rows, error } = useResaleScan({ intervalMs: 1000 });

  const minuteRangeValues = [
    1, 2, 3, 5, 10, 30, 60, 120
  ];

  const priceRangeValues = [
    1, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000,
    5000000, 10000000, 50000000, 100000000, 500000000, 1000000000,
  ];

  const initialMinProfitIndex = 3; // 100
  const initialMaxBuyPriceIndex = 17; // 1,000,000,000
  const initialMaxTimeSinceLastUpdateIndex = 4; // 10 minutes

  const [minProfit, setMinProfit] = useState(priceRangeValues[initialMinProfitIndex]);
  const [maxBuyPrice, setMaxBuyPrice] = useState(priceRangeValues[initialMaxBuyPriceIndex]);
  const [maxTimeSinceLastUpdate, setMaxTimeSinceLastUpdate] = useState(minuteRangeValues[initialMaxTimeSinceLastUpdateIndex]);


  const handleMinProfitSliderValueChange = (newValue: number) => {
    setMinProfit(newValue);
  };

  const handleMaxBuyPriceSliderValueChange = (newValue: number) => {
    setMaxBuyPrice(newValue);
  };
    
  const handleMaxTimeSinceLastUpdateSliderValueChange = (newValue: number) => {
    setMaxTimeSinceLastUpdate(newValue);
  }

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
        <Grid size={{ xs: 12, sm: 6, md: 4 }} alignItems="center">
          <SteppedSlider
            label="Minimum Profit"
            prefixUnit="$"
            suffixUnit=""
            sliderValues={priceRangeValues}
            initialValueIndex={initialMinProfitIndex}
            onValueChange={handleMinProfitSliderValueChange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} alignItems="center">
          <SteppedSlider
            label="Max Buy Price"
            prefixUnit="$"
            suffixUnit=""
            sliderValues={priceRangeValues}
            initialValueIndex={initialMaxBuyPriceIndex}
            onValueChange={handleMaxBuyPriceSliderValueChange}
          />
        </Grid>
         <Grid size={{ xs: 12, sm: 6, md: 4 }} alignItems="center">
          <SteppedSlider
            label="Max Time Since Last Update"
            prefixUnit=""
            suffixUnit="minute"
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
      />
    </Box>
  );
}

export default Resale;