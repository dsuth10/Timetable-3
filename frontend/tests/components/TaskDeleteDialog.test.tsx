import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskDeleteDialog from '../../src/components/TaskModals/TaskDeleteDialog';
import type { Task, Assignment } from '../../src/types';

// Mock the API and store
vi.mock('../../src/services/assignmentsApi', () => ({
  assignmentsApi: {
    delete: vi.fn(),
    // We'll add the new method here in implement phase, but mock it for now
    deleteRecurringSeriesForAide: vi.fn().mockResolvedValue({ 
      would_delete_count: 3, 
      would_skip_count: 0 
    }),
  }
}));

vi.mock('../../src/store/stores/tasks', () => ({
  useTasksStore: Object.assign(
    vi.fn(() => ({
      deleteTask: vi.fn(),
    })),
    {
      getState: vi.fn(() => ({
        fetchTasks: vi.fn(),
      })),
    }
  )
}));

const mockTask: Task = {
  id: 101,
  title: 'Reading Support',
  category: 'CLASS_SUPPORT',
  recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO'
} as any;

const mockAssignment: Assignment = {
  id: 1,
  task_id: 101,
  aide_id: 1,
  date: '2025-10-06',
  start_time: '09:00:00',
  end_time: '10:00:00',
  status: 'ASSIGNED',
  recurring_series_id: 500,
  version: 1
} as any;

describe('TaskDeleteDialog', () => {
  it('shows the fourth option when assignment is part of a recurring series', async () => {
    render(
      <TaskDeleteDialog
        open={true}
        onClose={vi.fn()}
        task={mockTask}
        assignment={mockAssignment}
      />
    );

    // Should see the new option label
    expect(screen.getByText(/Remove this and future recurring instances for this aide/i)).toBeInTheDocument();
  });

  it('hides the fourth option when assignment is NOT part of a recurring series', async () => {
    const nonRecurringAssignment = { ...mockAssignment, recurring_series_id: null };
    
    render(
      <TaskDeleteDialog
        open={true}
        onClose={vi.fn()}
        task={mockTask}
        assignment={nonRecurringAssignment}
      />
    );

    // Should NOT see the new option label
    expect(screen.queryByText(/Remove this and future recurring instances for this aide/i)).not.toBeInTheDocument();
  });

  it('hides the fourth option when deleting from TaskBank (no assignment)', async () => {
    render(
      <TaskDeleteDialog
        open={true}
        onClose={vi.fn()}
        task={mockTask}
        assignment={null}
      />
    );

    expect(screen.queryByText(/Remove this and future recurring instances for this aide/i)).not.toBeInTheDocument();
  });

  it('displays the number of future assignments to be deleted when the option is visible', async () => {
    render(
      <TaskDeleteDialog
        open={true}
        onClose={vi.fn()}
        task={mockTask}
        assignment={mockAssignment}
      />
    );

    // Should show the count from the preview API call (3 total - 1 current = 2 more)
    await waitFor(() => {
      expect(screen.getByText(/Delete this and 2 more recurring assignments/i)).toBeInTheDocument();
    });
  });
});

