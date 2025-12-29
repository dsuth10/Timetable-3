import { Assignment, Absence } from '../types';
import { 
  timeToMinutes, 
  minutesToTime, 
  calculateDuration, 
  timeIntervalsOverlap 
} from '../components/TimetableGrid/timeUtils';

export interface Gap {
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  duration: number;   // minutes
  aide_id: number;
  date: string;
}

/**
 * Calculates available gaps in an aide's schedule for a specific date.
 * Gaps are segments of time that:
 * 1. Are at least 10 minutes wide.
 * 2. Do not overlap with existing assignments or absences.
 * 3. Do not cross grid line boundaries.
 * 4. Are within working hours (implicitly defined by grid lines).
 */
export function calculateGaps(
  assignments: Assignment[],
  absences: Absence[],
  gridLines: string[],
  aide_id: number,
  date: string
): Gap[] {
  const gaps: Gap[] = [];

  // 1. Iterate through each grid interval
  for (let i = 0; i < gridLines.length - 1; i++) {
    const intervalStart = gridLines[i];
    const intervalEnd = gridLines[i + 1];
    
    // Sort assignments in this interval by start time
    const relevantAssignments = assignments
      .filter(asg => {
        const asgStart = asg.start_time.substring(0, 5);
        const asgEnd = asg.end_time.substring(0, 5);
        return timeIntervalsOverlap(intervalStart, intervalEnd, asgStart, asgEnd);
      })
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    // For now, we assume an absence covers the WHOLE day if it exists for this date.
    // (AideWithStatus.is_absent is already true if an absence exists).
    // If the aide is absent, this interval has NO gaps.
    const isAbsent = absences.some(abs => abs.date === date);
    if (isAbsent) continue;

    // 2. Find empty segments within this interval
    let currentPos = timeToMinutes(intervalStart);
    const intervalEndMin = timeToMinutes(intervalEnd);

    for (const asg of relevantAssignments) {
      const asgStartMin = timeToMinutes(asg.start_time.substring(0, 5));
      const asgEndMin = timeToMinutes(asg.end_time.substring(0, 5));

      // Check for gap before this assignment
      if (asgStartMin > currentPos) {
        const duration = asgStartMin - currentPos;
        if (duration >= 10) {
          gaps.push({
            start_time: minutesToTime(currentPos),
            end_time: minutesToTime(asgStartMin),
            duration,
            aide_id,
            date
          });
        }
      }
      
      // Advance position to end of assignment
      currentPos = Math.max(currentPos, asgEndMin);
    }

    // Check for gap after last assignment until interval end
    if (intervalEndMin > currentPos) {
      const duration = intervalEndMin - currentPos;
      if (duration >= 10) {
        gaps.push({
          start_time: minutesToTime(currentPos),
          end_time: minutesToTime(intervalEndMin),
          duration,
          aide_id,
          date
        });
      }
    }
  }

  return gaps;
}

/**
 * Checks if there's a gap smaller than 10 minutes at the given drop time.
 */
export function findSmallGap(
  assignments: Assignment[],
  gridLines: string[],
  dropTime: string
): boolean {
  // Find which grid interval the dropTime falls into
  const dropMins = timeToMinutes(dropTime);
  let intervalStart = '';
  let intervalEnd = '';

  for (let i = 0; i < gridLines.length - 1; i++) {
    const start = gridLines[i];
    const end = gridLines[i + 1];
    if (dropMins >= timeToMinutes(start) && dropMins < timeToMinutes(end)) {
      intervalStart = start;
      intervalEnd = end;
      break;
    }
  }

  if (!intervalStart) return false;

  const relevantAssignments = assignments
    .filter(asg => {
      const asgStart = asg.start_time.substring(0, 5);
      const asgEnd = asg.end_time.substring(0, 5);
      return timeIntervalsOverlap(intervalStart, intervalEnd, asgStart, asgEnd);
    })
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  let currentPos = timeToMinutes(intervalStart);
  const intervalEndMin = timeToMinutes(intervalEnd);

  for (const asg of relevantAssignments) {
    const asgStartMin = timeToMinutes(asg.start_time.substring(0, 5));
    const asgEndMin = timeToMinutes(asg.end_time.substring(0, 5));

    if (asgStartMin > currentPos) {
      const duration = asgStartMin - currentPos;
      if (duration < 10 && dropMins >= currentPos && dropMins < asgStartMin) {
        return true;
      }
    }
    currentPos = Math.max(currentPos, asgEndMin);
  }

  if (intervalEndMin > currentPos) {
    const duration = intervalEndMin - currentPos;
    if (duration < 10 && dropMins >= currentPos && dropMins < intervalEndMin) {
      return true;
    }
  }

  return false;
}


