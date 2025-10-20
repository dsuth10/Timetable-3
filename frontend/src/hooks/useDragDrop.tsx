import { useCallback, useRef, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { assignmentsApi } from '../services/assignmentsApi';
import ConflictModal from '../components/ConflictModal';
import { useUndoStore } from '../store/stores/undoStore';
import { calculateDuration, addMinutesToTime, timeToMinutes, END_HOUR } from '../components/TimetableGrid/timeUtils';

type UseDragDropOptions = {
  onSuccess?: () => void;
};

export function useDragDrop(options?: UseDragDropOptions) {
  const [conflicts, setConflicts] = useState<{
    conflicts: any[];
    errorMessage?: string | null;
    assignmentId: number;
    destAideId: number | null;
    updatePayload: any;
  } | null>(null);
  const { execute } = useUndoStore();

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

    // Expect draggableId like "asg-<id>"
    const idStr = draggableId.replace('asg-', '');
    const assignmentId = Number(idStr);
    if (!Number.isFinite(assignmentId)) return;

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
    
    // Parse source aide ID, date, and time
    let sourceAideId: number | null = null;
    let sourceDate: string | null = null;
    let sourceTime: string | null = null;
    
    if (sourceDroppableId === 'unassigned') {
      sourceAideId = null;
    } else if (sourceDroppableId.startsWith('aide-') && sourceDroppableId.includes('-date-')) {
      // Parse format: "aide-{id}-date-{date}-time-{HH:MM}" or "aide-{id}-date-{date}"
      const parts = sourceDroppableId.split('-');
      if (parts.length >= 4) {
        sourceAideId = Number(parts[1]);
        const dateIndex = parts.indexOf('date');
        const timeIndex = parts.indexOf('time');
        
        if (timeIndex !== -1 && timeIndex > dateIndex) {
          // Has time component
          sourceDate = parts.slice(dateIndex + 1, timeIndex).join('-');
          sourceTime = parts[timeIndex + 1]; // HH:MM format
        } else {
          // No time component (old format)
          sourceDate = parts.slice(dateIndex + 1).join('-');
        }
      }
    } else {
      // Fallback for old format (just aide ID)
      sourceAideId = Number(sourceDroppableId);
    }
    
    // Validate destination aide ID if not unassigned
    if (destAideId !== null && !Number.isFinite(destAideId)) return;
    
    // Skip if dropped in same location
    if (sourceDroppableId === destDroppableId) return;

    // Fetch the current assignment to get its version
    let currentAssignment;
    try {
      currentAssignment = await assignmentsApi.get(assignmentId);
    } catch (e) {
      console.error('Failed to fetch assignment:', e);
      return;
    }

    // Prepare update payload with version for optimistic locking
    const updatePayload: any = { 
      aide_id: destAideId,
      status: destAideId !== null ? 'ASSIGNED' : 'UNASSIGNED',
      version: currentAssignment.version 
    };
    
    // If date changed, include date in update
    if (destDate && sourceDate && destDate !== sourceDate) {
      updatePayload.date = destDate;
    }
    
    // Calculate new times if dropped in a time slot
    if (destTime) {
      // Calculate duration in minutes
      const duration = calculateDuration(currentAssignment.start_time, currentAssignment.end_time);
      
      // Set new start time (convert HH:MM to HH:MM:SS)
      updatePayload.start_time = destTime + ':00';
      
      // Calculate new end time by adding duration
      const newEndTime = addMinutesToTime(destTime, duration);
      updatePayload.end_time = newEndTime + ':00';
      
      // Validate end time doesn't exceed working hours (17:00)
      if (timeToMinutes(newEndTime) > END_HOUR * 60) {
        console.error('Cannot drop task: end time would exceed working hours (17:00)');
        // TODO: Show user-friendly error message
        return;
      }
    }

    // Wrap as undoable command
    const timeDescription = destTime ? ` at ${destTime}` : '';
    await execute({
      id: `move-${assignmentId}-${sourceAideId || 'unassigned'}-${sourceDate || 'any'}-${sourceTime || 'any'}-to-${destAideId || 'unassigned'}-${destDate || 'any'}-${destTime || 'any'}-${Date.now()}`,
      description: `Move assignment ${assignmentId} from ${sourceAideId || 'unassigned'} to ${destAideId || 'unassigned'}${destDate ? ` on ${destDate}` : ''}${timeDescription}`,
      async do() {
        try {
          // Debounce drag-triggered update to reduce API chatter
          await debouncedUpdate(`asg-${assignmentId}`, async () => {
            await assignmentsApi.update(assignmentId, updatePayload);
          });
          // Refresh data after successful update
          options?.onSuccess?.();
        } catch (e: any) {
          if (e?.status === 409) {
            setConflicts({
              conflicts: e?.data?.conflicts || [],
              errorMessage: e?.data?.error || null,
              assignmentId: assignmentId,
              destAideId: destAideId,
              updatePayload: updatePayload
            });
          } else {
            throw e;
          }
        }
      },
      async undo() {
        // Fetch the latest version for undo
        const latestAssignment = await assignmentsApi.get(assignmentId);
        const undoPayload: any = { 
          aide_id: sourceAideId,
          status: sourceAideId !== null ? 'ASSIGNED' : 'UNASSIGNED',
          version: latestAssignment.version
        };
        
        // Restore original date if it changed
        if (sourceDate && destDate && sourceDate !== destDate) {
          undoPayload.date = sourceDate;
        }
        
        // Restore original times if they changed
        if (destTime) {
          undoPayload.start_time = currentAssignment.start_time;
          undoPayload.end_time = currentAssignment.end_time;
        }
        
        await assignmentsApi.update(assignmentId, undoPayload);
        // Refresh data after undo
        options?.onSuccess?.();
      },
    });
  }, [execute, debouncedUpdate, options]);

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
        // Retry the original assignment update
        const targetAssignment = await assignmentsApi.get(conflicts.assignmentId);
        await assignmentsApi.update(conflicts.assignmentId, { 
          ...conflicts.updatePayload,
          version: targetAssignment.version
        });
        setConflicts(null);
        options?.onSuccess?.();
      }}
      onCancel={() => setConflicts(null)}
      onClose={() => setConflicts(null)}
    />
  ) : null;

  return { onDragEnd, ConflictUI };
}


