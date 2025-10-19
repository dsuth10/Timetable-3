import { useMemo } from 'react';
import { Box } from '@mui/material';
import type { Assignment, Task } from '../../types';
import { generateTimeSlots, SLOT_HEIGHT_PX, START_HOUR, END_HOUR } from './timeUtils';
import { calculateTaskPositions } from './OverlapCalculator';
import { TaskCard } from './TaskCard';
import { TimetableSlot } from './TimetableSlot';

type TimeSlottedColumnProps = {
  aideId: number;
  date: string;
  assignments: Assignment[];
  tasks: Task[];
  aideColor?: string;
  onTaskDoubleClick?: (assignment: Assignment, task?: Task) => void;
};

export function TimeSlottedColumn({ 
  aideId, 
  date, 
  assignments, 
  tasks, 
  aideColor,
  onTaskDoubleClick
}: TimeSlottedColumnProps) {
  const taskMap = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach(task => map.set(task.id, task));
    return map;
  }, [tasks]);

  const taskPositions = useMemo(() => calculateTaskPositions(assignments), [assignments]);
  const totalHeight = (END_HOUR - START_HOUR) * 4 * SLOT_HEIGHT_PX; // 4 slots per hour, 30px each
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Map task positions to their starting time slots
  const tasksBySlot = useMemo(() => {
    const map = new Map<string, typeof taskPositions>();
    taskPositions.forEach(position => {
      const slotTime = timeSlots[Math.floor(position.top / SLOT_HEIGHT_PX)];
      if (slotTime) {
        const existing = map.get(slotTime) || [];
        map.set(slotTime, [...existing, position]);
      }
    });
    return map;
  }, [taskPositions, timeSlots]);

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
      {/* Time slot droppables with their task cards */}
      {timeSlots.map((timeSlot, index) => {
        const slotTasks = tasksBySlot.get(timeSlot) || [];
        return (
          <TimetableSlot
            key={timeSlot}
            aideId={aideId}
            date={date}
            timeSlot={timeSlot}
            index={index}
          >
            {/* Render task cards that start in this slot */}
            {slotTasks.map((position, taskIndex) => {
              const task = taskMap.get(position.assignment.task_id);
              return (
                <Box
                  key={position.assignment.id}
                  sx={{
                    position: 'absolute',
                    top: 0, // Already positioned by time slot
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
