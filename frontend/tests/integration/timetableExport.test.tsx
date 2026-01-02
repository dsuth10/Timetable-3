import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// We'll mock the actual components if needed, but for TDD we just want to see it fail
// because exportTimetableToPdf hasn't been integrated into the component yet.

// Mock the service
vi.mock('../../src/services/pdfExportService', () => ({
  exportTimetableToPdf: vi.fn(),
}));

// Import the mocked service to check calls
import { exportTimetableToPdf } from '../../src/services/pdfExportService';
import Schedule from '../../src/pages/Schedule';

// Mock UI Store
vi.mock('../../src/store/stores/uiStore', () => ({
  useUiStore: () => ({
    selectedWeekStartISO: '2025-12-29',
    viewMode: 'AIDE',
    selectedClassId: null,
    setSelectedClassId: vi.fn(),
    setSelectedTimeSlot: vi.fn(),
    nextWeek: vi.fn(),
    prevWeek: vi.fn(),
    thisWeek: vi.fn(),
  }),
}));

// Mock Aides Store
vi.mock('../../src/store/stores/aides', () => ({
  useAidesStore: () => ({
    aides: [{ id: 1, name: 'John Doe', colour_hex: '#000000' }],
    fetchAides: vi.fn().mockResolvedValue([]),
  }),
}));

// Mock other stores
vi.mock('../../src/store/stores/tasks', () => ({
  useTasksStore: () => ({
    tasks: [],
    fetchTasks: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('../../src/store/stores/classrooms', () => ({
  useClassroomsStore: () => ({
    classrooms: [],
    fetchClassrooms: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('../../src/store/stores/absences', () => ({
  useAbsencesStore: () => ({
    byAide: {},
    listForAide: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('../../src/store/stores/assignments', () => ({
  useAssignmentsStore: () => ({
    assignments: [],
  }),
}));

vi.mock('../../src/store/stores/reliefPool', () => ({
  useReliefPoolStore: {
    getState: () => ({
      refresh: vi.fn(),
    }),
  },
}));

// Mock API
vi.mock('../../src/services/assignmentsApi', () => ({
  assignmentsApi: {
    weeklyMatrix: vi.fn().mockResolvedValue({ matrix: {} }),
  },
}));

describe('Timetable PDF Export Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should trigger frontend PDF export when "Export to PDF" is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/schedule?aideId=1']}>
        <Schedule />
      </MemoryRouter>
    );

    // Open the export menu
    const exportButton = await screen.findByRole('button', { name: /export/i });
    await userEvent.click(exportButton);

    // Click the PDF export option
    const pdfOption = await screen.findByText(/export to pdf/i);
    await userEvent.click(pdfOption);

    // This should FAIL because the current Schedule.tsx calls calendarApi.exportPdf,
    // not our new pdfExportService.exportTimetableToPdf.
    expect(exportTimetableToPdf).toHaveBeenCalled();
  });
});

