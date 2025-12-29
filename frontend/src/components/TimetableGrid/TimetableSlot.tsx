import { Droppable } from '@hello-pangea/dnd';
import { Box, Typography, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { memo } from 'react';
import { Gap } from '../../utils/gapUtils';
import GapHighlight from './GapHighlight';
import { timeToPixels, durationToPixels } from './timeUtils';

type TimetableSlotProps = {
  aideId: number;
  date: string;
  timeSlot: string; // HH:MM format
  children?: React.ReactNode;
  top: number;
  height: number;
  onClick?: (date: string, time: string) => void;
  onQuickCreate?: (date: string, time: string) => void;
  gaps?: Gap[];
  aideColor?: string;
};

function TimetableSlotBase({ aideId, date, timeSlot, children, top, height, onClick, onQuickCreate, gaps = [], aideColor }: TimetableSlotProps) {
  const droppableId = `aide-${aideId}-date-${date}-time-${timeSlot}`;

  const handleQuickCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering slot onClick
    onQuickCreate?.(date, timeSlot);
  };

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

          {/* Quick-create "+" button in top-right corner */}
          {onQuickCreate && (
            <IconButton
              onClick={handleQuickCreateClick}
              size="small"
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 20,
                height: 20,
                padding: 0,
                opacity: 0.4,
                zIndex: 10,
                '&:hover': {
                  opacity: 1,
                },
                '&:focus-visible': {
                  opacity: 1,
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
              aria-label={`Create task in this time slot (${timeSlot})`}
              tabIndex={0}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}
          
          {/* Border highlight during drag over */}
          {snapshot.isDraggingOver && (
            <>
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
              {/* Render specific gap highlights */}
              {gaps.map((gap, idx) => (
                <Box
                  key={`gap-${idx}`}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: `${timeToPixels(gap.start_time) - top}px`,
                    height: `${durationToPixels(gap.start_time, gap.end_time)}px`,
                    zIndex: 5,
                  }}
                >
                  <GapHighlight 
                    colour_hex={aideColor || '#1976d2'} 
                  />
                </Box>
              ))}
            </>
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
    prev.onClick === next.onClick &&
    prev.onQuickCreate === next.onQuickCreate &&
    prev.gaps === next.gaps &&
    prev.aideColor === next.aideColor
  );
});
