import { alpha, Box, Grid, Typography, useTheme } from '@mui/material'
import {
  SportsKabaddi as SportsKabaddiIcon,
  TrackChanges as TrackChangesIcon,
  Whatshot as WhatshotIcon,
  VisibilityOff as VisibilityOffIcon,
  Adjust as AdjustIcon,
  BubbleChart as BubbleChartIcon,
} from '@mui/icons-material'
import { type Item } from '../types/items'
import ShieldIcon from '@mui/icons-material/Shield'

interface ItemDetailsArmourStatsProps {
  item: Item
}

const ItemDetailsArmourStats = ({ item }: ItemDetailsArmourStatsProps) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const weaponStats = [
    {
      icon: <SportsKabaddiIcon />,
      label: 'Base Damage',
      value: item.detailsBaseStatsDamage,
    },
    {
      icon: <TrackChangesIcon />,
      label: 'Base Accuracy',
      value: item.detailsBaseStatsAccuracy,
    },
    {
      icon: <WhatshotIcon />,
      label: 'Rate of Fire',
      value: `${item.detailsAmmoRateOfFireMinimum}-${item.detailsAmmoRateOfFireMaximum} RPM`,
    },
    {
      icon: <VisibilityOffIcon />,
      label: 'Stealth Level',
      value: item.detailsStealthLevel,
    },
    {
      icon: <AdjustIcon />,
      label: 'Caliber',
      value: item.detailsAmmoName,
    },
    {
      icon: <BubbleChartIcon />,
      label: 'Ammo',
      value: item.detailsAmmoMagazineRounds,
    },
  ]

  return (
    <Box>
      <Grid container spacing={2} sx={{ my: 2 }}>
        <Grid
          size={{
            xs: 12,
            // sm: 6,
            // lg: 4,
          }}
        >
          <Box
            sx={{
              alignItems: 'center',
              borderRadius: 2,
              display: 'flex',
              background: isDark
                ? `linear-gradient(135deg,
                ${alpha(theme.palette.primary.light, 0.25)},
                ${alpha(theme.palette.background.default, 0.9)}
              )`
                : `linear-gradient(135deg,
                ${alpha(theme.palette.primary.light, 0.12)},
                ${theme.palette.grey[100]}
                )`,
              border: `1px solid ${
                isDark
                  ? alpha(theme.palette.primary.main, 0.5)
                  : alpha(theme.palette.primary.main, 0.3)
              }`,
              gap: 2,
              minHeight: '5em',
              p: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDark
                  ? alpha(theme.palette.common.black, 0.5)
                  : alpha(theme.palette.primary.main, 0.08),
              }}
            >
              <ShieldIcon sx={{ fontSize: 28 }} />
            </Box>

            <Box sx={{ lineHeight: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Armour
              </Typography>
              <Typography component={'p'} variant="caption" fontWeight="bold">
                {item.detailsBaseStatsArmor}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Loop through detailsCoverage
        {weaponStats.map(
          (stat) =>
            stat.showForCategory.includes(item.detailsCategory || '') && (
              <Grid size={{ xs: xsGridSize, sm: smGridSize, lg: lgGridSize }} key={stat.label}>
                <Box
                  sx={{
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    display: 'flex',
                    gap: 1.5,
                    minHeight: '5em',
                    p: 2,
                  }}
                >
                  {stat.icon}
                  <Box>
                    <Typography component={'p'} variant="caption" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography component={'p'} variant="caption" fontWeight="bold">
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ),
        )} */}
      </Grid>
    </Box>
  )
}

export default ItemDetailsArmourStats
