import { createTheme } from '@mui/material'

const PRIMARY = '#c8960c'
const SECONDARY = '#8b1a2c'

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
    fontFamily: '"Roboto", system-ui, sans-serif',
    h1: { fontFamily: '"Passero One", sans-serif' },
    h2: { fontFamily: '"Passero One", sans-serif' },
    h3: { fontFamily: '"Passero One", sans-serif' },
    h4: { fontFamily: '"Passero One", sans-serif' },
    h5: { fontFamily: '"Passero One", sans-serif' },
    h6: { fontFamily: '"Passero One", sans-serif' },
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
        a: {
          color: PRIMARY,
          '&:visited': { color: PRIMARY },
        },
      },
    },
  },
})
