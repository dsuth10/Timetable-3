import { timeIntervalsOverlap, timeToMinutes } from './timeUtils';
import { calculateOverlaps } from '../../utils/overlapUtils';

export interface TaskPosition {
  assignment: Assignment;
  top: number;
  height: number;
  left: number;
  width: number;
  column: number;
  maxColumns: number;
}

/**
 * Calculate positioning for all assignments in a day to handle overlaps
 */
export function calculateTaskPositions(
  assignments: Assignment[],
  timeToPixels: (time: string) => number,
  durationToPixels: (start: string, end: string) => number
): TaskPosition[] {
  if (assignments.length === 0) return [];

  const overlapAssignments = calculateOverlaps(assignments);

  return overlapAssignments.map(({ item: assignment, lane, totalLanes, laneSpan }) => {
    const top = timeToPixels(assignment.start_time);
    const height = durationToPixels(assignment.start_time, assignment.end_time);

    const width = (laneSpan / totalLanes) * 100;
    const left = (lane / totalLanes) * 100;

    return {
      assignment,
      top,
      height,
      left,
      width,
      column: lane,
      maxColumns: totalLanes
    };
  });
}

/**
 * Check if two assignments overlap in time
 */
export function assignmentsOverlap(a: Assignment, b: Assignment): boolean {
  return timeIntervalsOverlap(
    a.start_time, a.end_time,
    b.start_time, b.end_time
  );
}

/**
 * Get the maximum number of overlapping assignments at any point in time
 */
export function getMaxOverlaps(assignments: Assignment[]): number {
  if (assignments.length === 0) return 0;

  // Create time points for all start and end times
  const timePoints: Array<{ time: number; type: 'start' | 'end' }> = [];

  assignments.forEach(assignment => {
    timePoints.push(
      { time: timeToMinutes(assignment.start_time), type: 'start' },
      { time: timeToMinutes(assignment.end_time), type: 'end' }
    );
  });

  // Sort by time, with 'end' events before 'start' events at the same time
  timePoints.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.type === 'end' ? -1 : 1;
  });

  let currentOverlaps = 0;
  let maxOverlaps = 0;

  for (const point of timePoints) {
    if (point.type === 'start') {
      currentOverlaps++;
      maxOverlaps = Math.max(maxOverlaps, currentOverlaps);
    } else {
      currentOverlaps--;
    }
  }

  return maxOverlaps;
}
