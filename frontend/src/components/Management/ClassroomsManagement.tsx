import { useEffect, useState, useRef } from 'react';
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
  Alert,
  Stack,
  Divider,
  alpha,
} from '@mui/material';
import { Add as AddIcon, Edit, Delete, School, Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useClassroomsStore } from '../../store/stores/classrooms';
import LoadingState from '../common/LoadingState';
import ClassroomFormModal from '../ClassroomModals/ClassroomFormModal';
import { classroomsApi } from '../../services/classroomsApi';
import { downloadSampleClassroomsCSV } from '../../utils/download';
import type { Classroom } from '../../types';

export default function ClassroomsManagement({ onChanged }: { onChanged?: () => void }) {
  const { classrooms, loading, error, fetchClassrooms, deleteClassroom } = useClassroomsStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    skipped_duplicates: number;
    skipped_existing: number;
    errors: number;
    skipped_duplicate_names?: string[];
    skipped_existing_names?: string[];
    error_details?: string[];
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchClassrooms().catch(() => undefined);
  }, [fetchClassrooms]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setUploadError(null);
    setUploadResult(null);
    setUploading(true);
    setShowUploadDialog(true);

    try {
      const result = await classroomsApi.batchUpload(file);
      setUploadResult(result);
      
      // Refresh classrooms list if any were created
      if (result.created > 0) {
        await fetchClassrooms();
        onChanged?.();
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error || err.message || 'Failed to upload CSV file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false);
    setUploadResult(null);
    setUploadError(null);
  };

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
        onChanged?.();
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            size="small"
            onClick={() => downloadSampleClassroomsCSV()}
          >
            Download Sample CSV
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<UploadIcon />} 
            size="small"
            onClick={handleUploadClick}
          >
            Upload CSV
          </Button>
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
      </Box>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <List>
        {classrooms.map((classroom) => (
          <Paper key={classroom.id} sx={{ mb: 1 }}>
            <ListItem
              sx={{
                borderLeft: `4px solid ${classroom.colour_hex || '#1976d2'}`,
                mb: 1,
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'background-color 0.2s',
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School fontSize="small" sx={{ color: classroom.colour_hex || 'action.active' }} />
                    <Typography variant="subtitle1" component="span" fontWeight="medium">
                      {classroom.name}
                    </Typography>
                    <Chip 
                      label={`Room: ${classroom.room_number}`} 
                      size="small" 
                      variant="outlined" 
                      sx={{ 
                        fontSize: '0.75rem', 
                        height: 24,
                        borderColor: alpha(classroom.colour_hex || '#1976d2', 0.3),
                        bgcolor: alpha(classroom.colour_hex || '#1976d2', 0.05)
                      }}
                    />
                    {(classroom.is_composite || classroom.year_level) && (
                      <Chip
                        label={
                          classroom.is_composite
                            ? `Years: ${classroom.composite_year_levels}`
                            : `Year: ${classroom.year_level}`
                        }
                        size="small"
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.75rem', 
                          height: 24,
                          color: classroom.colour_hex || 'primary.main',
                          borderColor: alpha(classroom.colour_hex || '#1976d2', 0.5),
                          bgcolor: alpha(classroom.colour_hex || '#1976d2', 0.1)
                        }}
                      />
                    )}
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
        onClose={() => {
          setShowCreateModal(false);
          onChanged?.();
        }}
      />

      {/* Edit Modal */}
      <ClassroomFormModal
        open={showEditModal}
        classroom={selectedClassroom}
        onClose={() => {
          setShowEditModal(false);
          setSelectedClassroom(null);
          onChanged?.();
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

      {/* Upload CSV Dialog */}
      <Dialog open={showUploadDialog} onClose={handleCloseUploadDialog} maxWidth="sm" fullWidth>
        <DialogTitle>CSV Upload Results</DialogTitle>
        <DialogContent>
          {uploading && (
            <Alert severity="info">Uploading and processing CSV file...</Alert>
          )}
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}
          {uploadResult && (
            <Stack spacing={2}>
              {uploadResult.created > 0 && (
                <Alert severity="success">
                  Successfully created {uploadResult.created} classroom{uploadResult.created !== 1 ? 's' : ''}
                </Alert>
              )}
              {uploadResult.skipped_existing > 0 && (
                <Alert severity="warning">
                  Skipped {uploadResult.skipped_existing} existing classroom{uploadResult.skipped_existing !== 1 ? 's' : ''}
                  {uploadResult.skipped_existing_names && uploadResult.skipped_existing_names.length > 0 && (
                    <Box component="div" sx={{ mt: 1, fontSize: '0.875rem' }}>
                      {uploadResult.skipped_existing_names.slice(0, 5).join(', ')}
                      {uploadResult.skipped_existing_names.length > 5 && ` and ${uploadResult.skipped_existing_names.length - 5} more`}
                    </Box>
                  )}
                </Alert>
              )}
              {uploadResult.skipped_duplicates > 0 && (
                <Alert severity="info">
                  Skipped {uploadResult.skipped_duplicates} duplicate name{uploadResult.skipped_duplicates !== 1 ? 's' : ''} in CSV
                  {uploadResult.skipped_duplicate_names && uploadResult.skipped_duplicate_names.length > 0 && (
                    <Box component="div" sx={{ mt: 1, fontSize: '0.875rem' }}>
                      {uploadResult.skipped_duplicate_names.slice(0, 5).join(', ')}
                      {uploadResult.skipped_duplicate_names.length > 5 && ` and ${uploadResult.skipped_duplicate_names.length - 5} more`}
                    </Box>
                  )}
                </Alert>
              )}
              {uploadResult.errors > 0 && (
                <Alert severity="error">
                  {uploadResult.errors} error{uploadResult.errors !== 1 ? 's' : ''} encountered
                  {uploadResult.error_details && uploadResult.error_details.length > 0 && (
                    <Box component="div" sx={{ mt: 1, fontSize: '0.875rem' }}>
                      <Divider sx={{ my: 1 }} />
                      {uploadResult.error_details.slice(0, 5).map((detail, idx) => (
                        <Box key={idx} component="div" sx={{ mb: 0.5 }}>
                          {detail}
                        </Box>
                      ))}
                      {uploadResult.error_details.length > 5 && (
                        <Box component="div" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                          ... and {uploadResult.error_details.length - 5} more error{uploadResult.error_details.length - 5 !== 1 ? 's' : ''}
                        </Box>
                      )}
                    </Box>
                  )}
                </Alert>
              )}
              {uploadResult.created === 0 && uploadResult.skipped_existing === 0 && uploadResult.skipped_duplicates === 0 && uploadResult.errors === 0 && (
                <Alert severity="info">No classrooms were created. Please check your CSV file format.</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
