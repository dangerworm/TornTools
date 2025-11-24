import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Link, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CopyWithSuccess from "./CopyWithSuccess";

interface AutoBuyScriptDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  autoBuyScript: string | null;
  lastClickedRow: {
    itemId: number;
    name: string;
  } | null;
}

export const AutoBuyScriptDialog: React.FC<AutoBuyScriptDialogProps> = ({
  dialogOpen,
  setDialogOpen,
  autoBuyScript,
  lastClickedRow,
}) => {
  return (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
        Auto-Buy Script
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={() => setDialogOpen(false)}
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Typography gutterBottom>
          <CopyWithSuccess
            label="Copy script"
            textToCopy={autoBuyScript || ""}
          />
          <ul>
            <li>Copy the code using the button above</li>
            <li>
              Open{" "}
              <Link
                href={`https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${lastClickedRow?.itemId}`}
                target="_blank"
                rel="noopener"
              >
                the market
              </Link>{" "}
              for '{lastClickedRow?.name}' (opens in new tab)
            </li>
            <li>Open the developer console</li>
            <li>Switch to the 'Console' tab</li>
            <li>Press Enter</li>
          </ul>
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
          <pre>
            <code>
              {autoBuyScript?.split("\n").map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </code>
          </pre>
        </Typography>
      </DialogContent>
      <DialogActions>
        <CopyWithSuccess textToCopy={autoBuyScript || ""} />
      </DialogActions>
    </Dialog>
  );
};
