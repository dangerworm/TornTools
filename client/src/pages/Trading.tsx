import { Alert, Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useItems } from "../contexts/ItemsContext";

export default function Trading() {
  const { apiKey, items } = useItems();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trading Opportunities
      </Typography>

      {!apiKey && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Link to="/">Set your API key</Link> to scan the market for trading
          opportunities.
        </Alert>
      )}
    </Box>
  );
}
