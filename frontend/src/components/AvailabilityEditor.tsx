import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Grid,
  Paper,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AccessTime, Schedule } from '@mui/icons-material';
import { aidesApi } from '../services/aidesApi';
import { generateTimeSlots, timeToMinutes, snapToSlot } from './TimetableGrid/timeUtils';
import type { Availability, ID, Weekday } from '../types';

type AvailabilityEditorProps = {
  aideId: ID;
  initialAvailability?: Availability[];
  onAvailabilityChange?: (availability: Availability[]) => void;
  disabled?: boolean;
};

type DayAvailability = {
  weekday: Weekday;
  enabled: boolean;
  startTime: string;
  endTime: string;
  availabilityId?: ID;
};

const WEEKDAYS: { key: Weekday; label: string }[] = [
  { key: 'MO', label: 'Monday' },
  { key: 'TU', label: 'Tuesday' },
  { key: 'WE', label: 'Wednesday' },
  { key: 'TH', label: 'Thursday' },
  { key: 'FR', label: 'Friday' },
];

const DEFAULT_START_TIME = '08:00';
const DEFAULT_END_TIME = '17:00';

export default function AvailabilityEditor({
  aideId,
  initialAvailability = [],
  onAvailabilityChange,
  disabled = false,
}: AvailabilityEditorProps) {
  const [dayAvailability, setDayAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Initialize day availability from props or defaults
  useEffect(() => {
    const initializeAvailability = () => {
      const days: DayAvailability[] = WEEKDAYS.map(day => {
        const existing = initialAvailability.find(avail => avail.weekday === day.key);
        return {
          weekday: day.key,
          enabled: !!existing,
          startTime: existing?.start_time?.substring(0, 5) || DEFAULT_START_TIME,
          endTime: existing?.end_time?.substring(0, 5) || DEFAULT_END_TIME,
          availabilityId: existing?.id,
        };
      });
      setDayAvailability(days);
    };

    initializeAvailability();
  }, [initialAvailability]);

  // Generate time slots for dropdowns
  const timeSlots = generateTimeSlots();

  const handleDayToggle = async (weekday: Weekday, enabled: boolean) => {
    if (disabled) return;

    setLoading(true);
    setError(undefined);

    try {
      const dayIndex = dayAvailability.findIndex(day => day.weekday === weekday);
      const day = dayAvailability[dayIndex];

      if (enabled) {
        // Create new availability
        const newAvailability = await aidesApi.availability.create(aideId, {
          weekday,
          start_time: `${day.startTime}:00`,
          end_time: `${day.endTime}:00`,
        });

        // Update local state
        const updatedDays = [...dayAvailability];
        updatedDays[dayIndex] = {
          ...day,
          enabled: true,
          availabilityId: newAvailability.id,
        };
        setDayAvailability(updatedDays);
        onAvailabilityChange?.(updatedDays.filter(d => d.enabled).map(d => ({
          id: d.availabilityId!,
          aide_id: aideId,
          weekday: d.weekday as Weekday,
          start_time: `${d.startTime}:00`,
          end_time: `${d.endTime}:00`,
        })));
      } else {
        // Delete existing availability
        if (day.availabilityId) {
          await aidesApi.availability.delete(aideId, day.availabilityId);
        }

        // Update local state
        const updatedDays = [...dayAvailability];
        updatedDays[dayIndex] = {
          ...day,
          enabled: false,
          availabilityId: undefined,
        };
        setDayAvailability(updatedDays);
        onAvailabilityChange?.(updatedDays.filter(d => d.enabled).map(d => ({
          id: d.availabilityId!,
          aide_id: aideId,
          weekday: d.weekday as Weekday,
          start_time: `${d.startTime}:00`,
          end_time: `${d.endTime}:00`,
        })));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = async (weekday: Weekday, field: 'startTime' | 'endTime', value: string) => {
    if (disabled) return;

    const dayIndex = dayAvailability.findIndex(day => day.weekday === weekday);
    const day = dayAvailability[dayIndex];

    if (!day.enabled) return;

    // Validate time
    const snappedValue = snapToSlot(value);
    const startTime = field === 'startTime' ? snappedValue : day.startTime;
    const endTime = field === 'endTime' ? snappedValue : day.endTime;

    // Validate end time is after start time
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError('End time must be after start time');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      // Delete existing and create new (since we can only have one per day)
      if (day.availabilityId) {
        await aidesApi.availability.delete(aideId, day.availabilityId);
      }

      const newAvailability = await aidesApi.availability.create(aideId, {
        weekday,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
      });

      // Update local state
      const updatedDays = [...dayAvailability];
      updatedDays[dayIndex] = {
        ...day,
        startTime,
        endTime,
        availabilityId: newAvailability.id,
      };
      setDayAvailability(updatedDays);
      onAvailabilityChange?.(updatedDays.filter(d => d.enabled).map(d => ({
        id: d.availabilityId!,
        aide_id: aideId,
        weekday: d.weekday,
        start_time: `${d.startTime}:00`,
        end_time: `${d.endTime}:00`,
      })));
    } catch (err: any) {
      setError(err.message || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (day: DayAvailability | undefined) => {
    if (!day || !day.enabled) {
      return { label: 'Unavailable', color: 'default' as const };
    }
    return { label: 'Available', color: 'success' as const };
  };

  // Don't render until dayAvailability is properly initialized
  if (dayAvailability.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Schedule color="primary" />
          <Typography variant="h6">Weekly Availability</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Schedule color="primary" />
        <Typography variant="h6">Weekly Availability</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {WEEKDAYS.map((day, index) => {
          const dayData = dayAvailability[index];
          if (!dayData) {
            return null; // Skip rendering if data not yet loaded
          }
          const status = getDayStatus(dayData);

          return (
            <Grid item xs={12} sm={6} md={4} key={day.key}>
              <Paper
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: dayData.enabled ? 'success.main' : 'divider',
                  backgroundColor: dayData.enabled ? 'success.50' : 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="medium">
                    {day.label}
                  </Typography>
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    variant={dayData.enabled ? 'filled' : 'outlined'}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={dayData.enabled}
                      onChange={(e) => handleDayToggle(day.key, e.target.checked)}
                      disabled={disabled || loading}
                    />
                  }
                  label={dayData.enabled ? 'Available' : 'Unavailable'}
                />

                {dayData.enabled && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                      <AccessTime fontSize="small" color="action" />
                      <TextField
                        select
                        size="small"
                        value={dayData.startTime}
                        onChange={(e) => handleTimeChange(day.key, 'startTime', e.target.value)}
                        disabled={disabled || loading}
                        SelectProps={{
                          native: true,
                        }}
                        sx={{ minWidth: 80 }}
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </TextField>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      to
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                      <AccessTime fontSize="small" color="action" />
                      <TextField
                        select
                        size="small"
                        value={dayData.endTime}
                        onChange={(e) => handleTimeChange(day.key, 'endTime', e.target.value)}
                        disabled={disabled || loading}
                        SelectProps={{
                          native: true,
                        }}
                        sx={{ minWidth: 80 }}
                      >
                        {timeSlots.map(time => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </TextField>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        💡 Tip: To make an aide unavailable on a specific day, simply toggle it off. 
        Days without availability are shown as unavailable in the schedule.
      </Typography>
    </Box>
  );
}
