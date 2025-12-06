import { useEffect, useState } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, Edit } from '@mui/icons-material';
import { useAidesStore } from '../../store/stores/aides';
import LoadingState from '../common/LoadingState';
import AideFormModal from '../AideFormModal';
import type { TeacherAide } from '../../types';

type AidesManagementProps = {
  onAddAide?: () => void;
};

export default function AidesManagement({ onAddAide: _onAddAide }: AidesManagementProps) {
  const { aides, loading, error, fetchAides, updateAide: _updateAide } = useAidesStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAide, setSelectedAide] = useState<TeacherAide | null>(null);

  useEffect(() => {
    fetchAides({ includeAvailability: true }).catch(() => undefined);
  }, [fetchAides]);

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
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          size="small"
          onClick={() => setShowCreateModal(true)}
        >
          Add Aide
        </Button>
      </Box>
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
        }}
      />
    </Box>
  );
}

