import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  AccountCircle,
  AccountCircleOutlined,
  DarkMode,
  LightMode,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useUser } from "../hooks/useUser";
import { useThemeSettings } from "../hooks/useThemeSettings";
import "../index.css";
import ItemSearch from "./ItemSearch";

interface TopAppBarProps {
  handleDrawerToggle: () => void;
}

function TopAppBar({ handleDrawerToggle }: TopAppBarProps) {
  const navigate = useNavigate();
  const { dotNetUserDetails, clearAllUserData } = useUser();
  const { selectTheme, selectedThemeId } = useThemeSettings();

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => setMenuAnchor(null);

  const handleMenuNavigation = (path: string) => {
    navigate(path);
    handleCloseMenu();
  };

  const handleSignOut = () => {
    clearAllUserData();
    navigate("/");
    handleCloseMenu();
  };

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          {/* Hamburger only on small screens */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
            aria-label="open drawer"
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            className="geo"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            dangerworm's Torn Tools
          </Typography>
        </Box>

        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexGrow: 1,
            justifyContent: { xs: "flex-start", sm: "center" },
            mr: { xs: 1, sm: 0 },
          }}
        >
          <ItemSearch />
        </Box>

        {!dotNetUserDetails && (
          <Box sx={{ ml: "auto" }}>
            <IconButton color="inherit" aria-label="colour mode toggle">
              {selectedThemeId === 2 ? (
                <LightMode
                  onClick={() => void selectTheme(1)}
                  sx={{ fontSize: 32 }}
                />
              ) : (
                <DarkMode
                  onClick={() => void selectTheme(2)}
                  sx={{ fontSize: 32 }}
                />
              )}
            </IconButton>
          </Box>
        )}

        <Box sx={{ ml: "auto" }}>
          <IconButton
            color="inherit"
            onClick={handleOpenMenu}
            aria-label="user menu"
            aria-controls={menuAnchor ? "user-menu" : undefined}
            aria-haspopup="true"
          >
            {dotNetUserDetails ? (
              <AccountCircle sx={{ fontSize: 32 }} />
            ) : (
              <AccountCircleOutlined sx={{ fontSize: 32 }} />
            )}
          </IconButton>
          {dotNetUserDetails ? (
            <Menu
              id="user-menu"
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleCloseMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem
                disabled
                sx={(theme) => ({
                  color: theme.palette.text.primary,
                  opacity: "0.8 !important",
                  cursor: "default",
                })}
              >
                <Typography variant="body2">
                  {dotNetUserDetails.name} [{dotNetUserDetails.id}]
                </Typography>
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={() => handleMenuNavigation("/favourites")}>
                Favourite markets
              </MenuItem>
              <MenuItem onClick={() => handleMenuNavigation("/settings")}>
                User settings
              </MenuItem>
              <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
            </Menu>
          ) : (
            <Menu
              id="user-menu"
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleCloseMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={() => handleMenuNavigation("/signin")}>
                Sign in
              </MenuItem>
            </Menu>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopAppBar;
