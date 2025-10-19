import { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import type { TeacherAide, Assignment, Task } from '../../types';
import TimeAxis from './TimeAxis';
import { TimeSlottedColumn } from './TimeSlottedColumn';

type TimetableGridProps = {
  selectedAide: TeacherAide;
  assignmentsByDay: Record<string, Assignment[]>; // key: date string (YYYY-MM-DD)
  weekDates: string[]; // array of 5 date strings (Mon-Fri)
  tasks: Task[];
};

export function TimetableGrid({ selectedAide, assignmentsByDay, weekDates, tasks }: TimetableGridProps) {
  // Day names for headers
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Format date for display (e.g., "Oct 13")
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
        {weekDates.map((date, dayIndex) => {
          const dayName = dayNames[dayIndex];
          const formattedDate = formatDate(date);
          const assignments = assignmentsByDay[date] || [];
          
          return (
            <Box key={date} sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Day Header */}
              <Paper
                elevation={2}
                sx={{
                  p: 1.5,
                  mb: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: selectedAide.colour_hex,
                  color: 'white',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {dayName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {formattedDate}
                </Typography>
              </Paper>

              {/* Time-Slotted Day Column */}
              <TimeSlottedColumn
                aideId={selectedAide.id}
                date={date}
                assignments={assignments}
                tasks={tasks}
                aideColor={selectedAide.colour_hex}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}




