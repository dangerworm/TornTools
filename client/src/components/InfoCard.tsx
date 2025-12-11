import { Card, Typography, Chip, Box } from '@mui/material'
import { getFormattedText } from '../lib/textFormat'

interface InfoCardProps {
  heading: string
  isCurrency?: boolean
  isProfitable?: boolean
  taxType?: number
  value?: number | null
}

const InfoCard = ({
  heading,
  isCurrency,
  isProfitable = false,
  taxType = 0,
  value,
}: InfoCardProps) => {
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
      {!value && (
        <Typography gutterBottom sx={{ fontSize: '1.5em' }}>
          <span>&mdash;</span>
        </Typography>
      )}
      {value && (
        <>
          {isProfitable && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <Chip
                color="success"
                label={getFormattedText('$', value, '')}
                size="medium"
                sx={{ fontSize: '1.5em', mr: 1 }}
              />
              <Typography component={'p'} variant="caption" color="textSecondary">
                &nbsp;
                {isCurrency && taxType > 0 && `${getFormattedText('$', value * (1 - taxType), '')} after ${Math.round(taxType * 100)}% tax`}
              </Typography>
            </Box>
          )}
          {!isProfitable && (
            <Typography gutterBottom sx={{ fontSize: '1.5em', mb: 0.5 }}>
              {getFormattedText(isCurrency ? '$' : '', value, '')}
            </Typography>
          )}
        </>
      )}
    </Card>
  )
}

export default InfoCard
