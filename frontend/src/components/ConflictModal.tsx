import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Warning, SwapHoriz, Cancel } from '@mui/icons-material';

type Conflict = {
  existing_assignment_id: number;
  task_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Props = {
  open: boolean;
  conflicts: Conflict[];
  onReplace: () => void;
  onCancel: () => void;
  onClose: () => void;
};

export default function ConflictModal({ open, conflicts, onReplace, onCancel, onClose }: Props) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Assignment Conflict
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          The following assignments conflict with your action
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {conflicts.length} conflicting {conflicts.length === 1 ? 'assignment' : 'assignments'} found:
        </Typography>
        <List>
          {conflicts.map((conflict) => (
            <ListItem 
              key={conflict.existing_assignment_id}
              sx={{ 
                border: '1px solid',
                borderColor: 'warning.light',
                borderRadius: 1,
                mb: 1,
                bgcolor: 'warning.lighter',
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      Assignment #{conflict.existing_assignment_id}
                    </Typography>
                    <Chip 
                      label={conflict.status} 
                      size="small" 
                      color="warning" 
                      sx={{ height: 20 }}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="caption">
                    {new Date(conflict.date + 'T00:00:00').toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })} · {conflict.start_time.slice(0, 5)} - {conflict.end_time.slice(0, 5)} · Task #{conflict.task_id}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Choose an action to resolve this conflict:
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', gap: 1, alignItems: 'stretch' }}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
          <Button 
            onClick={onCancel} 
            data-testid="conflict-cancel"
            startIcon={<Cancel />}
          >
            Cancel Action
          </Button>
          <Button 
            onClick={onReplace} 
            data-testid="conflict-replace"
            variant="contained"
            color="warning"
            startIcon={<SwapHoriz />}
          >
            Replace Existing
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}


