import {
  Alert,
  Card,
  CardContent,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router";
import { useItems } from "../contexts/ItemsContext";
import Loading from "../components/Loading";

function Home() {
  const { apiKey, setApiKey, loading } = useItems();

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

      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        API Key
      </Typography>

      <Typography variant="h6" gutterBottom>
        Why do you need my API key?
      </Typography>
      <Typography variant="body1" gutterBottom>
        The API key is required to fetch item data from the Torn API, which is
        necessary for the tools to function properly.
      </Typography>

      <Typography variant="h6" gutterBottom>
        Will the API key be stored securely and who can access it?	
      </Typography>
      <Typography variant="body1" gutterBottom>
        Yes, the API key is stored securely in your browser's local storage.
        If you delete the key from the text box, it will be removed from the cache.
        The key is only sent to the Torn servers, it is not stored or shared to anywhere else.
      </Typography>

      <Typography variant="h6" gutterBottom>
        What key access level or specific selections are required?
      </Typography>
      <Typography variant="body1" gutterBottom>
        The tools only need the 'Public' access level. This is the lowest level of access.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Enter your Torn API key here.
      </Typography>
      <TextField
        label="Torn API Key"
        variant="outlined"
        value={apiKey || ""}
        onChange={(e) => setApiKey(e.target.value || null)}
        sx={{ mt: 1 }}
      />
      <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
        If you don't have an API key you can get one from your{" "}
        <a
          href="https://www.torn.com/preferences.php#tab=api?&step=addNewKey&title=dangerworm&#39;s tools&type=1"
          target="_blank"
          rel="noopener noreferrer"
        >
          Torn settings page
        </a>
        .
      </Typography>

      {apiKey && (
        <>
        <Divider sx={{ my: 4 }} />
          {loading ? (
            <Loading message="Loading items..." />
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              Items loaded. You can now use the tools listed below. These can also be accessed from the navigation menu.
            </Alert>
          )}

          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            Tools
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid size={{ xs: 2, sm: 6 }}>
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
                    <li><Typography variant="body2">Go to the resale page</Typography></li>
                    <li><Typography variant="body2">Wait for the page to scan the market. Profitable listings will be moved to the top of the list as they are found</Typography></li>
                    <li><Typography variant="body2">Buy what you can afford and resell in the city for a profit</Typography></li>
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
      )}
    </>
  );
}

export default Home;
