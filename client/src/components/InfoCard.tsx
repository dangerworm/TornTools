import { Grid, Card, Typography, Chip } from '@mui/material'
import { getFormattedText } from '../lib/textFormat'

interface InfoCardProps {
  heading: string
  isCurrency?: boolean
  isProfitable?: boolean
  value?: number | null
}

const InfoCard = ({ heading, isCurrency, isProfitable = false, value }: InfoCardProps) => {
  return (
    <Card
      elevation={2}
      sx={{
        backgroundColor: 'background.paper',
        p: 2,
        textAlign: 'center',
      }}
    >
      <Typography gutterBottom sx={{ fontWeight: 'bold', fontSize: '1.2em' }}>
        {heading}
      </Typography>
      <Typography gutterBottom sx={{ fontSize: '1.5em' }}>
        {value ? (
          isProfitable ? (
            <Chip
              color="success"
              label={getFormattedText('$', value, '')}
              size="medium"
              sx={{ fontSize: '1em', mr: 1 }}
            />
          ) : (
            getFormattedText(isCurrency ? '$' : '', value, '')
          )
        ) : (
          <span>&mdash;</span>
        )}
      </Typography>
    </Card>
  )
}

export default InfoCard
