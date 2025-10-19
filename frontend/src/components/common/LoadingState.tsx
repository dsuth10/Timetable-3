import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';

type LoadingStateProps = {
  variant?: 'spinner' | 'skeleton';
  message?: string;
  rows?: number;
};

export default function LoadingState({ 
  variant = 'spinner', 
  message = 'Loading...', 
  rows = 5 
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return (
      <Box sx={{ p: 2 }}>
        {Array.from({ length: rows }).map((_, idx) => (
          <Skeleton 
            key={idx} 
            variant="rectangular" 
            height={60} 
            sx={{ mb: 1, borderRadius: 1 }} 
          />
        ))}
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: 200,
        gap: 2,
      }}
    >
      <CircularProgress />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}

