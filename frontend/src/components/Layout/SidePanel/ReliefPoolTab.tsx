import { useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  AccessTime,
  Person,
  Class,
  Close,
} from '@mui/icons-material';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { useReliefPoolStore, useReliefPoolByDate } from '../../../store/stores/reliefPool';
import LoadingState from '../../common/LoadingState';
import EmptyState from '../../common/EmptyState';
import type { ReliefPoolTask } from '../../../types';

interface Props {
  onDismiss?: (task: ReliefPoolTask) => void;
  refreshTrigger?: number;
}

function formatTime(timeStr: string): string {
  // Convert HH:MM:SS to h:mm AM/PM
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  }
  if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface ReliefPoolCardProps {
  task: ReliefPoolTask;
  index: number;
  onDismiss?: (task: ReliefPoolTask) => void;
}

function ReliefPoolCard({ task, index, onDismiss }: ReliefPoolCardProps) {
  const draggableId = `relief-pool-${task.id}`;

  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="listitem"
          aria-label={`Relief Pool task: ${task.task?.title || 'Task'} at ${formatTime(task.start_time)}`}
          sx={{
            mb: 1,
            cursor: 'grab',
            bgcolor: snapshot.isDragging ? 'action.selected' : 'background.paper',
            border: '1px solid',
            borderColor: snapshot.isDragging ? 'primary.main' : 'divider',
            borderLeft: '4px solid',
            borderLeftColor: 'warning.main',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.light',
              boxShadow: 1,
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
          tabIndex={0}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {task.task?.title || 'Unknown Task'}
                </Typography>

                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                  <AccessTime fontSize="inherit" sx={{ color: 'text.secondary', fontSize: 14 }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(task.start_time)} - {formatTime(task.end_time)}
                  </Typography>
                </Stack>

                {task.classroom && (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                    <Class fontSize="inherit" sx={{ color: 'text.secondary', fontSize: 14 }} />
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {task.classroom.name}
                    </Typography>
                  </Stack>
                )}

                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                  <Person fontSize="inherit" sx={{ color: 'text.secondary', fontSize: 14 }} />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Was: {task.original_aide?.name || 'Unknown'}
                  </Typography>
                </Stack>
              </Box>

              {onDismiss && (
                <Tooltip title="Dismiss task (not needed)">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(task);
                    }}
                    aria-label={`Dismiss ${task.task?.title}`}
                    sx={{ ml: 0.5 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {task.task?.category && (
              <Chip
                label={task.task.category.replace(/_/g, ' ')}
                size="small"
                variant="outlined"
                sx={{ mt: 1, fontSize: '0.7rem', height: 20 }}
              />
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}

export default function ReliefPoolTab({ onDismiss, refreshTrigger }: Props) {
  const { loading, error, fetch } = useReliefPoolStore();
  const tasksByDate = useReliefPoolByDate();

  // Fetch Relief Pool tasks on mount and when refresh triggered
  useEffect(() => {
    fetch();
  }, [fetch, refreshTrigger]);

  const sortedDates = useMemo(() => Object.keys(tasksByDate).sort(), [tasksByDate]);
  const totalTasks = useMemo(
    () => Object.values(tasksByDate).reduce((sum, tasks) => sum + tasks.length, 0),
    [tasksByDate]
  );

  if (loading && totalTasks === 0) {
    return <LoadingState variant="skeleton" rows={3} />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }} role="alert">
        {error}
      </Alert>
    );
  }

  if (totalTasks === 0) {
    return (
      <EmptyState
        title="No Relief Pool Tasks"
        description="Tasks will appear here when an aide is marked absent."
        icon={<Person sx={{ fontSize: 48, color: 'text.secondary' }} />}
      />
    );
  }

  // Track global index for drag-and-drop
  let globalIndex = 0;

  return (
    <Droppable droppableId="relief-pool" isDropDisabled>
      {(provided) => (
        <Box
          ref={provided.innerRef}
          {...provided.droppableProps}
          role="list"
          aria-label={`Relief Pool with ${totalTasks} tasks`}
          sx={{ minHeight: '100%' }}
        >
          {sortedDates.map((date) => {
            const dateTasks = tasksByDate[date];

            return (
              <Accordion
                key={date}
                defaultExpanded
                sx={{
                  '&:before': { display: 'none' },
                  boxShadow: 'none',
                  bgcolor: 'transparent',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`relief-pool-${date}-content`}
                  id={`relief-pool-${date}-header`}
                  sx={{
                    minHeight: 40,
                    '& .MuiAccordionSummary-content': { my: 1 },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {formatDate(date)}
                  </Typography>
                  <Chip
                    label={dateTasks.length}
                    size="small"
                    color="warning"
                    sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                  />
                </AccordionSummary>
                <AccordionDetails sx={{ p: 1, pt: 0 }}>
                  {dateTasks.map((task) => {
                    const currentIndex = globalIndex++;
                    return (
                      <ReliefPoolCard
                        key={task.id}
                        task={task}
                        index={currentIndex}
                        onDismiss={onDismiss}
                      />
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            );
          })}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );
}

