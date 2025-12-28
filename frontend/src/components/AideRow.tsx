import { Box, Typography, Avatar, alpha } from '@mui/material';
import type { AideWithStatus, TimelineConfig, Assignment } from '../types';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TimetableGrid/TaskCard';
import { useMemo } from 'react';

interface AideRowProps {
  aide: AideWithStatus;
  timelineConfig: TimelineConfig;
  onTaskDoubleClick?: (assignment: Assignment) => void;
}

export default function AideRow({ aide, timelineConfig, onTaskDoubleClick }: AideRowProps) {
  const startTimeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const timelineStart = startTimeToMinutes(timelineConfig.slots[0].start_time);
  const totalMinutes = timelineConfig.slots.reduce((acc, slot) => acc + slot.duration_minutes, 0);
  
  // Calculate horizontal positions and vertical split for overlaps
  const taskLayouts = useMemo(() => {
    if (aide.assignments.length === 0) return [];

    // Sort by start time
    const sorted = [...aide.assignments].sort((a, b) => 
      startTimeToMinutes(a.start_time) - startTimeToMinutes(b.start_time)
    );

    const layouts = [];
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
        bgcolor: aide.is_absent ? 'error.light' : 'inherit',
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
        {timelineConfig.slots.map((slot) => {
          const slotStartTime = slot.start_time;
          // Find tasks that start in this exact slot
          const slotTasks = taskLayouts.filter(l => l.assignment.start_time === slotStartTime);
          
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
                  {/* Render task cards that start in this slot */}
                  {slotTasks.map((layout, index) => (
                    <Box
                      key={layout.assignment.id}
                      sx={{
                        position: 'absolute',
                        zIndex: 2,
                        ...layout.style,
                        // Adjust style to be relative to this slot
                        left: 0, // Since we are starting at this slot
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

