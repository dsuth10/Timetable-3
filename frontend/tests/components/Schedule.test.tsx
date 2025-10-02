import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Schedule from '../../src/pages/Schedule';
import { vi } from 'vitest';
vi.mock('../../src/services/assignmentsApi');
import { assignmentsApi } from '../../src/services/assignmentsApi';
import { assignmentsApi } from '../../src/services/assignmentsApi';
import { useAidesStore } from '../../src/store/stores/aides';
import { useTasksStore } from '../../src/store/stores/tasks';

vi.mock('../../src/services/assignmentsApi');

describe('Schedule', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Seed aides/tasks stores
    const aidesStore = useAidesStore.getState();
    aidesStore.aides = [
      { id: 1, name: 'A1', colour_hex: '#000' } as any,
      { id: 2, name: 'A2', colour_hex: '#111' } as any,
    ];
    const tasksStore = useTasksStore.getState();
    tasksStore.tasks = [] as any;
  });

  it('renders weekly matrix tasks into grid', async () => {
    (assignmentsApi.weeklyMatrix as any).mockResolvedValueOnce({
      assignments: [
        { id: 10, task_id: 100, aide_id: 1, date: '2025-10-01', start_time: '09:00:00', end_time: '09:30:00', status: 'ASSIGNED', version: 1 },
      ],
    });
    (assignmentsApi.unassigned as any).mockResolvedValueOnce([]);

    render(<Schedule />);
    expect(await screen.findByText(/Task #100/)).toBeInTheDocument();
  });
});


