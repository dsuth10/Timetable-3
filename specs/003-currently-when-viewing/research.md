# Phase 0: Research & Architecture

## Feature Context
The feature "Interactive Task Selection on Aide Assignment" intercepts the drag-and-drop action of assigning a teacher aide to a class. Instead of automatically creating a generic "Class Support" task, it prompts the user to select an existing task for that class or create a specific new one.

## Architecture Decisions

### 1. UI Component Strategy
- **Decision**: Use a `TaskSelectionModal` utilizing the existing Material-UI `Dialog` component.
- **Rationale**: Consistent with the application's design system. Modals are the standard pattern for interrupting a flow to request user input.
- **State Management**: The modal's open state and context (which aide, which class, which time slot) will be managed locally in the Drag-and-Drop parent component or a dedicated Zustand store slice if it becomes complex. Given the localized nature, local state or a small context provider is likely sufficient, but passing handlers is cleaner.

### 2. API Strategy
- **Decision**: Leverage existing granular endpoints rather than creating a specialized "assign-with-new-task" endpoint.
    - `GET /api/tasks?classroom_id={id}` (or similar filter) to populate the list.
    - `POST /api/tasks` to create a new task (for quick create).
    - `POST /api/assignments` to link the aide.
- **Rationale**: Keeps the backend RESTful and resource-oriented. The frontend "Wizard" flow can orchestrate the calls:
    - *Scenario A (Select Existing)*: User picks task -> Frontend calls `POST /assignments` with that `task_id`.
    - *Scenario B (Create New)*: User types details -> Frontend calls `POST /tasks` -> gets `new_task_id` -> calls `POST /assignments` with `new_task_id`.
- **Alternatives Considered**: A composite endpoint that takes task details and an assignment payload. Rejected because it couples task creation too tightly with assignment, whereas they are separate domain concepts.

### 3. "Quick Create" Form
- **Decision**: Inline form within the modal showing only `title` (required) and `description` (optional).
- **Rationale**: Reduces friction. Full task creation might have more fields, but for "Class Support", these are the essentials. The `classroom_id` is implicit from the drop target.

### 4. Data Consistency
- **Decision**: Ensure the frontend list of tasks excludes "completed" tasks if that's a system feature, or shows them distinctly. (MVP: Show all tasks for the class).
- **Constraint**: The system must handle the case where the drop happens, the modal opens, but the user cancels. The drag operation must be fully reverted visually and logically.

## Data Flow
1. **Drag Start**: `Aide` dragged.
2. **Drop**: `onDrop` handler detects target is a `Classroom` slot.
3. **Interception**: Instead of immediate API call, `setShowTaskModal(true)` with `draftAssignment` data.
4. **User Action**:
   - **Cancel**: `setShowTaskModal(false)`, clear draft.
   - **Select Existing**: `onConfirm(existingTaskId)`.
   - **Create New**: `onCreate(taskData)`.
5. **Commit**:
   - **Existing**: `createAssignment(aideId, existingTaskId, timeSlot)`.
   - **New**: `createTask(taskData)` -> `createAssignment(aideId, newTaskId, timeSlot)`.
6. **Update UI**: Optimistic update or refetch.

## Open Questions (Resolved via Design)
- *Does the backend support filtering tasks by classroom?*
  - Yes, `Task` model likely has `classroom_id`. We need to verify if `GET /tasks` supports a filter. If not, we will add `GET /api/classrooms/{id}/tasks` or `GET /api/tasks?classroom_id={id}`.
  - *Assumption*: We will implement `GET /api/tasks?classroom_id={id}` as the standard filter pattern.

## Conclusion
The approach is a straightforward UI enhancement backed by standard REST operations. The complexity lies mainly in the frontend state management of the drag-and-drop interruption.

