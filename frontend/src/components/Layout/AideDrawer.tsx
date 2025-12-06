import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemAvatar,
  ListItemText,
  Avatar,
  Switch,
  Box,
  Typography,
  Divider,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  EventBusy as AbsenceIcon,
} from '@mui/icons-material';
import { TeacherAide } from '../../types';

type AideDrawerProps = {
  open: boolean;
  onClose: () => void;
  aides: TeacherAide[];
  visibleAideIds: Set<number>;
  onToggleAideVisibility: (aideId: number) => void;
  onMarkAbsence: (aideId: number) => void;
  onAddAide: () => void;
};

const DRAWER_WIDTH = 280;

export default function AideDrawer({
  open,
  onClose,
  aides,
  visibleAideIds,
  onToggleAideVisibility,
  onMarkAbsence,
  onAddAide,
}: AideDrawerProps) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Manage Aides
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Toggle visibility or mark absences
        </Typography>
      </Box>
      <Divider />
      
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {aides.map((aide) => {
          const isVisible = visibleAideIds.has(aide.id);
          return (
            <ListItem
              key={aide.id}
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title="Mark Absence">
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={() => onMarkAbsence(aide.id)}
                    >
                      <AbsenceIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Switch
                    edge="end"
                    checked={isVisible}
                    onChange={() => onToggleAideVisibility(aide.id)}
                    inputProps={{ 'aria-label': `Toggle ${aide.name} visibility` }}
                  />
                </Box>
              }
              sx={{ 
                pr: 12,
                opacity: isVisible ? 1 : 0.5,
              }}
            >
              <ListItemAvatar>
                <Avatar 
                  sx={{ 
                    bgcolor: aide.colour_hex,
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  {aide.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={aide.name}
                secondary={aide.details || 'No details listed'}
              />
            </ListItem>
          );
        })}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAddAide}
        >
          Add Aide
        </Button>
      </Box>
    </Drawer>
  );
}

