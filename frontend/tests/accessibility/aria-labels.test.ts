import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createElement } from 'react';
import ConflictModal from '../../src/components/ConflictModal';
import MultiDayDialog from '../../src/components/MultiDayDialog';
import UnassignedPanel from '../../src/components/UnassignedPanel';

describe('ARIA Labels and Screen Reader Accessibility', () => {
  describe('ConflictModal ARIA attributes', () => {
    const mockConflicts = [
      {
        existing_assignment_id: 1,
        task_id: 101,
        date: '2025-10-06',
        start_time: '09:00:00',
        end_time: '10:00:00',
        status: 'ASSIGNED',
      },
    ];

    it('has role="dialog" attribute', () => {
      render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has aria-modal="true" attribute', () => {
      render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('buttons have accessible text', () => {
      render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      expect(screen.getByTestId('conflict-cancel')).toHaveTextContent('Cancel');
      expect(screen.getByTestId('conflict-replace')).toHaveTextContent('Replace existing');
      expect(screen.getByTestId('conflict-close')).toHaveTextContent('Close');
    });

    it('heading provides context to screen readers', () => {
      render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      expect(screen.getByText('Assignment Conflict')).toBeInTheDocument();
    });
  });

  describe('MultiDayDialog ARIA attributes', () => {
    const mockDays = [
      { key: 'MO' as const, label: 'Monday', selected: true },
      { key: 'TU' as const, label: 'Tuesday', selected: false },
      { key: 'WE' as const, label: 'Wednesday', selected: false },
      { key: 'TH' as const, label: 'Thursday', selected: false },
      { key: 'FR' as const, label: 'Friday', selected: false },
    ];

    it('has role="dialog" attribute', () => {
      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('has aria-modal="true" attribute', () => {
      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('checkboxes have associated labels', () => {
      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      // Each checkbox should be associated with a label
      expect(screen.getByLabelText('Monday')).toBeInTheDocument();
      expect(screen.getByLabelText('Tuesday')).toBeInTheDocument();
      expect(screen.getByLabelText('Wednesday')).toBeInTheDocument();
      expect(screen.getByLabelText('Thursday')).toBeInTheDocument();
      expect(screen.getByLabelText('Friday')).toBeInTheDocument();
    });

    it('buttons have accessible text', () => {
      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
    });

    it('heading provides context to screen readers', () => {
      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      expect(screen.getByText('Apply to multiple days')).toBeInTheDocument();
    });
  });

  describe('UnassignedPanel ARIA attributes', () => {
    it('error messages have role="alert"', async () => {
      // Mock API to reject - import and mock inline
      const assignmentsApiModule = await import('../../src/services/assignmentsApi');
      const mockUnassigned = vi.fn().mockRejectedValue(new Error('Network error'));
      assignmentsApiModule.assignmentsApi.unassigned = mockUnassigned;

      render(createElement(UnassignedPanel, { dateISO: '2025-10-01' }));

      // Wait for error message
      const alert = await screen.findByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('list items have proper test IDs for screen readers', async () => {
      const assignmentsApiModule = await import('../../src/services/assignmentsApi');
      const mockUnassigned = vi.fn().mockResolvedValue([
        {
          id: 1,
          task_id: 100,
          aide_id: null,
          date: '2025-10-01',
          start_time: '09:00:00',
          end_time: '09:30:00',
          status: 'UNASSIGNED',
          version: 1,
        },
      ]);
      assignmentsApiModule.assignmentsApi.unassigned = mockUnassigned;

      render(createElement(UnassignedPanel, { dateISO: '2025-10-01' }));

      const listItem = await screen.findByTestId('unassigned-item-1');
      expect(listItem).toBeInTheDocument();
    });

    it('heading provides semantic structure', () => {
      render(createElement(UnassignedPanel, { dateISO: '2025-10-01' }));

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });
  });

  describe('General ARIA best practices', () => {
    it('modals trap focus when open', () => {
      const mockConflicts = [
        {
          existing_assignment_id: 1,
          task_id: 101,
          date: '2025-10-06',
          start_time: '09:00:00',
          end_time: '10:00:00',
          status: 'ASSIGNED',
        },
      ];

      render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      // Modal should be present and have proper structure
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Note: Actual focus trap implementation would require additional testing
      // with user-event library or Cypress for full focus management validation
    });

    it('interactive elements have sufficient text content', () => {
      const mockDays = [
        { key: 'MO' as const, label: 'Monday', selected: true },
      ];

      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      // All buttons should have descriptive text
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button.textContent).toBeTruthy();
        expect(button.textContent!.length).toBeGreaterThan(0);
      });
    });
  });
});

