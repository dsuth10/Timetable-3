import { Box, Paper, Typography } from '@mui/material';
import type { DailyViewData, Assignment } from '../types';
import AideRow from './AideRow';

interface DailyTimelineProps {
  data: DailyViewData;
  date: string; // YYYY-MM-DD
  onTaskDoubleClick?: (assignment: Assignment) => void;
  onEditAide?: (aide: any) => void;
  onMarkAbsence?: (aideId: number) => void;
  onRemoveAbsence?: (aideId: number) => void;
}

export default function DailyTimeline({ data, date, onTaskDoubleClick, onEditAide, onMarkAbsence, onRemoveAbsence }: DailyTimelineProps) {
  const { aides, timeline_config } = data;

  return (
    <Paper
      elevation={1}
      sx={{
        overflow: 'auto', // Handle both X and Y in one container
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper'
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Box sx={{ minWidth: 'fit-content', display: 'flex', flexDirection: 'column' }}>
          {/* Timeline Header (Sticky) */}
          <Box sx={{
            display: 'flex',
            borderBottom: 2,
            borderColor: 'divider',
            bgcolor: 'grey.100',
            position: 'sticky',
            top: 0,
            zIndex: 20
          }}>
            <Box sx={{
              width: 150,
              flexShrink: 0,
              position: 'sticky',
              left: 0,
              p: 1,
              zIndex: 21,
              bgcolor: 'grey.100',
              boxShadow: 2,
              borderRight: 1,
              borderColor: 'divider'
            }}>
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
                      flex: `0 0 ${((slot.duration_minutes || 0) / (totalMinutes || 1)) * 100}%`,
                      p: 0.5,
                      pl: 1,
                      borderRight: 1,
                      borderColor: 'divider',
                      textAlign: 'left',
                      bgcolor: slot.duration_minutes === 40 ? '#e8f5e9' : 'inherit',
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      {slot.start_time ? slot.start_time.substring(0, 5) : "00:00"}
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
                date={date}
                timelineConfig={timeline_config}
                onTaskDoubleClick={onTaskDoubleClick}
                onEditAide={onEditAide}
                onMarkAbsence={onMarkAbsence}
                onRemoveAbsence={onRemoveAbsence}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
