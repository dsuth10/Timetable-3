import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { Assignment, Task, Absence, Availability } from '../../types';
import { generateTimeSlots, timeToPixels, durationToPixels, TOTAL_HEIGHT_PX, getSegmentForTime, snapToSlot } from './timeUtils';
import { calculateTaskPositions } from './OverlapCalculator';
import { TaskCard } from './TaskCard';
import { TimetableSlot } from './TimetableSlot';
import AvailabilityOverlay from './AvailabilityOverlay';

type TimeSlottedColumnProps = {
  aideId: number;
  date: string;
  assignments: Assignment[];
  tasks: Task[];
  aideColor?: string;
  onTaskDoubleClick?: (assignment: Assignment, task?: Task) => void;
  availability?: Availability[];
  absences?: Absence[];
};

export function TimeSlottedColumn({ 
  aideId, 
  date, 
  assignments, 
  tasks, 
  aideColor,
  onTaskDoubleClick,
  availability = [],
  absences = []
}: TimeSlottedColumnProps) {
  const taskMap = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach(task => map.set(task.id, task));
    return map;
  }, [tasks]);

  const taskPositions = useMemo(() => calculateTaskPositions(assignments), [assignments]);
  const totalHeight = TOTAL_HEIGHT_PX;
  const timeSlots = useMemo(() => generateTimeSlots(), []);

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
      <AvailabilityOverlay
        aideId={aideId}
        availability={availability}
        absences={absences}
        date={date}
      />

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

        return (
          <TimetableSlot
            key={timeSlot}
            aideId={aideId}
            date={date}
            timeSlot={timeSlot}
            top={top}
            height={height}
          >
            {/* Render task cards that start in this slot */}
            {slotTasks.map((position, taskIndex) => {
              const task = taskMap.get(position.assignment.task_id);
              return (
                <Box
                  key={position.assignment.id}
                  sx={{
                    position: 'absolute',
                    top: position.top - top, // Position relative to slot top
                    left: `${position.left}%`,
                    width: `${position.width}%`,
                    height: `${position.height}px`,
                    zIndex: 2,
                  }}
                >
                  <TaskCard
                    assignment={position.assignment}
                    index={taskIndex}
                    task={task}
                    aideColor={aideColor}
                    isPositioned={true}
                    onDoubleClick={onTaskDoubleClick}
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
