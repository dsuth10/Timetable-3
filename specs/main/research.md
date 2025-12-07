# Research: Quick-Click Task Creation

## Overview
Research findings for implementing the Quick-Click Task Creation feature, which enables instant task creation and assignment from the timetable view.

## Technical Decisions

### 1. API Endpoint Design

**Decision**: Create a new dedicated endpoint `POST /api/quick-create-task` that accepts both task and assignment data in a single request.

**Rationale**:
- Ensures atomic transaction (both task and assignment created or both fail)
- Simplifies frontend code (single API call instead of two sequential calls)
- Follows RESTful conventions (resource-specific endpoint for specialized operation)
- Maintains separation of concerns (quick-create is distinct from standard task creation)

**Alternatives Considered**:
- **Option B**: Use existing endpoints sequentially with frontend transaction rollback
  - Rejected: Frontend cannot guarantee atomicity if network fails between calls
- **Option C**: Add batch endpoint
  - Rejected: Over-engineered for single task+assignment creation
- **Option D**: Extend existing `POST /api/tasks` with optional parameter
  - Rejected: Violates single responsibility principle, makes endpoint behavior conditional

### 2. Time Validation for Quick-Click Assignments

**Decision**: Backend validation already supports 5-minute increments (Assignment model validates `value.minute % 5 != 0`). The `validate_time_30min` middleware function name is misleading but already validates 5-minute increments. No changes needed to validation logic.

**Rationale**:
- Assignment model already enforces 5-minute increments (lines 68, 80 in `assignment.py`)
- Middleware `validate_time_30min` already checks `m % 5 != 0` (line 59 in `validation.py`)
- Function name is legacy but functionality is correct
- No breaking changes required

**Alternatives Considered**:
- **Rename middleware function**: Considered but deferred to avoid unnecessary refactoring
- **Create separate validation**: Rejected as redundant

### 3. Collision Detection

**Decision**: Reuse existing `CollisionService.validate_assignment()` for conflict detection before creating assignment.

**Rationale**:
- Existing service already handles collision detection for same aide, date, and overlapping times
- Consistent behavior with standard assignment creation
- No code duplication

**Alternatives Considered**:
- **Custom collision logic**: Rejected as unnecessary duplication
- **Bypass collision detection**: Rejected per spec requirement to block conflicts

### 4. Frontend State Management

**Decision**: Update existing Zustand stores (`tasks.ts` and `assignments.ts`) with optimistic updates and server response reconciliation.

**Rationale**:
- Maintains consistency with existing state management patterns
- Zustand already used throughout application
- Optimistic updates provide instant feedback per spec requirement

**Alternatives Considered**:
- **Redux**: Rejected - project uses Zustand
- **Local component state only**: Rejected - need global state for Task Bank and schedule updates

### 5. Modal Component Design

**Decision**: Create new `QuickCreateTaskModal.tsx` component using Material-UI Dialog, separate from existing task creation modal.

**Rationale**:
- Different UX flow (context-aware, pre-filled values, locked start time)
- Simpler form (no start time picker, duration dropdown instead of time range)
- Maintains separation from traditional task creation flow
- Can reuse form field components but different layout

**Alternatives Considered**:
- **Extend existing TaskCreationModal**: Rejected - would add conditional logic and complexity
- **Inline form in TimetableGrid**: Rejected - violates component separation

### 6. Duration Dropdown Options

**Decision**: Provide dropdown with 5-minute increment options: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60 minutes.

**Rationale**:
- Matches backend validation (5-minute increments)
- Provides flexibility for various task durations
- Default logic: 30 min for slots ≥30 min, slot length for slots <30 min

**Alternatives Considered**:
- **Fixed durations only (15, 30, 45, 60)**: Rejected - too restrictive per spec
- **Free-form input**: Rejected - requires additional validation and UX complexity

### 7. UI Button Placement and Styling

**Decision**: Small "+" icon in top-right corner of each time slot cell, opacity 0.4 default, full opacity on hover.

**Rationale**:
- Non-intrusive design per spec requirement
- Always discoverable but doesn't clutter interface
- Standard pattern for "add" actions in grid interfaces
- Accessible via keyboard navigation and screen readers

**Alternatives Considered**:
- **Bottom-right corner**: Rejected - may conflict with assignment blocks
- **Only on empty cells**: Rejected - spec requires button on all cells
- **Toolbar button**: Rejected - loses context-awareness

## Integration Points

### Backend
- **Existing Models**: Task and Assignment models require no changes
- **Existing Services**: CollisionService can be reused as-is
- **New Route**: Add to `backend/api/routes/tasks.py` or create new route file
- **Validation**: Existing validation middleware supports 5-minute increments

### Frontend
- **TimetableGrid Component**: Add "+" button to `TimeSlottedColumn` or time slot cells
- **State Stores**: Update `tasks.ts` and `assignments.ts` Zustand stores
- **API Service**: Add `quickCreateTask` function to `tasksApi.ts`
- **Modal**: New component `QuickCreateTaskModal.tsx`

## Dependencies
- No new external dependencies required
- All required libraries already in project (Material-UI, Zustand, Axios, Flask, SQLAlchemy)

## Performance Considerations
- API endpoint should respond in <500ms (single transaction, minimal queries)
- Modal should open instantly (<100ms) - lightweight component
- Optimistic UI updates provide perceived instant feedback
- No performance concerns identified

## Security Considerations
- Input validation at API boundary (title, category, time format)
- SQL injection protection via SQLAlchemy ORM (parameterized queries)
- No authentication required (single-user MVP per constitution)

## Testing Strategy
- **Contract Test**: Verify API endpoint request/response schema
- **Integration Test**: Full workflow from button click to task+assignment creation
- **Component Test**: Modal form validation and submission
- **E2E Test**: User story scenarios (optional, can use quickstart.md)

## Open Questions Resolved
All technical questions resolved during clarification phase:
- ✅ Duration increments: 5-minute increments supported
- ✅ Conflict handling: Block creation with error message
- ✅ Classroom pre-filling: Always empty, manual selection required
- ✅ Default duration: 30 min for slots ≥30 min, slot length for <30 min
- ✅ API design: New dedicated endpoint

## Conclusion
All technical decisions are straightforward with no major unknowns. Implementation can proceed with existing codebase patterns and infrastructure.
