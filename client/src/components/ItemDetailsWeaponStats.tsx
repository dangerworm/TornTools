import type { JSX } from 'react'
import { alpha, Box, Grid, Typography, useTheme, type SvgIconProps } from '@mui/material'
import {
  Category as CategoryIcon,
  SportsKabaddi as SportsKabaddiIcon,
  TrackChanges as TrackChangesIcon,
  Whatshot as WhatshotIcon,
  VisibilityOff as VisibilityOffIcon,
  Adjust as AdjustIcon,
  BubbleChart as BubbleChartIcon,
} from '@mui/icons-material'
import { type Item } from '../types/items'
import {
  MeleeWeaponIcon,
  PrimaryWeaponIcon,
  SecondaryWeaponIcon,
  TemporaryWeaponIcon,
} from './TornIcons'

const categoryIcons: Record<string, (props: SvgIconProps) => JSX.Element> = {
  Primary: PrimaryWeaponIcon,
  Secondary: SecondaryWeaponIcon,
  Melee: MeleeWeaponIcon,
  Temporary: TemporaryWeaponIcon,
}

interface ItemDetailsWeaponStatsProps {
  item: Item
}

const ItemDetailsWeaponStats = ({ item }: ItemDetailsWeaponStatsProps) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const categoryIconColor = isDark ? theme.palette.grey[300] : theme.palette.grey[700]

  const CategoryIconComponent =
    (item.detailsCategory && categoryIcons[item.detailsCategory]) || CategoryIcon

  const weaponStats = [
    {
      icon: <SportsKabaddiIcon />,
      label: 'Base Damage',
      showForCategory: ['Primary', 'Secondary', 'Melee', 'Temporary'],
      value: item.detailsBaseStatsDamage,
    },
    {
      icon: <TrackChangesIcon />,
      label: 'Base Accuracy',
      showForCategory: ['Primary', 'Secondary', 'Melee', 'Temporary'],
      value: item.detailsBaseStatsAccuracy,
    },
    {
      icon: <WhatshotIcon />,
      label: 'Rate of Fire',
      showForCategory: ['Primary', 'Secondary'],
      value: `${item.detailsAmmoRateOfFireMinimum}-${item.detailsAmmoRateOfFireMaximum} RPM`,
    },
    {
      icon: <VisibilityOffIcon />,
      label: 'Stealth Level',
      showForCategory: ['Primary', 'Secondary', 'Melee', 'Temporary'],
      value: item.detailsStealthLevel,
    },
    {
      icon: <AdjustIcon />,
      label: 'Caliber',
      showForCategory: ['Primary', 'Secondary'],
      value: item.detailsAmmoName,
    },
    {
      icon: <BubbleChartIcon />,
      label: 'Ammo',
      showForCategory: ['Primary', 'Secondary'],
      value: item.detailsAmmoMagazineRounds,
    },
  ]

  const isPrimaryOrSecondary =
    item.detailsCategory === 'Primary' || item.detailsCategory === 'Secondary'

  const xsGridSize = 6
  const smGridSize = isPrimaryOrSecondary ? 4 : 3
  const lgGridSize = isPrimaryOrSecondary ? 2 : 3

  return (
    <Box>
      <Grid container spacing={2} sx={{ my: 2 }}>
        <Grid
          size={{
            xs: isPrimaryOrSecondary ? 12 : xsGridSize,
            sm: isPrimaryOrSecondary ? 12 : smGridSize,
            lg: isPrimaryOrSecondary ? 12 : lgGridSize,
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
              <CategoryIconComponent sx={{ fontSize: 28, color: categoryIconColor }} />
            </Box>

            <Box sx={{ lineHeight: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Weapon Type
              </Typography>
              <Typography component={'p'} variant="caption" fontWeight="bold">
                {item.detailsCategory}
              </Typography>
            </Box>
          </Box>
        </Grid>

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
        )}
      </Grid>
    </Box>
  )
}

export default ItemDetailsWeaponStats
