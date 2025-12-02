import HomeIcon from "@mui/icons-material/Home";
import Sell from "@mui/icons-material/Sell";
import Assessment from "@mui/icons-material/Assessment";
import AccessTimeFilled from "@mui/icons-material/AccessTimeFilled";

export const DRAWER_WIDTH = 240; // px

export type MenuItem = {
  address: string;
  icon: React.ReactNode;
  requiresItems: boolean;
  showOnHomePage: boolean;
  subTitle: string;
  title: string;
};

export const menuItems: MenuItem[] = [
  {
    address: "/",
    icon: <HomeIcon />,
    requiresItems: false,
    showOnHomePage: false,
    subTitle: "",
    title: "Home",
  },
  {
    address: "/city-markets",
    icon: <Assessment />,
    requiresItems: true,
    showOnHomePage: true,
    subTitle: "View the item markets for Torn City, including price history and favourite items.",
    title: "City Markets",
  },
  {
    address: "/foreign-markets",
    icon: <Assessment />,
    requiresItems: true,
    showOnHomePage: true,
    subTitle: "View markets from other countries around the world.",
    title: "Foreign Markets",
  },
  {
    address: "/resale",
    icon: <Sell />,
    requiresItems: true,
    showOnHomePage: true,
    subTitle: "Checks the market for profitable resale listings.",
    title: "Resale",
  },
  {
    address: "/time",
    icon: <AccessTimeFilled />,
    requiresItems: false,
    showOnHomePage: true,
    subTitle: "Convert between your local time and Torn City time (TCT).",
    title: "Time Calcs",
  },
];
