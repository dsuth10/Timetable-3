import React from 'react';
import { Box } from '@mui/material';

interface GapHighlightProps {
  colour_hex: string;
}

/**
 * A visual highlight for a "snappable" gap in the timetable.
 * Renders a semi-transparent block with the aide's color.
 * It fills its parent container, so the parent should handle positioning.
 */
const GapHighlight: React.FC<GapHighlightProps> = ({ colour_hex }) => {
  return (
    <Box
      data-testid="gap-highlight"
      sx={{
        position: 'absolute',
        inset: 0,
        backgroundColor: `${colour_hex}4D`, // 30% transparency
        border: `2px dashed ${colour_hex}`,
        borderRadius: '4px',
        zIndex: 5,
        pointerEvents: 'none', // Allow clicks to pass through
        transition: 'all 0.2s ease-in-out',
      }}
    />
  );
};

export default GapHighlight;

