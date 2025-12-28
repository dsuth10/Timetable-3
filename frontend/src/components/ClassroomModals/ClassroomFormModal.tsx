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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { useClassroomsStore } from '../../store/stores/classrooms';
import type { Classroom } from '../../types';

const YEAR_LEVELS = ['Prep', '1', '2', '3', '4', '5', '6'];

// Generate a random color hex from the same palette as aides
const generateRandomColor = () => {
  const colors = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

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
  const [yearLevel, setYearLevel] = useState('');
  const [isComposite, setIsComposite] = useState(false);
  const [compositeYearLevels, setCompositeYearLevels] = useState<string[]>([]);
  const [colourHex, setColourHex] = useState(generateRandomColor());

  // Initialize form when classroom changes or modal opens
  useEffect(() => {
    if (open) {
      if (classroom) {
        setName(classroom.name);
        setRoomNumber(classroom.room_number);
        setTeacher(classroom.teacher);
        setNotes(classroom.notes || '');
        setYearLevel(classroom.year_level || '');
        setIsComposite(classroom.is_composite || false);
        setCompositeYearLevels(
          classroom.composite_year_levels
            ? classroom.composite_year_levels.split(',').map((s) => s.trim())
            : []
        );
        setColourHex(classroom.colour_hex || generateRandomColor());
      } else {
        // Reset for create mode
        setName('');
        setRoomNumber('');
        setTeacher('');
        setNotes('');
        setYearLevel('');
        setIsComposite(false);
        setCompositeYearLevels([]);
        setColourHex(generateRandomColor());
      }
      setError(undefined);
    }
  }, [open, classroom]);

  const handleCompositeYearChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setCompositeYearLevels(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

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

    // Validate composite/year level
    if (isComposite && compositeYearLevels.length === 0) {
       setError('Please select at least one year level for composite class');
       return;
    }

    setLoading(true);
    setError(undefined);

    try {
      const payload = {
        name: name.trim(),
        room_number: roomNumber.trim(),
        teacher: teacher.trim(),
        notes: notes.trim() || null,
        year_level: !isComposite ? yearLevel : null,
        is_composite: isComposite,
        composite_year_levels: isComposite ? compositeYearLevels.join(',') : null,
        colour_hex: colourHex,
      };

      if (classroom) {
        const updated = await updateClassroom(classroom.id, payload);
        onUpdated?.(updated);
      } else {
        const created = await createClassroom(payload);
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

          <FormControlLabel
            control={
              <Checkbox
                checked={isComposite}
                onChange={(e) => setIsComposite(e.target.checked)}
              />
            }
            label="Composite Class"
          />

          {isComposite ? (
            <FormControl fullWidth>
              <InputLabel>Composite Year Levels</InputLabel>
              <Select
                multiple
                value={compositeYearLevels}
                onChange={handleCompositeYearChange}
                input={<OutlinedInput label="Composite Year Levels" />}
                renderValue={(selected) => selected.join(', ')}
              >
                {YEAR_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    <Checkbox checked={compositeYearLevels.indexOf(level) > -1} />
                    {level === 'Prep' ? 'Prep' : `Year ${level}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Year Level</InputLabel>
              <Select
                value={yearLevel}
                label="Year Level"
                onChange={(e) => setYearLevel(e.target.value)}
              >
                {YEAR_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level === 'Prep' ? 'Prep' : `Year ${level}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box>
            <TextField
              label="Color"
              type="color"
              value={colourHex}
              onChange={(e) => setColourHex(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="This color will be used to identify the class in the dashboard"
            />
          </Box>

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
