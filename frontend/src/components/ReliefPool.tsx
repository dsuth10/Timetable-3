import { useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Stack,
  Alert,
  Chip
} from '@mui/material';
import {
  ExpandMore,
  AccessTime,
  Person,
  Class
} from '@mui/icons-material';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { useReliefPoolStore, useReliefPoolByDate } from '../store/stores/reliefPool';
import LoadingState from './common/LoadingState';
import EmptyState from './common/EmptyState';
import type { ReliefPoolTask } from '../types';

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function ReliefPool() {
  const { loading, error, fetch } = useReliefPoolStore();
  const tasksByDate = useReliefPoolByDate();
  
  useEffect(() => {
    fetch();
  }, [fetch]);
  
  const sortedDates = useMemo(() => Object.keys(tasksByDate).sort(), [tasksByDate]);
  const totalTasks = useMemo(
    () => Object.values(tasksByDate).reduce((sum, tasks) => sum + tasks.length, 0),
    [tasksByDate]
  );
  
  if (loading && totalTasks === 0) return <LoadingState variant="skeleton" rows={3} />;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (totalTasks === 0) {
    return (
      <EmptyState
        title="No Relief Tasks"
        description="Tasks will appear here when an aide is marked absent."
        icon={<Person sx={{ fontSize: 48, color: 'text.secondary' }} />}
      />
    );
  }
  
  let globalIndex = 0;
  
  return (
    <Droppable droppableId="relief-pool" isDropDisabled>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ p: 1 }}>
          {sortedDates.map((date) => (
            <Accordion key={date} defaultExpanded elevation={0} sx={{ bgcolor: 'transparent' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="body2" fontWeight={600}>{formatDate(date)}</Typography>
                <Chip label={tasksByDate[date].length} size="small" color="warning" sx={{ ml: 1, height: 20 }} />
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {tasksByDate[date].map((task) => {
                  const index = globalIndex++;
                  return (
                    <Draggable key={task.id} draggableId={`relief-${task.id}`} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 1,
                            borderLeft: '4px solid',
                            borderLeftColor: 'warning.main',
                            bgcolor: snapshot.isDragging ? 'action.selected' : 'background.paper',
                          }}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                              {task.task?.title || 'Unknown Task'}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                {formatTime(task.start_time)} - {formatTime(task.end_time)}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" noWrap>
                                Was: {task.original_aide?.name || 'Unknown'}
                              </Typography>
                            </Stack>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          ))}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );
}


