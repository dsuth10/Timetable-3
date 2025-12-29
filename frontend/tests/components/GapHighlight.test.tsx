/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GapHighlight from '../../src/components/TimetableGrid/GapHighlight';
import React from 'react';

describe('GapHighlight Component', () => {
  const mockGap = {
    start_time: '09:40',
    end_time: '10:00',
    duration: 20,
    aide_id: 1,
    date: '2025-12-29'
  };

  it('should render with the aide hex color and correct opacity', () => {
    const aideColor = '#FF5733';
    render(<GapHighlight gap={mockGap} colour_hex={aideColor} />);
    
    const highlight = screen.getByTestId('gap-highlight');
    expect(highlight).toBeDefined();
    
    // Check background color (MUI Box uses system styles, so we check the element style)
    // Note: Vitest/RTL might represent colors in rgb/rgba
    const style = window.getComputedStyle(highlight);
    expect(style.backgroundColor).toContain('rgba(255, 87, 51, 0.3)');
  });

  it('should have a border with the aide hex color', () => {
    const aideColor = '#FF5733';
    render(<GapHighlight gap={mockGap} colour_hex={aideColor} />);
    
    const highlight = screen.getByTestId('gap-highlight');
    const style = window.getComputedStyle(highlight);
    expect(style.border).toContain('rgb(255, 87, 51)');
  });
});

