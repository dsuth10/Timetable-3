import { Box, Tooltip } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import type { Availability, Absence } from '../../types';

type AvailabilityOverlayProps = {
  aideId: number;
  availability: Availability[];
  absences: Absence[];
  date: string; // YYYY-MM-DD
};

export default function AvailabilityOverlay({
  aideId,
  availability,
  absences,
  date,
}: AvailabilityOverlayProps) {
  // Check if aide is absent on this date
  const isAbsent = absences.some(
    absence => absence.aide_id === aideId && absence.date === date
  );

  // Get day of week from date
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();
  const weekdayMap: Record<number, string> = {
    0: 'SU',
    1: 'MO',
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA',
  };
  const weekday = weekdayMap[dayOfWeek];

  // Filter availability for this day
  const dayAvailability = availability.filter(
    avail => avail.aide_id === aideId && avail.weekday === weekday
  );

  // If absent, show full overlay
  if (isAbsent) {
    const absence = absences.find(
      a => a.aide_id === aideId && a.date === date
    );
    return (
      <Tooltip title={`Absent: ${absence?.reason || 'No reason provided'}`}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(244, 67, 54, 0.05) 10px, rgba(244, 67, 54, 0.05) 20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <EventBusy sx={{ fontSize: 48, color: 'error.light', opacity: 0.3 }} />
        </Box>
      </Tooltip>
    );
  }

  // If no availability defined, show unavailable
  if (dayAvailability.length === 0) {
    return (
      <Tooltip title="No availability set for this day">
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(158, 158, 158, 0.05)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      </Tooltip>
    );
  }

  // TODO: Show time-specific availability overlays
  // This would require calculating pixel positions based on time ranges
  
  return null;
}

