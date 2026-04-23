import AccessTimeFilled from '@mui/icons-material/AccessTimeFilled'
import CategoryIcon from '@mui/icons-material/Category'
import FavoriteIcon from '@mui/icons-material/Favorite'
import HomeIcon from '@mui/icons-material/Home'
import LanguageIcon from '@mui/icons-material/Language'
import LocationCityIcon from '@mui/icons-material/LocationCity'
import SellIcon from '@mui/icons-material/Sell'
import SettingsIcon from '@mui/icons-material/Settings'
import StorefrontIcon from '@mui/icons-material/Storefront'

export const DRAWER_WIDTH = 240 // px

export type MenuSection = 'markets' | 'utilities' | 'you'

export type MenuItem = {
  address: string
  icon: React.ReactNode
  requiresItems: boolean
  requiresLogin: boolean
  requiresAccessLevel?: number
  showOnHomePage: boolean
  section?: MenuSection
  subTitle: string
  title: string
}

export const SECTION_ORDER: MenuSection[] = ['markets', 'utilities', 'you']

export const SECTION_LABELS: Record<MenuSection, string> = {
  markets: 'Markets',
  utilities: 'Utilities',
  you: 'You',
}

export const menuItems: MenuItem[] = [
  {
    address: '/',
    icon: <HomeIcon />,
    requiresItems: false,
    requiresLogin: false,
    showOnHomePage: false,
    subTitle: '',
    title: 'Home',
  },
  {
    address: '/bazaar-prices',
    icon: <StorefrontIcon />,
    requiresItems: true,
    requiresLogin: true,
    requiresAccessLevel: 2,
    showOnHomePage: true,
    section: 'markets',
    subTitle: 'Look up the lowest current bazaar price for each item in your inventory.',
    title: 'Bazaar Price Lookup',
  },
  {
    address: '/city-markets',
    icon: <LocationCityIcon />,
    requiresItems: true,
    requiresLogin: true,
    showOnHomePage: true,
    section: 'markets',
    subTitle: 'View the item markets for Torn City, including price history and favourite items.',
    title: 'City Markets',
  },
  {
    address: '/foreign-markets',
    icon: <LanguageIcon />,
    requiresItems: true,
    requiresLogin: true,
    showOnHomePage: true,
    section: 'markets',
    subTitle: 'View markets from other countries around the world.',
    title: 'Foreign Markets',
  },
  {
    address: '/resale',
    icon: <SellIcon />,
    requiresItems: true,
    requiresLogin: true,
    showOnHomePage: true,
    section: 'markets',
    subTitle: 'Checks the market for profitable resale listings.',
    title: 'Resale',
  },
  {
    address: '/items',
    icon: <CategoryIcon />,
    requiresItems: true,
    requiresLogin: false,
    showOnHomePage: false,
    section: 'utilities',
    subTitle: 'Browse every item in the Torn catalogue.',
    title: 'All Items',
  },
  {
    address: '/time',
    icon: <AccessTimeFilled />,
    requiresItems: false,
    requiresLogin: false,
    showOnHomePage: true,
    section: 'utilities',
    subTitle: 'Convert between your local time and Torn City time (TCT).',
    title: 'Time',
  },
  {
    address: '/favourites',
    icon: <FavoriteIcon />,
    requiresItems: true,
    requiresLogin: true,
    showOnHomePage: false,
    section: 'you',
    subTitle: 'Quickly jump back to the items you follow the most.',
    title: 'Favourites',
  },
  {
    address: '/settings',
    icon: <SettingsIcon />,
    requiresItems: false,
    requiresLogin: true,
    showOnHomePage: false,
    section: 'you',
    subTitle: 'Update your API key and preferences.',
    title: 'Settings',
  },
]
