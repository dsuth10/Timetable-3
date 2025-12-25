import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskCard } from '../../src/components/TimetableGrid/TaskCard';
import AppDragDropContext from '../../src/components/DragDropContext';
import { Droppable } from '@hello-pangea/dnd';
import type { Assignment, Task } from '../../src/types';

const mockTask: Task = {
  id: 101,
  title: 'Reading Support',
  category: 'CLASS_SUPPORT',
  classroom_id: 1,
  classroom: { id: 1, name: '5C' }
} as any;

const mockAssignment: Assignment = {
  id: 1,
  task_id: 101,
  aide_id: 1,
  date: '2025-10-01',
  start_time: '09:00:00',
  end_time: '09:40:00',
  status: 'ASSIGNED',
  version: 1
} as any;

describe('TaskCard', () => {
  const renderTaskCard = (props: any) => {
    return render(
      <AppDragDropContext onDragEnd={() => {}}>
        <Droppable droppableId="test-droppable">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              <TaskCard {...props} />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </AppDragDropContext>
    );
  };

  it('renders task title and times in Aide View', () => {
    renderTaskCard({
      assignment: mockAssignment,
      task: mockTask,
      index: 0,
      viewMode: 'aide'
    });

    expect(screen.getByText('Reading Support')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 09:40')).toBeInTheDocument();
  });

  it('renders times even in compact mode', () => {
    renderTaskCard({
      assignment: mockAssignment,
      task: mockTask,
      index: 0,
      viewMode: 'aide',
      compact: true
    });

    expect(screen.getByText('09:00 – 09:40')).toBeInTheDocument();
  });

  it('renders classroom chip with name and icon in Aide View', () => {
    renderTaskCard({
      assignment: mockAssignment,
      task: mockTask,
      index: 0,
      viewMode: 'aide'
    });

    expect(screen.getByText('5C')).toBeInTheDocument();
  });

  it('renders classroom chip even in compact mode', () => {
    renderTaskCard({
      assignment: mockAssignment,
      task: mockTask,
      index: 0,
      viewMode: 'aide',
      compact: true
    });

    expect(screen.getByText('5C')).toBeInTheDocument();
  });

  it('renders generic school icon when classroom is missing', () => {
    const taskNoClassroom = { ...mockTask, classroom: null, classroom_id: null };
    renderTaskCard({
      assignment: mockAssignment,
      task: taskNoClassroom,
      index: 0,
      viewMode: 'aide'
    });

    // Should still show something generic or fallback
    // We'll check for the generic icon logic in T003
  });

  it('renders task title, times, and aide names in Class View', () => {
    renderTaskCard({
      assignment: mockAssignment,
      task: mockTask,
      index: 0,
      viewMode: 'class',
      aideName: 'John Smith, Mary Johnson'
    });

    expect(screen.getByText('Reading Support')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 09:40')).toBeInTheDocument();
    expect(screen.getByText('John Smith, Mary Johnson')).toBeInTheDocument();
  });

  it('renders unassigned placeholder when no aide is assigned', () => {
    const unassignedAssignment = { ...mockAssignment, aide_id: null, status: 'UNASSIGNED' };
    renderTaskCard({
      assignment: unassignedAssignment,
      task: mockTask,
      index: 0,
      viewMode: 'class',
      aideName: undefined
    });

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });
});

