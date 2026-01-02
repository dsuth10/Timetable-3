import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimetableExportView } from '../../src/components/TimetableExportView';
import { describe, it, expect } from 'vitest';
import { useTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';

const ThemeCheck = () => {
  const theme = useTheme();
  return <div data-testid="theme-mode">{theme.palette.mode}</div>;
};

describe('TimetableExportView', () => {
  it('should force light theme mode', () => {
    render(
      <TimetableExportView staffName="John Doe" dateRange="Jan 1 - Jan 7">
        <ThemeCheck />
      </TimetableExportView>
    );
    
    // This should fail initially because the placeholder doesn't wrap in ThemeProvider
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
  });

  it('should display the minimal header with staff name and date range', () => {
    render(
      <TimetableExportView staffName="John Doe" dateRange="Jan 1 - Jan 7">
        <div>Content</div>
      </TimetableExportView>
    );

    // Use regex to match parts of the text
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 1 - Jan 7/)).toBeInTheDocument();
  });
});

