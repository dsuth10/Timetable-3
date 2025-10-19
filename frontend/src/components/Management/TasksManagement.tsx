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
} from '@mui/material';
import { Add as AddIcon, Repeat, Person } from '@mui/icons-material';
import { useTasksStore } from '../../store/stores/tasks';
import { assignmentsApi } from '../../services/assignmentsApi';
import { categoryColors } from '../../theme/theme';
import LoadingState from '../common/LoadingState';
import TaskCreationModal from '../TaskModals/TaskCreationModal';
import TaskEditModal from '../TaskModals/TaskEditModal';
import { type Task, type Assignment, type TeacherAide } from '../../types';

export default function TasksManagement() {
  const { tasks, loading, error, fetchTasks } = useTasksStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    fetchTasks().catch(() => undefined);
    assignmentsApi.assigned()
      .then(setAssignments)
      .catch(() => undefined);
  }, [fetchTasks]);

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
      <List>
        {tasks.map((task) => {
          const categoryColor = categoryColors[task.category] || '#9E9E9E';
          const taskAssignments = getTaskAssignments(task.id);
          
          return (
            <Paper key={task.id} sx={{ mb: 1 }}>
              <ListItem
                button
                onClick={() => {
                  setSelectedTask(task);
                  setShowEditModal(true);
                }}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">{task.title}</Typography>
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
        }}
        onDeleted={() => {
          setShowEditModal(false);
          setSelectedTask(null);
          fetchTasks(); // Refresh task list after deletion
          // Refresh assignments as related assignments may have been deleted
          assignmentsApi.assigned()
            .then(setAssignments)
            .catch(() => undefined);
        }}
      />
    </Box>
  );
}

