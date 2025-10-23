import { Draggable } from '@hello-pangea/dnd';
import { memo } from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton } from '@mui/material';
import { DragIndicator, Repeat, Warning } from '@mui/icons-material';
import type { Assignment, Task } from '../../types';
import { categoryColors, statusColors } from '../../theme/theme';

type TaskCardProps = {
  assignment: Assignment;
  index: number;
  task?: Task;
  aideColor?: string;
  onContextMenu?: (event: React.MouseEvent, assignment: Assignment) => void;
  onDoubleClick?: (assignment: Assignment, task?: Task) => void;
  isPositioned?: boolean; // When true, card is positioned absolutely and doesn't need margin
};

function TaskCardBase({ assignment, index, task, aideColor, onContextMenu, onDoubleClick, isPositioned = false }: TaskCardProps) {
  const categoryColor = task ? categoryColors[task.category] : '#9E9E9E';
  const statusColor = statusColors[assignment.status];

  return (
    <Draggable draggableId={`asg-${assignment.id}`} index={index}>
      {(dragProvided, dragSnapshot) => (
        <Card
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          data-testid={`assignment-card-${assignment.id}`}
          onContextMenu={(e) => onContextMenu?.(e, assignment)}
          onDoubleClick={() => onDoubleClick?.(assignment, task)}
          sx={{
            mb: isPositioned ? 0 : 1,
            borderLeft: `4px solid ${aideColor || categoryColor}`,
            cursor: dragSnapshot.isDragging ? 'grabbing' : 'grab',
            opacity: dragSnapshot.isDragging ? 0.8 : 1,
            transform: dragSnapshot.isDragging ? 'rotate(2deg)' : 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: 3,
              transform: 'translateY(-2px)',
              '& .action-buttons': {
                opacity: 1,
              },
            },
            ...dragProvided.draggableProps.style,
          }}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
              <IconButton
                size="small"
                {...dragProvided.dragHandleProps}
                sx={{ p: 0.25, mt: -0.25 }}
              >
                <DragIndicator fontSize="small" />
              </IconButton>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: task ? 'text.primary' : 'error.main',
                  }}
                >
                  {task?.title || `Missing Task #${assignment.task_id}`}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {assignment.start_time.slice(0, 5)} – {assignment.end_time.slice(0, 5)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                  {task && (
                    <Chip
                      label={task.category.replace(/_/g, ' ')}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: categoryColor,
                        color: 'white',
                      }}
                    />
                  )}
                  <Chip
                    label={assignment.status}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      bgcolor: statusColor,
                      color: 'white',
                    }}
                  />
                  {task?.classroom && (
                    <Chip
                      label={task.classroom.name}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                      }}
                    />
                  )}
                  {task?.recurrence_rule && (
                    <Repeat sx={{ fontSize: 16, color: 'text.secondary' }} />
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}

export const TaskCard = memo(TaskCardBase, (prev, next) => {
  const a = prev.assignment;
  const b = next.assignment;
  return (
    a.id === b.id &&
    a.aide_id === b.aide_id &&
    a.start_time === b.start_time &&
    a.end_time === b.end_time &&
    a.status === b.status &&
    prev.index === next.index &&
    prev.task?.id === next.task?.id &&
    prev.aideColor === next.aideColor &&
    prev.isPositioned === next.isPositioned &&
    prev.onDoubleClick === next.onDoubleClick
  );
});


