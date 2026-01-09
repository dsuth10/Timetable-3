import { useEffect, useState } from 'react';
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
  CircularProgress,
  Avatar,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { EventBusy, Save } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { absencesApi } from '../services/absencesApi';
import type { TeacherAide } from '../types';

type Props = {
  open: boolean;
  aides: TeacherAide[];
  onClose: () => void;
  onCreated?: (aideId: number) => void;
  initialAideId?: number;
  initialDate?: string;
};

export default function AbsenceModal({ open, aides, onClose, onCreated, initialAideId, initialDate }: Props) {
  const [aideId, setAideId] = useState<string>('');
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      // Use initial values if provided, otherwise reset
      setAideId(initialAideId ? String(initialAideId) : '');
      setDateValue(initialDate ? new Date(initialDate + 'T00:00:00') : null);
      setReason('');
      setError(undefined);
    }
  }, [open, initialAideId, initialDate]);

  const handleSubmit = async () => {
    if (!dateValue) return;
    
    setSubmitting(true);
    setError(undefined);
    try {
      // Format date using local time components to avoid timezone issues
      // Use local date methods instead of toISOString() which converts to UTC
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      const dateISO = `${year}-${month}-${day}`;
      await absencesApi.create({ 
        aide_id: Number(aideId), 
        date: dateISO, 
        reason: reason || null 
      });
      onCreated?.(Number(aideId));
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to record absence');
    } finally {
      setSubmitting(false);
    }
  };

  // const selectedAide = aides.find(a => a.id === Number(aideId));

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventBusy color="primary" />
          Record Absence
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel>Aide</InputLabel>
            <Select
              value={aideId}
              label="Aide"
              onChange={(e) => setAideId(e.target.value)}
              data-testid="absence-aide"
            >
              <MenuItem value="">
                <em>Select an aide...</em>
              </MenuItem>
              {aides.map((aide) => (
                <MenuItem key={aide.id} value={aide.id}>
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        bgcolor: aide.colour_hex,
                        fontSize: '0.75rem',
                      }}
                    >
                      {aide.name.charAt(0)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText>{aide.name}</ListItemText>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="Date"
            value={dateValue}
            onChange={(newValue) => setDateValue(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                InputLabelProps: { shrink: true },
              },
            }}
            data-testid="absence-date"
          />

          <TextField
            label="Reason (Optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="e.g., Sick leave, Personal day"
            data-testid="absence-reason"
          />

          {error && (
            <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>
              {error}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!aideId || !dateValue || submitting}
          variant="contained"
          startIcon={submitting ? <CircularProgress size={16} /> : <Save />}
          data-testid="absence-submit"
        >
          Record Absence
        </Button>
      </DialogActions>
    </Dialog>
  );
}


