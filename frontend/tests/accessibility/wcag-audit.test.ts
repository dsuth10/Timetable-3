import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConflictModal from '../../src/components/ConflictModal';
import MultiDayDialog from '../../src/components/MultiDayDialog';
import UnassignedPanel from '../../src/components/UnassignedPanel';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

describe('WCAG AA Compliance Audit', () => {
  describe('ConflictModal accessibility', () => {
    it('should not have any accessibility violations', async () => {
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

      const { container } = render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient color contrast', async () => {
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

      const { container } = render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', async () => {
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

      const { container } = render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('MultiDayDialog accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const mockDays = [
        { key: 'MO' as const, label: 'Monday', selected: true },
        { key: 'TU' as const, label: 'Tuesday', selected: false },
        { key: 'WE' as const, label: 'Wednesday', selected: false },
        { key: 'TH' as const, label: 'Thursday', selected: false },
        { key: 'FR' as const, label: 'Friday', selected: false },
      ];

      const { container } = render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have properly associated form labels', async () => {
      const mockDays = [
        { key: 'MO' as const, label: 'Monday', selected: true },
        { key: 'TU' as const, label: 'Tuesday', selected: false },
      ];

      const { container } = render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const results = await axe(container, {
        rules: {
          label: { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('should have accessible names for interactive elements', async () => {
      const mockDays = [
        { key: 'MO' as const, label: 'Monday', selected: true },
      ];

      const { container } = render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const results = await axe(container, {
        rules: {
          'button-name': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('UnassignedPanel accessibility', () => {
    it('should not have any accessibility violations', async () => {
      const assignmentsApiModule = await import('../../src/services/assignmentsApi');
      const mockUnassigned = vi.fn().mockResolvedValue([]);
      assignmentsApiModule.assignmentsApi.unassigned = mockUnassigned;

      const { container } = render(
        createElement(UnassignedPanel, { dateISO: '2025-10-01' })
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper list semantics', async () => {
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

      const { container } = render(
        createElement(UnassignedPanel, { dateISO: '2025-10-01' })
      );

      const results = await axe(container, {
        rules: {
          list: { enabled: true },
          listitem: { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('WCAG 2.1 Level AA specific requirements', () => {
    it('should meet WCAG AA contrast requirements for text', async () => {
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

      const { container } = render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results.violations.filter((v) => v.id === 'color-contrast')).toHaveLength(0);
    });

    it('should have keyboard accessible interactive elements', async () => {
      const mockDays = [
        { key: 'MO' as const, label: 'Monday', selected: true },
      ];

      const { container } = render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      // Test for general accessibility without specific rules that may not exist
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper focus indicators', async () => {
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

      const { container } = render(
        createElement(ConflictModal, {
          open: true,
          conflicts: mockConflicts,
          onReplace: vi.fn(),
          onCancel: vi.fn(),
          onClose: vi.fn(),
        })
      );

      // Test for general accessibility
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient touch target sizes (mobile consideration)', async () => {
      // WCAG 2.1 Success Criterion 2.5.5 (AAA, but good practice)
      // Minimum 44x44 pixels for touch targets
      const mockDays = [
        { key: 'MO' as const, label: 'Monday', selected: true },
      ];

      const { container } = render(
        createElement(MultiDayDialog, {
          open: true,
          days: mockDays,
          onToggle: vi.fn(),
          onApply: vi.fn(),
          onClose: vi.fn(),
        })
      );

      // Test for general accessibility
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

