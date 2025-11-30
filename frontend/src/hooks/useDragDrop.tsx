import { useCallback, useRef, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { assignmentsApi } from '../services/assignmentsApi';
import ConflictModal from '../components/ConflictModal';
import AssignmentDurationModal from '../components/TaskModals/AssignmentDurationModal';
import { useUndoStore } from '../store/stores/undoStore';
import { useTasksStore } from '../store/stores/tasks'; // Import tasks store
import { isAideAvailable, getAvailabilityInfo } from '../utils/availabilityUtils';
import type { TeacherAide, Task } from '../types';
import { calculateDuration, addMinutesToTime, timeToMinutes, END_TIME_MINUTES } from '../components/TimetableGrid/timeUtils';

type UseDragDropOptions = {
  onSuccess?: () => void;
  aides?: TeacherAide[];
};

type PendingAssignment = {
  type: 'create' | 'update';
  task: Task;
  assignmentId?: number;
  currentAssignment?: any;
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

export function useDragDrop(options?: UseDragDropOptions) {
  const [conflicts, setConflicts] = useState<{
    conflicts: any[];
    errorMessage?: string | null;
    assignmentId?: number; // Optional now
    taskId?: number; // Add taskId for conflicts during creation
    destAideId: number | null;
    updatePayload?: any;
    createPayload?: any; // Add create payload
  } | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<PendingAssignment | null>(null);
  const { execute } = useUndoStore();
  const { tasks } = useTasksStore(); // Get tasks from store
  const aides = options?.aides || [];

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
    if (!destination) return;

    const isTaskTemplate = draggableId.startsWith('task-');
    const isAssignment = draggableId.startsWith('asg-');

    if (!isTaskTemplate && !isAssignment) return;

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
      // Parse format: "aide-{id}-date-{date}-time-{HH:MM}" or "aide-{id}-date-{date}"
      const parts = destDroppableId.split('-');
      if (parts.length >= 4) {
        destAideId = Number(parts[1]);
        const dateIndex = parts.indexOf('date');
        const timeIndex = parts.indexOf('time');
        
        if (timeIndex !== -1 && timeIndex > dateIndex) {
          // Has time component
          destDate = parts.slice(dateIndex + 1, timeIndex).join('-');
          destTime = parts[timeIndex + 1]; // HH:MM format
        } else {
          // No time component (old format)
          destDate = parts.slice(dateIndex + 1).join('-');
        }
      }
    } else {
      // Fallback for old format (just aide ID)
      destAideId = Number(destDroppableId);
    }
    
    // Validate destination aide ID if not unassigned
    if (destAideId !== null && !Number.isFinite(destAideId)) return;
    
    // Skip if dropped in same location (only for assignments)
    if (isAssignment && sourceDroppableId === destDroppableId) return;

    // --- VALIDATION ---
    // Validate availability if assigning to an aide
    if (destAideId !== null && destDate) {
      // ... (same availability validation logic as before) ...
      const aide = aides.find(a => a.id === destAideId);
      if (!aide) {
        console.error('Aide not found:', destAideId);
        return;
      }
      
      const availability = aide.availability || [];
      
      if (availability.length === 0) {
        const weekday = new Date(destDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
        const errorMessage = `Cannot assign: No availability set for ${aide.name} on ${weekday}`;
        window.dispatchEvent(new CustomEvent('app:error', { detail: { message: errorMessage } }));
        return;
      }
      
      if (destTime) {
        // For validation, we need start and end time. 
        // If it's a task template, we know the duration.
        // If it's an assignment, we need to fetch it or know its duration.
        let duration = 30; // default fallback
        
        if (isTaskTemplate) {
            const taskId = Number(draggableId.replace('task-', ''));
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                duration = calculateDuration(task.start_time, task.end_time);
            }
        } else {
             // For assignments, we'll validate optimistically or fetch first?
             // The original code fetched assignment later. We can defer precise time check or do it after fetch.
             // Let's proceed and let the loop check handle basic availability, but strict time check needs end time.
             // We'll defer precise check for assignments until we have the object.
        }

        // Only validate here if we have duration (Task Template)
        if (isTaskTemplate) {
             const endTime = addMinutesToTime(destTime, duration);
             const isAvailable = isAideAvailable(
              availability,
              destDate,
              destTime + ':00',
              endTime + ':00'
            );
            
            if (!isAvailable) {
                // ... (error message logic) ...
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

        // Calculate default times - always use 30 minutes as default duration
        let startTime: string;
        let endTime: string;

        if (destTime) {
            // Dropped on specific time slot
            startTime = destTime + ':00';
            endTime = addMinutesToTime(destTime, 30) + ':00'; // Default 30 minutes
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

    // Parse source aide ID, date, and time (same as before)
    // ... (existing parsing logic) ...
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

    // Calculate default times for modal
    let startTime: string;
    let endTime: string;

    if (destTime) {
      // Dropped on specific time slot - default to 30 minutes
      startTime = destTime + ':00';
      endTime = addMinutesToTime(destTime, 30) + ':00';
    } else {
      // No specific time slot, preserve current duration
      const currentDuration = calculateDuration(currentAssignment.start_time, currentAssignment.end_time);
      startTime = currentAssignment.start_time;
      endTime = currentAssignment.end_time;
    }

    // Use destDate if available, otherwise keep current date
    const targetDate = destDate || currentAssignment.date;

    // Show modal for user to confirm/edit times
    setPendingAssignment({
      type: 'update',
      task: task,
      assignmentId: assignmentId,
      currentAssignment: currentAssignment,
      initialData: {
        aideId: destAideId,
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
  }, [execute, debouncedUpdate, options, aides, tasks]); // Add aides and tasks to dependencies

  // Handle modal confirmation
  const handleModalConfirm = useCallback(async (data: {
    aideId: number | null;
    date: string;
    startTime: string;
    endTime: string;
  }) => {
    if (!pendingAssignment) return;

    const { type, task, assignmentId, currentAssignment, sourceData } = pendingAssignment;

    // Validate end time doesn't exceed working hours
    if (timeToMinutes(data.endTime.slice(0, 5)) > END_TIME_MINUTES) {
      window.dispatchEvent(new CustomEvent('app:error', { 
        detail: { message: 'Cannot assign task: end time would exceed working hours (15:00)' } 
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

    // All validations passed - now clear pending state to dismiss modal
    setPendingAssignment(null);

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

      await execute({
        id: `create-assignment-${task.id}-${data.aideId}-${Date.now()}`,
        description: `Assign ${task.title} to ${data.aideId} on ${data.date}`,
        async do() {
          try {
            await assignmentsApi.create(createPayload);
            options?.onSuccess?.();
          } catch (e: any) {
            if (e?.status === 409) {
              setConflicts({
                conflicts: e?.data?.conflicts || [],
                errorMessage: e?.data?.error || null,
                taskId: task.id,
                destAideId: data.aideId,
                createPayload: createPayload
              });
            } else {
              throw e;
            }
          }
        },
        async undo() {
          console.warn("Undo for creation not fully implemented (missing ID capture)");
          options?.onSuccess?.();
        }
      });
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
      await execute({
        id: `move-${assignmentId}-${sourceData?.aideId ?? 'unassigned'}-${sourceData?.date ?? 'any'}-${sourceData?.time ?? 'any'}-to-${data.aideId ?? 'unassigned'}-${data.date ?? 'any'}-${data.startTime.slice(0, 5) ?? 'any'}-${Date.now()}`,
        description: `Move assignment ${assignmentId} from ${sourceData?.aideId ?? 'unassigned'} to ${data.aideId ?? 'unassigned'}${data.date ? ` on ${data.date}` : ''}${timeDescription}`,
        async do() {
          try {
            await debouncedUpdate(`asg-${assignmentId}`, async () => {
              await assignmentsApi.update(assignmentId, updatePayload);
            });
            options?.onSuccess?.();
          } catch (e: any) {
            if (e?.status === 409) {
              setConflicts({
                conflicts: e?.data?.conflicts || [],
                errorMessage: e?.data?.error || null,
                assignmentId: assignmentId,
                destAideId: data.aideId,
                updatePayload: updatePayload
              });
            } else {
              throw e;
            }
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
          options?.onSuccess?.();
        },
      });
    }
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

  return { onDragEnd, ConflictUI, DurationModal };
}
