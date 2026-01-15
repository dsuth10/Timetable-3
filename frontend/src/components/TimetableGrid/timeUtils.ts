// Time calculation constants and utilities for calendar grid positioning
import { useScheduleStore } from '../../store/stores/scheduleStore';

export const PIXELS_PER_MINUTE = 2.5;

/**
 * Hook to provide reactive time calculation utilities
 */
export function useTimeUtils() {
  const { startTimeMinutes, endTimeMinutes, scheduleSegments } = useScheduleStore();

  return {
    startTimeMinutes,
    endTimeMinutes,
    scheduleSegments,
    getTotalHeightPx: () => (endTimeMinutes - startTimeMinutes) * PIXELS_PER_MINUTE,
    timeToPixels: (timeStr: string) => timeToPixelsStandalone(timeStr, startTimeMinutes),
    durationToPixels: (startTime: string, endTime: string) => durationToPixelsStandalone(startTime, endTime),
    snapToSlot: (timeStr: string) => snapToSlotStandalone(timeStr, scheduleSegments),
    generateTimeSlots: () => scheduleSegments.map(segment => segment.start),
    generateAllTimeSlots: () => generateAllTimeSlotsStandalone(startTimeMinutes, endTimeMinutes),
    getSegmentForTime: (timeStr: string) => scheduleSegments.find(s => s.start === timeStr),
    isWithinWorkingHours: (timeStr: string) => isWithinWorkingHoursStandalone(timeStr, startTimeMinutes, endTimeMinutes),
    // Re-export pure utilities for convenience
    timeToMinutes,
    minutesToTime,
    addMinutesToTime,
    calculateDuration,
    timeIntervalsOverlap,
  };
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Standlone pixel position calculation
 */
export function timeToPixelsStandalone(timeStr: string, startTimeMinutes: number): number {
  const minutes = timeToMinutes(timeStr);
  return (minutes - startTimeMinutes) * PIXELS_PER_MINUTE;
}

/**
 * Standalone pixel height calculation
 */
export function durationToPixelsStandalone(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  return durationMinutes * PIXELS_PER_MINUTE;
}

/**
 * Snap a time to the nearest segment start time
 */
export function snapToSlotStandalone(timeStr: string, segments: { start: string, end: string }[]): string {
  const minutes = timeToMinutes(timeStr);

  if (segments.length === 0) return timeStr;

  // Find the closest segment start time
  let closestDiff = Infinity;
  let closestTime = segments[0].start;

  // Check all segment start times
  for (const segment of segments) {
    const segStartMinutes = timeToMinutes(segment.start);
    const diff = Math.abs(minutes - segStartMinutes);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestTime = segment.start;
    }
  }

  // Also check end time of last segment
  const lastSegEndMinutes = timeToMinutes(segments[segments.length - 1].end);
  if (Math.abs(minutes - lastSegEndMinutes) < closestDiff) {
    closestTime = segments[segments.length - 1].end;
  }

  return closestTime;
}

/**
 * Generate all possible time slots at 5-minute increments within working hours
 */
export function generateAllTimeSlotsStandalone(startTimeMinutes: number, endTimeMinutes: number): string[] {
  const slots: string[] = [];
  let currentMinutes = startTimeMinutes;

  while (currentMinutes <= endTimeMinutes) {
    slots.push(minutesToTime(currentMinutes));
    currentMinutes += 5;
  }

  return slots;
}

/**
 * Check if two time intervals overlap
 */
export function timeIntervalsOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  return start1Min < end2Min && start2Min < end1Min;
}

/**
 * Calculate duration in minutes between two times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
}

/**
 * Add minutes to a time string and return new time
 */
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const currentMinutes = timeToMinutes(timeStr);
  return minutesToTime(currentMinutes + minutes);
}

/**
 * Check if a time is within working hours
 */
export function isWithinWorkingHoursStandalone(timeStr: string, startTimeMinutes: number, endTimeMinutes: number): boolean {
  const minutes = timeToMinutes(timeStr);
  return minutes >= startTimeMinutes && minutes <= endTimeMinutes;
}
