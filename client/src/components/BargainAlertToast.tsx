import { Avatar, Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useEffect, useState } from 'react'
import { useBargainAlerts } from '../hooks/useBargainAlerts'
import { useItems } from '../hooks/useItems'
import type { BargainAlert } from '../types/bargainAlerts'

// Top-of-viewport persistent stack. Renders nothing for unauthorised
// users, so it's safe to mount globally.
export default function BargainAlertToast() {
  const { authorised, alerts, dismiss } = useBargainAlerts()

  if (!authorised || alerts.length === 0) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        zIndex: (theme) => theme.zIndex.snackbar,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: 360,
        width: 'calc(100vw - 32px)',
      }}
    >
      {alerts.map((alert) => (
        <BargainAlertCard key={alert.id} alert={alert} onDismiss={() => void dismiss(alert.id)} />
      ))}
    </Box>
  )
}

const tornMarketUrl = (itemId: number) =>
  `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`

const formatMoney = (n: number) => `$${n.toLocaleString('en-US')}`

const formatElapsed = (foundAt: string) => {
  const ms = Date.now() - new Date(foundAt).getTime()
  if (ms < 0) return 'just now'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s ago`
  const h = Math.floor(m / 60)
  return `${h}h ${m % 60}m ago`
}

interface CardProps {
  alert: BargainAlert
  onDismiss: () => void
}

function BargainAlertCard({ alert, onDismiss }: CardProps) {
  const { itemsById } = useItems()
  const item = itemsById[alert.itemId]

  // Re-render every second so the "time since" counter ticks live.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Computed inline rather than memoised: the setInterval above triggers
  // a re-render every second and we want a fresh elapsed string each time.
  // Memoising on alert.foundAt would freeze the value because foundAt
  // never changes for the lifetime of an alert row.
  const elapsed = formatElapsed(alert.foundAt)

  return (
    <Paper
      elevation={6}
      sx={{
        p: 1.5,
        bgcolor: 'background.paper',
        borderLeft: '4px solid',
        borderLeftColor: 'warning.main',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {item?.image ? (
          <Avatar
            src={item.image}
            alt={item?.name ?? `Item ${alert.itemId}`}
            variant="rounded"
            sx={{ width: 48, height: 48, bgcolor: 'transparent' }}
          />
        ) : (
          <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: 'warning.dark' }}>
            <LocalFireDepartmentIcon />
          </Avatar>
        )}

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {item?.name ?? `Item ${alert.itemId}`}
            </Typography>
            <Chip
              size="small"
              icon={<LocalFireDepartmentIcon />}
              color="warning"
              label="Bargain"
              sx={{ height: 20 }}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Listed for <strong>{formatMoney(alert.listingPrice)}</strong>, sells for{' '}
            <strong>{formatMoney(alert.marketValue)}</strong>
          </Typography>
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
            +{formatMoney(alert.profit)} profit
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
            <Typography variant="caption" color="text.secondary">
              {elapsed}
            </Typography>
            <Tooltip title="Open on Torn market">
              <IconButton
                size="small"
                component="a"
                href={tornMarketUrl(alert.itemId)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ ml: 'auto' }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <IconButton size="small" onClick={onDismiss} aria-label="Dismiss">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  )
}
