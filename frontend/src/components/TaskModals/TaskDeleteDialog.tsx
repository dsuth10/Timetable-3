import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
} from '@mui/material';
import { Warning, Delete } from '@mui/icons-material';
import { assignmentsApi } from '../../services/assignmentsApi';
import { useTasksStore } from '../../store/stores/tasks';
import type { Task, Assignment } from '../../types';

type Props = {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  assignment: Assignment | null;
  onDeleted?: () => void;
};

export default function TaskDeleteDialog({ open, onClose, task, assignment, onDeleted }: Props) {
  const { deleteTask } = useTasksStore();
  const [deleteOption, setDeleteOption] = useState<'instance' | 'all'>('instance');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isRecurring = task?.recurrence_rule != null;

  const handleClose = () => {
    if (!busy) {
      setDeleteOption('instance');
      setError(undefined);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!task || !assignment) return;

    setBusy(true);
    setError(undefined);

    try {
      if (isRecurring && deleteOption === 'instance') {
        // Delete only this assignment instance
        await assignmentsApi.delete(assignment.id);
        
        // Dispatch success event for toast notification
        try {
          window.dispatchEvent(new CustomEvent('app:success', { 
            detail: { message: 'Assignment deleted successfully' } 
          }));
        } catch {}
      } else {
        // Delete the entire task (and all its assignments)
        await deleteTask(task.id);
        
        // Dispatch success event for toast notification
        try {
          window.dispatchEvent(new CustomEvent('app:success', { 
            detail: { message: 'Task deleted successfully' } 
          }));
        } catch {}
      }

      onDeleted?.();
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          Delete Task
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body1" fontWeight={600}>
            {task.title}
          </Typography>
          
          {isRecurring ? (
            <>
              <Alert severity="warning" sx={{ mb: 1 }}>
                This is a recurring task. Choose how you want to delete it:
              </Alert>
              
              <RadioGroup
                value={deleteOption}
                onChange={(e) => setDeleteOption(e.target.value as 'instance' | 'all')}
              >
                <FormControlLabel
                  value="instance"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Delete only this instance
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Remove the assignment for {assignment?.date ? new Date(assignment.date + 'T00:00:00').toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'this date'} only. The task template will remain.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Delete all instances
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Delete the entire recurring task and all its assignments (past and future).
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </>
          ) : (
            <Alert severity="warning">
              Are you sure you want to delete this task? This action cannot be undone.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          disabled={busy}
          variant="contained"
          color="error"
          startIcon={busy ? <CircularProgress size={16} /> : <Delete />}
        >
          {busy ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

