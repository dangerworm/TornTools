import {
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  ToggleButton,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { NameType, Payload } from 'recharts/types/component/DefaultTooltipContent'
import { getFormattedText, type PrefixUnit, type SuffixUnit } from '../lib/textFormat'
import {
  HISTORY_WINDOWS_LARGE,
  HISTORY_WINDOWS_SMALL,
  type HistoryWindow,
  type ItemHistoryPoint,
} from '../types/history'
import Loading from './Loading'

export interface ChartSeries {
  name: string
  color: string
  data: ItemHistoryPoint[]
  fillOpacity?: number
}

interface ChartProps {
  chartType: 'area' | 'bar'
  series: ChartSeries[]
  loading?: boolean
  error?: string | null
  timeWindow: HistoryWindow
  onTimeWindowChange: (window: HistoryWindow) => void
  valueLabel?: string
  valuePrefix?: PrefixUnit
  valueSuffix?: SuffixUnit
  title?: string
  yAxisLabel?: string
}

// Merge the timestamps across all series into one ordered set so recharts
// can plot them on a shared X axis. Each series contributes a keyed column
// named after the series.
type MergedPoint = { timestamp: number } & Record<string, number | undefined>

const mergeSeriesForChart = (series: ChartSeries[]): MergedPoint[] => {
  const byTimestamp = new Map<number, MergedPoint>()
  series.forEach((s) => {
    s.data.forEach((point) => {
      const existing = byTimestamp.get(point.timestamp) ?? { timestamp: point.timestamp }
      existing[s.name] = point.value
      byTimestamp.set(point.timestamp, existing)
    })
  })
  return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp)
}

