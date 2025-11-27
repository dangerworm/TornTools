import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ItemsProvider } from "./contexts/ItemsContext.tsx";
import { UserProvider } from "./contexts/UserContext.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import App from "./App.tsx";
import { ForeignStockItemsProvider } from "./contexts/ForeignStockItemsContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UserProvider>
      <ThemeProvider>
        <ItemsProvider>
          <ForeignStockItemsProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <App />
              </BrowserRouter>
            </LocalizationProvider>
          </ForeignStockItemsProvider>
        </ItemsProvider>
      </ThemeProvider>
    </UserProvider>
  </StrictMode>
);
