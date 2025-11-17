import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link } from "react-router-dom";
import { useUser } from "../hooks/useUser";
import "../index.css";

interface TopAppBarProps {
  handleDrawerToggle: () => void;
}

function TopAppBar({ handleDrawerToggle }: TopAppBarProps) {
  const { dotNetUserDetails } = useUser();
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
          <Typography variant="h6" noWrap component="div" className="geo">
            <Link
              to="/signin"
              style={{ color: "inherit", textDecoration: "none" }}
            >
            {dotNetUserDetails ? (
              <>
                {dotNetUserDetails.name} [{dotNetUserDetails.id}]
              </>
            ) : (
              <span>Sign in</span>
            )}
            </Link>
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default TopAppBar;
