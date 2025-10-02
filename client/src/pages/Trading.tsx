import { Alert, Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

interface TradingProps {
  apiKey: string | null;
}

export default function Trading({ apiKey }: TradingProps) {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trading Opportunities
      </Typography>

      {!apiKey && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Link to="/">Set your API key</Link> to scan the market for trading opportunities.
        </Alert>
      )}
    </Box>
  );
}
