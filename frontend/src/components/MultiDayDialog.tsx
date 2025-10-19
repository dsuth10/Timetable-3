import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Box,
  Typography,
} from '@mui/material';
import { CalendarMonth, Check } from '@mui/icons-material';

type Props = {
  open: boolean;
  days: { key: 'MO' | 'TU' | 'WE' | 'TH' | 'FR'; label: string; selected: boolean }[];
  onToggle: (key: Props['days'][number]['key']) => void;
  onApply: (selectedKeys: Array<'MO' | 'TU' | 'WE' | 'TH' | 'FR'>) => void;
  onClose: () => void;
};

export default function MultiDayDialog({ open, days, onToggle, onApply, onClose }: Props) {
  const selectedDays = days.filter(d => d.selected).map(d => d.key);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth color="primary" />
          Apply to Multiple Days
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select the days you want to apply this task to:
        </Typography>
        <ToggleButtonGroup
          value={selectedDays}
          onChange={(_event, newDays) => {
            // Find which day was toggled
            const added = newDays.find((d: string) => !selectedDays.includes(d as any));
            const removed = selectedDays.find(d => !newDays.includes(d));
            if (added) {
              onToggle(added as Props['days'][number]['key']);
            } else if (removed) {
              onToggle(removed);
            }
          }}
          aria-label="day selection"
          fullWidth
          sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {days.map((day) => (
            <ToggleButton 
              key={day.key} 
              value={day.key}
              data-testid={`multiday-${day.key}`}
              sx={{ 
                flex: 1,
                minWidth: 80,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {day.selected && <Check fontSize="small" />}
                {day.label}
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {selectedDays.length === 0 && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            Please select at least one day
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          onClick={() => onApply(selectedDays)}
          variant="contained"
          disabled={selectedDays.length === 0}
          data-testid="open-multiday"
        >
          Apply to {selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


