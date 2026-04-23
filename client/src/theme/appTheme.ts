import { createTheme } from '@mui/material'

const PRIMARY = '#c8960c'
const SECONDARY = '#8b1a2c'

const DISPLAY_FONT = '"Passero One", serif'
const BODY_FONT = '"IBM Plex Sans", system-ui, -apple-system, sans-serif'
const MONO_FONT = '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace'

// Subtle grain — inline SVG noise overlay. Low alpha so it only adds
// atmosphere. Kept in the theme so it follows the background colour.
const GRAIN_URL =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 0.75 0 0 0 0 0.05 0 0 0 0.035 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")"

declare module '@mui/material/styles' {
  interface TypographyVariants {
    tabular: React.CSSProperties
  }

  interface TypographyVariantsOptions {
    tabular?: React.CSSProperties
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    tabular: true
  }
}

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: PRIMARY },
    secondary: { main: SECONDARY },
    background: {
      default: '#0c0e12',
      paper: '#131519',
    },
    text: {
      primary: '#e8e4d8',
      secondary: '#908880',
    },
  },
  typography: {
    fontFamily: BODY_FONT,
    h1: { fontFamily: DISPLAY_FONT, letterSpacing: '0.01em' },
    h2: { fontFamily: DISPLAY_FONT, letterSpacing: '0.01em' },
    h3: { fontFamily: DISPLAY_FONT, letterSpacing: '0.01em' },
    h4: { fontFamily: DISPLAY_FONT, letterSpacing: '0.01em' },
    h5: { fontFamily: DISPLAY_FONT, letterSpacing: '0.01em' },
    h6: { fontFamily: DISPLAY_FONT, letterSpacing: '0.01em' },
    tabular: {
      fontFamily: MONO_FONT,
      fontFeatureSettings: '"tnum" 1, "zero" 1',
      letterSpacing: 0,
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0a0c10',
          borderBottom: '1px solid rgba(200, 150, 12, 0.18)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: '1px solid rgba(200, 150, 12, 0.12)' },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: PRIMARY,
          '&:visited': { color: PRIMARY },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: GRAIN_URL,
          backgroundRepeat: 'repeat',
          backgroundAttachment: 'fixed',
        },
        a: {
          color: PRIMARY,
          '&:visited': { color: PRIMARY },
        },
      },
    },
    MuiTableCell: {
      variants: [
        {
          props: { variant: 'body' },
          style: {
            // Default — overridden per-cell via className or sx where needed.
          },
        },
      ],
    },
  },
})
