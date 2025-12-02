import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Task } from '../../types/contracts';
import { taskService } from '../../services/taskService';

interface TaskSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (taskId: number) => void;
  onCreate: (taskData: { title: string; description?: string }) => void;
  classroomId: number | null;
  loading?: boolean;
}

export const TaskSelectionModal: React.FC<TaskSelectionModalProps> = ({
  open,
  onClose,
  onConfirm,
  onCreate,
  classroomId,
  loading = false,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fetchingTasks, setFetchingTasks] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks when modal opens and classroomId is available
  useEffect(() => {
    if (open && classroomId) {
      setFetchingTasks(true);
      setError(null);
      taskService
        .fetchTasksByClassroom(classroomId)
        .then((fetchedTasks) => {
          setTasks(fetchedTasks);
          setFetchingTasks(false);
        })
        .catch((e) => {
          setError(e.message || 'Failed to load tasks');
          setFetchingTasks(false);
        });
    } else if (open && !classroomId) {
      setError('No classroom selected');
    }
  }, [open, classroomId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setShowCreateForm(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setError(null);
    }
  }, [open]);

  const handleSelectTask = (taskId: number) => {
    onConfirm(taskId);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      setError('Task title is required');
      return;
    }
    onCreate({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
    });
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="task-selection-dialog-title"
      aria-describedby="task-selection-dialog-description"
    >
      <DialogTitle id="task-selection-dialog-title">Select Task</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {fetchingTasks ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : showCreateForm ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create a new task for this classroom
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="Task Title"
              required
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              margin="normal"
              error={!newTaskTitle.trim() && error === 'Task title is required'}
              helperText={!newTaskTitle.trim() && error === 'Task title is required' ? 'Task title is required' : ''}
            />
            <TextField
              fullWidth
              label="Description"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              placeholder="Optional description"
            />
          </Box>
        ) : (
          <Box>
            {tasks.length === 0 ? (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No existing tasks for this classroom
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click "Create New Task" to add one
                </Typography>
              </Box>
            ) : (
              <List>
                {tasks.map((task) => (
                  <ListItem key={task.id} disablePadding>
                    <ListItemButton onClick={() => handleSelectTask(task.id)}>
                      <ListItemText
                        primary={task.title}
                        secondary={task.description || task.notes}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {showCreateForm ? (
          <>
            <Button onClick={() => setShowCreateForm(false)}>Back</Button>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              onClick={handleCreateTask}
              variant="contained"
              disabled={!newTaskTitle.trim() || loading}
              startIcon={<AddIcon />}
            >
              Create & Assign
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create New Task
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
