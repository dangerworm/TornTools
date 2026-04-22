import CloseIcon from '@mui/icons-material/Close'
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import { useState } from 'react'
import PrivacyNotice from './PrivacyNotice'

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <>
      <Box
        component="footer"
        sx={{
          mt: 3,
          pt: 2,
          textAlign: 'center',
          width: '100%',
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="body2" gutterBottom color="text.secondary">
          This website is maintained by{' '}
          <a href="https://www.torn.com/index.php" target="_blank" rel="noopener noreferrer">
            dangerworm [3943900]
          </a>
          .&nbsp;
          <a target="_blank" rel="noopener noreferrer" onClick={() => setPrivacyOpen(true)}>
            Privacy &amp; API key usage
          </a>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You can find this project's source code on{' '}
          <a
            href="https://github.com/dangerworm/TornTools"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .{' '}
          <a
            href="https://www.torn.com/messages.php#/p=compose&XID=3943900"
            target="_blank"
            rel="noopener noreferrer"
          >
            Your feedback is appreciated
          </a>
          .{' '}
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
