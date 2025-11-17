import {
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import { Link } from "react-router";
import { useItems } from "../hooks/useItems";
import Loading from "../components/Loading";

function Home() {
  const { loading } = useItems();

  return (
    <>
      <Typography variant="body1" gutterBottom>
        This website hosts a collection of tools for the game{" "}
        <a
          href="https://www.torn.com/index.php"
          target="_blank"
          rel="noopener noreferrer"
        >
          Torn
        </a>
        .
      </Typography>
      <Typography variant="body1" gutterBottom>
        This is a personal project and not affiliated with Torn or its
        developers. Use at your own risk.
      </Typography>

      <Divider sx={{ my: 4 }} />
      {loading ? (
        <Loading message="Loading items..." />
      ) : (
        <Alert severity="success" sx={{ mt: 2 }}>
          Items loaded. You can now use the tools listed below. These can also
          be accessed from the navigation menu.
        </Alert>
      )}

      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        Tools
      </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <Link to="/resale" className="no-underline">
                  Resale Opportunities
                </Link>
              </Typography>
              <Typography variant="body1">
                Checks the market for profitable resale listings.
              </Typography>
              <ul>
                <li>
                  <Typography variant="body2">Go to the resale page</Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Wait for the page to scan the market. Profitable listings
                    will be moved to the top of the list as they are found
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Buy what you can afford and resell in the city for a profit
                  </Typography>
                </li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
        {/* <Grid size={{ xs: 2, sm: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Features
              </Typography>
              <Typography variant="body1">
                - Market Price Checker
              </Typography>
              <Typography variant="body1">
                - Item Price History
              </Typography>
              <Typography variant="h6">Feature 1</Typography>
              <Typography variant="body1">
                Description of feature 1.
              </Typography>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>
    </>
  );
}

export default Home;
