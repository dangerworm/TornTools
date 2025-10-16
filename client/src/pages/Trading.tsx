import {
  Alert,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import Loading from "../components/Loading";
import { Link } from "react-router-dom";
import { useItems } from "../contexts/ItemsContext";
import { useState } from "react";
import TradingScanner from "../components/TradingScanner";

export default function Trading() {
  const { apiKey, items } = useItems();

  const [budget, setBudget] = useState<number>(0);
  const [scanning, setScanning] = useState(false);

  const onBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    setScanning(false);
    setBudget(val);
  };

  if (!items) return <Loading />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trading Opportunities
      </Typography>

      {!apiKey && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Link to="/">Set your API key</Link> to scan the market for profitable
          listings.
        </Alert>
      )}

      {apiKey && (
        <>
          <Typography variant="body1" gutterBottom>
            Enter your budget here (the most you're willing to pay for a single
            item).
          </Typography>

          <TextField
            label="Budget"
            variant="outlined"
            type="number"
            value={budget}
            onChange={onBudgetChange}
            sx={{ mt: 1 }}
          />
          <br />

          {!scanning && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setScanning(true)}
              sx={{ mt: 2 }}
            >
              Start Scanning
            </Button>
          )}

          <Typography variant="body1" gutterBottom>
            Be careful here, this requires a little thought and a little patience.
          </Typography>

          <Typography variant="body1">
            This tool will search for each item's current lowest price on the market.
            Often (though not always) users won't bother to check the current lowest price 
            and will add listings using the current market rate, which is often significantly
            lower than the actual going rate.
          </Typography>

          <Typography variant="body1">
            If you find an item that gets new offers posted often and just wait, there's
            a chance someone will add a listing at that lower price. At that point you can
            snap it up, add it back to the market at the going rate/higher price, and resell
            it for a profit.
          </Typography>

          <Typography variant="body1" gutterBottom>
            If you click on the row you're interested in the tool will also generate a script
            you can paste into your browser console that will click 'buy' quickly if anything
            pops up which is significantly cheaper than the going rate.
          </Typography>
        </>
      )}

      {scanning && <TradingScanner budget={budget} />}
    </Box>
  );
}
