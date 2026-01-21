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
import { Tooltip, IconButton } from '@mui/material';
import { EventBusy as AbsenceIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useAidesStore } from '../../../store/stores/aides';
import { useUiStore } from '../../../store/stores/uiStore';
import LoadingState from '../../common/LoadingState';
import EmptyState from '../../common/EmptyState';
import { isAideAvailable } from '../../../utils/availabilityUtils';
import { addMinutesToTime, timeIntervalsOverlap } from '../../TimetableGrid/timeUtils';
import type { Assignment, TeacherAide } from '../../../types';

const DRAWER_WIDTH = 320;

type Props = {
  assignmentsByAide: Record<string, Assignment[]>;
  onMarkAbsence?: (aideId: number) => void;
  onEditAide?: (aide: TeacherAide) => void;
  onViewSchedule?: (aideId: number) => void;
  selectedWeekStartISO?: string;
};

export default function TeacherAideListPanel({ 
  assignmentsByAide = {},
  onMarkAbsence,
  onEditAide,
  onViewSchedule,
  selectedWeekStartISO
}: Props) {
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
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {/* Top Row: Drag Indicator, Avatar, Name */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                {aide.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {aide.details || 'No details'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Bottom Row: Action Buttons */}
                          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5, mt: 0.5, ml: 4.5 }}>
                            {/* Button 1: Set Absence */}
                            {onMarkAbsence && (
                              <Tooltip title="Mark Absence">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAbsence(aide.id);
                                  }}
                                  sx={{ 
                                    border: 1, 
                                    borderColor: 'divider', 
                                    borderRadius: 1,
                                    p: 0.5,
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                      borderColor: 'primary.main'
                                    }
                                  }}
                                >
                                  <AbsenceIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {/* Button 2: Edit Details */}
                            {onEditAide && (
                              <Tooltip title="Edit Details & Availability">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditAide(aide);
                                  }}
                                  sx={{ 
                                    border: 1, 
                                    borderColor: 'divider', 
                                    borderRadius: 1,
                                    p: 0.5,
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                      borderColor: 'primary.main'
                                    }
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {/* Button 3: View Schedule */}
                            {onViewSchedule && (
                              <Tooltip title="View Weekly Schedule">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewSchedule(aide.id);
                                  }}
                                  sx={{ 
                                    border: 1, 
                                    borderColor: 'divider', 
                                    borderRadius: 1,
                                    p: 0.5,
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                      borderColor: 'primary.main'
                                    }
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
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
