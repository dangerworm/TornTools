import { AppBar, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import "../index.css";

interface TopAppBarProps {
  apiKey: string | null;
  handleDrawerToggle: () => void;
}

function TopAppBar({ apiKey, handleDrawerToggle }: TopAppBarProps) {
  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar>
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

        {apiKey && (
          <Typography
            variant="h6"
            noWrap
            component="div"
            color={"rgb(127,192,255)"}
            sx={{ fontSize: "1.04rem", ml: 4 }}
          >
            API key: {apiKey}
          </Typography>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default TopAppBar;
