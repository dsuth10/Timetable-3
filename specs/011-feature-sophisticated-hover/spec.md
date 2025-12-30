# Feature Specification: Sophisticated Hover Tooltip

**Feature Branch**: `011-feature-sophisticated-hover`  
**Created**: Tuesday Dec 30, 2025  
**Status**: Complete  
**Input**: User description: "A sophisticated hover tooltip that displays when users hold their mouse over an assigned task for 1 second, showing: Task title, Classroom information, Task time (start/end), All assigned teacher aides, Recurrence details (up to 10 dates for recurring tasks), Task notes"

## Clarifications
### Session 2025-12-30
- Q: How should the tooltip handle its position when the assigned task is near the edge of the screen? → A: Smart Flip (Automatically flip position to stay within viewport).
- Q: What should happen if a task has no notes? → A: Show Placeholder (Display "No notes provided").
- Q: For tasks with more than 10 recurring dates, how should the tooltip indicate there are more dates? → A: Ellipsis (Show 10 dates followed by "...").
- Q: How should the tooltip handle tasks with no assigned teacher aides? → A: Show "None" (Display "Aides: None").
- Q: How should the tooltip behave on mobile/touch devices since "hover" is not naturally supported? → A: Long Press (Trigger after 1-second long press).

## Execution Flow (main)
```
1. Parse user description from Input
   → Success
2. Extract key concepts from description
   → Identified: Tooltip, 1-second delay, Task details, Aides, Recurrence, Notes
3. For each unclear aspect:
   → Marked with [NEEDS CLARIFICATION]
4. Fill User Scenarios & Testing section
   → Success
5. Generate Functional Requirements
   → Success
6. Identify Key Entities (if data involved)
   → Success
7. Run Review Checklist
   → Success
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
As a school administrator or teacher, I want to hover over an assigned task in the timetable for 1 second to quickly see its full details (title, classroom, time, aides, recurrence, and notes) without having to click or navigate away, so that I can efficiently manage the daily schedule.

### Acceptance Scenarios
1. **Given** a user is viewing the timetable with assigned tasks, **When** they hover over a task for 1 second, **Then** a detailed tooltip appears with the task name, title, classroom, start/end times, assigned aides, recurrence info, and notes.
2. **Given** a tooltip is visible, **When** the user moves their mouse away from the task, **Then** the tooltip disappears immediately.
3. **Given** a recurring task with more than 10 future dates, **When** the tooltip is displayed, **Then** it shows the next 10 upcoming dates followed by an ellipsis "...".
4. **Given** a task near the screen edge, **When** the tooltip is triggered, **Then** it MUST automatically flip its position (top, bottom, left, or right) to remain fully visible within the viewport.
5. **Given** a task with no notes, **When** the tooltip is displayed, **Then** the notes section MUST show "No notes provided".
6. **Given** a task with no assigned teacher aides, **When** the tooltip is displayed, **Then** the aides section MUST show "Aides: None".
7. **Given** a mobile device, **When** the user performs a long press on a task for 1 second, **Then** the tooltip MUST appear.

### Edge Cases
- Placement: System MUST automatically flip the tooltip position to stay within the viewport when near screen edges.
- Empty State (Notes): System MUST show "No notes provided" when no notes are associated with the task.
- Empty State (Aides): System MUST show "None" when no teacher aides are assigned.
- Recurrence Overflow: System MUST use an ellipsis (...) to indicate more than 10 recurring dates are present.
- Mobile Interaction: System MUST support a 1-second long press as a trigger for touch-based devices.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST display a tooltip when a user hovers over an assigned task for a duration of 1 second.
- **FR-002**: Tooltip MUST display the task's title and category.
- **FR-003**: Tooltip MUST display the classroom information associated with the assignment.
- **FR-004**: Tooltip MUST display the assignment's start and end times.
- **FR-005**: Tooltip MUST list all teacher aides currently assigned to the task.
- **FR-006**: Tooltip MUST display up to 10 dates for tasks that are part of a recurring series.
- **FR-007**: Tooltip MUST display the notes associated with the task template or specific assignment.
- **FR-008**: Tooltip MUST disappear immediately when the user's cursor leaves the task's boundary or the tooltip's boundary.
- **FR-009**: Tooltip MUST intelligently reposition itself (flip) to avoid being clipped by the browser viewport boundaries.
- **FR-010**: System MUST display the placeholder text "No notes provided" within the notes section if the data is null or empty.
- **FR-011**: System MUST append an ellipsis ("...") after the 10th date if the recurrence series contains more than 10 dates.
- **FR-012**: System MUST display "None" in the teacher aides section if no aides are assigned to the task.
- **FR-013**: System MUST support a long-press interaction (1 second) to trigger the tooltip on touch-enabled devices.

### Key Entities *(include if feature involves data)*
- **Assignment**: A specific occurrence of a task on a specific date, with specific aides and classroom.
- **Task**: The template for an activity, containing title, category, and notes.
- **Teacher Aide**: The staff member assigned to support the task.
- **Classroom**: The location where the task takes place.
- **Recurring Series**: The set of rules and associated assignments that repeat over time.

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
