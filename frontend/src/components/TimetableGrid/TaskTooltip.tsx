import React, { useState } from 'react';
import { Tooltip, Box, Typography, Divider, CircularProgress } from '@mui/material';
import { School, Repeat, Notes, Person, AccessTime } from '@mui/icons-material';
import { TooltipDataFetcher } from '../common/TooltipDataFetcher';
import { ID, TooltipData } from '../../types';

interface TaskTooltipProps {
  assignmentId: ID;
  children: React.ReactElement;
}

const TooltipContent: React.FC<{ data: TooltipData }> = ({ data }) => (
  <Box sx={{ p: 1, maxWidth: 300 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.25, color: 'primary.main' }}>
      {data.task_title}
    </Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
      {data.category.replace('_', ' ')}
    </Typography>

    <Divider sx={{ my: 1 }} />

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
      <School fontSize="small" sx={{ color: 'action.active', fontSize: '1.1rem' }} />
      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
        {data.classroom ? `${data.classroom.name} (${data.classroom.room_number}) - ${data.classroom.teacher}` : 'No Classroom'}
      </Typography>
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
      <AccessTime fontSize="small" sx={{ color: 'action.active', fontSize: '1.1rem' }} />
      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
        {data.start_time} – {data.end_time}
      </Typography>
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
      <Person fontSize="small" sx={{ color: 'action.active', fontSize: '1.1rem', mt: 0.25 }} />
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', lineHeight: 1 }}>Aides:</Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
          {data.assigned_aides.join(', ')}
        </Typography>
      </Box>
    </Box>

    {data.recurrence.is_recurring && (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
        <Repeat fontSize="small" sx={{ color: 'action.active', fontSize: '1.1rem', mt: 0.25 }} />
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', lineHeight: 1 }}>Upcoming:</Typography>
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.primary' }}>
            {data.recurrence.dates.map(d => d.slice(5).replace('-', '/')).join(', ')}
            {data.recurrence.has_more && ' ...'}
          </Typography>
        </Box>
      </Box>
    )}

    <Divider sx={{ my: 1 }} />

    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Notes fontSize="small" sx={{ color: 'action.active', fontSize: '1.1rem', mt: 0.25 }} />
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', lineHeight: 1 }}>Notes:</Typography>
        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontStyle: data.notes === 'No notes provided' ? 'italic' : 'normal', whiteSpace: 'pre-wrap' }}>
          {data.notes}
        </Typography>
      </Box>
    </Box>
  </Box>
);

/**
 * Sophisticated hover tooltip for assigned tasks.
 * Appears after 1 second hover or long-press on mobile.
 */
export const TaskTooltip: React.FC<TaskTooltipProps> = ({ assignmentId, children }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <Tooltip
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      enterDelay={1000}
      enterTouchDelay={1000} // Support long-press on mobile
      leaveDelay={0}
      arrow
      placement="top"
      title={
        open ? (
          <TooltipDataFetcher assignmentId={assignmentId}>
            {({ loading, error, data }) => {
              if (loading) return (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', minWidth: 100 }}>
                  <CircularProgress size={20} color="inherit" />
                </Box>
              );
              if (error) return <Typography variant="caption" color="error">Failed to load details</Typography>;
              if (!data) return <Typography variant="caption">No data available</Typography>;
              return <TooltipContent data={data} />;
            }}
          </TooltipDataFetcher>
        ) : ""
      }
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 6,
            border: '1px solid',
            borderColor: 'divider',
            p: 0,
            '& .MuiTooltip-arrow': {
              color: 'background.paper',
              '&::before': {
                border: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        },
      }}
    >
      {/* 
        MUI Tooltip requires the child to be able to hold a ref.
        If children is a functional component, it must use React.forwardRef.
        TaskCard is already memoized, so we should be careful.
      */}
      {children}
    </Tooltip>
  );
};

