import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

const Markets = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Markets
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <Link to="/city-markets" className="no-underline">
                  Local Markets
                </Link>
              </Typography>
              <Typography variant="body1" sx={{ width: "80%" }}>
                View markets for items available to buy and sell in Torn City
                as well as those with no listed vendor.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <Link to="/foreign-markets" className="no-underline">
                  Foreign Markets
                </Link>
              </Typography>
              <Typography variant="body1" sx={{ width: "80%" }}>
                View markets for items available to buy and sell in foreign
                countries outside of Torn City.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Markets;
