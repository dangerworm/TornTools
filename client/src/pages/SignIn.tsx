import {
  Alert,
  Divider,
  Paper,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
} from "@mui/material";
import Loading from "../components/Loading";
import { useUser } from "../hooks/useUser";

export default function SignIn() {
  const { apiKey, dotNetUserDetails, setApiKey, loading, error } = useUser();

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

      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        API Key
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
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
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {!error && apiKey && (
            <>
              {loading ? (
                <Loading message="Loading profile..." />
              ) : (
                <>
                  {error && (
                    <Alert severity="error" sx={{ mt: 2, width: "95%" }}>
                      {error}
                    </Alert>
                  )}

                  {!error && dotNetUserDetails && (
                    <Alert severity="success" sx={{ mt: 2, width: "90%" }}>
                      Profile loaded. You can now use the tools in the
                      navigation menu.
                      <Paper
                        elevation={3}
                        sx={{ p: 2, mt: 2, mb: 1, width: "fit-content" }}
                      >
                        <Typography variant="body1" gutterBottom>
                          {dotNetUserDetails.name} [{dotNetUserDetails.id}]{" "}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {dotNetUserDetails.gender}, level{" "}
                          {dotNetUserDetails.level}
                        </Typography>
                      </Paper>
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 2, width: "95%" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data Storage</TableCell>
              <TableCell>Data Sharing</TableCell>
              <TableCell>Purpose of Use</TableCell>
              <TableCell>Key Storage & Sharing</TableCell>
              <TableCell>Key Access Level</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Will the data be stored for any purpose?</TableCell>
              <TableCell>
                Who can access the data besides the end user?
              </TableCell>
              <TableCell>What is the stored data being used for?</TableCell>
              <TableCell>
                Will the API key be stored securely and who can access it?
              </TableCell>
              <TableCell>
                What key access level or specific selections are required?
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ color: "darkred" }}>
                Persistent - until account deletion
              </TableCell>
              <TableCell sx={{ color: "darkred" }}>General public</TableCell>
              <TableCell sx={{ color: "darkred" }}>
                Public community tools
              </TableCell>
              <TableCell sx={{ color: "darkred" }}>
                Stored/used only for automation
              </TableCell>
              <TableCell sx={{ color: "darkred" }}>Public</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
