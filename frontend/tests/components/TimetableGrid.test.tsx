import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TimetableGrid } from '../../src/components/TimetableGrid/TimetableGrid';
import AppDragDropContext from '../../src/components/DragDropContext';

describe('TimetableGrid', () => {
  it('renders assignments under each aide column', () => {
    const aides = [
      { id: 1, name: 'A1', colour_hex: '#000' },
      { id: 2, name: 'A2', colour_hex: '#111' },
    ] as any[];

    const assignmentsByAide = {
      '1': [
        { id: 10, task_id: 101, aide_id: 1, date: '2025-10-01', start_time: '09:00:00', end_time: '09:30:00', status: 'ASSIGNED', version: 1 },
      ],
      '2': [
        { id: 11, task_id: 102, aide_id: 2, date: '2025-10-01', start_time: '10:00:00', end_time: '10:30:00', status: 'ASSIGNED', version: 1 },
      ],
    } as any;

    render(
      <AppDragDropContext onDragEnd={() => {}}>
        <TimetableGrid aides={aides as any} assignmentsByAide={assignmentsByAide} />
      </AppDragDropContext>
    );

    expect(screen.getByText(/Task #101/)).toBeInTheDocument();
    expect(screen.getByText(/Task #102/)).toBeInTheDocument();
  });
});


