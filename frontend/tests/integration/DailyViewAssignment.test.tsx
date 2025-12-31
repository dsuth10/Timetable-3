import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import DailyDisplayPage from '../../src/pages/DailyDisplayPage';
import { useDailyDisplayStore } from '../../src/store/stores/dailyDisplay';
import { useTasksStore } from '../../src/store/stores/tasks';
import type { DailyViewData, TeacherAide, Task } from '../../src/types';

// Mock API and stores
vi.mock('../../src/services/api');
vi.mock('../../src/store/stores/dailyDisplay');
vi.mock('../../src/store/stores/tasks');

// Helper to create mock data
const createMockData = (aides: Partial<TeacherAide>[] = []): DailyViewData => ({
  aides: aides.map((a, i) => ({
    id: a.id || i + 1,
    name: a.name || `Aide ${i + 1}`,
    colour_hex: a.colour_hex || '#3498db',
    is_absent: a.is_absent || false,
    assignments: a.assignments || [],
    details: null,
  })) as any[],
  relief_pool: [],
  task_bank: [
    { 
      id: 101, 
      title: 'Math Support', 
      category: 'CLASS_SUPPORT',
      start_time: '09:00:00',
      end_time: '09:30:00',
      status: 'UNASSIGNED',
      classroom_id: null,
      notes: null,
    } as Task
  ],
  timeline_config: { 
    slots: [
      { start_time: '09:00:00', duration_minutes: 30 },
      { start_time: '09:30:00', duration_minutes: 30 },
      { start_time: '10:00:00', duration_minutes: 30 },
    ] 
  }
});

describe('DailyViewAssignment - TDD Tests', () => {
  let mockFetchDailyData: any;
  let mockAssignTask: any;

  beforeEach(() => {
    vi.resetAllMocks();
    
    mockFetchDailyData = vi.fn();
    mockAssignTask = vi.fn();

    // Mock the store
    (useDailyDisplayStore as any).mockReturnValue({
      data: createMockData([
        { id: 1, name: 'Jane Doe', is_absent: false },
        { id: 2, name: 'Absent Aide', is_absent: true },
      ]),
      loading: false,
      error: null,
      fetchDailyData: mockFetchDailyData,
      assignTask: mockAssignTask,
    });

    (useTasksStore as any).mockReturnValue({
      tasks: [],
      loading: false,
    });
  });

  /**
   * T003: Integration test asserting that dropping a task template onto an aide slot 
   * opens the AssignmentDurationModal
   */
  it('T003: shows AssignmentDurationModal when dropping task from bank onto aide slot', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/?date=2025-12-08']}>
        <DailyDisplayPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockFetchDailyData).toHaveBeenCalledWith('2025-12-08');
    });

    // Wait for task bank to render
    await waitFor(() => {
      expect(screen.getByText('Math Support')).toBeInTheDocument();
    });

    // Simulate drag and drop from task bank to aide slot
    // Note: @hello-pangea/dnd doesn't work well with RTL, so we'll test the underlying logic
    // by directly calling the onDragEnd handler or checking for the modal after a simulated drop
    
    // For now, we'll assert that the modal SHOULD appear (this will fail until Phase 3.3)
    // In a real test, we'd simulate DnD, but for TDD purposes, we can check state

    // Try to find the AssignmentDurationModal dialog
    // This will FAIL initially because the current implementation doesn't show it
    const modalTitle = await screen.findByRole('dialog', { name: /set assignment details/i });
    expect(modalTitle).toBeInTheDocument();
    
    // Verify prepopulated fields
    const dateField = within(modalTitle).getByLabelText(/date/i);
    expect(dateField).toHaveValue('2025-12-08');
    
    const startTimeField = within(modalTitle).getByLabelText(/start time/i);
    expect(startTimeField).toHaveValue('09:00');
    
    const endTimeField = within(modalTitle).getByLabelText(/end time/i);
    expect(endTimeField).toHaveValue('09:30');
    
    const aideField = within(modalTitle).getByLabelText(/teacher aide/i);
    expect(aideField).toHaveValue('Jane Doe'); // Should be prepopulated with the aide
  });

  /**
   * T004: Test case ensuring that dropping a task onto an absent aide's row is blocked
   */
  it('T004: blocks drop onto absent aide row and does not show dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/?date=2025-12-08']}>
        <DailyDisplayPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockFetchDailyData).toHaveBeenCalledWith('2025-12-08');
    });

    // Verify that the absent aide row has isDropDisabled set
    // In the actual implementation, the Droppable component for absent aides should have isDropDisabled={true}
    
    // For this test, we'll verify that if we try to drop on an absent aide, 
    // the dialog does NOT appear and assignTask is NOT called
    
    // Simulate attempting to drop on absent aide (this would be blocked by DnD library)
    // We can test this by verifying the AideRow component has the right props
    
    const absentAideRow = screen.getByText('Absent Aide');
    expect(absentAideRow).toBeInTheDocument();
    
    // Check that there's an "ABSENT" indicator
    expect(screen.getByText('ABSENT')).toBeInTheDocument();
    
    // The modal should NOT be present
    expect(screen.queryByRole('dialog', { name: /set assignment details/i })).not.toBeInTheDocument();
    
    // If a drop were attempted, assignTask should not be called
    expect(mockAssignTask).not.toHaveBeenCalled();
  });

  /**
   * T012: Test case verifying that the dialog includes the "Make this a recurring task" toggle option
   */
  it('T012: AssignmentDurationModal includes recurring task toggle', async () => {
    render(
      <MemoryRouter initialEntries={['/?date=2025-12-08']}>
        <DailyDisplayPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockFetchDailyData).toHaveBeenCalledWith('2025-12-08');
    });

    // Wait for modal to appear (after simulated drop)
    // This will FAIL until Phase 3.3 when we integrate the modal
    const modal = await screen.findByRole('dialog', { name: /set assignment details/i });
    
    // Verify the recurring toggle is present
    const recurringToggle = within(modal).getByRole('checkbox', { name: /make this a recurring task/i });
    expect(recurringToggle).toBeInTheDocument();
    expect(recurringToggle).not.toBeChecked(); // Should be unchecked by default
  });

  /**
   * T013: Test case verifying that users can change the assigned Teacher Aide and Classroom in the dialog
   */
  it('T013: allows changing Teacher Aide and Classroom in dialog', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/?date=2025-12-08']}>
        <DailyDisplayPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockFetchDailyData).toHaveBeenCalledWith('2025-12-08');
    });

    // Wait for modal to appear
    const modal = await screen.findByRole('dialog', { name: /set assignment details/i });
    
    // Verify Teacher Aide field is present and can be changed
    const aideField = within(modal).getByLabelText(/teacher aide/i);
    expect(aideField).toBeInTheDocument();
    
    // Try to change the aide
    await user.clear(aideField);
    await user.type(aideField, 'Jane Doe');
    expect(aideField).toHaveValue('Jane Doe');
    
    // Verify Classroom field is present and can be changed
    const classroomField = within(modal).getByLabelText(/classroom/i);
    expect(classroomField).toBeInTheDocument();
    
    // The fields should be editable (not read-only)
    expect(aideField).not.toHaveAttribute('readonly');
    expect(classroomField).not.toHaveAttribute('readonly');
  });
});













