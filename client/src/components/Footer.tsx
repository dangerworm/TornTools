import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 3,
        pt: 2,
        textAlign: "center",
        width: "100%",
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="body2" gutterBottom color="text.secondary">
        This website is maintained by{" "}
        <a
          href="https://www.torn.com/index.php"
          target="_blank"
          rel="noopener noreferrer"
        >
          dangerworm [3943900]
        </a>
        .
      </Typography>
      <Typography variant="body2" color="text.secondary">
        You can find this project's source code on{" "}
        <a
          href="https://github.com/dangerworm/TornTools"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        .
        {" "}
        <a
          href="https://www.torn.com/messages.php#/p=compose&XID=3943900"
          target="_blank"
          rel="noopener noreferrer"
        >
          Your feedback is appreciated
        </a>
        .
      </Typography>
    </Box>
  );
}
