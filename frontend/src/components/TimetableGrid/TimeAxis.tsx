import { Box, Typography } from '@mui/material';
import { SLOT_INTERVAL_MINUTES, SLOT_HEIGHT_PX, START_HOUR, END_HOUR } from './timeUtils';

type TimeAxisProps = {
  startHour?: number;
  endHour?: number;
  intervalMinutes?: number;
};

export default function TimeAxis({ 
  startHour = START_HOUR, 
  endHour = END_HOUR, 
  intervalMinutes = SLOT_INTERVAL_MINUTES 
}: TimeAxisProps) {
  const timeSlots: string[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  const slotHeight = SLOT_HEIGHT_PX; // pixels per 15-min slot

  return (
    <Box
      sx={{
        width: 80,
        position: 'relative',
        borderRight: '2px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      {timeSlots.map((time, index) => (
        <Box
          key={time}
          sx={{
            height: slotHeight,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            pr: 1,
            pt: 0.5,
            borderBottom: index % 4 === 3 ? '1px solid' : '1px dashed',
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontSize: '0.7rem',
              lineHeight: 1,
            }}
          >
            {time}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

