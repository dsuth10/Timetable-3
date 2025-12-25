# Feature Specification: Task Card Enhancements

**Feature Branch**: `008-each-task-card`  
**Created**: 2025-12-25  
**Status**: Completed  
**Input**: User description: "Each task card that has been assigned in the aides schedule section and the daily display needs to show: - The task name - The times of the particular task in the instance that it exists - The class that it is assigned to icon - The category that the task exists in (like class support or individual support) icon. In the schedule that shows individual classes, it needs to say: - The name of the task - The time - The teacher aide that has been assigned in that slot - The category icon"

## Execution Flow (main)
```
1. Parse user description from Input
   → Success: Description contains clear requirements for TaskCard display in different contexts.
2. Extract key concepts from description
   → Actors: Teacher Aides (in Aide View/Daily Display), Students/Teachers (in Class View)
   → Data: Task Name, Assignment Times, Classroom Icon, Category Icon, Aide Name.
   → Constraints: Display varies by context (Aide/Daily vs Class view).
3. For each unclear aspect:
   → Iconography: Proposing Material UI icons (Park, School, Groups, Person, Place).
   → Layout: Proposing a compact layout that adjusts based on card size.
4. Fill User Scenarios & Testing section
5. Generate Functional Requirements
6. Identify Key Entities
7. Run Review Checklist
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-12-25
- Q: When tasks overlap or the screen is small... which information should be prioritized? → A: Keep all elements but allow them to truncate/wrap (Option D).
- Q: What should be displayed in place of the classroom icon for tasks with no classroom (e.g. Playground)? → A: A generic school icon (Option B).
- Q: Should the category icon use a specific color? → A: Use the existing category color (Option A).
- Q: How should multiple aide names be displayed in Class View? → A: Show all aide names, separated by commas (Option A).
- Q: Where should the icons be placed relative to the text on the task card? → A: Icons on the right, text on the left (Option B).

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a staff member looking at the timetable (either for an aide or for a class), I want to see all the relevant information for a task at a glance without having to open the task details, so that I can quickly understand what is happening, where, and who is involved.

### Acceptance Scenarios
1. **Given** an aide's weekly schedule or the daily timeline view, **When** I see an assigned task card, **Then** I should see the task name, the scheduled start and end times, an icon representing the classroom, and an icon representing the task category.
2. **Given** a specific classroom's weekly schedule, **When** I see an assigned task card, **Then** I should see the task name, the scheduled start and end times, the name of the assigned teacher aide, and an icon representing the task category.

### Edge Cases
- **Very Short Tasks (e.g., 10-15 mins)**: System should prioritize the task name and icons, potentially hiding times or using a more compact format.
- **Narrow Columns (e.g., Daily View with many aides)**: Icons should scale or wrap appropriately.
- **Unassigned Tasks**: Should still show all info except the aide name (which would be "Unassigned").

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Task cards in Aide View and Daily Timeline MUST display the Task Title.
- **FR-002**: Task cards in Aide View and Daily Timeline MUST display the instance-specific start and end times (e.g., "09:00 - 09:40").
- **FR-003**: Task cards in Aide View and Daily Timeline MUST display a Classroom Icon if the task is associated with a specific classroom.
- **FR-004**: Task cards in Aide View and Daily Timeline MUST display a Category Icon corresponding to the task's category.
- **FR-005**: Task cards in Class View MUST display the Task Title.
- **FR-006**: Task cards in Class View MUST display the instance-specific start and end times.
- **FR-007**: Task cards in Class View MUST display the assigned Teacher Aide's name (or all names separated by commas if multiple aides are assigned).
- **FR-008**: Task cards in Class View MUST display the Category Icon.
- **FR-009**: The system MUST use the following icons for task categories, colored using the existing category color scheme:
    - **PLAYGROUND**: `Park` icon
    - **CLASS_SUPPORT**: `School` icon
    - **GROUP_SUPPORT**: `Groups` icon
    - **INDIVIDUAL_SUPPORT**: `Person` icon
- **FR-010**: The system MUST use a classroom chip/badge for tasks assigned to a specific classroom. This chip MUST include both the classroom name and a classroom icon (e.g., `School` icon as shown in the task bank).
- **FR-011**: The system MUST use a generic chip/badge for tasks that are not assigned to a specific classroom (e.g., Playground duty), using a generic icon (e.g., `Park` for playground or `School` as a fallback).
- **FR-012**: The classroom chip MUST match the styling used in the task bank (e.g., outlined pill with icon and text).
- **FR-013**: In compact views or narrow columns (e.g., overlapping tasks), the system MUST attempt to show all elements (name, time, icons), allowing for truncation or wrapping to fit the available space rather than hiding specific data points.
- **FR-014**: In compact views, text and icons MUST be scaled appropriately to ensure readability.
- **FR-015**: Icons SHOULD be placed on the right side of the task card, with text content on the left.
- **FR-016**: Category icons MUST be visually distinct and consistently applied across all timetable views.

### Key Entities *(include if feature involves data)*
- **Task**: Represents the template for work (contains title, category, classroom reference).
- **Assignment**: Represents a specific occurrence of a task on a date and time (contains start_time, end_time, aide reference).
- **Teacher Aide**: The person assigned to a task.
- **Classroom**: The location where a task takes place.

---

## Review & Acceptance Checklist

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
- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
