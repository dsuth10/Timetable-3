import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
} from '@mui/material';
import { useClassroomsStore } from '../../store/stores/classrooms';
import type { Classroom } from '../../types';

type Props = {
  open: boolean;
  onClose: () => void;
  classroom?: Classroom | null; // If provided, edit mode
  onCreated?: (classroom: Classroom) => void;
  onUpdated?: (classroom: Classroom) => void;
};

export default function ClassroomFormModal({ open, onClose, classroom, onCreated, onUpdated }: Props) {
  const { createClassroom, updateClassroom } = useClassroomsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Form state
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [teacher, setTeacher] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize form when classroom changes or modal opens
  useEffect(() => {
    if (open) {
      if (classroom) {
        setName(classroom.name);
        setRoomNumber(classroom.room_number);
        setTeacher(classroom.teacher);
        setNotes(classroom.notes || '');
      } else {
        // Reset for create mode
        setName('');
        setRoomNumber('');
        setTeacher('');
        setNotes('');
      }
      setError(undefined);
    }
  }, [open, classroom]);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Classroom name (Description) is required');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Room number is required');
      return;
    }
    if (!teacher.trim()) {
      setError('Teacher name is required');
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      if (classroom) {
        const updated = await updateClassroom(classroom.id, {
          name: name.trim(),
          room_number: roomNumber.trim(),
          teacher: teacher.trim(),
          notes: notes.trim() || null,
        });
        onUpdated?.(updated);
      } else {
        const created = await createClassroom({
          name: name.trim(),
          room_number: roomNumber.trim(),
          teacher: teacher.trim(),
          notes: notes.trim() || null,
        });
        onCreated?.(created);
      }
      onClose();
    } catch (e: any) {
      console.error(e);
      // Error is already set in store, but we can also set local error if needed
      // or just rely on the store's error if we used that.
      // Here we catch the re-thrown error from the store.
      if (e.response?.data?.error) {
        setError(e.response.data.error);
      } else if (e.response?.data?.message) {
         setError(e.response.data.message);
      } else {
        setError(e.message || 'Failed to save classroom');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{classroom ? 'Edit Class' : 'Create Class'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Description / Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 3A"
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Room Number"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Teacher"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Optional notes..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : classroom ? 'Save Changes' : 'Create Class'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
