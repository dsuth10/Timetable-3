import { useEffect, useState } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemText,
  Button,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Edit, Delete, School } from '@mui/icons-material';
import { useClassroomsStore } from '../../store/stores/classrooms';
import LoadingState from '../common/LoadingState';
import ClassroomFormModal from '../ClassroomModals/ClassroomFormModal';
import type { Classroom } from '../../types';

export default function ClassroomsManagement() {
  const { classrooms, loading, error, fetchClassrooms, deleteClassroom } = useClassroomsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);

  useEffect(() => {
    fetchClassrooms().catch(() => undefined);
  }, [fetchClassrooms]);

  const handleDeleteClick = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedClassroom) {
      try {
        await deleteClassroom(selectedClassroom.id);
        setShowDeleteDialog(false);
        setSelectedClassroom(null);
      } catch (e) {
        // Error is handled in store
      }
    }
  };

  if (loading && classrooms.length === 0) {
    return <LoadingState variant="skeleton" rows={5} />;
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error" role="alert">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">All Classes</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          size="small"
          onClick={() => {
            setSelectedClassroom(null);
            setShowCreateModal(true);
          }}
        >
          Add Class
        </Button>
      </Box>
      <List>
        {classrooms.map((classroom) => (
          <Paper key={classroom.id} sx={{ mb: 1 }}>
            <ListItem
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'background-color 0.2s',
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School fontSize="small" color="action" />
                    <Typography variant="subtitle1" component="span" fontWeight="medium">
                      {classroom.name}
                    </Typography>
                    <Chip 
                      label={`Room: ${classroom.room_number}`} 
                      size="small" 
                      variant="outlined" 
                      sx={{ fontSize: '0.75rem', height: 24 }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Teacher: {classroom.teacher}
                    </Typography>
                    {classroom.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                        {classroom.notes}
                      </Typography>
                    )}
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Edit Class">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClassroom(classroom);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Class">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(classroom);
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
          </Paper>
        ))}
        {classrooms.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography>No classes found. Create one to get started.</Typography>
          </Box>
        )}
      </List>

      {/* Create Modal */}
      <ClassroomFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Modal */}
      <ClassroomFormModal
        open={showEditModal}
        classroom={selectedClassroom}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClassroom(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Class?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selectedClassroom?.name}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
