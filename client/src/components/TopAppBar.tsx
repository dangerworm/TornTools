import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
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
  createFilterOptions,
} from "@mui/material";
import {
  AccountCircle,
  AccountCircleOutlined,
  DarkMode,
  LightMode,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useUser } from "../hooks/useUser";
import { useItems } from "../hooks/useItems";
import { useThemeSettings } from "../hooks/useThemeSettings";
import "../index.css";

interface TopAppBarProps {
  handleDrawerToggle: () => void;
}

function TopAppBar({ handleDrawerToggle }: TopAppBarProps) {
  const { itemsById, items } = useItems();
  const { dotNetUserDetails, clearAllUserData } = useUser();
  const navigate = useNavigate();
  const { selectTheme, selectedThemeId } = useThemeSettings();

  useEffect(() => {
    console.log("selectedThemeId:", selectedThemeId);
  }, [selectedThemeId]);

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

  type ItemOption = { label: string; id: number };
  const filter = createFilterOptions<ItemOption>();

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
            fullWidth
            options={items.map((i) => ({ label: i.name, id: i.id }))}
            filterOptions={(options, state) => {
              const filtered = filter(options, state);
              return state.inputValue.length < 3 ? [] : filtered;
            }}
            noOptionsText="Please enter an item name"
            onChange={(_, value) => {
              if (value) {
                navigate(`/item/${value.id}`);
              }
            }}
            slotProps={{
              listbox: {
                sx: {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "#333" : "#fff",
                  borderRadius: 1,
                },
              },
              paper: {
                sx: (theme) => ({
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${
                    theme.palette.mode === "dark" ? "#555" : "#ccc"
                  }`,
                  color: theme.palette.text.primary,
                  scrollbarColor:
                    theme.palette.mode === "dark" ? "#555 #333" : "#ccc #fff",
                }),
              },
            }}
            sx={(theme) => ({
              borderRadius: 1,
              backgroundColor:
                theme.palette.mode === "dark"
                  ? theme.palette.background.paper
                  : "#fff",
              maxWidth: { xs: 450 },
            })}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search items..."
                size="small"
                variant="outlined"
              />
            )}
            renderOption={(_, option) => (
              <Box
                component="li"
                sx={{
                  alignItems: "center",
                  display: "flex",
                  m: 0.5,
                  pl: 1,
                  pb: 1,
                  "&:last-of-type": {
                    pb: 0,
                  },
                }}
              >
                <Box
                  sx={{
                    border: "1px solid #888",
                    borderRadius: 2,
                    display: "flex",
                    justifyContent: "center",
                    height: 40,
                    width: 40,
                  }}
                >
                  <img
                    alt=""
                    src={`https://www.torn.com/images/items/${option.id}/small.png`}
                    style={{
                      marginTop: "auto",
                      marginBottom: "auto",
                      height: 19,
                      width: 38,
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0, pl: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, m: 0 }}>
                    {option.label}
                  </Typography>
                  <Typography
                    component="p"
                    variant="caption"
                    sx={{ color: "text.secondary", mt: -0.2 }}
                  >
                    {itemsById[option.id]?.type}
                  </Typography>
                </Box>
              </Box>
            )}
          />
        </Box>

        {!dotNetUserDetails && (
          <Box sx={{ ml: "auto" }}>
            <IconButton
              color="inherit"
              aria-label="colour mode toggle"
            >
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
                sx={{
                  color: "#fff",
                  opacity: "0.8 !important",
                  cursor: "default",
                }}
              >
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
