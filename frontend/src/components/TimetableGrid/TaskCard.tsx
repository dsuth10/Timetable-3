import { Draggable } from '@hello-pangea/dnd';
import { memo } from 'react';
import { Card, CardContent, Typography, Chip, Box, IconButton, alpha } from '@mui/material';
import { DragIndicator, Repeat, Park, School, Groups, Person, Place } from '@mui/icons-material';
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
  showAideName?: boolean;
  aideName?: string;
  compact?: boolean;
  viewMode?: 'aide' | 'class';
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'PLAYGROUND': <Park fontSize="inherit" />,
  'CLASS_SUPPORT': <School fontSize="inherit" />,
  'GROUP_SUPPORT': <Groups fontSize="inherit" />,
  'INDIVIDUAL_SUPPORT': <Person fontSize="inherit" />,
};

function TaskCardBase({ assignment, index, task, aideColor, onContextMenu, onDoubleClick, isPositioned = false, showAideName, aideName, compact = false, viewMode = 'aide' }: TaskCardProps) {
  const categoryColor = task ? categoryColors[task.category] : '#9E9E9E';
  const statusColor = statusColors[assignment.status];

  // Determine which color to use based on viewMode
  // In 'aide' view (Aide Schedule), color by classroom/teacher
  // In 'class' view (Class Schedule), color by teacher aide
  const displayColor = viewMode === 'aide' 
    ? (task?.classroom?.colour_hex || categoryColor)
    : (aideColor || categoryColor);

  const CategoryIcon = task ? CATEGORY_ICONS[task.category] : null;

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
            borderLeft: `${compact ? '2px' : '4px'} solid ${displayColor}`,
            borderRadius: compact ? 0 : 1,
            cursor: dragSnapshot.isDragging ? 'grabbing' : 'grab',
            bgcolor: displayColor ? alpha(displayColor, 0.08) : (dragSnapshot.isDragging ? 'action.hover' : 'background.paper'),
            opacity: dragSnapshot.isDragging ? 0.9 : 1,
            transform: dragSnapshot.isDragging ? 'rotate(2deg) scale(0.95)' : 'none',
            transition: 'all 0.2s ease',
            height: isPositioned && !dragSnapshot.isDragging ? '100%' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            ...(dragSnapshot.isDragging ? {
              maxWidth: '180px',
              minWidth: '150px',
              maxHeight: '80px',
              boxShadow: 10,
              zIndex: 9999,
              pointerEvents: 'none', // Important for smooth dragging
              border: `1px solid ${displayColor}`,
              '& .MuiCardContent-root': {
                p: 1,
              },
              '& .MuiChip-root': {
                display: 'none', // Hide chips during drag to save space
              },
            } : {}),
            '&:hover': {
              boxShadow: 3,
              transform: 'translateY(-2px)',
              bgcolor: displayColor ? alpha(displayColor, 0.15) : 'action.hover',
              '& .action-buttons': {
                opacity: 1,
              },
            },
            ...dragProvided.draggableProps.style,
          }}
        >
          <CardContent
            sx={{
              p: compact ? 0.5 : 1.25, // Slightly reduced padding to fit icons
              '&:last-child': { pb: compact ? 0.5 : 1.25 },
              ...(isPositioned
                ? {
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }
                : {}),
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, height: '100%' }}>
              {!compact && (
                <IconButton
                  size="small"
                  {...dragProvided.dragHandleProps}
                  sx={{ p: 0.25, mt: -0.25 }}
                >
                  <DragIndicator fontSize="small" />
                </IconButton>
              )}
              
              <Box sx={{ display: 'flex', flex: 1, minWidth: 0, height: '100%' }}>
                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} {...(compact ? dragProvided.dragHandleProps : {})}>
                  <Typography 
                    variant={compact ? 'caption' : 'body2'} 
                    sx={{ 
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: task ? 'text.primary' : 'error.main',
                      lineHeight: 1.2
                    }}
                  >
                    {task?.title || `Missing Task #${assignment.task_id}`}
                  </Typography>

                  {viewMode === 'class' && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontStyle: 'italic',
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {aideName || 'Unassigned'}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {assignment.start_time.slice(0, 5)} – {assignment.end_time.slice(0, 5)}
                  </Typography>

                  {viewMode === 'aide' && task?.classroom && (
                    <Chip
                      icon={<School sx={{ fontSize: '12px !important' }} />}
                      label={task.classroom.name}
                      size="small"
                      variant="outlined"
                      sx={{
                        height: compact ? 18 : 20,
                        fontSize: compact ? '0.6rem' : '0.65rem',
                        mt: 0.5,
                        maxWidth: 'fit-content',
                        '& .MuiChip-label': { px: compact ? 0.5 : 1 },
                        '& .MuiChip-icon': { ml: 0.5 }
                      }}
                    />
                  )}

                  {viewMode === 'aide' && !task?.classroom && (
                    <Chip
                      icon={<School sx={{ fontSize: '12px !important' }} />}
                      label="School"
                      size="small"
                      variant="outlined"
                      sx={{
                        height: compact ? 18 : 20,
                        fontSize: compact ? '0.6rem' : '0.65rem',
                        mt: 0.5,
                        maxWidth: 'fit-content',
                        '& .MuiChip-label': { px: compact ? 0.5 : 1 },
                        '& .MuiChip-icon': { ml: 0.5 }
                      }}
                    />
                  )}
                </Box>

                {/* Icons on the right */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ml: 0.5, gap: 0.25 }}>
                  {CategoryIcon && (
                    <Box sx={{ color: categoryColor, fontSize: compact ? 16 : 20, display: 'flex' }}>
                      {CategoryIcon}
                    </Box>
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
    prev.onDoubleClick === next.onDoubleClick &&
    prev.showAideName === next.showAideName &&
    prev.aideName === next.aideName &&
    prev.compact === next.compact &&
    prev.viewMode === next.viewMode
  );
});


