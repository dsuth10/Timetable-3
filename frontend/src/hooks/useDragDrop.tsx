import { useCallback, useMemo, useRef, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { assignmentsApi } from '../services/assignmentsApi';
import { tasksApi } from '../services/tasksApi'; // Import tasksApi
import { reliefPoolApi } from '../services/reliefPoolApi';
import ConflictModal from '../components/ConflictModal';
import AssignmentDurationModal from '../components/TaskModals/AssignmentDurationModal';
import { useUndoStore } from '../store/stores/undoStore';
import { useTasksStore } from '../store/stores/tasks';
import { useUiStore } from '../store/stores/uiStore'; // Import uiStore
import { useReliefPoolStore } from '../store/stores/reliefPool';
import { isAideAvailable, getAvailabilityInfo } from '../utils/availabilityUtils';
import type { TeacherAide, Task, ReliefPoolTask, Absence, AideWithStatus, Weekday } from '../types';
import { useTimeUtils } from '../components/TimetableGrid/timeUtils';
import { calculateGaps, findSmallGap } from '../utils/gapUtils';

type UseDragDropOptions = {
  onSuccess?: () => void;
  aides?: TeacherAide[];
  defaultDate?: string; // Fallback date for Daily View (when date not in droppableId)
  onClassroomDrop?: (data: {
    aideId: number;
    classroomId: number;
    date: string;
    time: string;
    duration: number;
  }) => void;
};

type PendingAssignment = {
  type: 'create' | 'update' | 'relief-pool-reassign';
  task: Task;
  assignmentId?: number;
  currentAssignment?: any;
  reliefPoolTask?: ReliefPoolTask; // For relief pool reassignment
  initialData: {
    aideId: number | null;
    date: string;
    startTime: string;
    endTime: string;
  };
  sourceData?: {
    aideId: number | null;
    date: string | null;
    time: string | null;
  };
};

// Helper function to calculate default duration based on time slot
// Calculates actual duration from SCHEDULE_SEGMENTS instead of hardcoding


export function useDragDrop(options?: UseDragDropOptions) {
  const {
    generateTimeSlots,
    getSegmentForTime,
    calculateDuration,
    timeToMinutes,
    addMinutesToTime,
    endTimeMinutes: END_TIME_MINUTES,
    minutesToTime
  } = useTimeUtils();

  const [conflicts, setConflicts] = useState<{
    conflicts: any[];
    errorMessage?: string | null;
    assignmentId?: number;
    taskId?: number;
    destAideId: number | null;
    updatePayload?: any;
    createPayload?: any;
  } | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null);
  const { execute } = useUndoStore();
  const { tasks } = useTasksStore();
  const { selectedClassId } = useUiStore(); // Get selectedClassId

  const getDefaultDuration = useCallback((time: string | null): number => {
    if (!time) return 30; // Fallback
    const segment = getSegmentForTime(time);
    if (segment) {
      return calculateDuration(segment.start, segment.end);
    }
    return 30; // Fallback if segment not found
  }, [getSegmentForTime, calculateDuration]);

  const aides = options?.aides || [];

  const gridLines = useMemo(() => {
    const slots = generateTimeSlots();
    const lines = slots.map(s => s.substring(0, 5));
    // Add the end time of the last slot
    const lastSlot = slots[slots.length - 1];
    if (lastSlot) {
      const segment = getSegmentForTime(lastSlot);
      if (segment) {
        lines.push(segment.end);
      }
    }
    return lines;
  }, [generateTimeSlots, getSegmentForTime]);

  const getSnappedTimes = useCallback((aideId: number, date: string, time: string, fallbackDuration: number) => {
    const aide = aides.find(a => a.id === aideId) as AideWithStatus;
    if (!aide) return { startTime: time + ':00', endTime: addMinutesToTime(time, fallbackDuration) + ':00' };

    const segment = getSegmentForTime(time);
    if (!segment) return { startTime: time + ':00', endTime: addMinutesToTime(time, fallbackDuration) + ':00' };

    const slotStartMins = timeToMinutes(time);
    const slotEndMins = timeToMinutes(segment.end);

    const mockAbsences: Absence[] = aide.is_absent ? [{ id: 0, aide_id: aide.id, date: date }] : [];

    // Defensive check for aide.assignments
    const gaps = calculateGaps(aide.assignments || [], mockAbsences, gridLines, aide.id, date, aide.availability);

    // Find first gap that overlaps with the slot [slotStartMins, slotEndMins)
    // The key is that even if the gap doesn't start at slotStartMins (e.g. 1:25 instead of 1:20),
    // we want to pick it up if it's within the slot boundaries.
    const targetGap = gaps.find(g => {
      if (!g || !g.start_time || !g.end_time) return false;
      const gapStartMins = timeToMinutes(g.start_time);
      const gapEndMins = timeToMinutes(g.end_time);
      return gapStartMins < slotEndMins && gapEndMins > slotStartMins;
    });

    if (targetGap) {
      return {
        startTime: targetGap.start_time + ':00',
        endTime: targetGap.end_time + ':00'
      };
    }

    return {
      startTime: time + ':00',
      endTime: addMinutesToTime(time, fallbackDuration) + ':00'
    };
  }, [aides, gridLines]);

  // Debounce map for drag-triggered updates (per-assignment key)
  const pendingTimersRef = useRef<Record<string, any>>({});
  const debouncedUpdate = useCallback(
    async (key: string, fn: () => Promise<void>) => {
      return await new Promise<void>((resolve, reject) => {
        const pending = pendingTimersRef.current[key];
        if (pending) {
          clearTimeout(pending);
        }
        pendingTimersRef.current[key] = setTimeout(async () => {
          try {
            await fn();
            resolve();
          } catch (e) {
            reject(e);
          } finally {
            delete pendingTimersRef.current[key];
          }
        }, 150);
      });
    },
    []
  );

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) {
      return;
    }

    const isTaskTemplate = draggableId.startsWith('task-');
    const isAssignment = draggableId.startsWith('asg-');
    const isTeacherAide = draggableId.startsWith('aide-') && !draggableId.includes('date');
    const isReliefPool = draggableId.startsWith('relief-pool-');

    if (!isTaskTemplate && !isAssignment && !isTeacherAide && !isReliefPool) {
      return;
    }

    // Handle destination - could be aide-date-time, aide-date, or unassigned
    const destDroppableId = destination.droppableId;
    const sourceDroppableId = source.droppableId;

    // Parse destination aide ID, date, and time
    let destAideId: number | null = null;
    let destDate: string | null = null;
    let destTime: string | null = null;

    if (destDroppableId === 'unassigned') {
      destAideId = null;
    } else if (destDroppableId.startsWith('aide-') && destDroppableId.includes('-date-')) {
      const parts = destDroppableId.split('-');
      if (parts.length >= 4) {
        destAideId = Number(parts[1]);
        const dateIndex = parts.indexOf('date');
        const timeIndex = parts.indexOf('time');

        if (timeIndex !== -1 && timeIndex > dateIndex) {
          destDate = parts.slice(dateIndex + 1, timeIndex).join('-');
          destTime = parts[timeIndex + 1];
        } else {
          destDate = parts.slice(dateIndex + 1).join('-');
        }
      }
    } else if (destDroppableId.startsWith('aide-') && destDroppableId.includes('-slot-')) {
      const parts = destDroppableId.split('-');
      if (parts.length >= 4) {
        destAideId = Number(parts[1]);
        const slotIndex = parts.indexOf('slot');
        if (slotIndex !== -1) {
          const timeStr = parts.slice(slotIndex + 1).join('-');
          destTime = timeStr.substring(0, 5);
          destDate = options?.defaultDate || null;
        }
      }
    } else {
      destAideId = Number(destDroppableId);
    }

    console.log('[useDragDrop] Parsed destination', { destAideId, destDate, destTime });

    // Validate destination aide ID if not unassigned
    if (destAideId !== null && !Number.isFinite(destAideId)) {
      console.log('[useDragDrop] Invalid destAideId');
      return;
    }

    // Helper to check for small gaps and show error
    const checkForSmallGap = (aideId: number, checkDate: string | null, time: string): boolean => {
      if (!checkDate) return false;
      const aide = aides.find(a => a.id === aideId) as AideWithStatus;
      if (!aide || !aide.assignments) return false;

      // Filter assignments for the specific date
      const dateAssignments = aide.assignments.filter(asg => asg.date === checkDate);
      const isSmallGap = findSmallGap(dateAssignments, gridLines, time);
      if (isSmallGap) {
        window.dispatchEvent(new CustomEvent('app:error', {
          detail: { message: 'All tasks need to be at least 10 minutes wide.' }
        }));
        return true;
      }
      return false;
    };

    // Skip if dropped in same location (only for assignments)
    if (isAssignment && sourceDroppableId === destDroppableId) return;

    // --- VALIDATION ---
    // Validate availability if assigning to an aide (and not in Class View where destAideId might be 0)
    // In Class View, destAideId is 0. But if isTeacherAide, the aide ID comes from Source.
    // If isAssignment or isTaskTemplate, we use destAideId.

    let targetAideId = destAideId;
    if (isTeacherAide) {
      targetAideId = Number(draggableId.replace('aide-', ''));
    }

    if (targetAideId !== null && destDate && targetAideId !== 0) {
      // ... (same availability validation logic as before) ...
      const aide = aides.find(a => a.id === targetAideId);
      if (!aide) {
        // Only error if we really expected an aide (ignore if 0/dummy)
        if (targetAideId !== 0) console.error('Aide not found:', targetAideId);
        // If 0, we continue (Class View logic will handle it)
      } else {
        // Check if aide is absent (T008: Block drops on absent aides)
        if ((aide as any).is_absent) {
          const errorMessage = `Cannot assign: ${aide.name} is marked as absent for this date`;
          window.dispatchEvent(new CustomEvent('app:error', { detail: { message: errorMessage } }));
          return;
        }

        const availability = aide.availability || [];

        // Only validate availability if we have availability data AND destTime
        if (availability.length > 0 && destTime) {
          // Use default duration based on time slot (20 minutes for 8:50, 30 for others)
          // This ensures availability validation matches the default duration that will be used
          const duration = getDefaultDuration(destTime);

          // Only validate here if we have duration (Task Template or Aide)
          if (isTaskTemplate || isTeacherAide) {
            const endTime = addMinutesToTime(destTime, duration);
            const isAvailable = isAideAvailable(
              availability,
              destDate,
              destTime + ':00',
              endTime + ':00'
            );

            if (!isAvailable) {
              const availabilityInfo = getAvailabilityInfo(availability, destDate);
              const aideName = aide.name;
              const weekday = availabilityInfo.weekday;

              let errorMessage: string;
              if (!availabilityInfo.hasAvailability) {
                errorMessage = `Cannot assign: No availability set for ${aideName} on ${weekday}`;
              } else if (availabilityInfo.timeWindow) {
                errorMessage = `Cannot assign: ${aideName} is only available ${availabilityInfo.timeWindow.start.slice(0, 5)}-${availabilityInfo.timeWindow.end.slice(0, 5)} on ${weekday}`;
              } else {
                errorMessage = `Cannot assign: ${aideName} is not available at this time`;
              }

              window.dispatchEvent(new CustomEvent('app:error', { detail: { message: errorMessage } }));
              return;
            }
          }
        }
      }
    }

    // --- HANDLE TEACHER AIDE DROP ---
    if (isTeacherAide) {
      console.log('Dropping Teacher Aide:', draggableId, 'to', destDroppableId);
      const sourceAideId = Number(draggableId.replace('aide-', ''));

      if (!destDate || !destTime) {
        console.warn('Missing destDate or destTime', { destDate, destTime });
        return; // Must drop on a time slot
      }
      if (!selectedClassId) {
        console.error('No class selected');
        window.dispatchEvent(new CustomEvent('app:error', { detail: { message: 'No class selected' } }));
        return;
      }

      // Check if onClassroomDrop callback is provided (Feature: Task Selection Modal)
      if (options?.onClassroomDrop) {
        const defaultDuration = getDefaultDuration(destTime);
        options.onClassroomDrop({
          aideId: sourceAideId,
          classroomId: selectedClassId,
          date: destDate,
          time: destTime,
          duration: defaultDuration
        });
        return;
      }

      // Create One-Off Task (Legacy Fallback)
      try {
        const defaultDuration = getDefaultDuration(destTime);
        const { startTime, endTime } = getSnappedTimes(sourceAideId, destDate, destTime, defaultDuration);

        console.log('Creating one-off task...', { startTime, endTime, selectedClassId });

        const task = await tasksApi.createOneOff({
          title: 'Class Support',
          category: 'CLASS_SUPPORT',
          start_time: startTime,
          end_time: endTime,
          classroom_id: selectedClassId
        });

        console.log('Task created:', task);

        setPendingAssignment({
          type: 'create',
          task: task,
          initialData: {
            aideId: sourceAideId,
            date: destDate,
            startTime: startTime,
            endTime: endTime,
          },
        });
      } catch (e: any) {
        console.error('Failed to create task:', e);
        window.dispatchEvent(new CustomEvent('app:error', { detail: { message: e.message || 'Failed to create task' } }));
      }
      return;
    }

    // --- HANDLE RELIEF POOL TASK DROP ---
    if (isReliefPool) {
      const assignmentId = Number(draggableId.replace('relief-pool-', ''));
      if (!Number.isFinite(assignmentId)) return;

      // If dropped back to relief-pool or unassigned, ignore
      if (destDroppableId === 'relief-pool' || destDroppableId === 'unassigned') {
        return;
      }

      // Must have destination date and aide
      if (!destDate || destAideId === null) {
        window.dispatchEvent(new CustomEvent('app:error', {
          detail: { message: 'Relief Pool tasks must be assigned to an aide on a specific date' }
        }));
        return;
      }

      // Fetch the Relief Pool task to get its original date
      const reliefPoolStore = useReliefPoolStore.getState();
      const reliefTask = reliefPoolStore.tasks.find(t => t.id === assignmentId);

      if (!reliefTask) {
        window.dispatchEvent(new CustomEvent('app:error', {
          detail: { message: 'Relief Pool task not found' }
        }));
        return;
      }

      // DATE RESTRICTION: Relief Pool tasks can only be assigned on their original date
      if (destDate !== reliefTask.date) {
        window.dispatchEvent(new CustomEvent('app:error', {
          detail: { message: `This task can only be assigned on ${reliefTask.date} (the original absence date)` }
        }));
        return;
      }

      // Calculate times - preserve original duration
      let startTime = reliefTask.start_time;
      let endTime = reliefTask.end_time;

      if (destTime && destDate && destAideId !== null) {
        // Check for small gap first
        if (checkForSmallGap(destAideId, destDate, destTime)) return;

        // --- GAP SNAPPING ---
        const originalDuration = calculateDuration(reliefTask.start_time, reliefTask.end_time);
        const snapped = getSnappedTimes(destAideId, destDate, destTime, originalDuration);
        startTime = snapped.startTime;
        endTime = snapped.endTime;
      }

      // Show modal for user to confirm/edit times (preserving original duration)
      setPendingAssignment({
        type: 'relief-pool-reassign',
        task: reliefTask.task,
        assignmentId: assignmentId,
        reliefPoolTask: reliefTask,
        initialData: {
          aideId: destAideId,
          date: destDate,
          startTime: startTime,
          endTime: endTime,
        },
      });
      return;
    }

    // --- HANDLE TASK TEMPLATE DROP ---
    if (isTaskTemplate) {
      const taskId = Number(draggableId.replace('task-', ''));
      if (!Number.isFinite(taskId)) return;

      // If dropped back to unassigned, do nothing
      if (destDroppableId === 'unassigned') return;

      if (!destDate || destAideId === null) {
        return; // Must have date and aide
      }

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Calculate default times - use 20 minutes for 8:50 slot, 30 minutes for others
      let startTime: string;
      let endTime: string;

      if (destTime && destDate && destAideId !== null) {
        // Check for small gap first
        if (checkForSmallGap(destAideId, destDate, destTime)) return;

        // --- GAP SNAPPING ---
        const defaultDuration = getDefaultDuration(destTime);
        const snapped = getSnappedTimes(destAideId, destDate, destTime, defaultDuration);
        startTime = snapped.startTime;
        endTime = snapped.endTime;
      } else {
        // No specific time, use current task times or defaults
        startTime = '09:00:00';
        endTime = '09:30:00';
      }

      // Show modal for user to confirm/edit times
      setPendingAssignment({
        type: 'create',
        task: task,
        initialData: {
          aideId: destAideId,
          date: destDate,
          startTime: startTime,
          endTime: endTime,
        },
      });
      return;
    }

    // --- HANDLE EXISTING ASSIGNMENT DROP ---
    const assignmentId = Number(draggableId.replace('asg-', ''));
    if (!Number.isFinite(assignmentId)) return;

    // Parse source aide ID, date, and time
    let sourceAideId: number | null = null;
    let sourceDate: string | null = null;
    let sourceTime: string | null = null;

    if (sourceDroppableId === 'unassigned') {
      sourceAideId = null;
    } else if (sourceDroppableId.startsWith('aide-') && sourceDroppableId.includes('-date-')) {
      const parts = sourceDroppableId.split('-');
      if (parts.length >= 4) {
        sourceAideId = Number(parts[1]);
        const dateIndex = parts.indexOf('date');
        const timeIndex = parts.indexOf('time');
        if (timeIndex !== -1 && timeIndex > dateIndex) {
          sourceDate = parts.slice(dateIndex + 1, timeIndex).join('-');
          sourceTime = parts[timeIndex + 1];
        } else {
          sourceDate = parts.slice(dateIndex + 1).join('-');
        }
      }
    } else {
      sourceAideId = Number(sourceDroppableId);
    }

    // If dropped on Unassigned/Task Bank -> DELETE (no modal needed)
    if (destDroppableId === 'unassigned') {
      // Fetch before delete for undo support
      const currentAssignment = await assignmentsApi.get(assignmentId);
      await execute({
        id: `delete-assignment-${assignmentId}-${Date.now()}`,
        description: `Delete assignment ${assignmentId}`,
        async do() {
          await assignmentsApi.delete(assignmentId);
          options?.onSuccess?.();
        },
        async undo() {
          // Re-create the assignment
          await assignmentsApi.create({
            task_id: currentAssignment.task_id,
            aide_id: currentAssignment.aide_id,
            date: currentAssignment.date,
            start_time: currentAssignment.start_time,
            end_time: currentAssignment.end_time,
            status: currentAssignment.status as any
          });
          options?.onSuccess?.();
        }
      });
      return;
    }

    // Fetch the current assignment to get its details
    let currentAssignment;
    try {
      currentAssignment = await assignmentsApi.get(assignmentId);
    } catch (e) {
      console.error('Failed to fetch assignment:', e);
      return;
    }

    // Find the task for this assignment
    const task = tasks.find(t => t.id === currentAssignment.task_id);
    if (!task) {
      console.error('Task not found for assignment:', currentAssignment.task_id);
      return;
    }

    // Use destDate if available, otherwise keep current date
    const targetDate = destDate || currentAssignment.date;

    // Calculate default times for modal
    let startTime: string;
    let endTime: string;

    if (destTime) {
      // --- GAP SNAPPING ---
      const aideId = destAideId === 0 ? currentAssignment.aide_id : (destAideId ?? 0);

      if (aideId !== null) {
        // Check for small gap first
        if (checkForSmallGap(aideId, targetDate, destTime)) return;

        const snapped = getSnappedTimes(aideId, targetDate, destTime, 30);
        startTime = snapped.startTime;
        endTime = snapped.endTime;
      } else {
        startTime = destTime + ':00';
        endTime = addMinutesToTime(destTime, 30) + ':00';
      }
    } else {
      // No specific time slot, preserve current duration
      // const currentDuration = calculateDuration(currentAssignment.start_time, currentAssignment.end_time);
      startTime = currentAssignment.start_time;
      endTime = currentAssignment.end_time;
    }

    // Show modal for user to confirm/edit times
    // In Class View, destAideId is 0 (no aide context), so preserve the original aide
    setPendingAssignment({
      type: 'update',
      task: task,
      assignmentId: assignmentId,
      currentAssignment: currentAssignment,
      initialData: {
        aideId: destAideId === 0 ? currentAssignment.aide_id : destAideId,
        date: targetDate,
        startTime: startTime,
        endTime: endTime,
      },
      sourceData: {
        aideId: sourceAideId,
        date: sourceDate,
        time: sourceTime,
      },
    });
  }, [execute, debouncedUpdate, options, aides, tasks, selectedClassId]);

  // Handle modal confirmation
  const handleModalConfirm = useCallback(async (data: {
    aideId: number | null;
    date: string;
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
    selectedWeekdays?: Weekday[];
    numWeeks?: number;
  }) => {
    if (!pendingAssignment) return;

    const { type, task, assignmentId, currentAssignment, sourceData, reliefPoolTask } = pendingAssignment;

    const handleRecurrence = async (taskId: number) => {
      if (data.isRecurring && data.selectedWeekdays && data.numWeeks) {
        const expiresOn = new Date(data.date);
        expiresOn.setDate(expiresOn.getDate() + (data.numWeeks * 7));

        await tasksApi.update(taskId, {
          recurrence_rule: `FREQ=WEEKLY;BYDAY=${data.selectedWeekdays.join(',')}`,
          expires_on: expiresOn.toISOString().split('T')[0],
          aide_id: data.aideId,
          start_time: data.startTime,
          end_time: data.endTime,
          existing_assignment_date: data.date
        });
      }
    };

    // Validate end time doesn't exceed working hours
    if (timeToMinutes(data.endTime.slice(0, 5)) > END_TIME_MINUTES) {
      window.dispatchEvent(new CustomEvent('app:error', {
        detail: { message: `Cannot assign task: end time would exceed working hours (${minutesToTime(END_TIME_MINUTES)})` }
      }));
      return;
    }

    // Validate availability if assigning to an aide
    if (data.aideId !== null && data.date) {
      const aide = aides.find(a => a.id === data.aideId);
      if (!aide) {
        console.error('Aide not found:', data.aideId);
        return;
      }

      const availability = aide.availability || [];

      if (availability.length === 0) {
        const weekday = new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        const errorMessage = `Cannot assign: No availability set for ${aide.name} on ${weekday}`;
        window.dispatchEvent(new CustomEvent('app:error', { detail: { message: errorMessage } }));
        return;
      }

      const isAvailable = isAideAvailable(
        availability,
        data.date,
        data.startTime,
        data.endTime
      );

      if (!isAvailable) {
        const availabilityInfo = getAvailabilityInfo(availability, data.date);
        const aideName = aide.name;
        const weekday = availabilityInfo.weekday;

        let errorMessage: string;
        if (!availabilityInfo.hasAvailability) {
          errorMessage = `Cannot assign: No availability set for ${aideName} on ${weekday}`;
        } else if (availabilityInfo.timeWindow) {
          errorMessage = `Cannot assign: ${aideName} is only available ${availabilityInfo.timeWindow.start.slice(0, 5)}-${availabilityInfo.timeWindow.end.slice(0, 5)} on ${weekday}`;
        } else {
          errorMessage = `Cannot assign: ${aideName} is not available at this time`;
        }

        window.dispatchEvent(new CustomEvent('app:error', { detail: { message: errorMessage } }));
        return;
      }
    }

    // Execute the operation
    if (type === 'create') {
      const createPayload = {
        task_id: task.id,
        aide_id: data.aideId,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        status: 'ASSIGNED' as const,
        version: 1,
      };

      try {
        await execute({
          id: `create-assignment-${task.id}-${data.aideId}-${Date.now()}`,
          description: `Assign ${task.title} to ${data.aideId} on ${data.date}`,
          async do() {
            try {
              await assignmentsApi.create(createPayload);
              await handleRecurrence(task.id);
              // Note: Task already exists in store from initial creation, no need to add again
            } catch (e: any) {
              if (e?.status === 409) {
                setConflicts({
                  conflicts: e?.data?.conflicts || [],
                  errorMessage: e?.data?.error || null,
                  taskId: task.id,
                  destAideId: data.aideId,
                  createPayload: createPayload
                });
                // Stop execution, but don't rethrow - we handled the conflict UI
                // Wait, if we stop here, the modal remains open (which is good for conflict resolution).
                // But if we don't rethrow, execute considers it a success?
                // We want modal to stay open. 
                // setConflicts will trigger ConflictUI.
                // pendingAssignment is still true.
                // handleModalConfirm finishes.
                // setPendingAssignment(null) is at the end of handleModalConfirm.
                // We need to PREVENT setPendingAssignment(null) if conflict found.
                throw e; // Rethrow to stop handleModalConfirm from reaching setPendingAssignment(null)
              } else {
                throw e;
              }
            }

            // Refresh data (ignore errors to prevent rollback of creation)
            try {
              await options?.onSuccess?.();
            } catch (err) {
              console.error('Refresh failed after assignment creation:', err);
            }
          },
          async undo() {
            console.warn("Undo for creation not fully implemented (missing ID capture)");
            options?.onSuccess?.();
          }
        });
      } catch (error: any) {
        // Handle errors that aren't conflicts (conflicts are handled above)
        if (error?.status !== 409) {
          const errorMessage = error?.message || error?.data?.error || 'Failed to create assignment';
          window.dispatchEvent(new CustomEvent('app:error', { detail: { message: errorMessage } }));
        }
        // Don't clear pendingAssignment if there's a conflict (modal should stay open)
        if (error?.status !== 409) {
          setPendingAssignment(null);
        }
        return; // Exit early to prevent clearing pendingAssignment below
      }
    } else if (type === 'update' && assignmentId && currentAssignment) {
      const updatePayload: any = {
        aide_id: data.aideId,
        date: data.date,
        start_time: data.startTime,
        end_time: data.endTime,
        status: data.aideId !== null ? 'ASSIGNED' : 'UNASSIGNED',
        version: currentAssignment.version
      };

      const timeDescription = data.startTime ? ` at ${data.startTime.slice(0, 5)}` : '';
      try {
        await execute({
          id: `move-${assignmentId}-${sourceData?.aideId ?? 'unassigned'}-${sourceData?.date ?? 'any'}-${sourceData?.time ?? 'any'}-to-${data.aideId ?? 'unassigned'}-${data.date ?? 'any'}-${data.startTime.slice(0, 5) ?? 'any'}-${Date.now()}`,
          description: `Move assignment ${assignmentId} from ${sourceData?.aideId ?? 'unassigned'} to ${data.aideId ?? 'unassigned'}${data.date ? ` on ${data.date}` : ''}${timeDescription}`,
          async do() {
            try {
              await debouncedUpdate(`asg-${assignmentId}`, async () => {
                await assignmentsApi.update(assignmentId, updatePayload);
                await handleRecurrence(task.id);
              });
            } catch (e: any) {
              if (e?.status === 409) {
                setConflicts({
                  conflicts: e?.data?.conflicts || [],
                  errorMessage: e?.data?.error || null,
                  assignmentId: assignmentId,
                  destAideId: data.aideId,
                  updatePayload: updatePayload
                });
                throw e; // Rethrow to keep modal open
              } else {
                throw e;
              }
            }

            // Refresh data (ignore errors to prevent rollback of update)
            try {
              await options?.onSuccess?.();
            } catch (err) {
              console.error('Refresh failed after assignment update:', err);
            }
          },
          async undo() {
            const latestAssignment = await assignmentsApi.get(assignmentId);
            const undoPayload: any = {
              aide_id: sourceData?.aideId ?? null,
              date: sourceData?.date ?? currentAssignment.date,
              start_time: currentAssignment.start_time,
              end_time: currentAssignment.end_time,
              status: (sourceData?.aideId ?? null) !== null ? 'ASSIGNED' : 'UNASSIGNED',
              version: latestAssignment.version
            };

            await assignmentsApi.update(assignmentId, undoPayload);
            try {
              await options?.onSuccess?.();
            } catch (err) {
              console.error('Refresh failed after undo:', err);
            }
          },
        });
      } catch (error: any) {
        // Handle errors that aren't conflicts (conflicts are handled above)
        if (error?.status !== 409) {
          const errorMessage = error?.message || error?.data?.error || 'Failed to update assignment';
          window.dispatchEvent(new CustomEvent('app:error', { detail: { message: errorMessage } }));
        }
        // Don't clear pendingAssignment if there's a conflict (modal should stay open)
        if (error?.status !== 409) {
          setPendingAssignment(null);
        }
        return; // Exit early to prevent clearing pendingAssignment below
      }
    } else if (type === 'relief-pool-reassign' && assignmentId && reliefPoolTask) {
      // Handle Relief Pool task reassignment
      try {
        await reliefPoolApi.reassign(assignmentId, {
          aide_id: data.aideId!,
          start_time: data.startTime,
          end_time: data.endTime,
          version: reliefPoolTask.version,
        });

        await handleRecurrence(task.id);

        // Refresh the Relief Pool store
        const reliefPoolStore = useReliefPoolStore.getState();
        reliefPoolStore.fetch();

        // Refresh the main view
        options?.onSuccess?.();
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || error?.message || 'Failed to reassign task';
        window.dispatchEvent(new CustomEvent('app:error', {
          detail: { message: errorMessage }
        }));
        setPendingAssignment(null);
        return;
      }
    }

    // Clear pending state only after successful execution (or handled conflict)
    setPendingAssignment(null);
  }, [pendingAssignment, aides, execute, debouncedUpdate, options]);

  const ConflictUI = conflicts ? (
    <ConflictModal
      open={true}
      conflicts={conflicts.conflicts}
      errorMessage={conflicts.errorMessage}
      onReplace={async () => {
        // Unassign conflicting assignments
        for (const c of conflicts.conflicts) {
          const conflictingAssignment = await assignmentsApi.get(c.existing_assignment_id);
          await assignmentsApi.update(c.existing_assignment_id, {
            aide_id: null,
            version: conflictingAssignment.version
          });
        }

        // If we have an assignmentId (moving existing)
        if (conflicts.assignmentId && conflicts.updatePayload) {
          const targetAssignment = await assignmentsApi.get(conflicts.assignmentId);
          await assignmentsApi.update(conflicts.assignmentId, {
            ...conflicts.updatePayload,
            version: targetAssignment.version
          });
        }
        // If we have a taskId (creating new)
        else if (conflicts.taskId && conflicts.createPayload) {
          await assignmentsApi.create(conflicts.createPayload);
        }

        setConflicts(null);
        options?.onSuccess?.();
      }}
      onCancel={() => setConflicts(null)}
      onClose={() => setConflicts(null)}
    />
  ) : null;

  const DurationModal = pendingAssignment ? (
    <AssignmentDurationModal
      open={true}
      onClose={() => setPendingAssignment(null)}
      onConfirm={handleModalConfirm}
      task={pendingAssignment.task}
      aides={aides}
      initialData={pendingAssignment.initialData}
    />
  ) : null;

  return {
    onDragEnd,
    ConflictUI,
    DurationModal,
    setConflicts,
    setPendingAssignment
  };
}
