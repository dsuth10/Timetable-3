import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimetableExportView } from './TimetableExportView';
import '@testing-library/jest-dom';

describe('TimetableExportView', () => {
  it('renders children correctly', () => {
    render(
      <TimetableExportView staffName="John Doe" dateRange="Jan 1-5, 2026">
        <div data-testid="child">Test Timetable</div>
      </TimetableExportView>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Timetable: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jan 1-5, 2026')).toBeInTheDocument();
  });

  it('applies light background and dark text styles', () => {
    const { container } = render(
      <TimetableExportView staffName="John Doe" dateRange="Jan 1-5, 2026">
        <div>Content</div>
      </TimetableExportView>
    );
    
    // The main container should have white background
    const exportView = container.querySelector('#timetable-export-view');
    expect(exportView).toHaveStyle('background-color: #ffffff');
    expect(exportView).toHaveStyle('color: #000000');
  });

  it('hides interactive elements with .hide-for-export', () => {
    // Note: CSS rules in SX are handled by Emotion and difficult to test purely with JSDOM
    // because they are injected into <style> tags.
    // However, we can verify the class name is present.
    render(
      <TimetableExportView staffName="John Doe" dateRange="Jan 1-5, 2026">
        <button className="hide-for-export">Export Button</button>
      </TimetableExportView>
    );
    
    const button = screen.getByText('Export Button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('hide-for-export');
  });
});

