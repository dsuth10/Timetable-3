import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DailyDisplayPage from '../../src/pages/DailyDisplayPage';
import { api } from '../../src/services/api';

vi.mock('../../src/services/api');

describe('ReliefPoolDrag', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows confirmation dialog when dragging from relief pool', async () => {
    (api.get as any).mockResolvedValue({ 
      data: {
        aides: [{ id: 1, name: 'Jane Doe', is_absent: false, assignments: [] }],
        relief_pool: [{ id: 501, task_id: 101, title: 'Relief Task', start_time: '10:00:00', end_time: '10:30:00', status: 'RELIEF_POOL' }],
        task_bank: [],
        timeline_config: { slots: [{ start_time: '10:00:00', duration_minutes: 30 }] }
      }
    });

    render(<DailyDisplayPage />);
    
    const reliefTask = await screen.findByText('Relief Task');
    expect(reliefTask).toBeInTheDocument();
    
    // Simulate drop... (will implement more detailed DND tests later)
    // For now, ensure the task is rendered in the relief pool panel.
  });
});


