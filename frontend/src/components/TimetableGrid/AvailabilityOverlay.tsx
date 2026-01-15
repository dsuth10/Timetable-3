import { Box, Tooltip } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import type { Availability, Absence } from '../../types';
import { useTimeUtils } from './timeUtils';

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

  // Helper to convert HH:MM:SS -> minutes
  const toMinutes = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  };

  const { startTimeMinutes, endTimeMinutes, PIXELS_PER_MINUTE } = useTimeUtils();

  // --- Calculate content variables but keep structure constant ---

  let tooltipTitle = '';
  // Default container style for "Full Box" mode
  let containerStyle: any = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    backgroundImage: 'none',
  };

  let contentChildren: React.ReactNode = null;
  let blocks: { top: number; height: number }[] = [];

  if (isAbsent) {
    const absence = absences.find(
      a => a.aide_id === aideId && a.date === date
    );
    tooltipTitle = `Absent: ${absence?.reason || 'No reason provided'}`;
    containerStyle = {
      ...containerStyle,
      backgroundColor: 'rgba(244, 67, 54, 0.2)',
      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(244, 67, 54, 0.1) 10px, rgba(244, 67, 54, 0.1) 20px)',
    };
    contentChildren = <EventBusy sx={{ fontSize: 48, color: 'error.light', opacity: 0.5 }} />;
  } else if (dayAvailability.length === 0) {
    tooltipTitle = "No availability set for this day";
    containerStyle = {
      ...containerStyle,
      backgroundColor: 'rgba(158, 158, 158, 0.4)',
    };
  } else {
    // Check if we have availability
    const dayWindow = dayAvailability[0];
    if (dayWindow) {
      const workStart = startTimeMinutes;
      const workEnd = endTimeMinutes;
      const availStart = Math.max(workStart, toMinutes(dayWindow.start_time));
      const availEnd = Math.min(workEnd, toMinutes(dayWindow.end_time));

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
    } else {
      // Should be unreachable due to length check but fallback
      containerStyle = {
        ...containerStyle,
        backgroundColor: 'rgba(158, 158, 158, 0.4)',
      };
    }
  }

  // --- Render ---

  // Case 1: Multiple blocks (Partial Availability)
  // We cannot easily wrap multiple absolute positioned blocks in a single useful Tooltip 
  // without a covering div, which would block clicks. 
  // So we render a Fragment of Boxes. 
  // Since we are changing from "Tooltip" to "No Tooltip", we wrap in a predictable root Box.

  if (blocks.length > 0) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
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
            }}
          />
        ))}
      </Box>
    );
  }

  // Case 2: Full coverage (Absent or No Availability or Fallback)
  // We use the Tooltip structure.

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <Tooltip title={tooltipTitle}>
        <Box sx={containerStyle}>
          {contentChildren}
        </Box>
      </Tooltip>
    </Box>
  );
}
