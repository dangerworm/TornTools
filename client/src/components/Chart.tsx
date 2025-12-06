import { useMemo, useState } from 'react'
import { Alert, Card, CardContent, CardHeader, ToggleButton, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import {
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts'
import type { NameType, Payload } from 'recharts/types/component/DefaultTooltipContent'
import { getFormattedText, type PrefixUnit, type SuffixUnit } from '../lib/textFormat'
import { HISTORY_WINDOWS, type HistoryWindow, type ItemHistoryPoint } from '../types/history'
import Loading from './Loading'

const renderWindowToggle = (selected: HistoryWindow, onChange: (window: HistoryWindow) => void) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    value={selected}
    color="primary"
    onChange={(_, value) => value && onChange(value)}
  >
    {HISTORY_WINDOWS.map((window) => (
      <ToggleButton key={window.value} value={window.value}>
        {window.label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
)

interface ChartProps {
  chartType: 'area' | 'bar'
  dataColour: string
  itemId: number | undefined
  valueLabel?: string
  valuePrefix?: PrefixUnit
  valueSuffix?: SuffixUnit
  title?: string
  yAxisLabel?: string
  dataFunction: (
    itemId: number | undefined,
    window: HistoryWindow,
  ) => {
    data: ItemHistoryPoint[]
    loading: boolean
    error: string | null
  }
}

const Chart = ({
  chartType,
  dataColour,
  dataFunction,
  itemId,
  valueLabel,
  valuePrefix,
  valueSuffix,
  title,
  yAxisLabel,
}: ChartProps) => {
  const theme = useTheme()

  const [timeWindow, setTimeWindow] = useState<HistoryWindow>('1w')

  const { data, loading, error } = dataFunction(itemId, timeWindow)

  const axisColor = theme.palette.text.secondary
  const gridColor = alpha(theme.palette.text.primary, 0.12)

  const tickFormat = { fontSize: 13 }

  const ticks: number[] = useMemo(() => {
    if (!data || data.length === 0) return []

    const minValue = Math.min(...data.map((point) => point.value))
    const maxValue = Math.max(...data.map((point) => point.value))

    let powers = 0
    while (maxValue >= Math.pow(10, powers + 1)) {
      powers += 1
    }
    
    let tickDelta = Math.pow(10, powers)
    let minTickValue = Math.floor(minValue / tickDelta) * tickDelta
    let maxTickValue = Math.ceil(maxValue / tickDelta) * tickDelta

    const numberOfTicks = (maxTickValue - minTickValue) / tickDelta

    if (numberOfTicks < 6) {
      tickDelta /= (6 - numberOfTicks)
      tickDelta = Math.max(1, Math.round(tickDelta)) // Don't round to 0

      minTickValue = Math.floor(minValue / tickDelta) * tickDelta
      maxTickValue = Math.ceil(maxValue / tickDelta) * tickDelta
    }

    const ticks = []
    for (
      let i = Math.max(0, minTickValue - tickDelta); 
      i <= maxTickValue + (tickDelta === 1 || maxTickValue - maxValue > (tickDelta / 2)
        ? 0 
        : tickDelta); 
      i += tickDelta
    ) {
      ticks.push(i)
    };
    return ticks
  }, [data])

  const timestampFormatter = useMemo(() => {
    if (timeWindow === '30m' || timeWindow === '1h' || timeWindow === '4h') {
      return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
    }

    if (timeWindow === '1d') {
      return new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    }

    if (timeWindow === '1w' || timeWindow === '1m') {
      return new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    }

    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }, [timeWindow])

  const formatTimestamp = useMemo(
    () => (value: number) => timestampFormatter.format(new Date(value)),
    [timestampFormatter],
  )

  const formatValue = useMemo(
    () => (value: number) => getFormattedText(valuePrefix ?? '', value, valueSuffix ?? ''),
    [valuePrefix, valueSuffix],
  )

  interface CustomTooltipProps {
    active?: boolean
    label?: number
    payload?: Payload<number, NameType>[]
  }

  const CustomTooltip = ({ active, label, payload }: CustomTooltipProps) => {
    if (!active || !payload?.length) {
      return null
    }

    const value = payload[0].value

    return (
      <div
        style={{
          padding: '4px 8px',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid #444',
          borderRadius: 6,
          fontSize: '0.8rem',
          color: '#fff',
        }}
      >
        <div>{formatTimestamp(label!)}</div>
        <div>
          {valueLabel ?? 'Value'}: {formatValue(value!)}
        </div>
      </div>
    )
  }

  return (
    <Card elevation={2} sx={{ backgroundColor: 'background.paper', height: '100%' }}>
      <CardHeader
        action={renderWindowToggle(timeWindow, setTimeWindow)}
        sx={{ pb: 0 }}
        title={title}
      />
      <CardContent>
        {loading && !error && <Loading />}
        {!loading && error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && !data?.length && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No data available.
          </Typography>
        )}
        {!loading && !error && data?.length && (
          <>
            {chartType === 'area' && (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={data}
                  margin={{
                    left: Math.max(...data.map((p) => p.value)).toLocaleString().length,
                    right: 10,
                    top: 10,
                  }}
                >
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={dataColour} stopOpacity={0.6} />
                      <stop offset="95%" stopColor={dataColour} stopOpacity={0.05} />
                    </linearGradient>
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
                  />
                  <Tooltip content={CustomTooltip} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={dataColour}
                    fill="url(#priceGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartType === 'bar' && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: 20 }}>
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
                  <Bar dataKey="value" fill={dataColour} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default Chart
