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
  Chip,
  CircularProgress
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
  const { loading, loadingStates, error, fetch } = useReliefPoolStore();
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

  let globalIndex = 0;

  return (
    <Droppable droppableId="relief-pool" isDropDisabled>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps} sx={{ p: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {totalTasks === 0 ? (
            <EmptyState
              title="No Relief Tasks"
              description="Tasks will appear here when an aide is marked absent."
              icon={<Person sx={{ fontSize: 48, color: 'text.secondary' }} />}
            />
          ) : (
            sortedDates.map((date) => (
              <Accordion key={date} defaultExpanded elevation={0} sx={{ bgcolor: 'transparent' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body2" fontWeight={600}>{formatDate(date)}</Typography>
                  <Chip label={tasksByDate[date].length} size="small" color="warning" sx={{ ml: 1, height: 20 }} />
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {tasksByDate[date].map((task) => {
                    const index = globalIndex++;
                    const isTaskLoading = loadingStates[task.id];

                    return (
                      <Draggable key={task.id} draggableId={`relief-pool-${task.id}`} index={index}>
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
                              opacity: isTaskLoading ? 0.7 : 1,
                              pointerEvents: isTaskLoading ? 'none' : 'auto',
                              position: 'relative',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: 2,
                              }
                            }}
                          >
                            {isTaskLoading && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  bgcolor: 'rgba(255, 255, 255, 0.5)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  zIndex: 1,
                                }}
                              >
                                <CircularProgress size={20} color="warning" />
                              </Box>
                            )}
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
                              {task.classroom && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Class sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary" noWrap>
                                    Room: {task.classroom.name}
                                  </Typography>
                                </Stack>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            ))
          )}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );
}


