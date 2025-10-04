import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App.tsx";
import { ItemsProvider } from "./contexts/ItemsContext.tsx";

const theme = createTheme({
  palette: { mode: "light" }, // change to 'dark' if you like
  typography: {
    fontFamily: `"Roboto", system-ui, Avenir, Helvetica, Arial, sans-serif`,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <ItemsProvider>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ItemsProvider>
    </ThemeProvider>
  </StrictMode>
);