const Chart = ({
  chartType,
  series,
  loading = false,
  error = null,
  timeWindow,
  onTimeWindowChange,
  valueLabel,
  valuePrefix,
  valueSuffix,
  title,
  yAxisLabel,
}: ChartProps) => {
  const isSmallScreen = useMediaQuery((theme: any) => theme.breakpoints.down('lg'))
  const theme = useTheme()

  const axisColor = theme.palette.text.secondary
  const gridColor = alpha(theme.palette.text.primary, 0.12)
  const tickFormat = { fontSize: 13 }

  const mergedData = useMemo(() => mergeSeriesForChart(series), [series])

  const allValues = useMemo(() => {
    const values: number[] = []
    series.forEach((s) => s.data.forEach((p) => values.push(p.value)))
    return values
  }, [series])

  const ticks: number[] = useMemo(() => {
    if (allValues.length === 0) return []

    const minValue = Math.min(...allValues)
    const maxValue = Math.max(...allValues)

    let powers = 0
    while (maxValue >= Math.pow(10, powers + 1)) {
      powers += 1
    }

    let tickDelta = Math.pow(10, powers)
    let minTickValue = Math.floor(minValue / tickDelta) * tickDelta
    let maxTickValue = Math.ceil(maxValue / tickDelta) * tickDelta

    const numberOfTicks = (maxTickValue - minTickValue) / tickDelta

    if (numberOfTicks < 6) {
      tickDelta /= 6 - numberOfTicks
      tickDelta = Math.max(1, Math.round(tickDelta))

      minTickValue = Math.floor(minValue / tickDelta) * tickDelta
      maxTickValue = Math.ceil(maxValue / tickDelta) * tickDelta
    }

    const ticks = []
    for (
      let i = Math.max(0, minTickValue - tickDelta);
      i <=
      maxTickValue + (tickDelta === 1 || maxTickValue - maxValue > tickDelta / 2 ? 0 : tickDelta);
      i += tickDelta
    ) {
      ticks.push(i)
    }
    return ticks
  }, [allValues])

  const timestampFormatter = useMemo(() => {
    if (timeWindow === '1h' || timeWindow === '4h' || timeWindow === '1d') {
      return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    } else {
      return new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    }
  }, [timeWindow])

  const formatTimestamp = useMemo(
    () => (value: number) => timestampFormatter.format(new Date(value)),
    [timestampFormatter],
  )

  const formatValue = useMemo(
    () => (value: number) => getFormattedText(valuePrefix ?? '', value, valueSuffix ?? ''),
    [valuePrefix, valueSuffix],
  )

  // Widen the Y-axis gutter to fit the longest tick label. See previous
  // commit for the reasoning.
  const yAxisWidth = useMemo(() => {
    if (!ticks.length) return 60
    const longest = ticks.reduce((max, t) => Math.max(max, formatValue(t).length), 0)
    return Math.max(60, longest * 7 + 14)
  }, [ticks, formatValue])

  interface CustomTooltipProps {
    active?: boolean
    label?: number
    payload?: Payload<number, NameType>[]
  }

  const CustomTooltip = ({ active, label, payload }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null
    return (
      <Box
        sx={{
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          color: theme.palette.text.primary,
          fontSize: '0.8rem',
          p: '4px 8px',
        }}
      >
        <Box>Time: {formatTimestamp(label!)}</Box>
        {payload.map((p) => (
          <Box key={p.dataKey as string} sx={{ color: p.color }}>
            {p.name}: {p.value != null ? formatValue(p.value as number) : '—'}
          </Box>
        ))}
      </Box>
    )
  }

  const renderWindowToggle = (
    selected: HistoryWindow,
    onChange: (window: HistoryWindow) => void,
  ) => (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={selected}
      color="primary"
      onChange={(_, value) => value && onChange(value)}
    >
      {(isSmallScreen ? HISTORY_WINDOWS_SMALL : HISTORY_WINDOWS_LARGE).map((window) => (
        <ToggleButton key={window.value} value={window.value}>
          {window.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )

  const hasAnyData = series.some((s) => s.data.length > 0)

  return (
    <Card elevation={2} sx={{ backgroundColor: 'background.paper', height: '100%' }}>
      <CardHeader
        action={renderWindowToggle(timeWindow, onTimeWindowChange)}
        sx={{ pb: 0 }}
        title={title}
      />
      <CardContent>
        {loading && !error && <Loading />}
        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && !hasAnyData && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No data available.
          </Typography>
        )}
        {!loading && !error && hasAnyData && (
          <>
            {series.length > 1 && (
              <Stack direction="row" spacing={2} sx={{ mb: 1, pl: 1 }}>
                {series.map((s) => (
                  <Box key={s.name} sx={{ alignItems: 'center', display: 'flex', gap: 0.75 }}>
                    <Box
                      sx={{
                        backgroundColor: s.color,
                        borderRadius: 0.5,
                        height: 10,
                        width: 14,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {s.name}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {chartType === 'area' && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={mergedData}
                  margin={{
                    right: 8,
                    top: 10,
                  }}
                >
                  <defs>
                    {series.map((s, i) => (
                      <linearGradient
                        key={s.name}
                        id={`priceGradient-${i}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor={s.color} stopOpacity={s.fillOpacity ?? 0.6} />
                        <stop offset="95%" stopColor={s.color} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={formatTimestamp}
                    stroke={axisColor}
                    tick={tickFormat}
                  />
                  <YAxis
                    domain={() => [Math.min(...ticks), Math.max(...ticks)]}
                    stroke={axisColor}
                    tick={tickFormat}
                    tickFormatter={formatValue}
                    ticks={ticks}
                    width={yAxisWidth}
                  />
                  <Tooltip content={CustomTooltip} />
                  {series.map((s, i) => (
                    <Area
                      key={s.name}
                      type="monotone"
                      name={s.name}
                      dataKey={s.name}
                      stroke={s.color}
                      fill={`url(#priceGradient-${i})`}
                      strokeWidth={2}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartType === 'bar' && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={mergedData}
                  margin={{
                    left: 8,
                    right: 8,
                    top: 10,
                  }}
                >
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    padding={{ left: 24, right: 24 }}
                    tickFormatter={formatTimestamp}
                    stroke={axisColor}
                    tick={tickFormat}
                  />
                  <YAxis
                    allowDecimals={false}
                    domain={['dataMin', 'dataMax']}
                    label={
                      yAxisLabel && {
                        value: yAxisLabel,
                        angle: -90,
                        position: 'insideLeft',
                      }
                    }
                    stroke={axisColor}
                    tick={tickFormat}
                    ticks={ticks}
                  />
                  <Tooltip content={CustomTooltip} />
                  {series.map((s) => (
                    <Bar
                      key={s.name}
                      name={s.name}
                      dataKey={s.name}
                      fill={s.color}
                      maxBarSize={40}
                      radius={[6, 6, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}

            {valueLabel && <Legend content={() => null} />}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default Chart
