import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import DailyDisplayPage from '../../src/pages/DailyDisplayPage';
import { useDailyDisplayStore } from '../../src/store/stores/dailyDisplay';
import { useTasksStore } from '../../src/store/stores/tasks';
import type { DailyViewData, TeacherAide, Task, Assignment } from '../../src/types';

// Mock API and stores
vi.mock('../../src/services/api');
vi.mock('../../src/store/stores/dailyDisplay');
vi.mock('../../src/store/stores/tasks');

const mockGridLines = [
  '08:50', '09:10', '09:40', '10:10', '10:40', 
  '11:10', '11:50', '12:20', '12:50', '13:20', 
  '14:00', '14:30', '15:00'
];

// Helper to create mock data with a gap
const createMockDataWithGap = (): DailyViewData => ({
  aides: [
    {
      id: 1,
      name: 'Bart Simpson',
      colour_hex: '#3498db',
      is_absent: false,
      assignments: [
        {
          id: 10,
          task_id: 101,
          aide_id: 1,
          date: '2025-12-29',
          start_time: '10:00:00',
          end_time: '10:40:00',
          status: 'ASSIGNED',
          version: 1,
          task: { title: 'Reading support for 3' }
        }
      ] as any[],
      details: null,
      availability: [
        { id: 1, aide_id: 1, weekday: 'MO', start_time: '09:40:00', end_time: '15:00:00' }
      ]
    }
  ] as any[],
  relief_pool: [],
  task_bank: [
    { 
      id: 201, 
      title: 'Math Support', 
      category: 'CLASS_SUPPORT',
      start_time: '09:00:00',
      end_time: '09:30:00',
      status: 'UNASSIGNED',
    } as Task
  ],
  timeline_config: { 
    slots: mockGridLines.slice(0, -1).map((start, i) => ({
      start_time: start + ':00',
      duration_minutes: 30 // Simplified
    }))
  }
});

describe('Snap-to-Gap Integration', () => {
  let mockFetchDailyData: any;

  beforeEach(() => {
    vi.resetAllMocks();
    mockFetchDailyData = vi.fn();

    (useDailyDisplayStore as any).mockReturnValue({
      data: createMockDataWithGap(),
      loading: false,
      error: null,
      fetchDailyData: mockFetchDailyData,
    });

    (useTasksStore as any).mockReturnValue({
      tasks: [
        { id: 201, title: 'Math Support', category: 'CLASS_SUPPORT' }
      ],
      loading: false,
    });
  });

  it('T003: snaps task times to fit gap (09:40-10:00) when dropped between Unavailable and Task', async () => {
    render(
      <MemoryRouter initialEntries={['/?date=2025-12-29']}>
        <DailyDisplayPage />
      </MemoryRouter>
    );

    // Wait for task bank to render
    await waitFor(() => {
      expect(screen.getByText('Math Support')).toBeInTheDocument();
    });

    // In a real browser, we'd trigger DnD. In vitest, we'll check if the 
    // hook logic (which we'll implement) results in the modal showing 09:40-10:00.
    // This will FAIL initially as the modal won't show or will show 09:10-09:40 (default slot).
    
    const modal = await screen.findByRole('dialog', { name: /set assignment details/i });
    expect(modal).toBeInTheDocument();
    
    const startTimeField = within(modal).getByLabelText(/start time/i);
    expect(startTimeField).toHaveValue('09:40');
    
    const endTimeField = within(modal).getByLabelText(/end time/i);
    expect(endTimeField).toHaveValue('10:00');
  });

  it('should highlight the gap when hovering over a valid slot', async () => {
    render(
      <MemoryRouter initialEntries={['/?date=2025-12-29']}>
        <DailyDisplayPage />
      </MemoryRouter>
    );

    // This will FAIL initially as GapHighlight isn't rendered or is generic
    const highlight = screen.queryByTestId('gap-highlight');
    // Simulate hover (this depends on @hello-pangea/dnd state which is hard to mock in RTL)
    // But we can check if the component is conditionally rendered.
  });
});

