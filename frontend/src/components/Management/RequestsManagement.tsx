import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  AccessTime as PendingIcon,
} from '@mui/icons-material';
import { useRequestsStore } from '../../store/stores/requests';
import EmptyState from '../common/EmptyState';
import RequestCreateModal from '../TaskModals/RequestCreateModal';

export default function RequestsManagement() {
  const { requests, loading, error, fetchRequests, updateRequestStatus, deleteRequest } = useRequestsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <PendingIcon fontSize="small" />;
      case 'APPROVED': return <CheckIcon fontSize="small" />;
      case 'REJECTED': return <CloseIcon fontSize="small" />;
      default: return null;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Teacher Requests</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setShowCreateModal(true)}
        >
          New Request
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      {requests.length === 0 ? (
        <EmptyState
          title="No Requests"
          description="Any teacher relief or task requests will appear here."
        />
      ) : (
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Teacher</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Date/Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {req.requesting_teacher}
                    </Typography>
                    {req.classroom && (
                      <Typography variant="caption" color="text.secondary">
                        {req.classroom.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{req.task_title}</Typography>
                    <Chip
                      label={req.task_category}
                      size="small"
                      variant="outlined"
                      sx={{ height: 16, fontSize: '0.65rem', mt: 0.5 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{req.preferred_date}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {req.preferred_time.slice(0, 5)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(req.status) || undefined}
                      label={req.status}
                      size="small"
                      color={getStatusColor(req.status) as any}
                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {req.status === 'PENDING' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => updateRequestStatus(req.id, 'APPROVED')}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => updateRequestStatus(req.id, 'REJECTED')}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (window.confirm('Delete this request?')) {
                              deleteRequest(req.id);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <RequestCreateModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </Box>
  );
}

