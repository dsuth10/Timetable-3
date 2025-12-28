# Phase 1: Data Model & State

## Schema Changes
*No database schema changes required.*

The feature uses existing entities:
- **Classroom**: The subject of the view.
- **TeacherAide**: The resource.
- **Task**: Represents the need (e.g., "Class Support").
- **Assignment**: Represents the allocation.

## Component State

### UI Store (`uiStore.ts`)
- `viewMode`: `'AIDE' | 'CLASS'` (Default: `'AIDE'`)
- `selectedClassId`: `number | null`
- `selectedTimeSlot`: `{ date: string, time: string, duration: number } | null` (For filtering the TA list)

### Derived Data (Client-Side)

#### Class Schedule
- **Input**: All Assignments (fetched via `weeklyMatrix`), Selected Class ID.
- **Transformation**:
  ```typescript
  assignments.filter(a => a.task?.classroom_id === selectedClassId)
  ```
- **Grouping**: By Date, then by Time.

#### Available Teacher Aides
- **Input**: All Teacher Aides, All Assignments, Selected Time Slot.
- **Transformation**:
  ```typescript
  aides.filter(aide => {
    // Check availability (working hours)
    const isWorking = checkAvailability(aide, selectedTimeSlot);
    // Check conflicts
    const hasConflict = checkConflicts(aide, selectedTimeSlot, allAssignments);
    return isWorking && !hasConflict;
  })
  ```

## Drag & Drop Types
- **Draggable**: `TeacherAide` (Source: Side Panel)
- **Droppable**: `TimeSlot` (Target: Class Schedule)
- **Payload**: `aideId`

































