import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

interface LoadingProps {
  message?: string;
  width?: string;
}

const Loading = ({ message = "Loading...", width = "100%" }: LoadingProps) => {
  return (
    <Box sx={{ alignItems: 'center', display: 'flex', gap: 2, justifyContent: 'center', p: 2, width }}>
      <CircularProgress />
      {"  "}{message && <span>{message}</span>}
    </Box>
  );
}

export default Loading;