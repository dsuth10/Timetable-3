import { Box, Typography, Avatar, alpha, Tooltip } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import type { AideWithStatus, TimelineConfig, Assignment, Absence } from '../types';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TimetableGrid/TaskCard';
import { useMemo } from 'react';
import { getAvailabilityInfo } from '../utils/availabilityUtils';
import { snapToSlot, addMinutesToTime, timeIntervalsOverlap } from './TimetableGrid/timeUtils';
import { calculateGaps } from '../utils/gapUtils';
import GapHighlight from './TimetableGrid/GapHighlight';

interface AideRowProps {
  aide: AideWithStatus;
  date: string; // YYYY-MM-DD
  timelineConfig: TimelineConfig;
  onTaskDoubleClick?: (assignment: Assignment) => void;
}

export default function AideRow({ aide, date, timelineConfig, onTaskDoubleClick }: AideRowProps) {
  const startTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const timelineStart = startTimeToMinutes(timelineConfig.slots[0].start_time);
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
    const availStart = startTimeToMinutes(availabilityInfo.timeWindow.start);
    const availEnd = startTimeToMinutes(availabilityInfo.timeWindow.end);

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

    // Sort by start time
    const sorted = [...aide.assignments].sort((a, b) => 
      startTimeToMinutes(a.start_time) - startTimeToMinutes(b.start_time)
    );

    const layouts: { assignment: Assignment; style: React.CSSProperties }[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < sorted.length; i++) {
      if (processed.has(sorted[i].id)) continue;

      const group = [sorted[i]];
      processed.add(sorted[i].id);

      let found = true;
      while (found) {
        found = false;
        for (let j = i + 1; j < sorted.length; j++) {
          if (processed.has(sorted[j].id)) continue;
          
          const overlaps = group.some(g => {
            const startA = startTimeToMinutes(g.start_time);
            const endA = startTimeToMinutes(g.end_time);
            const startB = startTimeToMinutes(sorted[j].start_time);
            const endB = startTimeToMinutes(sorted[j].end_time);
            return startA < endB && endA > startB;
          });

          if (overlaps) {
            group.push(sorted[j]);
            processed.add(sorted[j].id);
            found = true;
          }
        }
      }

      // Calculate vertical height and top for each in group
      const maxRows = group.length;
      group.forEach((assignment, index) => {
        const startMins = startTimeToMinutes(assignment.start_time);
        const endMins = startTimeToMinutes(assignment.end_time);
        const left = ((startMins - timelineStart) / totalMinutes) * 100;
        const width = ((endMins - startMins) / totalMinutes) * 100;
        const height = (1 / maxRows) * 100;
        const top = (index / maxRows) * 100;

        layouts.push({
          assignment,
          style: {
            left: `${left}%`,
            width: `${width}%`,
            top: `${top}%`,
            height: `${height}%`,
            padding: '2px'
          }
        });
      });
    }
    return layouts;
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
          const slotStartTime = slot.start_time;
          // Find tasks that snap to this slot (T054: Support non-aligned start times)
          const slotTasks = taskLayouts.filter(l => {
            const assignmentTime = l.assignment.start_time.substring(0, 5);
            const snappedTime = snapToSlot(assignmentTime);
            return snappedTime + ':00' === slotStartTime;
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
                        left: `${(startTimeToMinutes(gap.start_time) - startTimeToMinutes(slotStartTime)) / slot.duration_minutes * 100}%`,
                        width: `${(startTimeToMinutes(gap.end_time) - startTimeToMinutes(gap.start_time)) / slot.duration_minutes * 100}%`,
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
                        // Adjust style to be relative to this slot (T054: Support non-aligned start times)
                        left: `${(startTimeToMinutes(layout.assignment.start_time) - startTimeToMinutes(slotStartTime)) / slot.duration_minutes * 100}%`,
                        width: `${(startTimeToMinutes(layout.assignment.end_time) - startTimeToMinutes(layout.assignment.start_time)) / slot.duration_minutes * 100}%`,
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

