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
  Button,
} from "@mui/material";
import Loading from "../components/Loading";
import { useUser } from "../hooks/useUser";

const SignIn = () => {
  const {
    apiKey,
    setApiKey,
    tornUserProfile,
    loadingTornUserProfile,
    errorTornUserProfile,
    confirmApiKeyAsync,
  } = useUser();

  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        Account Sign-In
      </Typography>

      <Typography variant="body1" gutterBottom>
        Adding your API key helps to make the system faster as your API key will
        be used to fetch data from Torn. This means that market scans will be
        quicker.
      </Typography>

      <Typography variant="body1" gutterBottom>
        Your API key will also be used to generate a user account for you on
        this website. This will allow you to access additional features that are
        not available to anonymous users. For example, you will be able to
        'favourite' markets and save your preferences.
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        API Key
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
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
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          {!errorTornUserProfile && apiKey && (
            <>
              {loadingTornUserProfile ? (
                <Loading message="Loading profile..." />
              ) : (
                <>
                  {errorTornUserProfile && (
                    <Alert severity="error" sx={{ mt: 2, width: "95%" }}>
                      {errorTornUserProfile}
                    </Alert>
                  )}

                  {!errorTornUserProfile && tornUserProfile && (
                    <Alert severity="success" sx={{ width: "90%" }}>
                      Profile loaded successfully.
                      <Paper
                        elevation={3}
                        sx={{ p: 2, mt: 2, mb: 1, width: "fit-content" }}
                      >
                        <Typography variant="body1" gutterBottom>
                          {tornUserProfile.name} [{tornUserProfile.id}]{" "}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {tornUserProfile.gender}, level{" "}
                          {tornUserProfile.level}
                        </Typography>
                        <Button variant="contained" sx={{ mt: 1 }} onClick={() => confirmApiKeyAsync()}>
                          Add API key and sign in
                        </Button>
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

export default SignIn;