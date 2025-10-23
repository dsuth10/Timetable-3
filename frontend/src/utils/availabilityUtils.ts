import type { Availability } from '../types';

/**
 * Converts time string (HH:MM:SS or HH:MM) to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Gets weekday abbreviation from date string (YYYY-MM-DD)
 */
function getWeekdayFromDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();
  const weekdayMap: Record<number, string> = {
    0: 'SU',
    1: 'MO', 
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA',
  };
  return weekdayMap[dayOfWeek];
}

/**
 * Checks if an aide is available at a specific date and time range
 * @param availability Array of availability records for the aide
 * @param date Date in YYYY-MM-DD format
 * @param startTime Start time in HH:MM:SS or HH:MM format
 * @param endTime End time in HH:MM:SS or HH:MM format
 * @returns true if aide is available for the entire time range, false otherwise
 */
export function isAideAvailable(
  availability: Availability[],
  date: string,
  startTime: string,
  endTime: string
): boolean {
  // If no availability configured, treat as unavailable
  if (!availability || availability.length === 0) {
    return false;
  }

  // Get weekday from date
  const weekday = getWeekdayFromDate(date);
  
  // Find availability record for this weekday
  const dayAvailability = availability.find(avail => avail.weekday === weekday);
  
  // If no availability for this weekday, treat as unavailable
  if (!dayAvailability) {
    return false;
  }

  // Convert times to minutes for comparison
  const taskStartMinutes = timeToMinutes(startTime);
  const taskEndMinutes = timeToMinutes(endTime);
  const availStartMinutes = timeToMinutes(dayAvailability.start_time);
  const availEndMinutes = timeToMinutes(dayAvailability.end_time);

  // Check if entire task time range falls within availability window
  return taskStartMinutes >= availStartMinutes && taskEndMinutes <= availEndMinutes;
}

/**
 * Gets availability information for an aide on a specific date
 * @param availability Array of availability records for the aide
 * @param date Date in YYYY-MM-DD format
 * @returns Object with availability status and details
 */
export function getAvailabilityInfo(
  availability: Availability[],
  date: string
): {
  isAvailable: boolean;
  hasAvailability: boolean;
  timeWindow?: { start: string; end: string };
  weekday: string;
} {
  const weekday = getWeekdayFromDate(date);
  
  if (!availability || availability.length === 0) {
    return {
      isAvailable: false,
      hasAvailability: false,
      weekday
    };
  }

  const dayAvailability = availability.find(avail => avail.weekday === weekday);
  
  if (!dayAvailability) {
    return {
      isAvailable: false,
      hasAvailability: true,
      weekday
    };
  }

  return {
    isAvailable: true,
    hasAvailability: true,
    timeWindow: {
      start: dayAvailability.start_time,
      end: dayAvailability.end_time
    },
    weekday
  };
}
