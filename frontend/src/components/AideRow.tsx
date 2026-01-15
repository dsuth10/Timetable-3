import { Box, Typography, Avatar, alpha, Tooltip } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import type { AideWithStatus, TimelineConfig, Assignment, Absence } from '../types';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TimetableGrid/TaskCard';
import { useMemo } from 'react';
import { getAvailabilityInfo } from '../utils/availabilityUtils';
import { addMinutesToTime, timeIntervalsOverlap, timeToMinutes, useTimeUtils } from './TimetableGrid/timeUtils';
import { calculateGaps } from '../utils/gapUtils';
import { calculateOverlaps } from '../utils/overlapUtils';
import GapHighlight from './TimetableGrid/GapHighlight';

interface AideRowProps {
  aide: AideWithStatus;
  date: string; // YYYY-MM-DD
  timelineConfig: TimelineConfig;
  onTaskDoubleClick?: (assignment: Assignment) => void;
}

export default function AideRow({ aide, date, timelineConfig, onTaskDoubleClick }: AideRowProps) {
  const { timeToMinutes } = useTimeUtils();

  const timelineStart = timeToMinutes(timelineConfig.slots[0].start_time);
  const timelineEnd = timelineStart + timelineConfig.slots.reduce((acc, slot) => acc + slot.duration_minutes, 0);
  const totalMinutes = timelineEnd - timelineStart;

  // Calculate gaps for snapping
  const gridLines = useMemo(() => {
    const lines = timelineConfig.slots.map(s => s.start_time.substring(0, 5));
    // Add the end time of the last slot
    const lastSlot = timelineConfig.slots[timelineConfig.slots.length - 1];
    const [h, m] = lastSlot.start_time.split(':').map(Number);
    const lastEndMins = h * 60 + m + lastSlot.duration_minutes;
    lines.push(`${Math.floor(lastEndMins / 60).toString().padStart(2, '0')}:${(lastEndMins % 60).toString().padStart(2, '0')}`);
    return lines;
  }, [timelineConfig]);

  const gaps = useMemo(() => {
    // Note: We need actual Absence objects for calculateGaps if we want to support time-based absences.
    // For now, if aide.is_absent is true, we pass a mock absence for the day.
    const mockAbsences: Absence[] = aide.is_absent ? [{ id: 0, aide_id: aide.id, date: date }] : [];
    return calculateGaps(aide.assignments, mockAbsences, gridLines, aide.id, date, aide.availability);
  }, [aide.assignments, aide.is_absent, aide.id, date, gridLines, aide.availability]);

  // Calculate availability shading
  const availabilityInfo = useMemo(() => {
    return getAvailabilityInfo(aide.availability || [], date);
  }, [aide.availability, date]);

  const unavailabilityBlocks = useMemo(() => {
    if (!availabilityInfo.hasAvailability || !availabilityInfo.timeWindow) {
      return [];
    }

    const blocks = [];
    const availStart = timeToMinutes(availabilityInfo.timeWindow.start);
    const availEnd = timeToMinutes(availabilityInfo.timeWindow.end);

    // Block before availability
    if (availStart > timelineStart) {
      const start = timelineStart;
      const end = Math.min(availStart, timelineEnd);
      blocks.push({
        left: 0,
        width: ((end - start) / totalMinutes) * 100
      });
    }

    // Block after availability
    if (availEnd < timelineEnd) {
      const start = Math.max(availEnd, timelineStart);
      const end = timelineEnd;
      blocks.push({
        left: ((start - timelineStart) / totalMinutes) * 100,
        width: ((end - start) / totalMinutes) * 100
      });
    }

    return blocks;
  }, [availabilityInfo, timelineStart, timelineEnd, totalMinutes]);

  // Calculate horizontal positions and vertical split for overlaps
  const taskLayouts = useMemo(() => {
    if (aide.assignments.length === 0) return [];

    const overlapAssignments = calculateOverlaps(aide.assignments);

    return overlapAssignments.map(({ item: assignment, lane, totalLanes, laneSpan }) => {
      const startMins = timeToMinutes(assignment.start_time);
      const endMins = timeToMinutes(assignment.end_time);

      const left = ((startMins - timelineStart) / totalMinutes) * 100;
      const width = ((endMins - startMins) / totalMinutes) * 100;
      const height = (laneSpan / totalLanes) * 100;
      const top = (lane / totalLanes) * 100;

      return {
        assignment,
        style: {
          left: `${left}%`,
          width: `${width}%`,
          top: `${top}%`,
          height: `${height}%`,
          padding: '2px'
        }
      };
    });
  }, [aide.assignments, timelineStart, totalMinutes]);

  return (
    <Box
      sx={{
        display: 'flex',
        borderBottom: 1,
        borderColor: 'divider',
        minHeight: 66, // Slightly taller to accommodate overlaps
        '&:hover': { bgcolor: 'action.hover' },
        bgcolor: 'inherit',
        position: 'relative'
      }}
    >
      {/* Sticky Aide Name Column */}
      <Box
        sx={{
          width: 150,
          flexShrink: 0,
          position: 'sticky',
          left: 0,
          bgcolor: 'inherit',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 15,
          borderRight: 1,
          borderColor: 'divider',
          // Ensure the sticky column background stays opaque during scroll if needed, 
          // but here it inherits from the row which handles the absence color
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1,
            width: '100%',
            height: 50,
            bgcolor: alpha(aide.colour_hex || '#1976d2', 0.08),
            borderRadius: 2,
            borderLeft: `4px solid ${aide.colour_hex || '#1976d2'}`,
            boxShadow: 1,
            overflow: 'hidden'
          }}
        >
          <Avatar
            sx={{
              bgcolor: aide.colour_hex || '#1976d2',
              width: 28,
              height: 28,
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}
          >
            {aide.name.charAt(0)}
          </Avatar>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.primary'
            }}
          >
            {aide.name}
          </Typography>
        </Box>
      </Box>

      {/* Timeline Row Content */}
      <Box sx={{ flex: 1, position: 'relative', minWidth: 2000, display: 'flex' }}>
        {/* Absence Overlay */}
        {aide.is_absent && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(244, 67, 54, 0.1) 10px, rgba(244, 67, 54, 0.1) 20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <EventBusy sx={{ fontSize: 40, color: 'error.light', opacity: 0.5 }} />
          </Box>
        )}

        {/* Unavailability Overlays */}
        {!aide.is_absent && unavailabilityBlocks.map((block, i) => (
          <Tooltip key={i} title="Outside working hours">
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${block.left}%`,
                width: `${block.width}%`,
                backgroundColor: 'rgba(158, 158, 158, 0.4)',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
          </Tooltip>
        ))}

        {timelineConfig.slots.map((slot) => {
          const slotStartTime = slot.start_time.substring(0, 5);
          const slotEndTime = addMinutesToTime(slotStartTime, slot.duration_minutes);

          // Find tasks that fall within this slot (T054: Support non-aligned start times)
          const slotTasks = taskLayouts.filter(l => {
            const taskStart = l.assignment.start_time.substring(0, 5);
            return timeToMinutes(taskStart) >= timeToMinutes(slotStartTime) &&
              timeToMinutes(taskStart) < timeToMinutes(slotEndTime);
          });

          // Find gaps that fall into this slot
          const slotGaps = gaps.filter(g => {
            const gapStart = g.start_time;
            const gapEnd = g.end_time;
            return timeIntervalsOverlap(slotStartTime.substring(0, 5), addMinutesToTime(slotStartTime.substring(0, 5), slot.duration_minutes), gapStart, gapEnd);
          });

          return (
            <Droppable
              key={slotStartTime}
              droppableId={`aide-${aide.id}-slot-${slotStartTime}`}
              isDropDisabled={aide.is_absent}
            >
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    flex: `0 0 ${(slot.duration_minutes / totalMinutes) * 100}%`,
                    borderRight: 1,
                    borderColor: 'divider',
                    height: '100%',
                    bgcolor: snapshot.isDraggingOver
                      ? 'action.selected'
                      : (['11:10:00', '13:20:00'].includes(slotStartTime) ? '#e8f5e9' : 'transparent'),
                    transition: 'background-color 0.2s',
                    position: 'relative' // To position tasks relative to their starting slot
                  }}
                >
                  {/* Render gap highlights when dragging over */}
                  {snapshot.isDraggingOver && slotGaps.map((gap, idx) => (
                    <Box
                      key={`gap-${idx}`}
                      sx={{
                        position: 'absolute',
                        zIndex: 5,
                        top: 0,
                        bottom: 0,
                        // Position relative to slot
                        left: `${(timeToMinutes(gap.start_time) - timeToMinutes(slotStartTime)) / slot.duration_minutes * 100}%`,
                        width: `${(timeToMinutes(gap.end_time) - timeToMinutes(gap.start_time)) / slot.duration_minutes * 100}%`,
                      }}
                    >
                      <GapHighlight colour_hex={aide.colour_hex} />
                    </Box>
                  ))}

                  {/* Render task cards that start in this slot */}
                  {slotTasks.map((layout, index) => (
                    <Box
                      key={layout.assignment.id}
                      sx={{
                        position: 'absolute',
                        zIndex: 15,
                        ...layout.style,
                        // Position relative to current slot (always positive offset)
                        left: `${(timeToMinutes(layout.assignment.start_time) - timeToMinutes(slotStartTime)) / slot.duration_minutes * 100}%`,
                        width: `${(timeToMinutes(layout.assignment.end_time) - timeToMinutes(layout.assignment.start_time)) / slot.duration_minutes * 100}%`,
                      }}
                    >
                      <TaskCard
                        assignment={layout.assignment}
                        task={layout.assignment.task}
                        index={index}
                        aideColor={aide.colour_hex}
                        onDoubleClick={() => onTaskDoubleClick?.(layout.assignment)}
                        compact={true}
                        isPositioned={true}
                        viewMode="aide"
                      />
                    </Box>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          );
        })}
      </Box>
    </Box>
  );
}

