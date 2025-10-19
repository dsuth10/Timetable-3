import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import EmptyState from '../common/EmptyState';

export default function RequestsManagement() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Requests</Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="small">
          New Request
        </Button>
      </Box>
      <EmptyState
        title="Coming Soon"
        description="Teacher request list and approval workflow will be available here."
      />
    </Box>
  );
}

