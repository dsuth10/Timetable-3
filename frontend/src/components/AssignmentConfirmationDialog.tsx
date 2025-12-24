import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Stack 
} from '@mui/material';
import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (startTime: string, endTime: string) => void;
  initialStartTime: string;
  initialEndTime: string;
  title: string;
}

export default function AssignmentConfirmationDialog({ 
  open, 
  onClose, 
  onConfirm, 
  initialStartTime, 
  initialEndTime,
  title
}: Props) {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);

  useEffect(() => {
    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
  }, [initialStartTime, initialEndTime, open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Assignment: {title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Start Time"
            type="time"
            value={startTime.substring(0, 5)}
            onChange={(e) => setStartTime(`${e.target.value}:00`)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Time"
            type="time"
            value={endTime.substring(0, 5)}
            onChange={(e) => setEndTime(`${e.target.value}:00`)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onConfirm(startTime, endTime)} variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}


