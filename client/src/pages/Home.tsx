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

const Home = () => {
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

      <Divider sx={{ my: 2 }} />
      {loading ? (
        <Loading message="Loading items..." />
      ) : (
        <Alert severity="success">
          Items loaded. You can now use the tools listed below. These can also
          be accessed from the navigation menu.
        </Alert>
      )}

      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        Tools
      </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <Link to="/markets" className="no-underline">
                  Markets
                </Link>
              </Typography>
              <Typography variant="body1">
                View markets organised by country.
                In future iterations this will be expanded to include filters
                and additional information.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <Link to="/time" className="no-underline">
                  Time Conversion
                </Link>
              </Typography>
              <Typography variant="body1">
                Convert between your local time and Torn City time (TCT).
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
      </Grid>
    </>
  );
}

export default Home;