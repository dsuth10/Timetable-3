import { useState, useEffect } from 'react';
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
  Skeleton,
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
  // When deleting from TaskBank (no assignment), default to permanent deletion
  // When deleting from assignment context, default to instance deletion
  const [deleteOption, setDeleteOption] = useState<'instance' | 'recurring' | 'reset' | 'delete'>(
    assignment ? 'instance' : 'delete'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  
  // Preview count for recurring series
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const isRecurring = task?.recurrence_rule != null;
  const isSeriesInstance = assignment?.recurring_series_id != null;

  // Fetch preview count when modal opens for a series instance
  useEffect(() => {
    if (open && assignment && isSeriesInstance) {
      setPreviewLoading(true);
      setPreviewCount(null);
      assignmentsApi.deleteRecurringSeriesForAide(assignment.id, assignment.version, true)
        .then(data => {
          setPreviewCount(data.would_delete_count);
        })
        .catch(err => {
          console.error('Failed to fetch delete preview:', err);
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    }
  }, [open, assignment, isSeriesInstance]);

  const handleClose = () => {
    if (!busy) {
      setDeleteOption(assignment ? 'instance' : 'delete');
      setError(undefined);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setBusy(true);
    setError(undefined);

    try {
      if (deleteOption === 'instance') {
        // Validate assignment exists for single-instance deletion
        if (!assignment) {
          setError('Cannot delete single instance without an assignment');
          setBusy(false);
          return;
        }
        // Delete only this assignment instance
        await assignmentsApi.delete(assignment.id);
        
        // Dispatch success event for toast notification
        try {
          window.dispatchEvent(new CustomEvent('app:success', { 
            detail: { message: 'Assignment deleted successfully' } 
          }));
        } catch {}
      } else if (deleteOption === 'recurring') {
        if (!assignment) {
          setError('Cannot delete recurring series without an assignment');
          setBusy(false);
          return;
        }
        
        const result = await assignmentsApi.deleteRecurringSeriesForAide(assignment.id, assignment.version);
        
        // Dispatch success event for toast notification
        try {
          let message = result.message || 'Recurring assignments deleted';
          if (result.skipped_count > 0) {
            message += ` (${result.skipped_count} modified preserved)`;
          }
          window.dispatchEvent(new CustomEvent('app:success', { 
            detail: { message } 
          }));
        } catch {}
      } else if (deleteOption === 'reset') {
        // Reset the task back to task bank (remove all assignments but keep task)
        await deleteTask(task.id, true);
        
        // Refresh tasks to ensure UI is updated
        const { fetchTasks } = useTasksStore.getState();
        await fetchTasks();
        
        // Dispatch success event for toast notification
        try {
          window.dispatchEvent(new CustomEvent('app:success', { 
            detail: { message: 'Task reset successfully and returned to task bank' } 
          }));
        } catch {}
      } else {
        // Permanently delete the task (reset=false)
        await deleteTask(task.id, false);
        
        // Refresh tasks to ensure UI is updated
        const { fetchTasks } = useTasksStore.getState();
        await fetchTasks();
        
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
          
          {assignment ? (
            <>
              <Alert severity="warning" sx={{ mb: 1 }}>
                Choose how you want to delete this task:
              </Alert>
              
              <RadioGroup
                value={deleteOption}
                onChange={(e) => setDeleteOption(e.target.value as any)}
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
                        Remove the assignment for {assignment.date ? new Date(assignment.date + 'T00:00:00').toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'this date'} only. The task template will remain.
                      </Typography>
                    </Box>
                  }
                />

                {isSeriesInstance && (
                  <FormControlLabel
                    value="recurring"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          Remove this and future recurring instances for this aide
                        </Typography>
                        <Typography variant="caption" color="text.secondary" component="div">
                          {previewLoading ? (
                            <Skeleton width={300} />
                          ) : (
                            <>
                              Delete this and {previewCount !== null ? (previewCount - 1) : '...'} more recurring assignments.
                              Modified assignments will be preserved. Past assignments will not be affected.
                            </>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                )}

                <FormControlLabel
                  value="reset"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Reset task (keep template, remove all assignments)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Remove all assignments and reset the task back to the task bank. The task will keep its basic info (title, category, classroom, notes) and times from the last assignment{isRecurring ? ', but lose recurring settings' : ''}.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="delete"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Permanently delete task
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permanently remove this task and all its assignments. This action cannot be undone.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 1 }}>
                {isRecurring 
                  ? "This is a recurring task. Choose how you want to delete it:" 
                  : "Choose how you want to delete this task:"}
              </Alert>
              
              <RadioGroup
                value={deleteOption}
                onChange={(e) => setDeleteOption(e.target.value as any)}
              >
                <FormControlLabel
                  value="reset"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Reset task (keep template, remove all assignments)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Remove all assignments and reset the task back to the task bank. The task will keep its basic info (title, category, classroom, notes) and times from the last assignment{isRecurring ? ', but lose recurring settings' : ''}.
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="delete"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Permanently delete task
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permanently remove this task and all its assignments. This action cannot be undone.
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </>
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


