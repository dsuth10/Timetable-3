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

    const assignmentsByDay = {
      '2025-10-01': [
        { id: 10, task_id: 101, aide_id: 1, date: '2025-10-01', start_time: '09:00:00', end_time: '09:30:00', status: 'ASSIGNED', version: 1 },
      ],
    } as any;

    const tasks = [
      { id: 101, title: 'Task #101', category: 'CLASS_SUPPORT' }
    ] as any[];

    const weekDates = ['2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05'];

    render(
      <AppDragDropContext onDragEnd={() => {}}>
        <TimetableGrid 
          selectedAide={aides[0]} 
          assignmentsByDay={assignmentsByDay} 
          weekDates={weekDates}
          tasks={tasks}
        />
      </AppDragDropContext>
    );

    expect(screen.getByText(/Task #101/)).toBeInTheDocument();
  });
});


