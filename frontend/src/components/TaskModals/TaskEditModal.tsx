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
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { classroomsApi } from '../../services/classroomsApi';
import { useTasksStore } from '../../store/stores/tasks';
import type { Task, TaskCategory, Classroom, Weekday, Assignment } from '../../types';
import { categoryColors } from '../../theme/theme';
import TaskDeleteDialog from './TaskDeleteDialog';

type Props = {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  assignment?: Assignment | null;
  onUpdated?: (task: Task) => void;
  onDeleted?: () => void;
};

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'PLAYGROUND', label: 'Playground' },
  { value: 'CLASS_SUPPORT', label: 'Class Support' },
  { value: 'GROUP_SUPPORT', label: 'Group Support' },
  { value: 'INDIVIDUAL_SUPPORT', label: 'Individual Support' },
];

const WEEKDAY_MAP: Record<string, Weekday> = {
  'MO': 'MO',
  'TU': 'TU',
  'WE': 'WE',
  'TH': 'TH',
  'FR': 'FR',
};

export default function TaskEditModal({ open, onClose, task, assignment, onUpdated, onDeleted }: Props) {
  const { updateTask } = useTasksStore();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('CLASS_SUPPORT');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  
  // Recurring task fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);
  const [expiryDate, setExpiryDate] = useState('');
  
  // Classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  
  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  // Populate form when task changes
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setCategory(task.category);
      setStart(task.start_time.slice(0, 5)); // HH:MM
      setEnd(task.end_time.slice(0, 5)); // HH:MM
      setClassroomId(task.classroom_id || null);
      setNotes(task.notes || '');
      
      // Handle recurring task fields
      if (task.recurrence_rule) {
        setIsRecurring(true);
        
        // Parse BYDAY from recurrence rule
        const byDayMatch = task.recurrence_rule.match(/BYDAY=([^;]+)/);
        if (byDayMatch) {
          const days = byDayMatch[1].split(',').filter(d => WEEKDAY_MAP[d]) as Weekday[];
          setSelectedWeekdays(days);
        }
        
        setExpiryDate(task.expires_on || '');
      } else {
        setIsRecurring(false);
        setSelectedWeekdays([]);
        setExpiryDate('');
      }
    }
  }, [task, open]);

  const handleClose = () => {
    if (!busy) {
      setError(undefined);
      onClose();
    }
  };

  const handleWeekdayToggle = (weekday: Weekday) => {
    setSelectedWeekdays(prev => 
      prev.includes(weekday) 
        ? prev.filter(d => d !== weekday)
        : [...prev, weekday]
    );
  };

  async function submit() {
    if (!task) return;
    
    setBusy(true);
    setError(undefined);
    
    try {
      // Build payload
      const payload: any = {
        title,
        category,
        start_time: start,
        end_time: end,
        classroom_id: classroomId,
        notes: notes || null,
      };
      
      // Handle recurring task fields
      if (isRecurring) {
        if (selectedWeekdays.length === 0) {
          setError('Please select at least one weekday');
          setBusy(false);
          return;
        }
        if (!expiryDate) {
          setError('Please select an expiry date for recurring tasks');
          setBusy(false);
          return;
        }
        
        payload.recurrence_rule = `FREQ=WEEKLY;BYDAY=${selectedWeekdays.join(',')}`;
        payload.expires_on = expiryDate;
      } else {
        payload.recurrence_rule = null;
        payload.expires_on = null;
      }
      
      const updatedTask = await updateTask(task.id, payload);
      
      // Dispatch success event for toast notification
      try {
        window.dispatchEvent(new CustomEvent('app:success', { 
          detail: { message: 'Task updated successfully' } 
        }));
      } catch {}
      
      onUpdated?.(updatedTask);
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Failed to update task');
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
          <EditIcon color="primary" />
          Edit Task
        </Box>
      </DialogTitle>
      <DialogContent>
        {isRecurring && (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Editing a recurring task will update the task template only. Existing assignments will not be affected.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
            placeholder="e.g., Reading support for Year 3"
          />
          
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
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
                    />
                    {cat.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Time"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Classroom Selection */}
          <FormControl fullWidth>
            <InputLabel>Classroom (Optional)</InputLabel>
            <Select
              value={classroomId || ''}
              label="Classroom (Optional)"
              onChange={(e) => setClassroomId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingClassrooms}
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

          {/* Recurring Task Fields */}
          {isRecurring && (
            <>
              <Box>
                <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>
                  Repeat on Weekdays *
                </FormLabel>
                <FormGroup row>
                  {[
                    { label: 'Mon', value: 'MO' as Weekday },
                    { label: 'Tue', value: 'TU' as Weekday },
                    { label: 'Wed', value: 'WE' as Weekday },
                    { label: 'Thu', value: 'TH' as Weekday },
                    { label: 'Fri', value: 'FR' as Weekday },
                  ].map(day => (
                    <FormControlLabel
                      key={day.value}
                      control={
                        <Checkbox
                          checked={selectedWeekdays.includes(day.value)}
                          onChange={() => handleWeekdayToggle(day.value)}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </FormGroup>
              </Box>

              <TextField
                label="Expiry Date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                helperText="Task will recur until this date"
              />
            </>
          )}

          <TextField
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Add any additional details..."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button 
          onClick={() => setShowDeleteDialog(true)} 
          disabled={busy}
          color="error"
          startIcon={<DeleteIcon />}
        >
          Delete
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={busy || !title.trim()}
            variant="contained"
            startIcon={busy ? <CircularProgress size={16} /> : <EditIcon />}
          >
            Save Changes
          </Button>
        </Box>
      </DialogActions>

      {/* Delete Confirmation Dialog */}
      <TaskDeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        task={task}
        assignment={assignment || null}
        onDeleted={() => {
          setShowDeleteDialog(false);
          handleClose();
          onDeleted?.();
        }}
      />
    </Dialog>
  );
}

