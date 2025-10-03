import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConflictModal from '../../src/components/ConflictModal';

describe('ConflictModal', () => {
  const mockConflicts = [
    {
      existing_assignment_id: 1,
      task_id: 101,
      date: '2025-10-06',
      start_time: '09:00:00',
      end_time: '10:00:00',
      status: 'ASSIGNED',
    },
    {
      existing_assignment_id: 2,
      task_id: 102,
      date: '2025-10-06',
      start_time: '10:00:00',
      end_time: '11:00:00',
      status: 'ASSIGNED',
    },
  ];

  it('does not render when open is false', () => {
    const { container } = render(
      <ConflictModal
        open={false}
        conflicts={mockConflicts}
        onReplace={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders conflict details when open is true', () => {
    render(
      <ConflictModal
        open={true}
        conflicts={mockConflicts}
        onReplace={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Assignment Conflict')).toBeInTheDocument();
    // Use getAllByText for multiple matches
    const dateElements = screen.getAllByText(/2025-10-06/);
    expect(dateElements.length).toBeGreaterThan(0);
    expect(screen.getByText(/assignment #1/)).toBeInTheDocument();
    expect(screen.getByText(/assignment #2/)).toBeInTheDocument();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConflictModal
        open={true}
        conflicts={mockConflicts}
        onReplace={vi.fn()}
        onCancel={onCancel}
        onClose={vi.fn()}
      />
    );

    const cancelButton = screen.getByTestId('conflict-cancel');
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onReplace when Replace button is clicked', () => {
    const onReplace = vi.fn();
    render(
      <ConflictModal
        open={true}
        conflicts={mockConflicts}
        onReplace={onReplace}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const replaceButton = screen.getByTestId('conflict-replace');
    fireEvent.click(replaceButton);
    expect(onReplace).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ConflictModal
        open={true}
        conflicts={mockConflicts}
        onReplace={vi.fn()}
        onCancel={vi.fn()}
        onClose={onClose}
      />
    );

    const closeButton = screen.getByTestId('conflict-close');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays multiple conflicts correctly', () => {
    render(
      <ConflictModal
        open={true}
        conflicts={mockConflicts}
        onReplace={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const conflictItems = screen.getAllByRole('listitem');
    expect(conflictItems).toHaveLength(2);
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <ConflictModal
        open={true}
        conflicts={mockConflicts}
        onReplace={vi.fn()}
        onCancel={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});

