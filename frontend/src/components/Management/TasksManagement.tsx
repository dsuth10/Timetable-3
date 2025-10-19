import { useEffect, useState } from 'react';
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
import { Add as AddIcon, Repeat } from '@mui/icons-material';
import { useTasksStore } from '../../store/stores/tasks';
import { categoryColors } from '../../theme/theme';
import LoadingState from '../common/LoadingState';
import TaskCreationModal from '../TaskModals/TaskCreationModal';
import TaskEditModal from '../TaskModals/TaskEditModal';
import type { Task } from '../../types';

export default function TasksManagement() {
  const { tasks, loading, error, fetchTasks } = useTasksStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks().catch(() => undefined);
  }, [fetchTasks]);

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
          const categoryColor = categoryColors[task.category];
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
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
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
        }}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        open={showEditModal}
        task={selectedTask}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTask(null);
        }}
        onUpdated={() => {
          setShowEditModal(false);
          setSelectedTask(null);
          fetchTasks(); // Refresh task list after update
        }}
      />
    </Box>
  );
}

