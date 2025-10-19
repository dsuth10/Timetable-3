import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PersonAdd, Save } from '@mui/icons-material';
import { aidesApi } from '../services/aidesApi';
import type { TeacherAide } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (aide: TeacherAide) => void;
};

// Generate a random color hex
const generateRandomColor = () => {
  const colors = [
    '#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function AideFormModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [colourHex, setColourHex] = useState(generateRandomColor());
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setQualifications('');
      setColourHex(generateRandomColor());
      setError(undefined);
    }
  }, [open]);

  const handleClose = () => {
    if (!busy) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const aide = await aidesApi.create({
        name,
        qualifications: qualifications || null,
        colour_hex: colourHex,
      });
      onCreated?.(aide);
      handleClose();
    } catch (e: any) {
      setError(e.message || 'Failed to create aide');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd color="primary" />
          Add New Aide
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
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            autoFocus
            placeholder="e.g., Jane Smith"
          />
          
          <TextField
            label="Qualifications (Optional)"
            value={qualifications}
            onChange={(e) => setQualifications(e.target.value)}
            fullWidth
            placeholder="e.g., Special Education, ESL"
          />

          <Box>
            <TextField
              label="Color"
              type="color"
              value={colourHex}
              onChange={(e) => setColourHex(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="This color will be used to identify the aide in the schedule"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={busy || !name.trim()}
          variant="contained"
          startIcon={busy ? <CircularProgress size={16} /> : <Save />}
        >
          Add Aide
        </Button>
      </DialogActions>
    </Dialog>
  );
}
