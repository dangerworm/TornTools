import { useState, type MouseEvent } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import "../index.css";

interface TopAppBarProps {
  handleDrawerToggle: () => void;
}

function TopAppBar({ handleDrawerToggle }: TopAppBarProps) {
  const { dotNetUserDetails, clearAllUserData } = useUser();
  const navigate = useNavigate();
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
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
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

          <Typography variant="h6" noWrap component="div" className="geo">
            dangerworm's Torn Tools
          </Typography>
        </Box>

        <Box sx={{ ml: "auto" }}>
          {dotNetUserDetails ? (
            <>
              <Button
                color="inherit"
                onClick={handleOpenMenu}
                sx={{ textTransform: "none" }}
              >
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
                  className="geo"
                >
                  {dotNetUserDetails.name} [{dotNetUserDetails.id}]
                </Typography>
              </Button>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleCloseMenu}
              >
                <MenuItem onClick={() => handleMenuNavigation("/favourites")}>
                  Favourite markets
                </MenuItem>
                <MenuItem onClick={() => handleMenuNavigation("/settings")}>
                  User settings
                </MenuItem>
                <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              component={Link}
              to="/signin"
              sx={{ textTransform: "none" }}
            >
              <Typography variant="h6" noWrap component="div" className="geo">
                Sign in
              </Typography>
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopAppBar;
