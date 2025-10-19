import { useEffect } from 'react';
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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAidesStore } from '../../store/stores/aides';
import LoadingState from '../common/LoadingState';

type AidesManagementProps = {
  onAddAide?: () => void;
};

export default function AidesManagement({ onAddAide }: AidesManagementProps) {
  const { aides, loading, error, fetchAides } = useAidesStore();

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
          onClick={onAddAide}
        >
          Add Aide
        </Button>
      </Box>
      <List>
        {aides.map((aide) => (
          <Paper key={aide.id} sx={{ mb: 1 }}>
            <ListItem>
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
            </ListItem>
          </Paper>
        ))}
      </List>
    </Box>
  );
}

