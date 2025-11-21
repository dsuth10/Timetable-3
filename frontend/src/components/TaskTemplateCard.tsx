import { Draggable } from '@hello-pangea/dnd';
import { memo } from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton } from '@mui/material';
import { DragIndicator, Repeat, School } from '@mui/icons-material';
import type { Task } from '../types';
import { categoryColors } from '../theme/theme';

type TaskTemplateCardProps = {
  task: Task;
  index: number;
  onDoubleClick?: (task: Task) => void;
};

function TaskTemplateCardBase({ task, index, onDoubleClick }: TaskTemplateCardProps) {
  const categoryColor = categoryColors[task.category] || '#9E9E9E';
  
  // Tasks in Task Bank are not scheduled yet
  const durationText = 'Not scheduled';

  return (
    <Draggable draggableId={`task-${task.id}`} index={index}>
      {(dragProvided, dragSnapshot) => (
        <Card
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          data-testid={`task-template-card-${task.id}`}
          onDoubleClick={() => onDoubleClick?.(task)}
          sx={{
            mb: 1,
            borderLeft: `4px solid ${categoryColor}`,
            cursor: dragSnapshot.isDragging ? 'grabbing' : 'grab',
            opacity: dragSnapshot.isDragging ? 0.8 : 1,
            transform: dragSnapshot.isDragging ? 'rotate(2deg)' : 'none',
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: 3,
              transform: 'translateY(-2px)',
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
                    color: 'text.primary',
                  }}
                >
                  {task.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                  {durationText}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
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
                  {task.classroom && (
                    <Chip
                      label={task.classroom.name}
                      size="small"
                      variant="outlined"
                      icon={<School sx={{ '&&': { fontSize: 12 } }} />}
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        '& .MuiChip-label': { px: 1 },
                        '& .MuiChip-icon': { ml: 0.5 }
                      }}
                    />
                  )}
                  {task.recurrence_rule && (
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

export const TaskTemplateCard = memo(TaskTemplateCardBase, (prev, next) => {
  return (
    prev.task.id === next.task.id &&
    prev.task.title === next.task.title &&
    prev.task.category === next.task.category &&
    prev.index === next.index
  );
});

