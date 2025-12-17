import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { tasksApi, type QuickCreateTaskRequest, type QuickCreateTaskResponse } from '../../services/tasksApi';
import { classroomsApi } from '../../services/classroomsApi';
import type { TaskCategory, Classroom } from '../../types';
import { categoryColors } from '../../theme/theme';

type Props = {
  open: boolean;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM:SS
  duration: number; // Default duration in minutes
  aideId: number;
  onClose: () => void;
  onSuccess: (response: QuickCreateTaskResponse) => void;
};

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'PLAYGROUND', label: 'Playground' },
  { value: 'CLASS_SUPPORT', label: 'Class Support' },
  { value: 'GROUP_SUPPORT', label: 'Group Support' },
  { value: 'INDIVIDUAL_SUPPORT', label: 'Individual Support' },
];

// Duration options in 5-minute increments
const DURATION_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

export function QuickCreateTaskModal({ open, date, startTime, duration, aideId, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory | ''>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(duration >= 30 ? 30 : duration);
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  
  // Classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);

  // Update default duration when props change
  useEffect(() => {
    if (open) {
      // Default duration logic: 30 min for slots >=30 min, slot length for <30 min
      setSelectedDuration(duration >= 30 ? 30 : duration);
    }
  }, [open, duration]);

  // Load classrooms when modal opens
  useEffect(() => {
    if (open) {
      setLoadingClassrooms(true);
      classroomsApi.list()
        .then(setClassrooms)
        .catch(() => setClassrooms([]))
        .finally(() => setLoadingClassrooms(false));
    }
  }, [open]);

  const handleClose = () => {
    if (!busy) {
      // Preserve form data on close (in case user wants to retry)
      // Only clear on successful submission
      onClose();
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setSelectedDuration(duration >= 30 ? 30 : duration);
    setClassroomId(null);
    setNotes('');
    setError(undefined);
  };

  const formatTime = (timeStr: string): string => {
    // Convert HH:MM:SS to HH:MM for display
    return timeStr.slice(0, 5);
  };

  async function submit() {
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!category) {
      setError('Category is required');
      return;
    }

    setBusy(true);
    setError(undefined);
    
    try {
      const payload: QuickCreateTaskRequest = {
        title: title.trim(),
        category: category as TaskCategory,
        date,
        start_time: startTime,
        duration_minutes: selectedDuration,
        aide_id: aideId,
        classroom_id: classroomId || undefined,
        notes: notes.trim() || undefined,
      };
      
      const response = await tasksApi.quickCreateTask(payload);
      // Reset form on success
      resetForm();
      onSuccess(response);
      handleClose();
    } catch (e: any) {
      // Handle different error types with clear messages
      if (e.response?.status === 409) {
        // Conflict error - preserve form data for retry
        const conflictMsg = e.response?.data?.message || e.message || 'Assignment conflicts with existing assignment';
        setError(conflictMsg);
        // Form data is preserved automatically (not reset on error)
      } else if (e.response?.status === 400) {
        // Validation error
        const validationMsg = e.response?.data?.message || e.message || 'Invalid data provided';
        setError(validationMsg);
      } else if (e.response?.status === 404) {
        // Not found error
        const notFoundMsg = e.response?.data?.message || e.message || 'Resource not found';
        setError(notFoundMsg);
      } else if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
        // Network timeout
        setError('Request timed out. Please check your connection and try again.');
      } else if (!e.response) {
        // Network error (no response)
        setError('Network error. Please check your connection and try again.');
      } else {
        // Generic error
        setError(e.message || 'Failed to create task. Please try again.');
      }
      // Form data is preserved on error (user can retry without re-entering)
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="quick-create-task-dialog-title"
      aria-modal="true"
    >
      <DialogTitle id="quick-create-task-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Create Task
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} role="alert">
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Start Time (locked/read-only) */}
          <TextField
            label="Start Time"
            value={formatTime(startTime)}
            fullWidth
            disabled
            InputProps={{
              readOnly: true,
            }}
            helperText="Start time is locked to the selected time slot"
            aria-label="Start time (locked)"
          />

          {/* Duration Dropdown */}
          <FormControl fullWidth required>
            <InputLabel id="duration-label">Duration</InputLabel>
            <Select
              labelId="duration-label"
              label="Duration"
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              aria-label="Task duration in minutes"
            >
              {DURATION_OPTIONS.map(dur => (
                <MenuItem key={dur} value={dur}>
                  {dur} {dur === 1 ? 'minute' : 'minutes'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Title */}
          <TextField
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
            placeholder="e.g., One-on-one reading with Emma"
            aria-label="Task title"
            error={!!error && !title.trim()}
          />
          
          {/* Category */}
          <FormControl fullWidth required>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              aria-label="Task category"
              error={!!error && !category}
            >
              {CATEGORIES.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: categoryColors[cat.value],
                      }}
                      aria-hidden="true"
                    />
                    {cat.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Classroom Selection */}
          <FormControl fullWidth>
            <InputLabel id="classroom-label">Classroom (Optional)</InputLabel>
            <Select
              labelId="classroom-label"
              label="Classroom (Optional)"
              value={classroomId || ''}
              onChange={(e) => setClassroomId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingClassrooms}
              aria-label="Classroom selection"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {classrooms.map(classroom => (
                <MenuItem key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Notes */}
          <TextField
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Add any additional details..."
            aria-label="Task notes"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={busy} aria-label="Cancel task creation">
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={busy || !title.trim() || !category}
          variant="contained"
          startIcon={busy ? <CircularProgress size={16} /> : <AddIcon />}
          aria-label="Create task"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}










