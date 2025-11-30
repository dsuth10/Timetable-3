// Time calculation constants and utilities for calendar grid positioning

export const PIXELS_PER_MINUTE = 2;
export const START_TIME_MINUTES = 8 * 60 + 50; // 08:50
export const END_TIME_MINUTES = 15 * 60; // 15:00

// Kept for backward compatibility but should be phased out
export const START_HOUR = 8; 
export const END_HOUR = 15; 

export const SCHEDULE_SEGMENTS = [
  { start: '08:50', end: '09:10' },
  { start: '09:10', end: '09:40' },
  { start: '09:40', end: '10:10' },
  { start: '10:10', end: '10:40' },
  { start: '10:40', end: '11:10' },
  { start: '11:10', end: '11:50' },
  { start: '11:50', end: '12:20' },
  { start: '12:20', end: '12:50' },
  { start: '12:50', end: '13:20' },
  { start: '13:20', end: '14:00' },
  { start: '14:00', end: '14:30' }, // Adjusted end time
  { start: '14:30', end: '15:00' }, // Adjusted start time
];

// Calculate total height based on linear time scale
export const TOTAL_HEIGHT_PX = (END_TIME_MINUTES - START_TIME_MINUTES) * PIXELS_PER_MINUTE;

// Legacy constants, mapped to new values where possible
export const SLOT_INTERVAL_MINUTES = 15; // Used as default step
export const SLOT_HEIGHT_PX = 30; // Used as default height for 15 min

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
 * Calculate pixel position for a given time
 */
export function timeToPixels(timeStr: string): number {
  const minutes = timeToMinutes(timeStr);
  return (minutes - START_TIME_MINUTES) * PIXELS_PER_MINUTE;
}

/**
 * Calculate pixel height for a given duration
 */
export function durationToPixels(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  return durationMinutes * PIXELS_PER_MINUTE;
}

/**
 * Snap a time to the nearest segment start time
 */
export function snapToSlot(timeStr: string): string {
  const minutes = timeToMinutes(timeStr);
  
  // Find the closest segment start time
  let closestDiff = Infinity;
  let closestTime = SCHEDULE_SEGMENTS[0].start;
  
  // Check all segment start times
  for (const segment of SCHEDULE_SEGMENTS) {
    const segStartMinutes = timeToMinutes(segment.start);
    const diff = Math.abs(minutes - segStartMinutes);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestTime = segment.start;
    }
  }
  
  // Also check end time of last segment
  const lastSegEndMinutes = timeToMinutes(SCHEDULE_SEGMENTS[SCHEDULE_SEGMENTS.length - 1].end);
  if (Math.abs(minutes - lastSegEndMinutes) < closestDiff) {
    closestTime = SCHEDULE_SEGMENTS[SCHEDULE_SEGMENTS.length - 1].end;
  }

  return closestTime;
}

/**
 * Generate start times for all defined segments
 */
export function generateTimeSlots(): string[] {
  return SCHEDULE_SEGMENTS.map(segment => segment.start);
}

/**
 * Get segment details for a specific start time
 */
export function getSegmentForTime(timeStr: string) {
  return SCHEDULE_SEGMENTS.find(s => s.start === timeStr);
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
export function isWithinWorkingHours(timeStr: string): boolean {
  const minutes = timeToMinutes(timeStr);
  return minutes >= START_TIME_MINUTES && minutes <= END_TIME_MINUTES;
}
