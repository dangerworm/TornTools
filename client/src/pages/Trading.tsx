import {
  Alert,
  Box,
  Button,
  Chip,
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
        </>
      )}

      {scanning && <TradingScanner budget={budget} />}
    </Box>
  );
}
