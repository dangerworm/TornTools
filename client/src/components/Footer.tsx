import CloseIcon from '@mui/icons-material/Close'
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import PrivacyNotice from './PrivacyNotice'

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <>
      <Box
        component="footer"
        sx={{
          px: 2,
          py: 1.5,
          textAlign: 'center',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="caption" display="block" color="text.secondary">
          Made by{' '}
          <Link href="https://www.torn.com/index.php" target="_blank" rel="noopener noreferrer">
            dangerworm [3943900]
          </Link>
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          View{' '}
          <Link
            component="button"
            variant="caption"
            onClick={() => setPrivacyOpen(true)}
            sx={{ verticalAlign: 'baseline' }}
          >
            Privacy &amp; API key usage
          </Link>
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          <Link
            href="https://github.com/dangerworm/TornTools"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source
          </Link>{' '}
          on GitHub.{' '}
          <Link
            href="https://www.torn.com/messages.php#/p=compose&XID=3943900"
            target="_blank"
            rel="noopener noreferrer"
          >
            Feedback welcome
          </Link>
          .
        </Typography>
      </Box>

      <Dialog
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        aria-labelledby="privacy-notice-title"
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle id="privacy-notice-title" sx={{ m: 0, p: 2 }}>
          Privacy &amp; API key usage
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setPrivacyOpen(false)}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <PrivacyNotice />
        </DialogContent>
      </Dialog>
    </>
  )
}
