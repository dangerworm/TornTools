import { Card, CardContent, Grid, Typography } from '@mui/material'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import type { PickerValue } from '@mui/x-date-pickers/internals'
import DateTimeDisplay from '../components/DateTimeDisplay'
import { useState } from 'react'

const Time = () => {
  const [tctTime, setTctTime] = useState<PickerValue | null>(null)

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
                Local Time to TCT
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
                TCT to Local Time
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Enter the Torn City time (TCT) you want to convert to your local time.
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <DateTimeDisplay
                    asTornTime={false}
                    date={tctTime?.toDate() ?? new Date()}
                    label="Local"
                    showDate={false}
                    size={70}
                  />
                  <DateTimeDisplay
                    asTornTime={true}
                    date={tctTime?.toDate() ?? new Date()}
                    label="Torn City"
                    showDate={false}
                    size={70}
                  />
                </Grid>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <TimePicker
                    label="Torn City Time"
                    value={tctTime}
                    onChange={(newValue) => setTctTime(newValue)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}

export default Time
