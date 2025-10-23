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
import { useAidesStore } from '../store/stores/aides';
import AideFormModal from '../components/AideFormModal';
import type { TeacherAide } from '../types';

export default function Aides() {
  const { aides, loading, error, fetchAides } = useAidesStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAide, setSelectedAide] = useState<TeacherAide | null>(null);

  useEffect(() => {
    fetchAides({ includeAvailability: true }).catch(() => undefined);
  }, [fetchAides]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Aides</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => setShowCreateModal(true)}
        >
          Add Aide
        </Button>
      </Box>

      {loading && <Typography>Loading…</Typography>}
      {error && <Typography color="error" role="alert">{error}</Typography>}
      
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
                secondary={
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {aide.qualifications && (
                      <Chip 
                        label={aide.qualifications} 
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


