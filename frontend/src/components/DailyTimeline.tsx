import { Box, Paper, Typography } from '@mui/material';
import type { DailyViewData, Assignment } from '../types';
import AideRow from './AideRow';

interface DailyTimelineProps {
  data: DailyViewData;
  onTaskDoubleClick?: (assignment: Assignment) => void;
}

export default function DailyTimeline({ data, onTaskDoubleClick }: DailyTimelineProps) {
  const { aides, timeline_config } = data;

  return (
    <Paper elevation={1} sx={{ overflow: 'hidden' }}>
      {/* Timeline Header (Sticky) */}
      <Box sx={{ display: 'flex', borderBottom: 2, borderColor: 'divider', bgcolor: 'grey.100' }}>
        <Box sx={{ width: 150, flexShrink: 0, position: 'sticky', left: 0, p: 1, zIndex: 6, bgcolor: 'grey.100' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Teacher Aide
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', minWidth: 2000 }}>
          {timeline_config.slots.map((slot) => {
            const totalMinutes = timeline_config.slots.reduce((acc, s) => acc + s.duration_minutes, 0);
            return (
              <Box 
                key={slot.start_time}
                sx={{ 
                  flex: `0 0 ${(slot.duration_minutes / totalMinutes) * 100}%`,
                  p: 0.5,
                  pl: 1,
                  borderRight: 1,
                  borderColor: 'divider',
                  textAlign: 'left'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {slot.start_time.substring(0, 5)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Aide Rows */}
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {aides.map((aide) => (
          <AideRow 
            key={aide.id} 
            aide={aide} 
            timelineConfig={timeline_config}
            onTaskDoubleClick={onTaskDoubleClick}
          />
        ))}
      </Box>
    </Paper>
  );
}
