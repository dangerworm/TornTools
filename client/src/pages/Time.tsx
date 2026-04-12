import dayjs from 'dayjs'
import { Card, CardContent, Grid, Typography } from '@mui/material'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import type { PickerValue } from '@mui/x-date-pickers/internals'
import DateTimeDisplay from '../components/DateTimeDisplay'
import { useState } from 'react'

const Time = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const localPickerValue: PickerValue = selectedDate ? dayjs(selectedDate) : null

  const tctPickerValue: PickerValue = selectedDate
    ? (() => {
        const d = new Date()
        d.setHours(selectedDate.getUTCHours(), selectedDate.getUTCMinutes(), 0, 0)
        return dayjs(d)
      })()
    : null

  const handleLocalChange = (value: PickerValue | null) => {
    if (!value) {
      setSelectedDate(null)
      return
    }
    const d = new Date()
    d.setHours(value.hour(), value.minute(), 0, 0)
    setSelectedDate(d)
  }

  const handleTctChange = (value: PickerValue | null) => {
    if (!value) {
      setSelectedDate(null)
      return
    }
    const d = new Date()
    d.setUTCHours(value.hour(), value.minute(), 0, 0)
    setSelectedDate(d)
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Time Conversion
      </Typography>

      <Typography variant="body1" gutterBottom>
        If you're not in Iceland then chances are you'll occasionally need to convert between your
        local time and Torn City Time (TCT).
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Current Time
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                The current time in both your local timezone and Torn City.
              </Typography>
              <DateTimeDisplay asTornTime={false} label="Local" size={70} />
              <DateTimeDisplay asTornTime={true} label="Torn City" size={70} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Time Converter
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Pick a time in either field to convert between local and Torn City Time.
                Clear both pickers to return to the live view.
              </Typography>
              <DateTimeDisplay
                asTornTime={false}
                date={selectedDate ?? undefined}
                label="Local"
                showDate={false}
                size={70}
              >
                <TimePicker
                  label="Local Time"
                  value={localPickerValue}
                  onChange={handleLocalChange}
                />
              </DateTimeDisplay>
              <DateTimeDisplay
                asTornTime={true}
                date={selectedDate ?? undefined}
                label="Torn City"
                showDate={false}
                size={70}
              >
                <TimePicker
                  label="Torn City Time"
                  value={tctPickerValue}
                  onChange={handleTctChange}
                />
              </DateTimeDisplay>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default Time
