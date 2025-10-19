import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Paper,
} from '@mui/material';
import { Event as EventIcon, EventRepeat as EventRepeatIcon } from '@mui/icons-material';
import { useTasksStore } from '../store/stores/tasks';
import TaskEditModal from '../components/TaskModals/TaskEditModal';
import type { Task } from '../types';
import { categoryColors } from '../theme/theme';

const CATEGORY_LABELS: Record<string, string> = {
  'PLAYGROUND': 'Playground',
  'CLASS_SUPPORT': 'Class Support',
  'GROUP_SUPPORT': 'Group Support',
  'INDIVIDUAL_SUPPORT': 'Individual Support',
};

export default function Tasks() {
  const { tasks, loading, error, fetchTasks } = useTasksStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchTasks().catch(() => undefined);
  }, [fetchTasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditModalOpen(true);
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedTask(null);
  };

  const handleTaskUpdated = () => {
    // Refresh task list after update
    fetchTasks().catch(() => undefined);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Tasks
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && tasks.length === 0 && (
        <Alert severity="info">
          No tasks found. Create tasks to get started.
        </Alert>
      )}

      {!loading && tasks.length > 0 && (
        <Paper elevation={1}>
          <List>
            {tasks.map((task, index) => (
              <ListItem
                key={task.id}
                button
                onClick={() => handleTaskClick(task)}
                divider={index < tasks.length - 1}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  transition: 'background-color 0.2s',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: categoryColors[task.category],
                    mr: 2,
                  }}
                />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {task.title}
                      </Typography>
                      {task.recurrence_rule ? (
                        <EventRepeatIcon 
                          sx={{ fontSize: 18, color: 'text.secondary' }} 
                          titleAccess="Recurring task"
                        />
                      ) : (
                        <EventIcon 
                          sx={{ fontSize: 18, color: 'text.secondary' }} 
                          titleAccess="One-off task"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={CATEGORY_LABELS[task.category]}
                        size="small"
                        sx={{
                          bgcolor: categoryColors[task.category],
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {task.start_time.slice(0, 5)} - {task.end_time.slice(0, 5)}
                      </Typography>
                      {task.classroom && (
                        <Typography variant="body2" color="text.secondary">
                          · {task.classroom.name}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <TaskEditModal
        open={editModalOpen}
        onClose={handleModalClose}
        task={selectedTask}
        onUpdated={handleTaskUpdated}
      />
    </Box>
  );
}


