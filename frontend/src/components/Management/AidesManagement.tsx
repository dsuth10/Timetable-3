import { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  Avatar,
  Button,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Edit, Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useAidesStore } from '../../store/stores/aides';
import LoadingState from '../common/LoadingState';
import AideFormModal from '../AideFormModal';
import { aidesApi } from '../../services/aidesApi';
import { downloadSampleCSV } from '../../utils/download';
import type { TeacherAide } from '../../types';

type AidesManagementProps = {
  onAddAide?: () => void;
  onChanged?: () => void;
};

export default function AidesManagement({ onAddAide: _onAddAide, onChanged }: AidesManagementProps) {
  const { aides, loading, error, fetchAides, updateAide: _updateAide } = useAidesStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAide, setSelectedAide] = useState<TeacherAide | null>(null);
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
    fetchAides({ includeAvailability: true }).catch(() => undefined);
  }, [fetchAides]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setUploadError(null);
    setUploadResult(null);
    setUploading(true);
    setShowUploadDialog(true);

    try {
      const result = await aidesApi.batchUpload(file);
      setUploadResult(result);
      
      // Refresh aides list if any were created
      if (result.created > 0) {
        await fetchAides({ includeAvailability: true });
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

  if (loading) {
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
        <Typography variant="h6">All Aides</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            size="small"
            onClick={() => downloadSampleCSV()}
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
            onClick={() => setShowCreateModal(true)}
          >
            Add Aide
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
        {aides.map((aide) => (
          <Paper key={aide.id} sx={{ mb: 1 }}>
            <ListItem
              sx={{
                '&:hover': {
                  bgcolor: 'action.hover',
                },
                transition: 'background-color 0.2s',
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
                secondaryTypographyProps={{ component: 'div' }}
                secondary={
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {aide.details && (
                      <Chip 
                        label={aide.details} 
                        size="small" 
                        variant="outlined"
                      />
                    )}
                    <Chip 
                      label={aide.colour_hex} 
                      size="small"
                      sx={{ bgcolor: aide.colour_hex, color: 'white' }}
                    />
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Edit Aide">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAide(aide);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </ListItem>
          </Paper>
        ))}
      </List>

      {/* Create Aide Modal */}
      <AideFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          fetchAides({ includeAvailability: true }).catch(() => undefined);
          onChanged?.();
        }}
      />

      {/* Edit Aide Modal */}
      <AideFormModal
        open={showEditModal}
        aide={selectedAide}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAide(null);
        }}
        onUpdated={() => {
          setShowEditModal(false);
          setSelectedAide(null);
          fetchAides({ includeAvailability: true }).catch(() => undefined);
          onChanged?.();
        }}
        onDeleted={() => {
          setShowEditModal(false);
          setSelectedAide(null);
          fetchAides({ includeAvailability: true }).catch(() => undefined);
          onChanged?.();
        }}
      />

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
                  Successfully created {uploadResult.created} aide{uploadResult.created !== 1 ? 's' : ''}
                </Alert>
              )}
              {uploadResult.skipped_existing > 0 && (
                <Alert severity="warning">
                  Skipped {uploadResult.skipped_existing} existing aide{uploadResult.skipped_existing !== 1 ? 's' : ''}
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
                <Alert severity="info">No aides were created. Please check your CSV file format.</Alert>
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

