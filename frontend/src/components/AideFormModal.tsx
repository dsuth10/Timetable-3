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
  Divider,
  Typography,
} from '@mui/material';
import { PersonAdd, Save, Edit, Delete } from '@mui/icons-material';
import { aidesApi } from '../services/aidesApi';
import AvailabilityEditor from './AvailabilityEditor';
import type { TeacherAide, Availability, Weekday } from '../types';

type DraftAvailability = {
  weekday: Weekday;
  start_time: string;
  end_time: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (aide: TeacherAide) => void;
  onUpdated?: (aide: TeacherAide) => void;
  onDeleted?: () => void;
  aide?: TeacherAide | null;
  isEdit?: boolean; // Explicitly track edit mode for better clarity
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

export default function AideFormModal({ open, onClose, onCreated, onUpdated, onDeleted, aide }: Props) {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [colourHex, setColourHex] = useState(generateRandomColor());
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [draftAvailability, setDraftAvailability] = useState<DraftAvailability[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isEditMode = !!aide;

  useEffect(() => {
    if (open) {
      if (aide) {
        // Edit mode - populate with existing data
        setName(aide.name);
        setDetails(aide.details || '');
        setColourHex(aide.colour_hex);
        
        // Load availability for existing aide
        loadAvailability(aide.id);
      } else {
        // Create mode - reset to defaults
        setName('');
        setDetails('');
        setColourHex(generateRandomColor());
        setAvailability([]);
        // Initialize draft availability with all days enabled (will be set by AvailabilityEditor)
        setDraftAvailability([]);
      }
      setError(undefined);
    }
  }, [open, aide]);

  const loadAvailability = async (aideId: number) => {
    setLoadingAvailability(true);
    try {
      const availabilityData = await aidesApi.availability.list(aideId);
      setAvailability(availabilityData);
    } catch (err: any) {
      console.error('Failed to load availability:', err);
      setAvailability([]);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleClose = () => {
    if (!busy) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (isEditMode && aide) {
        // Update existing aide
        const updatedAide = await aidesApi.update(aide.id, {
          name,
          details: details || undefined,
          colour_hex: colourHex,
        });
        onUpdated?.(updatedAide);
      } else {
        // Create new aide
        const newAide = await aidesApi.create({
          name,
          details: details || undefined,
          colour_hex: colourHex,
        });
        
        // Create availability records for enabled days
        if (draftAvailability.length > 0) {
          const availabilityPromises = draftAvailability.map(draft =>
            aidesApi.availability.create(newAide.id, {
              weekday: draft.weekday,
              start_time: draft.start_time,
              end_time: draft.end_time,
            }).catch((err: any) => {
              console.error(`Failed to create availability for ${draft.weekday}:`, err);
              // Return null for failed creations so we can track them
              return null;
            })
          );
          
          const availabilityResults = await Promise.all(availabilityPromises);
          const failedDays = availabilityResults
            .map((result, index) => result === null ? draftAvailability[index].weekday : null)
            .filter((day): day is Weekday => day !== null);
          
          if (failedDays.length > 0) {
            // Show warning but still proceed - aide is created, user can edit later
            setError(
              `Aide created successfully, but failed to set availability for: ${failedDays.join(', ')}. ` +
              'You can edit the aide to add availability later.'
            );
          }
        }
        
        onCreated?.(newAide);
        handleClose();
      }
    } catch (e: any) {
      setError(e.message || `Failed to ${isEditMode ? 'update' : 'create'} aide`);
    } finally {
      setBusy(false);
    }
  };

  const handleAvailabilityChange = (newAvailability: Availability[]) => {
    // In edit mode, availability has IDs - use as-is
    if (isEditMode) {
      setAvailability(newAvailability);
    } else {
      // In create mode (draft), extract just the weekday, start_time, end_time
      // Draft availability objects may not have IDs yet
      const draft: DraftAvailability[] = newAvailability.map(avail => ({
        weekday: avail.weekday,
        start_time: avail.start_time,
        end_time: avail.end_time,
      }));
      setDraftAvailability(draft);
    }
  };

  const handleDelete = async () => {
    if (!aide) return;

    setBusy(true);
    setError(undefined);
    try {
      await aidesApi.delete(aide.id);
      
      // Dispatch success event for toast notification
      try {
        window.dispatchEvent(new CustomEvent('app:success', { 
          detail: { message: 'Aide deleted successfully' } 
        }));
      } catch {}
      
      onDeleted?.();
      handleClose();
      setShowDeleteDialog(false);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Failed to delete aide');
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
          {isEditMode ? <Edit color="primary" /> : <PersonAdd color="primary" />}
          {isEditMode ? 'Edit Aide' : 'Add New Aide'}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ overflow: 'visible' }}>
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
            label="Details (Optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
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

        <Divider sx={{ my: 3 }} />

        {isEditMode && aide ? (
          <AvailabilityEditor
            aideId={aide.id}
            initialAvailability={availability}
            onAvailabilityChange={handleAvailabilityChange}
            disabled={busy || loadingAvailability}
            draftMode={false}
          />
        ) : (
          <AvailabilityEditor
            draftMode={true}
            initialAvailability={[]}
            onAvailabilityChange={handleAvailabilityChange}
            disabled={busy}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        {isEditMode && (
          <Button 
            onClick={() => setShowDeleteDialog(true)} 
            disabled={busy}
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy || !name.trim()}
            variant="contained"
            startIcon={busy ? <CircularProgress size={16} /> : <Save />}
          >
            {isEditMode ? 'Save Changes' : 'Add Aide'}
          </Button>
        </Box>
      </DialogActions>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => {
          if (!busy) {
            setShowDeleteDialog(false);
            setError(undefined);
          }
        }}
      >
        <DialogTitle>Delete Aide?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{aide?.name}</strong>?
            This action cannot be undone.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowDeleteDialog(false);
              setError(undefined);
            }} 
            disabled={busy}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} /> : <Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
