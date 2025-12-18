import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuickCreateTaskModal } from '../../src/components/TimetableGrid/QuickCreateTaskModal';
import * as tasksApi from '../../src/services/tasksApi';

// Mock the API service
vi.mock('../../src/services/tasksApi', () => ({
  quickCreateTask: vi.fn(),
}));

describe('QuickCreateTaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  
  const defaultProps = {
    open: true,
    date: '2025-01-27',
    startTime: '10:00:00',
    duration: 30,
    aideId: 1,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when open is false', () => {
    const { container } = render(
      <QuickCreateTaskModal {...defaultProps} open={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog when open is true', () => {
    render(<QuickCreateTaskModal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/create task/i)).toBeInTheDocument();
  });

  it('displays locked start time', () => {
    render(<QuickCreateTaskModal {...defaultProps} startTime="10:00:00" />);
    
    const startTimeField = screen.getByLabelText(/start time/i);
    expect(startTimeField).toBeDisabled();
    expect(startTimeField).toHaveValue('10:00:00');
  });

  it('pre-fills duration based on slot length', () => {
    render(<QuickCreateTaskModal {...defaultProps} duration={15} />);
    
    const durationField = screen.getByLabelText(/duration/i);
    expect(durationField).toHaveValue('15');
  });

  it('defaults to 30 minutes for slots >= 30 minutes', () => {
    render(<QuickCreateTaskModal {...defaultProps} duration={45} />);
    
    const durationField = screen.getByLabelText(/duration/i);
    expect(durationField).toHaveValue('30'); // Defaults to 30 for >= 30 min slots
  });

  it('shows duration options in 5-minute increments', () => {
    render(<QuickCreateTaskModal {...defaultProps} />);
    
    const durationField = screen.getByLabelText(/duration/i);
    fireEvent.mouseDown(durationField);
    
    // Check for 5-minute increment options
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('requires title field', async () => {
    render(<QuickCreateTaskModal {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    
    expect(tasksApi.quickCreateTask).not.toHaveBeenCalled();
  });

  it('requires category selection', async () => {
    render(<QuickCreateTaskModal {...defaultProps} />);
    
    // Fill title but not category
    const titleField = screen.getByLabelText(/title/i);
    fireEvent.change(titleField, { target: { value: 'Test Task' } });
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
    });
    
    expect(tasksApi.quickCreateTask).not.toHaveBeenCalled();
  });

  it('calls API with correct payload on submit', async () => {
    const mockQuickCreateTask = vi.mocked(tasksApi.quickCreateTask);
    mockQuickCreateTask.mockResolvedValue({
      task: { id: 1, title: 'Test Task', category: 'CLASS_SUPPORT' },
      assignment: { id: 1, task_id: 1, aide_id: 1 },
    });

    render(<QuickCreateTaskModal {...defaultProps} />);
    
    // Fill form
    const titleField = screen.getByLabelText(/title/i);
    fireEvent.change(titleField, { target: { value: 'Test Task' } });
    
    const categoryField = screen.getByLabelText(/category/i);
    fireEvent.mouseDown(categoryField);
    fireEvent.click(screen.getByText('Class Support'));
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockQuickCreateTask).toHaveBeenCalledWith({
        title: 'Test Task',
        category: 'CLASS_SUPPORT',
        date: '2025-01-27',
        start_time: '10:00:00',
        duration_minutes: 30,
        aide_id: 1,
        classroom_id: undefined,
        notes: undefined,
      });
    });
  });

  it('calls onSuccess and onClose after successful creation', async () => {
    const mockQuickCreateTask = vi.mocked(tasksApi.quickCreateTask);
    mockQuickCreateTask.mockResolvedValue({
      task: { id: 1, title: 'Test Task', category: 'CLASS_SUPPORT' },
      assignment: { id: 1, task_id: 1, aide_id: 1 },
    });

    render(<QuickCreateTaskModal {...defaultProps} />);
    
    // Fill and submit form
    const titleField = screen.getByLabelText(/title/i);
    fireEvent.change(titleField, { target: { value: 'Test Task' } });
    
    const categoryField = screen.getByLabelText(/category/i);
    fireEvent.mouseDown(categoryField);
    fireEvent.click(screen.getByText('Class Support'));
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockQuickCreateTask).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        task: { id: 1, title: 'Test Task', category: 'CLASS_SUPPORT' },
        assignment: { id: 1, task_id: 1, aide_id: 1 },
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('displays error message on API failure', async () => {
    const mockQuickCreateTask = vi.mocked(tasksApi.quickCreateTask);
    mockQuickCreateTask.mockRejectedValue({
      response: {
        status: 409,
        data: { error: 'Conflict', message: 'Assignment conflicts with existing assignment' },
      },
    });

    render(<QuickCreateTaskModal {...defaultProps} />);
    
    // Fill and submit form
    const titleField = screen.getByLabelText(/title/i);
    fireEvent.change(titleField, { target: { value: 'Test Task' } });
    
    const categoryField = screen.getByLabelText(/category/i);
    fireEvent.mouseDown(categoryField);
    fireEvent.click(screen.getByText('Class Support'));
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/conflict/i)).toBeInTheDocument();
    });
    
    // Modal should remain open on error
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<QuickCreateTaskModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<QuickCreateTaskModal {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
  });

  it('preserves form data on error', async () => {
    const mockQuickCreateTask = vi.mocked(tasksApi.quickCreateTask);
    mockQuickCreateTask.mockRejectedValue({
      response: {
        status: 400,
        data: { error: 'Bad request', message: 'Invalid data' },
      },
    });

    render(<QuickCreateTaskModal {...defaultProps} />);
    
    // Fill form
    const titleField = screen.getByLabelText(/title/i);
    fireEvent.change(titleField, { target: { value: 'Test Task' } });
    
    const notesField = screen.getByLabelText(/notes/i);
    fireEvent.change(notesField, { target: { value: 'Test notes' } });
    
    // Submit and get error
    const categoryField = screen.getByLabelText(/category/i);
    fireEvent.mouseDown(categoryField);
    fireEvent.click(screen.getByText('Class Support'));
    
    const submitButton = screen.getByRole('button', { name: /create/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockQuickCreateTask).toHaveBeenCalled();
    });
    
    // Form data should be preserved
    expect(titleField).toHaveValue('Test Task');
    expect(notesField).toHaveValue('Test notes');
  });
});











