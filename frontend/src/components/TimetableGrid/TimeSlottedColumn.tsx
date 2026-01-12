import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { Assignment, Task, Absence, Availability, TeacherAide } from '../../types';
import { generateTimeSlots, timeToPixels, durationToPixels, TOTAL_HEIGHT_PX, getSegmentForTime, snapToSlot, timeIntervalsOverlap, addMinutesToTime } from './timeUtils';
import { calculateTaskPositions } from './OverlapCalculator';
import { TaskCard } from './TaskCard';
import { TimetableSlot } from './TimetableSlot';
import AvailabilityOverlay from './AvailabilityOverlay';
import { calculateGaps } from '../../utils/gapUtils';
import GapHighlight from './GapHighlight';

type TimeSlottedColumnProps = {
  aideId?: number; // Optional for Class View
  date: string;
  assignments: Assignment[];
  tasks: Task[];
  aideColor?: string;
  onTaskDoubleClick?: (assignment: Assignment, task?: Task) => void;
  availability?: Availability[];
  absences?: Absence[];
  showAideName?: boolean;
  aides?: TeacherAide[];
  onSlotClick?: (date: string, time: string) => void;
  onQuickCreate?: (date: string, time: string) => void;
};

export function TimeSlottedColumn({
  aideId,
  date,
  assignments,
  tasks,
  aideColor,
  onTaskDoubleClick,
  availability = [],
  absences = [],
  showAideName,
  aides = [],
  onSlotClick,
  onQuickCreate,
}: TimeSlottedColumnProps) {
  const taskMap = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach(task => map.set(task.id, task));
    return map;
  }, [tasks]);

  const totalHeight = TOTAL_HEIGHT_PX;
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Calculate gaps for snapping
  const gridLines = useMemo(() => {
    const lines = timeSlots.map(s => s.substring(0, 5));
    // Add the end time of the last slot
    const lastSlotStart = timeSlots[timeSlots.length - 1];
    const segment = getSegmentForTime(lastSlotStart);
    if (segment) {
      lines.push(segment.end);
    }
    return lines;
  }, [timeSlots]);

  const gaps = useMemo(() => {
    if (!aideId) return [];
    // Ensure absences is filtered for the current aide and date
    const relevantAbsences = absences.filter(a => a.aide_id === aideId && a.date === date);
    // Find the aide to get their availability
    const aide = aides?.find(a => a.id === aideId);
    return calculateGaps(assignments, relevantAbsences, gridLines, aideId, date, aide?.availability);
  }, [assignments, absences, aideId, date, gridLines, aides]);

  // Group assignments by task instance for Class View
  const processedAssignments = useMemo(() => {
    if (!showAideName) return assignments;

    const grouped = new Map<string, { assignment: Assignment; aideNames: string[] }>();

    assignments.forEach(asg => {
      const key = `${asg.task_id}-${asg.start_time}-${asg.end_time}`;
      const aide = aides.find(a => a.id === asg.aide_id);

      if (grouped.has(key)) {
        if (aide) grouped.get(key)!.aideNames.push(aide.name);
      } else {
        grouped.set(key, {
          assignment: asg,
          aideNames: aide ? [aide.name] : []
        });
      }
    });

    return Array.from(grouped.values()).map(g => ({
      ...g.assignment,
      // Store names in a temp property that TaskCard can use
      _aideNames: g.aideNames.join(', ')
    }));
  }, [assignments, showAideName, aides]);

  const taskPositions = useMemo(() => calculateTaskPositions(processedAssignments), [processedAssignments]);

  // Map task positions to their starting time slots
  const tasksBySlot = useMemo(() => {
    const map = new Map<string, typeof taskPositions>();
    taskPositions.forEach(position => {
      const startTime = position.assignment.start_time;
      // Snap to the nearest slot to group tasks
      const slotTime = snapToSlot(startTime);

      if (slotTime) {
        const existing = map.get(slotTime) || [];
        map.set(slotTime, [...existing, position]);
      }
    });
    return map;
  }, [taskPositions]);

  return (
    <Box
      sx={{
        position: 'relative',
        height: totalHeight,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: 'background.default',
      }}
    >
      {/* Availability / Absence overlay (non-blocking) */}
      {aideId && (
        <AvailabilityOverlay
          aideId={aideId}
          availability={availability}
          absences={absences}
          date={date}
        />
      )}

      {/* Special break shades (11:10-11:50 and 13:20-14:00) */}
      {['11:10', '13:20'].map((time) => {
        const segment = getSegmentForTime(time);
        if (!segment) return null;

        const top = timeToPixels(segment.start);
        const height = durationToPixels(segment.start, segment.end);

        return (
          <Box
            key={`break-${time}`}
            sx={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height,
              backgroundColor: '#e8f5e9', // Light green
              zIndex: 0,
              pointerEvents: 'none',
            }}
          />
        );
      })}

      {/* Time slot droppables with their task cards */}
      {timeSlots.map((timeSlot) => {
        const segment = getSegmentForTime(timeSlot);
        if (!segment) return null;

        const top = timeToPixels(segment.start);
        const height = durationToPixels(segment.start, segment.end);
        const slotTasks = tasksBySlot.get(timeSlot) || [];

        // Find gaps that fall into this specific slot
        const slotGaps = gaps.filter(g => {
          return timeIntervalsOverlap(timeSlot.substring(0, 5), segment.end, g.start_time, g.end_time);
        });

        return (
          <TimetableSlot
            key={timeSlot}
            aideId={aideId || 0} // Pass 0 or dummy if no aideId
            date={date}
            timeSlot={timeSlot}
            top={top}
            height={height}
            onClick={onSlotClick}
            onQuickCreate={onQuickCreate}
            gaps={slotGaps}
            aideColor={aideColor}
          >
            {/* Render task cards that start in this slot */}
            {slotTasks.map((position, taskIndex) => {
              const task = taskMap.get(position.assignment.task_id);
              const aide = aides.find(a => a.id === position.assignment.aide_id);
              return (
                <Box
                  key={position.assignment.id}
                  sx={{
                    position: 'absolute',
                    top: position.top - top, // Position relative to slot top
                    left: `${position.left}%`,
                    width: `${position.width}%`,
                    height: `${position.height}px`,
                    zIndex: 5,
                  }}
                >
                  <TaskCard
                    assignment={position.assignment}
                    index={taskIndex}
                    task={task}
                    aideColor={aide ? aide.colour_hex : aideColor}
                    isPositioned={true}
                    onDoubleClick={onTaskDoubleClick}
                    showAideName={showAideName}
                    aideName={(position.assignment as any)._aideNames || aide?.name}
                    viewMode={showAideName ? 'class' : 'aide'}
                  />
                </Box>
              );
            })}
          </TimetableSlot>
        );
      })}
    </Box>
  );
}
