import { useState } from 'react';
import { Box, Paper, Typography, Chip, Tooltip, IconButton, Collapse, Alert, Stack } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { TeacherAide, Assignment, Task, Absence } from '../../types';
import TimeAxis from './TimeAxis';
import { TimeSlottedColumn } from './TimeSlottedColumn';

type TimetableGridProps = {
  selectedAide: TeacherAide;
  assignmentsByDay: Record<string, Assignment[]>; // key: date string (YYYY-MM-DD)
  weekDates: string[]; // array of 5 date strings (Mon-Fri)
  tasks: Task[];
  onTaskDoubleClick?: (assignment: Assignment, task?: Task) => void;
  absences?: Absence[];
  onAddAbsence?: (aideId: number, date: string) => void;
  onRemoveAbsence?: (absenceId: number) => void;
};

export function TimetableGrid({ selectedAide, assignmentsByDay, weekDates, tasks, onTaskDoubleClick, absences = [], onAddAbsence, onRemoveAbsence }: TimetableGridProps) {
  // Day names for headers
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Format date for display (e.g., "Oct 13")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', overflow: 'auto', height: '100%' }}>
      {/* Time Axis */}
      <TimeAxis />

      {/* Day Columns */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(5, minmax(200px, 1fr))`,
          gap: 1,
          flex: 1,
          pb: 2,
        }}
      >
        {/* Legend toggle and panel spanning full width */}
        <Box sx={{ gridColumn: '1 / -1', mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton aria-label="Toggle legend" onClick={() => setLegendOpen((o) => !o)} size="small">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
            <Typography variant="body2">Legend</Typography>
          </Stack>
          <Collapse in={legendOpen}>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(244, 67, 54, 0.1)', border: '1px dashed rgba(244,67,54,0.4)' }} />
                  <Typography variant="caption">Absent (full-day block)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'rgba(158, 158, 158, 0.08)' }} />
                  <Typography variant="caption">Unavailable time</Typography>
                </Box>
              </Box>
            </Alert>
          </Collapse>
        </Box>
        {weekDates.map((date, dayIndex) => {
          const dayName = dayNames[dayIndex];
          const formattedDate = formatDate(date);
          const assignments = assignmentsByDay[date] || [];
          const absenceForDate = absences.find(a => a.aide_id === selectedAide.id && a.date === date);
          const hasAbsence = !!absenceForDate;
          
          return (
            <Box key={date} sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Day Header */}
              <Paper
                elevation={2}
                sx={{
                  p: 1.5,
                  mb: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: selectedAide.colour_hex,
                  color: 'white',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {dayName}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {formattedDate}
                  </Typography>
                  {/* Absence banner */}
                  {hasAbsence && absenceForDate && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Chip size="small" color="error" label="Absent" sx={{ bgcolor: 'error.light', color: 'white' }} />
                      {absenceForDate.reason && (
                        <Tooltip title={absenceForDate.reason}>
                          <InfoOutlinedIcon sx={{ fontSize: '0.875rem', color: 'white', cursor: 'help', opacity: 0.9 }} />
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Box>
                {/* Absence action buttons */}
                {onAddAbsence && onRemoveAbsence && (
                  <Box sx={{ ml: 1 }}>
                    {hasAbsence && absenceForDate ? (
                      <Tooltip title="Remove absence">
                        <IconButton
                          size="small"
                          onClick={() => onRemoveAbsence(absenceForDate.id)}
                          sx={{
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                          }}
                          aria-label="Remove absence"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Add absence">
                        <IconButton
                          size="small"
                          onClick={() => onAddAbsence(selectedAide.id, date)}
                          sx={{
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                          }}
                          aria-label="Add absence"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Paper>

              {/* Time-Slotted Day Column */}
              <TimeSlottedColumn
                aideId={selectedAide.id}
                date={date}
                assignments={assignments}
                tasks={tasks}
                aideColor={selectedAide.colour_hex}
                onTaskDoubleClick={onTaskDoubleClick}
                availability={selectedAide.availability || []}
                absences={absences}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}




