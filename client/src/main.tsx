import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ItemsProvider } from "./contexts/ItemsContext.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";
import App from "./App.tsx";
import { ForeignStockItemsProvider } from "./contexts/ForeignStockItemsContext.tsx";

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
          <ForeignStockItemsProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <CssBaseline />
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <App />
              </BrowserRouter>
            </LocalizationProvider>
          </ForeignStockItemsProvider>
        </ItemsProvider>
      </UserProvider>
    </ThemeProvider>
  </StrictMode>
);
