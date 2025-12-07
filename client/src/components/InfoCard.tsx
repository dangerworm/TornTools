import { Card, Typography, Chip } from '@mui/material'
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
      {value ? (
        isProfitable ? (
          <Chip
            color="success"
            label={getFormattedText('$', value, '')}
            size="medium"
            sx={{ fontSize: '1.5em', mr: 1 }}
          />
        ) : (
          <Typography gutterBottom sx={{ fontSize: '1.5em' }}>
            {getFormattedText(isCurrency ? '$' : '', value, '')}
          </Typography>
        )
      ) : (
        <span>&mdash;</span>
      )}
    </Card>
  )
}

export default InfoCard
