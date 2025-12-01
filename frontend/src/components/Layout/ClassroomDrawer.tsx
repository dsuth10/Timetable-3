import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Typography,
  Divider,
  Button,
  ListItemButton,
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { Classroom } from '../../types';

type ClassroomDrawerProps = {
  open: boolean;
  onClose: () => void;
  classrooms: Classroom[];
  selectedClassId: number | null;
  onSelectClass: (classId: number) => void;
  onAddClass?: () => void;
};

const DRAWER_WIDTH = 280;

export default function ClassroomDrawer({
  open,
  onClose,
  classrooms,
  selectedClassId,
  onSelectClass,
  onAddClass,
}: ClassroomDrawerProps) {
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
          Classes
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a class to view schedule
        </Typography>
      </Box>
      <Divider />
      
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {classrooms.map((classroom) => {
          const isSelected = selectedClassId === classroom.id;
          return (
            <ListItem
              key={classroom.id}
              disablePadding
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => onSelectClass(classroom.id)}
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: isSelected ? 'primary.main' : 'grey.300',
                      color: '#fff',
                    }}
                  >
                    <SchoolIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={classroom.name}
                  secondary={classroom.teacher || classroom.room_number}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {onAddClass && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddClass}
            >
              Add Class
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
}

