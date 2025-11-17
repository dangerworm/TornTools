import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App.tsx";
import { ItemsProvider } from "./contexts/ItemsContext.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";

const theme = createTheme({
  palette: { mode: "light" }, // change to 'dark' if you like
  typography: {
    fontFamily: `"Roboto", system-ui, Avenir, Helvetica, Arial, sans-serif`,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <UserProvider>
      <ItemsProvider>
        <CssBaseline />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </ItemsProvider>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>
);
