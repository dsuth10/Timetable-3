import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MultiDayDialog from '../../src/components/MultiDayDialog';

describe('MultiDayDialog', () => {
  const mockDays = [
    { key: 'MO' as const, label: 'Monday', selected: true },
    { key: 'TU' as const, label: 'Tuesday', selected: false },
    { key: 'WE' as const, label: 'Wednesday', selected: true },
    { key: 'TH' as const, label: 'Thursday', selected: false },
    { key: 'FR' as const, label: 'Friday', selected: false },
  ];

  it('does not render when open is false', () => {
    const { container } = render(
      <MultiDayDialog
        open={false}
        days={mockDays}
        onToggle={vi.fn()}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all days when open is true', () => {
    render(
      <MultiDayDialog
        open={true}
        days={mockDays}
        onToggle={vi.fn()}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Apply to multiple days')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('Tuesday')).toBeInTheDocument();
    expect(screen.getByText('Wednesday')).toBeInTheDocument();
    expect(screen.getByText('Thursday')).toBeInTheDocument();
    expect(screen.getByText('Friday')).toBeInTheDocument();
  });

  it('displays checkboxes with correct selected state', () => {
    render(
      <MultiDayDialog
        open={true}
        days={mockDays}
        onToggle={vi.fn()}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const mondayCheckbox = screen.getByTestId('multiday-MO') as HTMLInputElement;
    const tuesdayCheckbox = screen.getByTestId('multiday-TU') as HTMLInputElement;
    const wednesdayCheckbox = screen.getByTestId('multiday-WE') as HTMLInputElement;

    expect(mondayCheckbox.checked).toBe(true);
    expect(tuesdayCheckbox.checked).toBe(false);
    expect(wednesdayCheckbox.checked).toBe(true);
  });

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    render(
      <MultiDayDialog
        open={true}
        days={mockDays}
        onToggle={onToggle}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const tuesdayCheckbox = screen.getByTestId('multiday-TU');
    fireEvent.click(tuesdayCheckbox);
    expect(onToggle).toHaveBeenCalledWith('TU');
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <MultiDayDialog
        open={true}
        days={mockDays}
        onToggle={vi.fn()}
        onApply={vi.fn()}
        onClose={onClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onApply with selected days when Apply button is clicked', () => {
    const onApply = vi.fn();
    render(
      <MultiDayDialog
        open={true}
        days={mockDays}
        onToggle={vi.fn()}
        onApply={onApply}
        onClose={vi.fn()}
      />
    );

    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);
    expect(onApply).toHaveBeenCalledWith(['MO', 'WE']);
  });

  it('has proper ARIA attributes for accessibility', () => {
    render(
      <MultiDayDialog
        open={true}
        days={mockDays}
        onToggle={vi.fn()}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('renders all 5 checkboxes for weekdays', () => {
    render(
      <MultiDayDialog
        open={true}
        days={mockDays}
        onToggle={vi.fn()}
        onApply={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('multiday-MO')).toBeInTheDocument();
    expect(screen.getByTestId('multiday-TU')).toBeInTheDocument();
    expect(screen.getByTestId('multiday-WE')).toBeInTheDocument();
    expect(screen.getByTestId('multiday-TH')).toBeInTheDocument();
    expect(screen.getByTestId('multiday-FR')).toBeInTheDocument();
  });
});

