import { useMemo, useState } from 'react'
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useThemeSettings } from '../hooks/useThemeSettings'
import { useUser } from '../hooks/useUser'
import type { ThemeInput, ThemeMode } from '../types/themes'
import Loading from '../components/Loading'

const UserSettings = () => {
  const {
    apiKey,
    setApiKey,
    tornUserProfile,
    loadingTornUserProfile,
    errorTornUserProfile,
    confirmApiKeyAsync,
  } = useUser()
  const { availableThemes, selectedThemeId, selectTheme, saveTheme, applyingTheme } =
    useThemeSettings()

  const [themeForm, setThemeForm] = useState<ThemeInput>({
    name: 'Custom Theme',
    mode: 'light',
    primaryColor: '#1976d2',
    secondaryColor: '#9c27b0',
  })

  const handleThemeFieldChange = (field: keyof ThemeInput, value: string | ThemeMode) => {
    setThemeForm((prev) => ({ ...prev, [field]: value }))
  }

  const currentSelection = useMemo(
    () => availableThemes.find((t) => t.id === selectedThemeId),
    [availableThemes, selectedThemeId],
  )

  const handleSaveTheme = async () => {
    const saved = await saveTheme(themeForm)
    if (saved) {
      setThemeForm((prev) => ({ ...prev, name: `${saved.name} (copy)` }))
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Settings
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            API Key
          </Typography>
          <Typography variant="body2" gutterBottom>
            Update your Torn API key or re-confirm it if you generated a new one.
          </Typography>
          <Stack spacing={2} sx={{ mt: 1, width: '100%' }}>
            <TextField
              label="Torn API Key"
              variant="outlined"
              value={apiKey || ''}
              onChange={(e) => setApiKey(e.target.value || null)}
              fullWidth
            />
            {loadingTornUserProfile && <Loading message="Checking API key..." />}
            {errorTornUserProfile && <Alert severity="error">{errorTornUserProfile}</Alert>}
            {tornUserProfile && (
              <Alert severity="success">
                Loaded profile: {tornUserProfile.name} [{tornUserProfile.id}]
              </Alert>
            )}
            <Box>
              <Button
                variant="contained"
                onClick={() => confirmApiKeyAsync()}
                disabled={!apiKey || loadingTornUserProfile}
              >
                Save API key
              </Button>
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Theme & Appearance
          </Typography>
          <Typography variant="body2" gutterBottom>
            Switch between light and dark modes or build your own colour scheme.
          </Typography>

          <Paper sx={{ p: 2, mt: 1 }} elevation={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="theme-select-label">Active theme</InputLabel>
              <Select
                labelId="theme-select-label"
                value={selectedThemeId ?? ''}
                label="Active theme"
                onChange={(e) => {
                  const value = `${e.target.value}`
                  const nextThemeId = value === '' ? null : Number(value)
                  void selectTheme(nextThemeId)
                }}
              >
                {availableThemes.map((theme) => (
                  <MenuItem key={theme.id} value={theme.id}>
                    {theme.name} ({theme.mode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Create a custom theme
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Name"
                  value={themeForm.name}
                  onChange={(e) => handleThemeFieldChange('name', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="mode-select-label">Mode</InputLabel>
                  <Select
                    labelId="mode-select-label"
                    value={themeForm.mode}
                    label="Mode"
                    onChange={(e) => handleThemeFieldChange('mode', e.target.value as ThemeMode)}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="color"
                  label="Primary colour"
                  value={themeForm.primaryColor}
                  onChange={(e) => handleThemeFieldChange('primaryColor', e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  type="color"
                  label="Secondary colour"
                  value={themeForm.secondaryColor}
                  onChange={(e) => handleThemeFieldChange('secondaryColor', e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={handleSaveTheme}
              disabled={applyingTheme}
            >
              Save theme
            </Button>

            {currentSelection && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Theme changed successfully</AlertTitle>
                <Typography variant="body2" gutterBottom>
                  Active theme: {currentSelection.name} ({currentSelection.mode})
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default UserSettings
