# Feature Specification: Set Assignment Details Dialog in Daily View

**Feature Branch**: `007-when-assigning-tasks`  
**Created**: 2025-12-24  
**Status**: Draft  
**Input**: User description: "when assigning tasks from the Taskbank into a TeacherAid or into a class using the Aids or Classes tab at the top, the dialog to set the assignment details comes up and it allows the person dragging and dropping a task from the Taskbank into the slot to change the details of that task and to have those details reflected in the graphic interface of the TeacherAids calendar or the Class Calendar. However, in the Daily View, the user can drag and drop tasks in, but they automatically default to the SetHalfHour, and there is no SetAssignmentDetails. The automatic setting to the default depends actually on the Slot size that it's going into, so ignore that for the moment. But whenever this happens, that is when a user drags an assignment, a task, into a Slot on the Daily display. We need the SetAssignmentDetails, and to be tasks that has been created follows all the same rules as any other task that has been put into the system in any other calendar format. It's just presented differently in the Daily. I'm providing this screenshot of the SetAssignmentDetails dialogue that we're talking about."

## Clarifications
### Session 2025-12-24
- Q: When a task is dropped onto a row for an aide who is currently marked as absent (shown as a "Relief Pool" slot in the Daily View), how should the "Set Assignment Details" dialog initially handle the assignment? → A: C (Block the drop; do not show the dialog for absent aides)
- Q: When a user drops a task onto a Class row (if your Daily View includes rows for classes as well as aides), should the "Set Assignment Details" dialog appear pre-filled with that Class? → A: A (Yes, pre-fill the Classroom field)
- Q: When the "Set Assignment Details" dialog opens from a drop in the Daily View, what should happen to the Taskbank? → A: A (Leave it open (default))
- Q: When the "Set Assignment Details" dialog opens after a drop in the Daily View, how should the initial Duration be calculated? → A: A (Match the Slot size dropped onto (e.g., 30 mins))
- Q: If the user confirms an assignment that overlaps with an existing one in the Daily View, how should the system handle the visual conflict? → A: B (Stack them vertically within the same row)

## Execution Flow (main)
```
1. Parse user description from Input
   → Success
2. Extract key concepts from description
   → Identified: scheduler (actor), drag and drop from Taskbank (action), Daily View (context), SetAssignmentDetails dialog (target UI component)
3. For each unclear aspect:
   → [RESOLVED: Drops on absent aides/Relief Pool slots in Daily View are blocked.]
   → [RESOLVED: Drops on Class rows in Daily View pre-fill the Classroom field.]
   → [RESOLVED: Taskbank remains open when dialog appears.]
   → [RESOLVED: Initial duration matches the slot size of the drop target.]
   → [RESOLVED: Overlapping assignments in Daily View stack vertically.]
4. Fill User Scenarios & Testing section
   → Primary story and acceptance scenarios defined
5. Generate Functional Requirements
   → FRs 001-013 defined
6. Identify Key Entities (if data involved)
   → Assignment, Task, Teacher Aide, Classroom identified
7. Run Review Checklist
   → Review completed
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a scheduler using the Daily View, I want to see the "Set Assignment Details" dialog when I drag a task from the Taskbank into a time slot, so that I can precisely set the timing and aide/class assignments just like I do in the Aide or Class views.

### Acceptance Scenarios
1. **Given** a user is on the Daily View page and the Taskbank is open, **When** the user drags a task from the Taskbank into a teacher aide's slot on the timetable, **Then** the "Set Assignment Details" dialog MUST appear prepopulated with the selected date, time slot, and aide.
2. **Given** a user is on the Daily View page, **When** the user drags a task from the Taskbank into a Class row's slot (if Class rows are supported in Daily View), **Then** the "Set Assignment Details" dialog MUST appear prepopulated with the selected date, time slot, and classroom. *Note: Class row support in Daily View is dependent on UI implementation; if not available, this scenario applies to future enhancement.*
3. **Given** the "Set Assignment Details" dialog is open after a drag-and-drop action in Daily View, **When** the user modifies the start time or end time and clicks "Confirm Assignment", **Then** the assignment MUST be created with the modified times and the Daily View MUST update to show the new assignment.
4. **Given** the "Set Assignment Details" dialog is open, **When** the user clicks "Cancel", **Then** the assignment MUST NOT be created and the dialog MUST close.
5. **Given** an aide is marked as absent for the day (Relief Pool row), **When** a user attempts to drop a task from the Taskbank into that aide's row in Daily View, **Then** the drop MUST be blocked and no dialog should appear. *(This behavior is also specified in FR-011.)*
6. **Given** the "Set Assignment Details" dialog is open, **Then** the Taskbank MUST remain visible and accessible in the background.

### Edge Cases
- **Drop on occupied slot**: If the user drops a task onto an already occupied or partially occupied slot, the dialog MUST still appear, and the system MUST apply standard conflict validation rules upon confirmation.
- **Relief Pool Slots**: Drops into Relief Pool/absence slots are explicitly prohibited in Daily View to prevent scheduling conflicts with known absences.
- **Overlapping Assignments**: If the confirmed assignment overlaps in time with an existing assignment in the same row, the Daily View MUST stack them vertically to ensure both remain visible.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST intercept the drop event in the Daily View timetable when a task is dropped from the Taskbank.
- **FR-002**: System MUST display the "Set Assignment Details" dialog immediately after a task drop in the Daily View.
- **FR-003**: The dialog MUST be prepopulated with values derived from the drop location: Date, Start Time, and End Time.
- **FR-004**: The initial **Duration** in the dialog MUST match the size of the slot where the task was dropped (e.g., if dropped into a 30-minute slot, the duration defaults to 30 minutes).
- **FR-005**: If dropped on an Aide row, the dialog MUST prepopulate the Teacher Aide field.
- **FR-006**: If dropped on a Class row (when Class rows are available in Daily View), the dialog MUST prepopulate the Classroom field. *Note: Class row support may be implemented in a future phase if not currently available in Daily View.*
- **FR-007**: The dialog MUST allow users to toggle the "Make this a recurring task" option.
- **FR-008**: The dialog MUST allow users to select or change both the Teacher Aide and Classroom.
- **FR-009**: The system MUST persist the assignment to the database only after the user clicks "Confirm Assignment" in the dialog.
- **FR-010**: The Daily View UI MUST refresh to reflect the newly created assignment.
- **FR-011**: The system MUST NOT allow dropping tasks from the Taskbank into "Relief Pool" or absence slots in the Daily View. *(See Acceptance Scenario 5 for user-facing behavior.)*
- **FR-012**: The Taskbank MUST remain open and in its current state while the "Set Assignment Details" dialog is active.
- **FR-013**: The Daily View MUST support vertical stacking of overlapping assignments within a single row to handle concurrent scheduling.

### Key Entities *(include if feature involves data)*
- **Assignment**: Represents a specific instance of a task scheduled for a specific date, time, aide, and classroom.
- **Task**: The template from the Taskbank being used to create the assignment.
- **Teacher Aide**: The staff member assigned to the task.
- **Classroom**: The physical space or group assigned to the task.

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
