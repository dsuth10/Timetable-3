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
  Typography,
} from '@mui/material';
import { Add as AddIcon, Repeat } from '@mui/icons-material';
import { tasksApi } from '../../services/tasksApi';
import { classroomsApi } from '../../services/classroomsApi';
import { assignmentsApi } from '../../services/assignmentsApi';
import type { Task, TaskCategory, Classroom, Weekday } from '../../types';
import { categoryColors } from '../../theme/theme';
import { generateAllTimeSlots, timeToMinutes, addMinutesToTime, END_TIME_MINUTES, minutesToTime } from '../TimetableGrid/timeUtils';
import { useTasksStore } from '../../store/stores/tasks';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (task: Task) => void;
  defaultStartTime?: string; // HH:MM format
  defaultEndTime?: string; // HH:MM format
  defaultDate?: string; // YYYY-MM-DD format, for future use
  defaultAideId?: number; // for future use
};

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'PLAYGROUND', label: 'Playground' },
  { value: 'CLASS_SUPPORT', label: 'Class Support' },
  { value: 'GROUP_SUPPORT', label: 'Group Support' },
  { value: 'INDIVIDUAL_SUPPORT', label: 'Individual Support' },
];

export default function TaskCreationModal({ open, onClose, onCreated, defaultStartTime, defaultEndTime, defaultDate, defaultAideId }: Props) {
  const { addTask } = useTasksStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('CLASS_SUPPORT');
  const [startTime, setStartTime] = useState<string>(defaultStartTime || '09:00');
  const [endTime, setEndTime] = useState<string>(defaultEndTime || '10:00');
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  // Recurring task fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([]);
  const [numWeeks, setNumWeeks] = useState<number>(4);
  
  // Determine if this is template-only creation (no assignment will be created)
  const isTemplateOnly = !defaultDate || !defaultAideId;
  
  // Classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);

  // Generate time slots - use all 5-minute increments for dropdowns
  const timeSlots = useMemo(() => {
    return generateAllTimeSlots();
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

  // Update times when default props change and modal opens
  useEffect(() => {
    if (open) {
      if (defaultStartTime) {
        setStartTime(defaultStartTime);
      }
      if (defaultEndTime) {
        setEndTime(defaultEndTime);
      } else if (defaultStartTime) {
        // Auto-calculate end time if start time is provided but end time is not
        const calculatedEnd = addMinutesToTime(defaultStartTime, 30);
        // Ensure it doesn't exceed working hours
        const endMinutes = timeToMinutes(calculatedEnd);
        const maxMinutes = END_TIME_MINUTES;
        if (endMinutes > maxMinutes) {
          setEndTime(minutesToTime(maxMinutes));
        } else {
          setEndTime(calculatedEnd);
        }
      }
    }
  }, [open, defaultStartTime, defaultEndTime]);

  const handleClose = () => {
    if (!busy) {
      setTitle('');
      setCategory('CLASS_SUPPORT');
      setStartTime(defaultStartTime || '09:00');
      setEndTime(defaultEndTime || '10:00');
      setClassroomId(null);
      setNotes('');
      setError(undefined);
      setIsRecurring(false);
      setSelectedWeekdays([]);
      setNumWeeks(4);
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

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    // Auto-adjust end time if it becomes invalid (end must be after start)
    const startMinutes = timeToMinutes(newStartTime);
    const endMinutes = timeToMinutes(endTime);
    if (endMinutes <= startMinutes) {
      // Set end time to 30 minutes after start, but don't exceed working hours
      const calculatedEnd = addMinutesToTime(newStartTime, 30);
      const calculatedEndMinutes = timeToMinutes(calculatedEnd);
      const maxMinutes = END_TIME_MINUTES;
      if (calculatedEndMinutes > maxMinutes) {
        setEndTime(minutesToTime(maxMinutes));
      } else {
        setEndTime(calculatedEnd);
      }
    }
  };

  async function submit() {
    setBusy(true);
    setError(undefined);
    
    // For template-only creation, use placeholder times and skip validation
    // For tasks with assignments, validate times
    let startTimeFormatted: string;
    let endTimeFormatted: string;
    
    if (isTemplateOnly) {
      // Use placeholder times for template-only tasks
      startTimeFormatted = '09:00:00';
      endTimeFormatted = '10:00:00';
    } else {
      // Validate times when creating with assignment
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      if (endMinutes <= startMinutes) {
        setError('End time must be after start time');
        setBusy(false);
        return;
      }

      const maxMinutes = END_TIME_MINUTES;
      if (startMinutes < 0 || startMinutes >= maxMinutes) {
        setError(`Start time must be within working hours (08:50 - ${minutesToTime(maxMinutes)})`);
        setBusy(false);
        return;
      }

      if (endMinutes > maxMinutes) {
        setError(`End time cannot exceed ${minutesToTime(maxMinutes)} (end of working hours)`);
        setBusy(false);
        return;
      }

      // Validation for recurrence
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
      }
      
      // Format times as HH:MM:SS for API (append ':00' to seconds)
      startTimeFormatted = `${startTime}:00`;
      endTimeFormatted = `${endTime}:00`;
    }
    
    try {
      
      const task = await tasksApi.createOneOff({ 
        title, 
        category, 
        start_time: startTimeFormatted,
        end_time: endTimeFormatted,
        classroom_id: classroomId, 
        notes: notes || null
      });
      
      // Optimistically add task to store so it appears immediately
      addTask(task);
      
      // If we have a date and aide ID, also create an assignment so it appears on the schedule
      if (defaultDate && defaultAideId) {
        try {
          await assignmentsApi.create({
            task_id: task.id,
            aide_id: defaultAideId,
            date: defaultDate,
            start_time: startTimeFormatted,
            end_time: endTimeFormatted,
            status: 'ASSIGNED',
            auto_shorten: true
          } as any);

          // Handle recurrence if requested
          if (isRecurring && selectedWeekdays.length > 0 && numWeeks > 0) {
            const expiresOn = new Date(defaultDate);
            expiresOn.setDate(expiresOn.getDate() + (numWeeks * 7));
            
            await tasksApi.update(task.id, {
              recurrence_rule: `FREQ=WEEKLY;BYDAY=${selectedWeekdays.join(',')}`,
              expires_on: expiresOn.toISOString().split('T')[0],
              aide_id: defaultAideId,
              start_time: startTimeFormatted,
              end_time: endTimeFormatted,
              existing_assignment_date: defaultDate
            });
          }
        } catch (assignmentError: any) {
          // If assignment creation fails, log error but don't fail the whole operation
          // The task was created successfully, assignment can be created later
          console.error('Failed to create assignment:', assignmentError);
          setError(assignmentError.message || 'Task created but failed to assign. You can assign it manually.');
          // Don't close the modal if assignment fails - let user see the error
          setBusy(false);
          return;
        }
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

          {/* Time Selection - Only show when creating with assignment */}
          {!isTemplateOnly && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Start Time</InputLabel>
                <Select
                  value={startTime}
                  label="Start Time"
                  onChange={(e) => handleStartTimeChange(e.target.value)}
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
                  value={endTime}
                  label="End Time"
                  onChange={(e) => setEndTime(e.target.value)}
                >
                  {timeSlots.map(time => (
                    <MenuItem key={time} value={time}>
                      {time}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Recurring Task Options */}
          {!isTemplateOnly && (
            <Box sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Repeat fontSize="small" color={isRecurring ? "primary" : "action"} />
                    <Typography variant="body2" sx={{ fontWeight: isRecurring ? 500 : 400 }}>
                      Make this a recurring task
                    </Typography>
                  </Box>
                }
              />

              {isRecurring && (
                <Box sx={{ ml: 4, mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.8125rem', color: 'text.secondary' }}>
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
                              size="small"
                              checked={selectedWeekdays.includes(day.value)}
                              onChange={() => handleWeekdayToggle(day.value)}
                            />
                          }
                          label={<Typography variant="caption">{day.label}</Typography>}
                          sx={{ mr: 1 }}
                        />
                      ))}
                    </FormGroup>
                  </Box>

                  <TextField
                    label="Number of Weeks"
                    type="number"
                    size="small"
                    value={numWeeks}
                    onChange={(e) => setNumWeeks(Number(e.target.value))}
                    fullWidth
                    required
                    inputProps={{ min: 1, max: 52 }}
                    helperText="How many weeks this task should recur"
                  />
                </Box>
              )}
            </Box>
          )}

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



