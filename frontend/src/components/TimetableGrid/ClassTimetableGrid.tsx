import { Box, Paper, Typography } from '@mui/material';
import type { Classroom, Assignment, Task, TeacherAide, Absence } from '../../types';
import { TimeSlottedColumn } from './TimeSlottedColumn';

type ClassTimetableGridProps = {
  selectedClass: Classroom;
  assignmentsByDay: Record<string, Assignment[]>;
  weekDates: string[];
  tasks: Task[];
  aides: TeacherAide[];
  onTaskDoubleClick?: (assignment: Assignment, task?: Task) => void;
  onSlotClick?: (date: string, time: string) => void;
  absences?: Absence[];
};

export function ClassTimetableGrid({
  selectedClass,
  assignmentsByDay,
  weekDates,
  tasks,
  aides,
  onTaskDoubleClick,
  onSlotClick,
  absences = [],
}: ClassTimetableGridProps) {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(5, minmax(200px, 1fr))`,
          gap: 1,
          flex: 1,
          pb: 2,
        }}
      >
        <Box className="hide-for-export" sx={{ gridColumn: '1 / -1', mb: 1 }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            Schedule for {selectedClass.name}
          </Typography>
        </Box>

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
                  bgcolor: 'primary.main',
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

              <TimeSlottedColumn
                date={date}
                assignments={assignments}
                tasks={tasks}
                onTaskDoubleClick={onTaskDoubleClick}
                showAideName={true}
                aides={aides}
                onSlotClick={onSlotClick}
                absences={absences}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

