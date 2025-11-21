import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { tasksApi } from '../../services/tasksApi';
import { classroomsApi } from '../../services/classroomsApi';
import type { Task, TaskCategory, Classroom } from '../../types';
import { categoryColors } from '../../theme/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (task: Task) => void;
};

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'PLAYGROUND', label: 'Playground' },
  { value: 'CLASS_SUPPORT', label: 'Class Support' },
  { value: 'GROUP_SUPPORT', label: 'Group Support' },
  { value: 'INDIVIDUAL_SUPPORT', label: 'Individual Support' },
];

export default function TaskCreationModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('CLASS_SUPPORT');
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  
  // Classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);

  // Load classrooms when modal opens
  useEffect(() => {
    if (open) {
      setLoadingClassrooms(true);
      classroomsApi.list()
        .then(setClassrooms)
        .catch(() => setClassrooms([]))
        .finally(() => setLoadingClassrooms(false));
    }
  }, [open]);

  const handleClose = () => {
    if (!busy) {
      setTitle('');
      setCategory('CLASS_SUPPORT');
      setClassroomId(null);
      setNotes('');
      setError(undefined);
      onClose();
    }
  };

  async function submit() {
    setBusy(true);
    setError(undefined);
    
    try {
      // Create a simple task with default times
      // Times will be set when dragged to calendar
      const task = await tasksApi.createOneOff({ 
        title, 
        category, 
        start_time: '09:00',  // Default placeholder
        end_time: '10:00',    // Default placeholder
        classroom_id: classroomId, 
        notes: notes || null
      });
      
      onCreated?.(task);
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create task');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" />
          Create New Task
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Task Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            autoFocus
            placeholder="e.g., Reading support for Year 3"
          />
          
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
            >
              {CATEGORIES.map(cat => (
                <MenuItem key={cat.value} value={cat.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: categoryColors[cat.value],
                      }}
                    />
                    {cat.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Classroom Selection */}
          <FormControl fullWidth>
            <InputLabel>Classroom (Optional)</InputLabel>
            <Select
              value={classroomId || ''}
              label="Classroom (Optional)"
              onChange={(e) => setClassroomId(e.target.value ? Number(e.target.value) : null)}
              disabled={loadingClassrooms}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {classrooms.map(classroom => (
                <MenuItem key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Add any additional details..."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={busy || !title.trim()}
          variant="contained"
          startIcon={busy ? <CircularProgress size={16} /> : <AddIcon />}
          data-testid="open-create-task"
        >
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
}



