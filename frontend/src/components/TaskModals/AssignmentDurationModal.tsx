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
  Typography,
  Chip,
} from '@mui/material';
import { Schedule, Person, CalendarMonth, AccessTime } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import type { Task, TeacherAide } from '../../types';
import { categoryColors } from '../../theme/theme';
import { 
  timeToMinutes, 
  minutesToTime, 
  START_HOUR, 
  END_HOUR,
  addMinutesToTime
} from '../TimetableGrid/timeUtils';

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    aideId: number | null;
    date: string;
    startTime: string;
    endTime: string;
  }) => void;
  task: Task | null;
  aides: TeacherAide[];
  initialData: {
    aideId: number | null;
    date: string;
    startTime: string; // HH:MM:SS
    endTime: string;   // HH:MM:SS
  };
};

export default function AssignmentDurationModal({
  open,
  onClose,
  onConfirm,
  task,
  aides,
  initialData,
}: Props) {
  const [aideId, setAideId] = useState<number | null>(initialData.aideId);
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | undefined>();

  // Initialize state when modal opens or initialData changes
  useEffect(() => {
    if (open && initialData) {
      setAideId(initialData.aideId);
      
      // Parse date
      const parsedDate = new Date(initialData.date + 'T12:00:00');
      setDate(parsedDate);
      
      // Parse start time (HH:MM:SS format)
      const startParts = initialData.startTime.split(':');
      const startDate = new Date();
      startDate.setHours(parseInt(startParts[0], 10));
      startDate.setMinutes(parseInt(startParts[1], 10));
      startDate.setSeconds(0);
      setStartTime(startDate);
      
      // Parse end time (HH:MM:SS format)
      const endParts = initialData.endTime.split(':');
      const endDate = new Date();
      endDate.setHours(parseInt(endParts[0], 10));
      endDate.setMinutes(parseInt(endParts[1], 10));
      endDate.setSeconds(0);
      setEndTime(endDate);
      
      setError(undefined);
    }
  }, [open, initialData]);

  const handleStartTimeChange = (newTime: Date | null) => {
    if (newTime) {
      setStartTime(newTime);
      // Auto-adjust end time to maintain 30-minute default if end time hasn't been manually set
      if (endTime) {
        const startMinutes = newTime.getHours() * 60 + newTime.getMinutes();
        const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
        const duration = endMinutes - startMinutes;
        
        // If end time is before start time, automatically set end to start + 30 minutes
        if (duration <= 0) {
          const newEndDate = new Date(newTime);
          newEndDate.setMinutes(newEndDate.getMinutes() + 30);
          setEndTime(newEndDate);
        }
      }
    }
  };

  const handleSubmit = () => {
    setError(undefined);
    
    // Validation
    if (!date) {
      setError('Please select a date');
      return;
    }
    
    if (!startTime) {
      setError('Please select a start time');
      return;
    }
    
    if (!endTime) {
      setError('Please select an end time');
      return;
    }
    
    // Convert times to minutes for validation
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    
    // Check if end time is after start time
    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }
    
    // Check if times are within working hours
    const workingStartMinutes = START_HOUR * 60;
    const workingEndMinutes = END_HOUR * 60;
    
    if (startMinutes < workingStartMinutes || startMinutes >= workingEndMinutes) {
      setError(`Start time must be between ${START_HOUR}:00 and ${END_HOUR}:00`);
      return;
    }
    
    if (endMinutes > workingEndMinutes) {
      setError(`End time cannot exceed ${END_HOUR}:00 (end of working hours)`);
      return;
    }
    
    // Format data for submission
    const dateStr = date.toISOString().slice(0, 10);
    const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}:00`;
    const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}:00`;
    
    onConfirm({
      aideId,
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
  };

  const handleClose = () => {
    setError(undefined);
    onClose();
  };

  if (!task) return null;

  // Calculate duration for display
  const getDurationText = () => {
    if (!startTime || !endTime) return '';
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const duration = endMinutes - startMinutes;
    if (duration <= 0) return '';
    
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    
    if (hours === 0) {
      return `${mins} minutes`;
    } else if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule color="primary" />
          Set Assignment Details
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Task Details (Read-only) */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule fontSize="small" />
              Task
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
              {task.classroom && (
                <Typography variant="body2" color="text.secondary">
                  {task.classroom.name}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Date Selection */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  InputProps: {
                    startAdornment: <CalendarMonth sx={{ mr: 1, color: 'action.active' }} />,
                  },
                },
              }}
            />

            {/* Time Selection */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={handleStartTimeChange}
                minutesStep={15}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    InputProps: {
                      startAdornment: <AccessTime sx={{ mr: 1, color: 'action.active' }} />,
                    },
                  },
                }}
              />
              <TimePicker
                label="End Time"
                value={endTime}
                onChange={(newTime) => setEndTime(newTime)}
                minutesStep={15}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    InputProps: {
                      startAdornment: <AccessTime sx={{ mr: 1, color: 'action.active' }} />,
                    },
                  },
                }}
              />
            </Box>
          </LocalizationProvider>

          {/* Duration Display */}
          {startTime && endTime && getDurationText() && (
            <Box sx={{ p: 1.5, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="body2" color="info.dark">
                <strong>Duration:</strong> {getDurationText()}
              </Typography>
            </Box>
          )}

          {/* Aide Selection */}
          <FormControl fullWidth>
            <InputLabel>Assign to Aide</InputLabel>
            <Select
              value={aideId || ''}
              label="Assign to Aide"
              onChange={(e) => setAideId(e.target.value ? Number(e.target.value) : null)}
              startAdornment={<Person sx={{ ml: 1, mr: 0.5, color: 'action.active' }} />}
            >
              <MenuItem value="">
                <em>Leave unassigned</em>
              </MenuItem>
              {aides.map((aide) => (
                <MenuItem key={aide.id} value={aide.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: aide.colour_hex,
                      }}
                    />
                    {aide.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<Schedule />}
        >
          Confirm Assignment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

