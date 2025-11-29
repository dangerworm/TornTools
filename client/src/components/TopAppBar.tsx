import { useState, type MouseEvent } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  TextField,
  Autocomplete,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import { useNavigate } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import "../index.css";
import { useItems } from "../hooks/useItems";

interface TopAppBarProps {
  handleDrawerToggle: () => void;
}

function TopAppBar({ handleDrawerToggle }: TopAppBarProps) {
  const { items } = useItems();
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
          <Autocomplete
            disablePortal
            options={items.map(i => ({label: i.name, id: i.id}))}
            onChange={(_, value) => {
              if (value) {
                navigate(`/item/${value.id}`);
              }
            }}
            sx={{
              borderRadius: 1,
              width: { xs: 250, sm: 300 },
              maxWidth: { xs: 250, sm: 400 },
            }}
            slotProps={{
              paper: {
                sx: (theme) => ({
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                }),
              },
            }}
            renderInput={(params) =>
              <TextField
                {...params}
                placeholder="Search items..."
                size="small"
                variant="outlined"
              />
            }
          />
        </Box>

        <Box sx={{ ml: "auto" }}>
          <IconButton
            color="inherit"
            onClick={handleOpenMenu}
            aria-label="user menu"
            aria-controls={menuAnchor ? "user-menu" : undefined}
            aria-haspopup="true"
            sx={{
              color: (theme) =>
                dotNetUserDetails
                  ? theme.palette.primary.contrastText
                  : theme.palette.action.active,
            }}
          >
            {dotNetUserDetails ? <AccountCircle /> : <AccountCircleOutlined />}
          </IconButton>
          <Menu
            id="user-menu"
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {dotNetUserDetails ? (
              <>
                <MenuItem disabled sx={{ opacity: 1, cursor: "default" }}>
                  <Typography variant="body2" component="div">
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
              </>
            ) : (
              <MenuItem onClick={() => handleMenuNavigation("/signin")}>
                Sign in
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopAppBar;
