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
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
} from '@mui/material';
import { Add as AddIcon, Event as EventIcon, EventRepeat as EventRepeatIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tasksApi } from '../../services/tasksApi';
import { classroomsApi } from '../../services/classroomsApi';
import type { Task, TaskCategory, Classroom, Weekday } from '../../types';
import { categoryColors } from '../../theme/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (task: Task) => void;
};

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'PLAYGROUND', label: 'Playground' },
  { value: 'CLASS_SUPPORT', label: 'Class Support' },
  { value: 'GROUP_SUPPORT', label: 'Group Support' },
  { value: 'INDIVIDUAL_SUPPORT', label: 'Individual Support' },
];

export default function TaskCreationModal({ open, onClose, onCreated }: Props) {
  const [taskType, setTaskType] = useState<'one-off' | 'recurring'>('one-off');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('CLASS_SUPPORT');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [assignmentDate, setAssignmentDate] = useState<string>('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  
  // Recurring task fields
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>(['MO', 'TU', 'WE', 'TH', 'FR']);
  const [expiryDate, setExpiryDate] = useState('');
  
  // Classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);

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
      setTaskType('one-off');
      setTitle('');
      setCategory('CLASS_SUPPORT');
      setStart('09:00');
      setEnd('10:00');
      setClassroomId(null);
      setNotes('');
      setAssignmentDate('');
      setSelectedWeekdays(['MO', 'TU', 'WE', 'TH', 'FR']);
      setExpiryDate('');
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
      let task: Task;
      
      if (taskType === 'one-off') {
        if (!assignmentDate) {
          setError('Assignment date is required for one-off tasks');
          setBusy(false);
          return;
        }
        task = await tasksApi.createOneOff({ 
          title, 
          category, 
          start_time: start, 
          end_time: end, 
          classroom_id: classroomId, 
          notes: notes || null,
          assignment_date: assignmentDate
        });
      } else {
        // Recurring task
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
        
        // Build RRULE
        const rrule = `FREQ=WEEKLY;BYDAY=${selectedWeekdays.join(',')}`;
        
        task = await tasksApi.createRecurring({ 
          title, 
          category, 
          start_time: start, 
          end_time: end, 
          classroom_id: classroomId,
          recurrence_rule: rrule,
          expires_on: expiryDate,
          notes: notes || null 
        });
      }
      
      onCreated?.(task);
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create task');
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
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Create New Task
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Task Type Toggle */}
          <Box>
            <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem' }}>
              Task Type
            </FormLabel>
            <ToggleButtonGroup
              value={taskType}
              exclusive
              onChange={(_, newType) => newType && setTaskType(newType)}
              fullWidth
              size="small"
            >
              <ToggleButton value="one-off">
                <EventIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                One-off
              </ToggleButton>
              <ToggleButton value="recurring">
                <EventRepeatIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Recurring
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

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

          {/* Assignment Date for One-off Tasks */}
          {taskType === 'one-off' && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Assignment Date"
                value={assignmentDate ? new Date(assignmentDate) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    setAssignmentDate(newValue.toISOString().slice(0, 10));
                  }
                }}
                slotProps={{
                  textField: { fullWidth: true, required: true }
                }}
              />
            </LocalizationProvider>
          )}

          {/* Recurring Task Fields */}
          {taskType === 'recurring' && (
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
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={busy || !title.trim()}
          variant="contained"
          startIcon={busy ? <CircularProgress size={16} /> : <AddIcon />}
          data-testid="open-create-task"
        >
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}



