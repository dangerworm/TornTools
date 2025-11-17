import { Alert, Divider, Paper, TextField, Typography } from "@mui/material";
import Loading from "../components/Loading";
import { useUser } from "../hooks/useUser";

export default function SignIn() {
  const { apiKey, userDetails, setApiKey, loading, error } = useUser();

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
        Yes, the API key is stored securely in your browser's local storage. If
        you delete the key from the text box, it will be removed from the cache.
        The key is only sent to the Torn servers, it is not stored or shared to
        anywhere else.
      </Typography>

      <Typography variant="h6" gutterBottom>
        What key access level or specific selections are required?
      </Typography>
      <Typography variant="body1" gutterBottom>
        The tools only need the 'Public' access level. This is the lowest level
        of access.
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

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!error && apiKey && (
        <>
          {loading ? (
            <Loading message="Loading items..." />
          ) : (
            <>
              <Alert severity="success" sx={{ mt: 2 }}>
                Profile loaded. You can now use the tools in the navigation
                menu.
              </Alert>

              {userDetails && (
                <Paper elevation={3} sx={{ p: 2, mt: 2, width: "fit-content" }}>
                  <Typography variant="body1" gutterBottom>
                    {userDetails.name} [{userDetails.id}]{" "}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    {userDetails.gender}, level {userDetails.level}
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
                    Status: {userDetails.status.description}{" "}
                    {userDetails.status.state === "Traveling" &&
                      `(via ${userDetails.status.travel_type})`}{" "}
                    <br />
                  </Typography>
                </Paper>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
