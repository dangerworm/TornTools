import AccessTimeFilled from "@mui/icons-material/AccessTimeFilled";
import HomeIcon from "@mui/icons-material/Home";
import LanguageIcon from '@mui/icons-material/Language';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SellIcon from "@mui/icons-material/Sell";

export const DRAWER_WIDTH = 240; // px

export type MenuItem = {
  address: string;
  icon: React.ReactNode;
  requiresItems: boolean;
  requiresLogin: boolean;
  showOnHomePage: boolean;
  subTitle: string;
  title: string;
};

export const menuItems: MenuItem[] = [
  {
    address: "/",
    icon: <HomeIcon />,
    requiresItems: false,
    requiresLogin: false,
    showOnHomePage: false,
    subTitle: "",
    title: "Home",
  },
  {
    address: "/city-markets",
    icon: <LocationCityIcon />,
    requiresItems: true,
    requiresLogin: false,
    showOnHomePage: true,
    subTitle: "View the item markets for Torn City, including price history and favourite items.",
    title: "City Markets",
  },
  {
    address: "/foreign-markets",
    icon: <LanguageIcon />,
    requiresItems: true,
    requiresLogin: false,
    showOnHomePage: true,
    subTitle: "View markets from other countries around the world.",
    title: "Foreign Markets",
  },
  {
    address: "/settings",
    icon: <FavoriteIcon />,
    requiresItems: true,
    requiresLogin: true,
    showOnHomePage: true,
    subTitle: "Shows only the markets you have marked as favourites.",
    title: "My Favourites",
  },
  {
    address: "/resale",
    icon: <SellIcon />,
    requiresItems: true,
    requiresLogin: true,
    showOnHomePage: true,
    subTitle: "Checks the market for profitable resale listings.",
    title: "Resale",
  },
  {
    address: "/time",
    icon: <AccessTimeFilled />,
    requiresItems: false,
    requiresLogin: false,
    showOnHomePage: true,
    subTitle: "Convert between your local time and Torn City time (TCT).",
    title: "Time Calcs",
  },
];
