import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnassignedPanel from '../../src/components/UnassignedPanel';
import { assignmentsApi } from '../../src/services/assignmentsApi';

vi.mock('../../src/services/assignmentsApi');

describe('UnassignedPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders unassigned items', async () => {
    (assignmentsApi.unassigned as any).mockResolvedValueOnce([
      { id: 1, task_id: 100, date: '2025-10-01', start_time: '09:00:00', end_time: '09:30:00' },
      { id: 2, task_id: 101, date: '2025-10-01', start_time: '10:00:00', end_time: '10:30:00' },
    ]);

    render(<UnassignedPanel dateISO={'2025-10-01'} />);
    expect(await screen.findByText(/task #100/)).toBeInTheDocument();
    expect(screen.getByText(/task #101/)).toBeInTheDocument();
  });
});


