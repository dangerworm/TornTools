import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import { UserProvider } from "./contexts/UserContext.tsx";
import { ItemsProvider } from "./contexts/ItemsContext.tsx";
import { BazaarSummariesProvider } from "./contexts/BazaarSummariesContext.tsx";
import { BargainAlertsProvider } from "./contexts/BargainAlertsContext.tsx";
import { appTheme } from "./theme/appTheme.ts";

import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MuiThemeProvider theme={appTheme}>
      <CssBaseline />
      <UserProvider>
        <ItemsProvider>
          <BazaarSummariesProvider>
            <BargainAlertsProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
                  <App />
                </BrowserRouter>
              </LocalizationProvider>
            </BargainAlertsProvider>
          </BazaarSummariesProvider>
        </ItemsProvider>
      </UserProvider>
    </MuiThemeProvider>
  </StrictMode>
);
