import * as React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Alert,
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import TopAppBar from "./TopAppBar";
import Footer from "./Footer";
import { DRAWER_WIDTH } from "../constants";
import "../index.css";
import { useItems } from "../contexts/ItemsContext";

const menu = [
  { label: "Home", to: "/", icon: <HomeIcon />, requiresItems: false },
  { label: "Resale", to: "/resale", icon: <InfoIcon />, requiresItems: true },
  { label: "Trades", to: "/trades", icon: <InfoIcon />, requiresItems: true },
];

export default function Layout() {
  const { apiKey, items } = useItems();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  // Mark the left-nav item as selected when on that route (or a sub-route)
  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const drawerContent = (
    <div>
      {/* Spacer so content starts below the AppBar */}
      <Toolbar />
      <Divider />
      <List>
        {menu.map((item) => {
          if (item.requiresItems && (!items || items.length === 0)) {
            return null;
          }

          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              selected={isActive(item.to)}
              onClick={() => setMobileOpen(false)} // close temporary drawer after click
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}

        {!apiKey && (
          <Alert severity="info" sx={{ m: 2 }}>
            There are additional features available if you
            {" "}
            <NavLink to="/">
             add an API key
            </NavLink>
            .
          </Alert>
        )}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top AppBar */}
      <TopAppBar handleDrawerToggle={handleDrawerToggle} apiKey={apiKey} />

      {/* Left drawer area (responsive) */}
      <Box
        component="nav"
        aria-label="side navigation"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile: temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }} // better performance on mobile
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop: permanent drawer */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: "100vh", // ensure full height
          minWidth: `calc(100% - ${DRAWER_WIDTH}px)`, // prevent overflow
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {/* Spacer to push content below AppBar */}
        <Toolbar />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h3" gutterBottom className="passero-one">
            dangerworm's Torn Tools
          </Typography>
          <Outlet />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
}
