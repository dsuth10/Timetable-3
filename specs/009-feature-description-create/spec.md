# Feature Specification: Snap-to-Gap Drag and Drop Task Assignment

**Feature Branch**: `009-feature-description-create`  
**Created**: Monday Dec 29, 2025  
**Status**: Draft  
**Input**: User description: "create a feature where a user can drag or drop a task into small gaps between: 1. Unavailable to work and another task 2. Between two tasks with a small gap in time between them When they drag and drop that task in, it will default to the times that are free between the two tasks or the unavailable to work and task, so that it fits perfectly. In both the daily display and the teacher aid schedule. The image provided shows a small gap for the teacher aid Bart Simpson between unavailable to work and reading support for 3, the name of the task. When we drag from the TaskBank into this gap, we need the default times for the drop task to be the spare time between these two events. Likewise, if it was between two tasks and there was a gap in space, it would fit and use the default times for that gap between the tasks."

## Execution Flow (main)
```
1. Parse user description from Input
   → Success
2. Extract key concepts from description
   → Identified: scheduler (user), TaskBank, schedule gaps, automatic time snapping
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → Primary scenarios defined
5. Generate Functional Requirements
   → Testable requirements generated
6. Identify Key Entities (if data involved)
   → Identified Task, Assignment, Aide, Gap
7. Run Review Checklist
   → Reviewing...
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-12-29
- Q: If the gap becomes invalid (e.g., another user fills it) while dragging, how should the system respond? → A: Show error message and cancel assignment
- Q: If a user drags an existing assignment into a gap, should it also snap? → A: Yes, treat existing assignments the same as TaskBank tasks
- Q: Should the system automatically split a task if the gap spans across a grid line? → A: No, it should default to the small segment but remain a single task if edited to be longer.
- Q: Should the highlighting of the gap match the aide's color? → A: Use the aide's assigned hex color (with transparency)
- Q: Should the task edit/input dialog open automatically after a snapped drop? → A: Open dialog automatically for every snapped drop

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a scheduler, I want to be able to drag a task from the TaskBank into a small gap in a teacher aide's schedule (either between two existing tasks or between an "Unavailable" period and a task) and have the system automatically set the task's start and end times to perfectly fill that gap, so that I can quickly and accurately schedule support without manual time adjustment.

### Acceptance Scenarios
1. **Given** Bart Simpson is "Unavailable" from 08:50 to 09:40 and has a "Reading support for 3" task from 10:00 to 10:40, **When** a user drags a task from the TaskBank into the gap (09:40 to 10:00), **Then** the dropped task should default to start at 09:40 and end at 10:00.
2. **Given** an aide has Task A ending at 11:30 and Task B starting at 12:00, **When** a user drags a task from the TaskBank into the gap, **Then** the dropped task should default to start at 11:30 and end at 12:00.

### Edge Cases
- **Gap Size vs. Standard Duration**: The system will allow snapping for gaps as small as 10 minutes, overriding the standard default task durations.
- **Minimum Duration Enforcement**: If a gap is less than 10 minutes wide (e.g., 5 minutes), the system MUST NOT allow the drop and MUST show an error message: "All tasks need to be at least 10 minutes wide."
- **Grid Boundary Constraint**: The *default snap behavior* MUST respect the grid lines. If a physical gap spans across grid lines, the task will initially snap only to the segment within a single grid interval (e.g., from an existing task to the next grid line).
- **Crossing Grid Lines**: While snapping defaults to a single segment, the system MUST still allow assignments to cross grid lines if the user manually extends the duration (e.g., via an edit dialog).
- **Maximum Duration**: The *default snapped duration* MUST NOT exceed 30 minutes, but the system overall supports longer tasks if manually configured.
- **Respecting Existing Events**: Snapping logic MUST fully respect existing assignments and "Unavailable" periods, ensuring no overlaps occur.
- **Multiple Gaps/Segments**: If a gap spans multiple grid intervals or contains multiple valid segments (>= 10m), the task will snap to the segment closest to the user's cursor at the time of drop.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST identify available gaps in an aide's schedule in both Daily Display and Teacher Aide Schedule views.
- **FR-002**: System MUST detect when a task from the TaskBank or an existing assignment is hovering over an available gap.
- **FR-003**: System MUST automatically calculate the start and end times of the gap segment (the space between two scheduled events, or between an event and a grid line).
- **FR-004**: System MUST default the dropped item's duration to the exact duration of the gap segment when the "snap" occurs.
- **FR-005**: System MUST highlight the specific gap segment visually using the target aide's assigned hex color with 30% transparency (alpha 0.3) when an item is hovering over it.
- **FR-006**: System MUST enforce a minimum gap duration of 10 minutes for snapping.
- **FR-007**: System MUST show an error message "All tasks need to be at least 10 minutes wide" if a user attempts to drop a task into a gap smaller than 10 minutes.
- **FR-008**: System MUST allow assignments to span multiple grid intervals if manually edited, even if snapping is restricted to a single interval.
- **FR-009**: System MUST default snapping to the segment bounded by grid lines: 08:50, 09:10, 09:40, 10:10, 10:40, 11:10, 11:50, 12:20, 12:50, 13:20, 14:00, 14:30.
- **FR-010**: System MUST persist the assignment with the calculated snap times upon successful drop.
- **FR-011**: System MUST show an error message and cancel the assignment if the selected gap becomes invalid (e.g., due to local state changes or unexpected collisions) before the drop is finalized.
- **FR-012**: System MUST automatically open the task edit/input dialog immediately after a successful snapped drop to allow the user to review or modify the assignment.

### Key Entities *(include if feature involves data)*
- **Task (Template)**: The source task from the TaskBank being assigned.
- **Assignment**: The scheduled instance created for an aide on a specific date with specific times.
- **Teacher Aide**: The staff member whose schedule is being managed.
- **Schedule Gap**: A period of unassigned time bounded by either assignments, absences, or the start/end of the day.

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
- [x] SUCCESS (spec ready for planning)

---
