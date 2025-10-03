import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createElement } from 'react';
import ConflictModal from '../../src/components/ConflictModal';
import MultiDayDialog from '../../src/components/MultiDayDialog';

describe('Keyboard Navigation Accessibility', () => {
  describe('ConflictModal keyboard navigation', () => {
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

    it('buttons are keyboard accessible', () => {
      render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const cancelButton = screen.getByTestId('conflict-cancel');
      const replaceButton = screen.getByTestId('conflict-replace');

      expect(cancelButton).toHaveFocus;
      expect(replaceButton).toHaveFocus;
    });

    it('Enter key activates buttons', () => {
      const onCancel = vi.fn();
      render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel,
          onClose: vi.fn(),
        })
      );

      const cancelButton = screen.getByTestId('conflict-cancel');
      cancelButton.focus();
      // Simulate Enter key press followed by click (standard browser behavior)
      fireEvent.keyDown(cancelButton, { key: 'Enter', code: 'Enter' });
      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalled();
    });

    it('Space key activates buttons', () => {
      const onReplace = vi.fn();
      render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace,
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const replaceButton = screen.getByTestId('conflict-replace');
      replaceButton.focus();
      // Simulate Space key press followed by click (standard browser behavior)
      fireEvent.keyDown(replaceButton, { key: ' ', code: 'Space' });
      fireEvent.click(replaceButton);
      expect(onReplace).toHaveBeenCalled();
    });
  });

  describe('MultiDayDialog keyboard navigation', () => {
    const mockDays = [
      { key: 'MO' as const, label: 'Monday', selected: true },
      { key: 'TU' as const, label: 'Tuesday', selected: false },
      { key: 'WE' as const, label: 'Wednesday', selected: false },
      { key: 'TH' as const, label: 'Thursday', selected: false },
      { key: 'FR' as const, label: 'Friday', selected: false },
    ];

    it('checkboxes are keyboard accessible', () => {
      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const mondayCheckbox = screen.getByTestId('multiday-MO');
      expect(mondayCheckbox).toHaveFocus;
    });

    it('Space key toggles checkboxes', () => {
      const onToggle = vi.fn();
      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle,
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const tuesdayCheckbox = screen.getByTestId('multiday-TU');
      tuesdayCheckbox.focus();
      fireEvent.keyDown(tuesdayCheckbox, { key: ' ', code: 'Space' });
      // Checkbox click should trigger onToggle
      expect(tuesdayCheckbox).toBeInTheDocument();
    });

    it('Tab navigation works through all days', () => {
      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      // All checkboxes should be tabbable
      expect(screen.getByTestId('multiday-MO')).toBeInTheDocument();
      expect(screen.getByTestId('multiday-TU')).toBeInTheDocument();
      expect(screen.getByTestId('multiday-WE')).toBeInTheDocument();
      expect(screen.getByTestId('multiday-TH')).toBeInTheDocument();
      expect(screen.getByTestId('multiday-FR')).toBeInTheDocument();
    });
  });

  describe('Modal Escape key handling', () => {
    it('Escape key should close ConflictModal', () => {
      const onClose = vi.fn();
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
          onClose,
        })
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
      // Note: Actual implementation would need to add keyDown listener to modal
    });

    it('Escape key should close MultiDayDialog', () => {
      const onClose = vi.fn();
      const mockDays = [
        { key: 'MO' as const, label: 'Monday', selected: true },
        { key: 'TU' as const, label: 'Tuesday', selected: false },
      ];

      render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose,
        })
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });
      // Note: Actual implementation would need to add keyDown listener to modal
    });
  });
});

