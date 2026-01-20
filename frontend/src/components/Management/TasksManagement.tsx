import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Repeat,
  Person,
  CalendarMonth,
  Edit,
  Search,
  Sort,
} from '@mui/icons-material';
import { useTasksStore } from '../../store/stores/tasks';
import { useSyncStore } from '../../store/stores/syncStore';
import { assignmentsApi } from '../../services/assignmentsApi';
import { categoryColors } from '../../theme/theme';
import LoadingState from '../common/LoadingState';
import TaskCreationModal from '../TaskModals/TaskCreationModal';
import TaskEditModal from '../TaskModals/TaskEditModal';
import TaskScheduleModal from '../TaskModals/TaskScheduleModal';
import { type Task, type Assignment, type TeacherAide } from '../../types';

type Props = {
  refreshTrigger?: number;
  onChanged?: () => void;
};

export default function TasksManagement({ refreshTrigger, onChanged }: Props) {
  const { tasks, loading, error, fetchTasks } = useTasksStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [classroomFilter, setClassroomFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'start_time' | 'category'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchTasks().catch(() => undefined);
    assignmentsApi.assigned()
      .then(setAssignments)
      .catch(() => undefined);
  }, [fetchTasks]);

  // Global Sync Subscription
  useEffect(() => {
    const unsub = useSyncStore.subscribe((state, prevState) => {
      if (state.version !== prevState.version) {
        fetchTasks().catch(() => undefined);
        assignmentsApi.assigned()
          .then(setAssignments)
          .catch(() => undefined);
      }
    });
    return unsub;
  }, [fetchTasks]);

  // Refetch assigned list whenever the schedule refresh trigger changes
  useEffect(() => {
    if (refreshTrigger === undefined) return;
    assignmentsApi.assigned()
      .then(setAssignments)
      .catch(() => undefined);
  }, [refreshTrigger]);

  // Helper function to format dates
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric'
    });
  };

  // Helper function to get assignments for a specific task
  const getTaskAssignments = useMemo(() => {
    return (taskId: number) => {
      // Filter assignments for this task
      const taskAssignments = assignments.filter(a => a.task_id === taskId);

      // Group by aide
      const byAide = new Map<number, { aide: TeacherAide; dates: string[] }>();

      taskAssignments.forEach(assignment => {
        if (assignment.aide_id && assignment.aide) {
          if (!byAide.has(assignment.aide_id)) {
            byAide.set(assignment.aide_id, {
              aide: assignment.aide,
              dates: []
            });
          }
          byAide.get(assignment.aide_id)!.dates.push(assignment.date);
        }
      });

      return Array.from(byAide.values());
    };
  }, [assignments]);

  // Unique categories and classrooms for filters
  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category));
    return Array.from(cats);
  }, [tasks]);

  const classrooms = useMemo(() => {
    const rooms = new Map<number, string>();
    tasks.forEach(t => {
      if (t.classroom) {
        rooms.set(t.classroom.id, t.classroom.name);
      }
    });
    return Array.from(rooms.entries());
  }, [tasks]);

  // Filtered and Sorted Tasks
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.classroom?.name.toLowerCase().includes(query) ||
        t.notes?.toLowerCase().includes(query)
      );
    }

    // Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Classroom Filter
    if (classroomFilter !== 'all') {
      result = result.filter(t => t.classroom_id === parseInt(classroomFilter));
    }

    // Sort
    result.sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      if (sortBy === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else if (sortBy === 'start_time') {
        valA = a.start_time;
        valB = b.start_time;
      } else if (sortBy === 'category') {
        valA = a.category;
        valB = b.category;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tasks, searchQuery, categoryFilter, classroomFilter, sortBy, sortOrder]);

  const isFiltered = searchQuery !== '' || categoryFilter !== 'all' || classroomFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setClassroomFilter('all');
  };

  if (loading) {
    return <LoadingState variant="skeleton" rows={5} />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" role="alert">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">All Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setShowCreateModal(true)}
        >
          Create Task
        </Button>
      </Box>

      {/* Controls: Search, Filter, Sort */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          placeholder="Search tasks..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="category-filter-label">Category</InputLabel>
          <Select
            labelId="category-filter-label"
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat.replace(/_/g, ' ')}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="classroom-filter-label">Classroom</InputLabel>
          <Select
            labelId="classroom-filter-label"
            value={classroomFilter}
            label="Classroom"
            onChange={(e) => setClassroomFilter(e.target.value)}
          >
            <MenuItem value="all">All Classes</MenuItem>
            {classrooms.map(([id, name]) => (
              <MenuItem key={id} value={id.toString()}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="start_time">Start Time</MenuItem>
              <MenuItem value="category">Category</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}>
            <IconButton
              size="small"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              sx={{ bgcolor: 'action.hover' }}
            >
              <Sort sx={{ transform: sortOrder === 'desc' ? 'scaleY(-1)' : 'none' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {isFiltered && (
          <Button
            size="small"
            onClick={clearFilters}
            sx={{
              height: 40,
              px: 2,
              color: 'text.secondary',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'action.hover',
                color: 'primary.main',
              }
            }}
          >
            Clear Filters
          </Button>
        )}
      </Box>

      <List>
        {processedTasks.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No tasks found matching your criteria</Typography>
          </Box>
        ) : processedTasks.map((task) => {
          const categoryColor = categoryColors[task.category] || '#9E9E9E';
          const taskAssignments = getTaskAssignments(task.id);

          return (
            <Paper key={task.id} sx={{ mb: 1 }}>
              <ListItem
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <ListItemText
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                        <Typography variant="body1">{task.title}</Typography>
                        {task.classroom && (
                          <Chip
                            label={task.classroom.name}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              flexShrink: 0,
                              '& .MuiChip-label': { px: 0.75 },
                            }}
                          />
                        )}
                      </Box>
                      {task.recurrence_rule && (
                        <Repeat fontSize="small" color="primary" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="caption">
                          {task.start_time.slice(0, 5)} – {task.end_time.slice(0, 5)}
                        </Typography>
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
                          />
                        )}
                      </Box>

                      {/* Assignment Information */}
                      {taskAssignments.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {taskAssignments.map(({ aide, dates }) => {
                            // Limit dates displayed to first 5, then show count
                            const displayDates = dates.slice(0, 5);
                            const remainingCount = dates.length - displayDates.length;

                            return (
                              <Box
                                key={aide.id}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  mb: 0.25
                                }}
                              >
                                <Person sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  <strong>{aide.name}:</strong> {displayDates.map(formatDate).join(', ')}
                                  {remainingCount > 0 && ` ...and ${remainingCount} more`}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Schedule Task">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setShowScheduleModal(true);
                      }}
                      sx={{ color: 'primary.main' }}
                    >
                      <CalendarMonth fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Task">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            </Paper>
          );
        })}
      </List>

      {/* Task Creation Modal */}
      <TaskCreationModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          fetchTasks(); // Refresh task list after creation
          // Refresh assignments in case the task was created with assignments
          assignmentsApi.assigned()
            .then(setAssignments)
            .catch(() => undefined);
          onChanged?.();
        }}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        open={showEditModal}
        task={selectedTask}
        assignment={null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        onUpdated={() => {
          setShowEditModal(false);
          setSelectedTask(null);
          fetchTasks(); // Refresh task list after update
          // Refresh assignments as task assignments may have changed
          assignmentsApi.assigned()
            .then(setAssignments)
            .catch(() => undefined);
          onChanged?.();
        }}
        onDeleted={() => {
          setShowEditModal(false);
          setSelectedTask(null);
          fetchTasks(); // Refresh task list after deletion
          // Refresh assignments as related assignments may have been deleted
          assignmentsApi.assigned()
            .then(setAssignments)
            .catch(() => undefined);
          onChanged?.();
        }}
      />

      {/* Task Schedule Modal */}
      <TaskScheduleModal
        open={showScheduleModal}
        task={selectedTask}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedTask(null);
        }}
        onScheduled={() => {
          setShowScheduleModal(false);
          setSelectedTask(null);
          // Refresh assignments to show new ones
          assignmentsApi.assigned()
            .then(setAssignments)
            .catch(() => undefined);
          onChanged?.();
        }}
      />
    </Box >
  );
}

