import React, { forwardRef } from 'react';
import { Box, Typography, ThemeProvider, createTheme } from '@mui/material';
import theme from '../theme/theme';

// Create a forced light theme for the export
const exportTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
});

interface Props {
  staffName: string;
  dateRange: string;
  children: React.ReactNode;
}

/**
 * A container component for the timetable export that forces a light theme,
 * adds a minimal header, and applies CSS to hide interactive elements.
 */
export const TimetableExportView = forwardRef<HTMLDivElement, Props>(({ staffName, dateRange, children }, ref) => {
  return (
    <ThemeProvider theme={exportTheme}>
      <Box
        ref={ref}
        id="timetable-export-view"
        sx={{
          p: 4,
          backgroundColor: '#ffffff',
          color: '#000000',
          width: '1200px', // Fixed width for consistent capture
          minHeight: '1000px', // Ensure it has a minimum height for capture
          // Hide interactive elements marked with .hide-for-export
          '& .hide-for-export': {
            display: 'none !important',
          },
          // Ensure all text is dark for printing
          '& .MuiTypography-root': {
            color: '#000000 !important',
          },
          // Adjust grid lines for better print visibility
          '& .MuiDivider-root': {
            borderColor: 'rgba(0, 0, 0, 0.12) !important',
          }
        }}
      >
        {/* FR-010: Minimal Header */}
        <Box sx={{ mb: 3, borderBottom: '2px solid #000', pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Timetable: {staffName}
            </Typography>
            <Typography variant="h6">
              {dateRange}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              Standard A4 Landscape View
            </Typography>
          </Box>
        </Box>

        {/* The actual timetable grid content */}
        <Box sx={{ position: 'relative' }}>
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
});

TimetableExportView.displayName = 'TimetableExportView';
