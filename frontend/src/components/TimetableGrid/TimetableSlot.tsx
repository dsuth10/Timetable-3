import { Droppable } from '@hello-pangea/dnd';
import { Box, Typography } from '@mui/material';
import { memo } from 'react';
// import { SLOT_HEIGHT_PX } from './timeUtils'; // No longer using fixed height

type TimetableSlotProps = {
  aideId: number;
  date: string;
  timeSlot: string; // HH:MM format
  children?: React.ReactNode;
  // index: number; // No longer needed for positioning
  top: number;
  height: number;
  onClick?: (date: string, time: string) => void;
};

function TimetableSlotBase({ aideId, date, timeSlot, children, top, height, onClick }: TimetableSlotProps) {
  const droppableId = `aide-${aideId}-date-${date}-time-${timeSlot}`;

  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <Box
          ref={provided.innerRef}
          {...provided.droppableProps}
          onClick={() => onClick?.(date, timeSlot)}
          sx={{
            position: 'absolute',
            top: top,
            left: 0,
            right: 0,
            height: height,
            borderBottom: '1px dashed',
            borderColor: 'divider',
            zIndex: 1,
            backgroundColor: snapshot.isDraggingOver 
              ? 'rgba(25, 118, 210, 0.12)' 
              : 'transparent',
            transition: 'background-color 0.2s ease',
            overflow: 'visible', // Allow children to extend beyond slot
            '&:hover': {
              backgroundColor: snapshot.isDraggingOver 
                ? 'rgba(25, 118, 210, 0.12)'
                : 'rgba(0, 0, 0, 0.02)',
            },
          }}
        >
          {/* Time label always shown */}
          <Typography
            className="time-label"
            variant="caption"
            sx={{
              position: 'absolute',
              left: 4,
              top: 2,
              fontSize: '0.65rem',
              color: 'text.secondary',
              opacity: 0.6, // Subtle greyed out look
              pointerEvents: 'none',
              // Remove background to be less intrusive when shown on every slot
              px: 0.5,
              zIndex: 10,
            }}
          >
            {timeSlot}
          </Typography>
          
          {/* Border highlight during drag over */}
          {snapshot.isDraggingOver && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                border: '2px solid',
                borderColor: 'primary.main',
                borderRadius: 0.5,
                pointerEvents: 'none',
                zIndex: 5,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    opacity: 0.6,
                  },
                  '50%': {
                    opacity: 1,
                  },
                },
              }}
            />
          )}
          
          {children}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );
}

export const TimetableSlot = memo(TimetableSlotBase, (prev, next) => {
  return (
    prev.aideId === next.aideId &&
    prev.date === next.date &&
    prev.timeSlot === next.timeSlot &&
    prev.top === next.top &&
    prev.height === next.height &&
    prev.children === next.children &&
    prev.onClick === next.onClick
  );
});
