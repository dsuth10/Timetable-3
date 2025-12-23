# Feature Specification: Daily Display Timetable

**Feature Branch**: `006-we-are-implementing`  
**Created**: 2025-12-23  
**Status**: Draft  
**Input**: User description: "we are implementing a new feature, this is a new display arrangement where the user can see where each of the teacher aids are during the day. It's a daily display. The idea is that the task bank and the relief pool will be available on the right-hand side so that the user can drag and drop tasks into each of the teacher aids' time table slots. The times will be divided up the same way they are in all of the other calendars, and it should scroll to the right to reveal the rest of the day. I've provided you with this folder that contains some mock-ups similar to what I have in mind. I'd like you to adapt this to our setup. The mock-ups include a lot of things that are not required and aren't in our current setup, so they would be simplified in our setup with fewer icons and things, especially the thin bar on the left-hand side and a few of the elements across the header area. Other than that, this is generally what it should look like, and I'd like you to planthat out in our current tech stack."

## Execution Flow (main)
```
1. Parse user description from Input
   → Success
2. Extract key concepts from description
   → Identified: Daily view, aide rows, horizontal timeline, task bank/relief pool, drag-and-drop.
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION]
4. Fill User Scenarios & Testing section
   → Primary journey and acceptance scenarios defined.
5. Generate Functional Requirements
   → FRs defined for display, interaction, and data updates.
6. Identify Key Entities (if data involved)
   → Teacher Aides, Assignments, Tasks, Relief Pool.
7. Run Review Checklist
   → Checked.
8. Return: SUCCESS (spec ready for planning)
```

## Clarifications

### Session 2025-12-23
- Q: Beyond the "thin bar on the left," are there any other specific sections or features from the mock-up that should be explicitly excluded? → A: Exclude all header icons/search except date navigation and the Task Bank panel.
- Q: When a task from the Task Bank is dropped onto a timeline slot, what should its duration be? → A: Default to the duration of the specific slot (usually 30m, first slot is 20m, some are longer).
- Q: How should the Task Bank and Relief Pool on the right panel be organized? → A: Grouped by Task Category (e.g., Playground, Class Support) with collapsible headers and a search bar for filtering.
- Q: When dragging an assignment from the Relief Pool onto the timeline, how should its duration be handled? → A: Keep original duration, but show a confirmation dialog on drop to allow duration modification.
- Q: Should the Teacher Aide names remain sticky/pinned on the left side while the timeline scrolls? → A: Yes, pin names to the left so they stay visible while scrolling hours.

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a scheduler, I want to see a comprehensive view of all teacher aides' daily schedules in one place and easily assign tasks from a bank or relief pool by dragging them onto the timeline, so that I can efficiently manage staff allocation and cover gaps.

### Acceptance Scenarios
1. **Scenario: Viewing the Daily Schedule**
   - **Given** I am on the Daily Display page for a specific date,
   - **When** I view the page,
   - **Then** I see a list of all teacher aides in rows,
   - **And** a horizontal timeline showing their assigned tasks for that day,
   - **And** the timeline uses the standard time increments (30 mins).

2. **Scenario: Assigning a Task from the Task Bank**
   - **Given** I see the Task Bank on the right-hand side,
   - **When** I drag a task template from the bank onto an empty 30-minute slot for a specific aide,
   - **Then** a new assignment is created for that aide, at that time, on the current date,
   - **And** the UI reflects the new assignment immediately.

3. **Scenario: Reassigning from Relief Pool**
   - **Given** there are tasks in the Relief Pool,
   - **When** I drag a relief task onto an aide's schedule,
   - **Then** the assignment is updated to be assigned to that aide,
   - **And** its status changes from 'RELIEF_POOL' to 'ASSIGNED'.

4. **Scenario: Navigating the Timeline**
   - **Given** the workday spans 8 hours,
   - **When** I scroll horizontally to the right,
   - **Then** I can see the afternoon slots and assignments that were previously off-screen.

### Edge Cases
- **Overlapping Assignments**: If multiple tasks are assigned to the same time slot for an aide, the system MUST display them as thinner vertical strips within that slot to remain visible.
- **Aide Absence**: Rows for absent aides MUST be "reddened out" (using the same styling as the absence indicators in individual schedules) to clearly indicate unavailability.
- **End of Day**: If a task's duration extends past the end of the displayed workday (e.g., 3:30 PM), the timeline MUST clip the visual block at the workday boundary. The full time range MUST still be visible in the confirmation dialog and tooltip.

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST provide a "Daily Display" view showing teacher aides as the vertical axis and time as the horizontal axis.
- **FR-002**: System MUST allow horizontal scrolling of the timeline grid to accommodate the full day's hours.
- **FR-003**: System MUST display a "Task Bank" (task templates) and a "Relief Pool" (unassigned/relief assignments) in a FIXED panel on the right side of the screen. Items MUST be grouped by category with collapsible headers and include a search/filter bar at the top of the panel.
- **FR-004**: System MUST support drag-and-drop of items from both the Task Bank and Relief Pool into the aide timeline.
- **FR-005**: System MUST align assignments to the predefined timeline grid slots. New assignments from the Task Bank MUST default to the duration of the slot they are dropped into (e.g., 20m for the first slot, 30m for standard slots, or longer if specified).
- **FR-011**: System MUST support variable slot durations within the timeline grid to reflect the actual school day structure.
- **FR-012**: System MUST display a confirmation dialog after an item from the Relief Pool is dropped onto the timeline, allowing the user to review and modify the start and end times before saving. Original duration MUST be the default in this dialog.
- **FR-013**: System MUST pin the Teacher Aide names to the left side of the view (sticky column) to ensure they remain visible while the user scrolls the timeline horizontally.
- **FR-006**: System MUST display basic assignment information (Title, Category, Time Range) within the blocks on the timeline.
- **FR-007**: System MUST allow users to navigate between different dates to view schedules for other days.
- **FR-008**: System MUST provide a simplified UI compared to the mock-up, excluding the left sidebar and all header icons/search functionality except for date navigation and the Task Bank panel.
- **FR-009**: System MUST visually indicate aide absences by reddening the corresponding rows.
- **FR-010**: System MUST handle overlapping assignments by rendering them as thinner strips side-by-side within the time slot.

### Key Entities *(include if feature involves data)*
- **Teacher Aide**: Staff member whose schedule is displayed in rows.
- **Task (Template)**: Items in the Task Bank that serve as the blueprint for new assignments.
- **Assignment**: Specific instances of tasks assigned to an aide on a specific date and time.
- **Relief Pool**: A subset of assignments that are currently unassigned or marked for relief.

---

## Review & Acceptance Checklist
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed (except for clarifications)

---
