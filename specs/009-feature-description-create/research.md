
# Research: Snap-to-Gap Drag and Drop

## Decision 1: Gap Calculation Logic
- **Decision**: Implement gap calculation in the frontend `timeUtils.ts` or a new `gapUtils.ts`.
- **Rationale**: The frontend already has the necessary context (assignments, absences, and `SCHEDULE_SEGMENTS`) via stores. Doing it client-side allows for immediate visual feedback during drag.
- **Implementation**:
  - For a selected Aide and Date:
    1. Collect all `assignments` and `absences`.
    2. Sort them by time.
    3. Iterate through `SCHEDULE_SEGMENTS`.
    4. For each segment, find empty sub-segments.
    5. Filter sub-segments >= 10 minutes.
- **Alternatives**: Backend calculation. Rejected because it would require frequent API calls during drag/hover, impacting performance.

## Decision 2: Visual Feedback (Hover Highlighting)
- **Decision**: Use the existing `Droppable` slots in `AideRow.tsx` / `TimetableGrid`.
- **Rationale**: The system already has `Droppable` zones for each time slot. We can update the `Droppable` components to check if the current slot contains a "snappable" gap when an item is hovering over it.
- **Implementation**:
  - Pass the "gap" information to the `Droppable` component.
  - When `snapshot.isDraggingOver` is true, check if the drag cursor is over a valid gap.
  - If yes, render a `Box` with the aide's color and appropriate opacity/border.
- **Challenges**: `@hello-pangea/dnd` doesn't give us the exact mouse coordinates inside a `Droppable` easily. We might need to split the `Droppable` area or use a more clever hover state if multiple gaps exist in one slot (though slots are usually small).

## Decision 3: Snap Logic in `useDragDrop.tsx`
- **Decision**: Update `onDragEnd` to prioritize snapping to gaps.
- **Rationale**: `onDragEnd` already handles the drop logic and opens the modal. By injecting the snap calculation here, we can set the modal's initial times to the perfect gap fit.
- **Implementation**:
  - In `onDragEnd`, if the `destination` is a timetable slot:
    1. Check if the drop point is within a calculated gap.
    2. If yes, use the gap's `start_time` and `end_time` for the `pendingAssignment`.
    3. If no, fall back to the standard slot behavior.

## Decision 4: Minimum Duration Enforcement
- **Decision**: Frontend validation in `onDragEnd`.
- **Rationale**: Immediate feedback is better than a backend 400 error.
- **Implementation**:
  - If a gap is detected but it's < 10m, trigger a toast/error event: "All tasks need to be at least 10 minutes wide."

## Decision 5: Auto-Opening Edit Dialog
- **Decision**: Reuse existing `AssignmentDurationModal`.
- **Rationale**: It's already integrated with `useDragDrop.tsx` and handles both creation and updates.
- **Implementation**:
  - No changes needed to the modal itself, just the parameters passed to `setPendingAssignment`.

