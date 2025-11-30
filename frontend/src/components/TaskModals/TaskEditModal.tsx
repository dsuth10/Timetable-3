import { useState, useEffect, useMemo } from 'react';
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
import { assignmentsApi } from '../../services/assignmentsApi';
import { useTasksStore } from '../../store/stores/tasks';
import type { Task, TaskCategory, Classroom, Weekday, Assignment } from '../../types';
import { categoryColors } from '../../theme/theme';
import { generateTimeSlots, END_HOUR } from '../TimetableGrid/timeUtils';
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
  const [numWeeks, setNumWeeks] = useState<number>(4);
  
  // Classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  
  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots = generateTimeSlots();
    // Add the end of the day time
    slots.push(`${END_HOUR}:00`);
    return slots;
  }, []);

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

  const toHHMM = (time?: string | null) => (time ? time.slice(0, 5) : '');

  // Populate form when task changes
  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setCategory(task.category);
      setStart(toHHMM(assignment?.start_time ?? task.start_time)); // HH:MM
      setEnd(toHHMM(assignment?.end_time ?? task.end_time)); // HH:MM
      setClassroomId(task.classroom_id || null);
      setNotes(task.notes || '');
      
      // Check if this assignment is part of a recurring series
      // Note: Task no longer has recurrence_rule, but we can check the assignment
      if (assignment?.recurring_series_id) {
        // This assignment is part of a recurring series
        // We don't pre-populate recurring fields in edit mode
        setIsRecurring(false);
        setSelectedWeekdays([]);
        setNumWeeks(4);
      } else {
        // Not part of a recurring series
        setIsRecurring(false);
        setSelectedWeekdays([]);
        setNumWeeks(4);
      }
    }
  }, [task, assignment, open]);

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
    
    // Validate 15-minute increments
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    if (startM % 15 !== 0) {
      setError('Start time must be in 15-minute increments (00, 15, 30, 45)');
      setBusy(false);
      return;
    }
    
    if (endM % 15 !== 0) {
      setError('End time must be in 15-minute increments (00, 15, 30, 45)');
      setBusy(false);
      return;
    }

    if (start >= end) {
      setError('End time must be after start time');
      setBusy(false);
      return;
    }

    try {
      // If editing an assignment (scheduled task)
      if (assignment) {
        // Update assignment times and status
        await assignmentsApi.update(assignment.id, {
          start_time: start,
          end_time: end,
          version: assignment.version
        });

        // Update task template (shared properties, but NOT times to preserve defaults)
        const taskPayload: any = {
          title,
          category,
          classroom_id: classroomId,
          notes: notes || null,
        };

        // Handle recurring task fields for task update if needed
        // (Usually we don't convert to recurring series when editing an instance unless explicit)
        // Keeping existing logic for recurring creation just in case user checked it
        if (isRecurring) {
          if (selectedWeekdays.length === 0) {
            setError('Please select at least one weekday');
            setBusy(false);
            return;
          }
          if (!numWeeks || numWeeks < 1) {
            setError('Please enter a valid number of weeks (at least 1)');
            setBusy(false);
            return;
          }
          
          taskPayload.recurrence_rule = `FREQ=WEEKLY;BYDAY=${selectedWeekdays.join(',')}`;
          
          // Calculate expiry date based on number of weeks from assignment date
          if (assignment.date) {
            const startDate = new Date(assignment.date);
            startDate.setDate(startDate.getDate() + (numWeeks * 7));
            taskPayload.expires_on = startDate.toISOString().split('T')[0];
          } else {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + (numWeeks * 7));
            taskPayload.expires_on = startDate.toISOString().split('T')[0];
          }
          
          if (assignment.aide_id) {
            taskPayload.aide_id = assignment.aide_id;
          }
          
          taskPayload.existing_assignment_date = assignment.date;
        } else {
            taskPayload.recurrence_rule = null;
            taskPayload.expires_on = null;
        }

        const updatedTask = await updateTask(task.id, taskPayload);
        
        // Dispatch success event
        try {
          window.dispatchEvent(new CustomEvent('app:success', { 
            detail: { message: 'Task and assignment updated successfully' } 
          }));
        } catch {}
        
        onUpdated?.(updatedTask);
      } else {
        // Editing task template only (Task Bank)
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
          if (!numWeeks || numWeeks < 1) {
            setError('Please enter a valid number of weeks (at least 1)');
            setBusy(false);
            return;
          }
          
          payload.recurrence_rule = `FREQ=WEEKLY;BYDAY=${selectedWeekdays.join(',')}`;
          
          // Fallback to weeks from today
          const startDate = new Date();
          startDate.setDate(startDate.getDate() + (numWeeks * 7));
          payload.expires_on = startDate.toISOString().split('T')[0];
        } else {
          payload.recurrence_rule = null;
          payload.expires_on = null;
        }
        
        const updatedTask = await updateTask(task.id, payload);
        
        // Dispatch success event
        try {
          window.dispatchEvent(new CustomEvent('app:success', { 
            detail: { message: 'Task updated successfully' } 
          }));
        } catch {}
        
        onUpdated?.(updatedTask);
      }
      
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
        {assignment?.recurring_series_id && (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            This assignment is part of a recurring series. Edits to the task template will not affect existing recurring assignments.
          </Alert>
        )}
        {isRecurring && (
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Creating a new recurring series for this task. Each recurring series is independent.
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
            <FormControl fullWidth required>
              <InputLabel>Start Time</InputLabel>
              <Select
                value={start}
                label="Start Time"
                onChange={(e) => setStart(e.target.value)}
              >
                {timeSlots.map(time => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>End Time</InputLabel>
              <Select
                value={end}
                label="End Time"
                onChange={(e) => setEnd(e.target.value)}
              >
                {timeSlots.map(time => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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

          {/* Recurring Task Toggle */}
          <FormControlLabel
            control={
              <Checkbox
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
            }
            label="Make this a recurring task"
          />

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
                label="Number of Weeks"
                type="number"
                value={numWeeks}
                onChange={(e) => setNumWeeks(Number(e.target.value))}
                fullWidth
                required
                inputProps={{ min: 1, max: 52 }}
                helperText="How many weeks this task should recur"
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
