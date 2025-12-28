import { useMemo, useState } from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  TextField, 
  InputAdornment,
  Avatar,
  Card,
  CardContent,
  Drawer,
  alpha,
} from '@mui/material';
import { Search, Person, DragIndicator } from '@mui/icons-material';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useAidesStore } from '../../../store/stores/aides';
import { useUiStore } from '../../../store/stores/uiStore';
import LoadingState from '../../common/LoadingState';
import EmptyState from '../../common/EmptyState';
import { isAideAvailable } from '../../../utils/availabilityUtils';
import { addMinutesToTime, timeIntervalsOverlap } from '../../TimetableGrid/timeUtils';
import type { Assignment } from '../../../types';

const DRAWER_WIDTH = 320;

type Props = {
  assignmentsByAide: Record<string, Assignment[]>;
};

export default function TeacherAideListPanel({ assignmentsByAide = {} }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const { aides, loading } = useAidesStore();
  const { selectedTimeSlot } = useUiStore();

  const filteredAides = useMemo(() => {
    return aides.filter(aide => {
      if (searchQuery && !aide.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (selectedTimeSlot) {
        const { date, time, duration } = selectedTimeSlot;
        const endTime = addMinutesToTime(time, duration);

        // Check working hours / availability
        // If availability is not set (undefined or empty), treat as available
        if (aide.availability && aide.availability.length > 0 && !isAideAvailable(aide.availability, date, time, endTime)) {
           return false;
        }

        // Check conflicts with existing assignments
        const aideAssignments = assignmentsByAide[String(aide.id)] || [];
        const hasConflict = aideAssignments.some(assignment => {
            if (assignment.date !== date) return false;
            return timeIntervalsOverlap(time, endTime, assignment.start_time, assignment.end_time);
        });

        if (hasConflict) return false;
      }
      return true;
    });
  }, [aides, searchQuery, selectedTimeSlot, assignmentsByAide]);

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" />
            Teacher Aides
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Search aides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {selectedTimeSlot && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing aides available at {selectedTimeSlot.time}
            </Typography>
          )}
        </Box>
        <Divider />

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loading && <LoadingState variant="skeleton" rows={5} />}
          
          {!loading && filteredAides.length === 0 && (
            <EmptyState
              title="No Aides Found"
              description={selectedTimeSlot ? "No aides available for this time." : "Try adjusting your search."}
            />
          )}

          <Droppable droppableId="teacher-aides-list" isDropDisabled={true}>
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{ minHeight: '100%' }}
              >
                {filteredAides.map((aide, index) => (
                  <Draggable 
                    key={aide.id} 
                    draggableId={`aide-${aide.id}`} 
                    index={index}
                  >
                    {(dragProvided, dragSnapshot) => (
                      <Card
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        sx={{
                          mb: 1,
                          cursor: 'grab',
                          borderLeft: `4px solid ${aide.colour_hex}`,
                          bgcolor: dragSnapshot.isDragging 
                            ? 'action.hover' 
                            : alpha(aide.colour_hex || '#1976d2', 0.08),
                          '&:hover': {
                            bgcolor: alpha(aide.colour_hex || '#1976d2', 0.15),
                          },
                          opacity: dragSnapshot.isDragging ? 0.8 : 1,
                          ...dragProvided.draggableProps.style,
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <DragIndicator fontSize="small" color="action" />
                          <Avatar 
                            sx={{ 
                              bgcolor: aide.colour_hex, 
                              width: 32, 
                              height: 32, 
                              fontSize: '0.875rem' 
                            }}
                          >
                            {aide.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {aide.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {aide.details || 'No details'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </Box>
      </Box>
    </Drawer>
  );
}
