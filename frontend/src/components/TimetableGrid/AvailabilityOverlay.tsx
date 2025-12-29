import { Box, Tooltip } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import type { Availability, Absence } from '../../types';
import { START_TIME_MINUTES, END_TIME_MINUTES, PIXELS_PER_MINUTE } from './timeUtils';

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

  // Get day of week from date (using UTC to avoid timezone issues)
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = dateObj.getUTCDay();
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
            backgroundColor: 'rgba(244, 67, 54, 0.2)',
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(244, 67, 54, 0.1) 10px, rgba(244, 67, 54, 0.1) 20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <EventBusy sx={{ fontSize: 48, color: 'error.light', opacity: 0.5 }} />
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
            backgroundColor: 'rgba(158, 158, 158, 0.4)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      </Tooltip>
    );
  }

  // Compute unavailable blocks (complement of availability) for this day
  // Assumption: at most one availability window per weekday (per backend contract)
  const dayWindow = dayAvailability[0] || null;
  if (!dayWindow) {
    // No availability configured: full-day light gray overlay
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(158, 158, 158, 0.4)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    );
  }

  // Helper to convert HH:MM:SS -> minutes
  const toMinutes = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  };

  const workStart = START_TIME_MINUTES;
  const workEnd = END_TIME_MINUTES;
  const availStart = Math.max(workStart, toMinutes(dayWindow.start_time));
  const availEnd = Math.min(workEnd, toMinutes(dayWindow.end_time));

  const blocks: { top: number; height: number }[] = [];

  // Block before availability
  if (availStart > workStart) {
    const duration = availStart - workStart;
    blocks.push({ top: 0, height: duration * PIXELS_PER_MINUTE });
  }
  // Block after availability
  if (availEnd < workEnd) {
    const durationFromStart = availEnd - workStart;
    const top = durationFromStart * PIXELS_PER_MINUTE;
    const duration = workEnd - availEnd;
    blocks.push({ top, height: duration * PIXELS_PER_MINUTE });
  }

  return (
    <>
      {blocks.map((b, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: b.top,
            height: b.height,
            backgroundColor: 'rgba(158, 158, 158, 0.4)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      ))}
    </>
  );
}
