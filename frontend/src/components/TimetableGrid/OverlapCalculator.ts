import type { Assignment } from '../../types';
import { timeIntervalsOverlap, timeToMinutes, timeToPixels, durationToPixels } from './timeUtils';

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
export function calculateTaskPositions(assignments: Assignment[]): TaskPosition[] {
  if (assignments.length === 0) return [];

  // Sort assignments by start time
  const sortedAssignments = [...assignments].sort((a, b) => 
    timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );

  // Group assignments into overlap groups
  const overlapGroups: Assignment[][] = [];
  const processed = new Set<number>();

  for (let i = 0; i < sortedAssignments.length; i++) {
    if (processed.has(sortedAssignments[i].id)) continue;

    const currentGroup: Assignment[] = [sortedAssignments[i]];
    processed.add(sortedAssignments[i].id);

    // Find all assignments that overlap with any assignment in current group
    let foundOverlap = true;
    while (foundOverlap) {
      foundOverlap = false;
      for (let j = i + 1; j < sortedAssignments.length; j++) {
        if (processed.has(sortedAssignments[j].id)) continue;

        // Check if this assignment overlaps with any in current group
        const hasOverlap = currentGroup.some(groupAssignment => 
          timeIntervalsOverlap(
            groupAssignment.start_time, groupAssignment.end_time,
            sortedAssignments[j].start_time, sortedAssignments[j].end_time
          )
        );

        if (hasOverlap) {
          currentGroup.push(sortedAssignments[j]);
          processed.add(sortedAssignments[j].id);
          foundOverlap = true;
        }
      }
    }

    overlapGroups.push(currentGroup);
  }

  // Calculate positions for each group
  const positions: TaskPosition[] = [];

  for (const group of overlapGroups) {
    const maxColumns = group.length;
    
    for (let i = 0; i < group.length; i++) {
      const assignment = group[i];
      const top = timeToPixels(assignment.start_time);
      const height = durationToPixels(assignment.start_time, assignment.end_time);
      const left = (i / maxColumns) * 100;
      const width = (1 / maxColumns) * 100;

      positions.push({
        assignment,
        top,
        height,
        left,
        width,
        column: i,
        maxColumns
      });
    }
  }

  return positions;
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
