import { useCallback, useMemo, useRef, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { assignmentsApi } from '../services/assignmentsApi';
import { api } from '../services/api';
import ConflictModal from '../components/ConflictModal';
import { useUndoStore } from '../store/stores/undoStore';

export function useDragDrop() {
  const [conflicts, setConflicts] = useState<any[] | null>(null);
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

    const destAideId = Number(destination.droppableId);
    const sourceAideId = Number(source.droppableId);
    if (!Number.isFinite(destAideId)) return;

    // Wrap as undoable command
    await execute({
      id: `move-${assignmentId}-${sourceAideId}-to-${destAideId}-${Date.now()}`,
      description: `Move assignment ${assignmentId} ${sourceAideId} -> ${destAideId}`,
      async do() {
        try {
          // Debounce drag-triggered update to reduce API chatter
          await debouncedUpdate(`asg-${assignmentId}`, () => assignmentsApi.update(assignmentId, { aide_id: destAideId }));
        } catch (e: any) {
          if (e?.status === 409 && e?.data?.conflicts) {
            setConflicts({ conflicts: e.data.conflicts, assignmentId, destAideId });
          } else {
            throw e;
          }
        }
      },
      async undo() {
        await assignmentsApi.update(assignmentId, { aide_id: Number.isFinite(sourceAideId) ? sourceAideId : null });
      },
    });
  }, [execute, debouncedUpdate]);

  const ConflictUI = conflicts ? (
    <ConflictModal
      open={true}
      conflicts={(conflicts as any).conflicts || conflicts}
      onReplace={async () => {
        const details = conflicts as any;
        const list = (details.conflicts || []) as Array<{ existing_assignment_id: number }>;
        // Unassign conflicting assignments, then retry update
        for (const c of list) {
          await assignmentsApi.update(c.existing_assignment_id, { aide_id: null });
        }
        await assignmentsApi.update(details.assignmentId, { aide_id: details.destAideId });
        setConflicts(null);
      }}
      onCancel={() => setConflicts(null)}
      onClose={() => setConflicts(null)}
    />
  ) : null;

  return { onDragEnd, ConflictUI };
}


