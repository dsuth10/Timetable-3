// Time calculation constants and utilities for calendar grid positioning

export const SLOT_INTERVAL_MINUTES = 15;
export const SLOT_HEIGHT_PX = 30;
export const START_HOUR = 8;
export const END_HOUR = 17;
export const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 60 / SLOT_INTERVAL_MINUTES;

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
  const startMinutes = START_HOUR * 60;
  return ((minutes - startMinutes) / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT_PX;
}

/**
 * Calculate pixel height for a given duration
 */
export function durationToPixels(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const durationMinutes = endMinutes - startMinutes;
  return (durationMinutes / SLOT_INTERVAL_MINUTES) * SLOT_HEIGHT_PX;
}

/**
 * Snap a time to the nearest 15-minute slot
 */
export function snapToSlot(timeStr: string): string {
  const minutes = timeToMinutes(timeStr);
  const snappedMinutes = Math.round(minutes / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
  return minutesToTime(snappedMinutes);
}

/**
 * Generate all time slots for the day
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      slots.push(minutesToTime(hour * 60 + minute));
    }
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
export function isWithinWorkingHours(timeStr: string): boolean {
  const minutes = timeToMinutes(timeStr);
  return minutes >= START_HOUR * 60 && minutes <= END_HOUR * 60;
}