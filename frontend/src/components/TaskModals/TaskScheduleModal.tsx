import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { CalendarMonth, Schedule, Person } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { assignmentsApi } from '../../services/assignmentsApi';
import { useAidesStore } from '../../store/stores/aides';
import type { Task } from '../../types';
import { categoryColors } from '../../theme/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onScheduled?: () => void;
};

export default function TaskScheduleModal({ open, onClose, task, onScheduled }: Props) {
  const { aides, fetchAides } = useAidesStore();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedAideId, setSelectedAideId] = useState<number | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Load aides when modal opens
  useEffect(() => {
    if (open) {
      fetchAides().catch(() => undefined);
    }
  }, [open, fetchAides]);

  const handleClose = () => {
    if (!busy) {
      setSelectedDates([]);
      setSelectedAideId(null);
      setError(undefined);
      setConflicts([]);
      onClose();
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDates(prev => {
        const dateStr = newDate.toISOString().slice(0, 10);
        const exists = prev.some(d => d.toISOString().slice(0, 10) === dateStr);
        if (exists) return prev;
        return [...prev, newDate].sort((a, b) => a.getTime() - b.getTime());
      });
    }
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(prev => prev.filter(d => d.getTime() !== dateToRemove.getTime()));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  async function submit() {
    if (!task || selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }
    
    setBusy(true);
    setError(undefined);
    setConflicts([]);
    
    try {
      const dateStrings = selectedDates.map(d => d.toISOString().slice(0, 10));
      
      const result = await assignmentsApi.batch({
        task_id: task.id,
        aide_id: selectedAideId,
        dates: dateStrings,
        start_time: task.start_time,
        end_time: task.end_time,
      });
      
      if (result.conflicts && result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        setError(`Some assignments could not be created due to conflicts. ${result.assignments.length} assignments were created successfully.`);
      } else {
        // Success
        try {
          window.dispatchEvent(new CustomEvent('app:success', { 
            detail: { message: `Successfully created ${result.assignments.length} assignment(s)` } 
          }));
        } catch {}
        
        onScheduled?.();
        handleClose();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to create assignments');
    } finally {
      setBusy(false);
    }
  }

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
          <CalendarMonth color="primary" />
          Schedule Task
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {conflicts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Conflicts detected:</strong>
            </Typography>
            <List dense>
              {conflicts.map((conflict, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <ListItemText 
                    primary={`${conflict.date}: ${conflict.reason}`}
                    sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem' } }}
                  />
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Task Details (Read-only) */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" />
              Task Details
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
              {task.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip
                label={task.category.replace(/_/g, ' ')}
                size="small"
                sx={{
                  bgcolor: categoryColors[task.category],
                  color: 'white',
                  fontSize: '0.75rem',
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {task.start_time.slice(0, 5)} - {task.end_time.slice(0, 5)}
              </Typography>
              {task.classroom && (
                <Typography variant="body2" color="text.secondary">
                  · {task.classroom.name}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Date Selection */}
          <DatePicker
            label="Select Date"
            value={null}
            onChange={handleDateChange}
            slotProps={{
              textField: { 
                fullWidth: true,
                helperText: 'Click to add dates to schedule'
              }
            }}
          />

          {/* Selected Dates */}
          {selectedDates.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Selected Dates ({selectedDates.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedDates.map((date, index) => (
                  <Chip
                    key={index}
                    label={formatDate(date)}
                    onDelete={() => removeDate(date)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Aide Assignment (Optional) */}
          <FormControl fullWidth>
            <InputLabel>Assign to Aide (Optional)</InputLabel>
            <Select
              value={selectedAideId || ''}
              label="Assign to Aide (Optional)"
              onChange={(e) => setSelectedAideId(e.target.value ? Number(e.target.value) : null)}
            >
              <MenuItem value="">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" color="action" />
                  <em>Leave unassigned (appears in Unassigned Panel)</em>
                </Box>
              </MenuItem>
              {aides.map(aide => (
                <MenuItem key={aide.id} value={aide.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person fontSize="small" />
                    {aide.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={busy || selectedDates.length === 0}
          variant="contained"
          startIcon={busy ? <CircularProgress size={16} /> : <CalendarMonth />}
        >
          Create Assignments
        </Button>
      </DialogActions>
    </Dialog>
  );
}
