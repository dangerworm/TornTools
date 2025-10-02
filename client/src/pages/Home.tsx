import {
  Card,
  CardContent,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router";

interface HomeProps {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
}

function Home({ apiKey, setApiKey }: HomeProps) {
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
      <Typography variant="body1" gutterBottom>
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

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        Tools
      </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid size={{ xs: 2, sm: 6 }}>
          <Card variant="outlined" sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                <Link to="/resale" className="no-underline">
                  Market
                </Link>
              </Typography>
              <Typography variant="body1">- Market Price Checker</Typography>
              <Typography variant="body1">- Item Price History</Typography>
              <Typography variant="h6">Feature 1</Typography>
              <Typography variant="body1">Description of feature 1.</Typography>
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
