# Feature Specification: Delete Recurring Assignment Instances for Specific Aide

**Feature Branch**: `010-we-need-to`  
**Created**: 2025-12-29  
**Status**: Draft  
**Input**: User description: "We need to create a new feature or reorganize a particular feature. The current situation is when deleting an instance of a task that's been assigned, you get this dialog up which is: 1. Delete only this instance 2. Reset the task (remove all instances of the task but retain the original template for the task) 3. Permanently delete the task. We need another option which is to delete the instance that the user is selecting, but also to look for recurring instances of that assignment. It's possible that a user could put in a recurring instance of an assignment, say for four weeks, and that assignment/task may also be in somebody else's work schedule. If we were to want to delete all of the recurring tasks just for one of their teacher aids, then we would have to go through each one. Or else we could choose the current second of our options, but that would delete all of those instances for all of the teacher aids. When a user creates a recurring task, I'd like that task. Perhaps I'm not sure what the best system to do to make this happen, but we need another option in these options to delete this instance and all other recurring instances that were created when the task was created."

## Execution Flow (main)
1. Parse user description from Input
   → Success
2. Extract key concepts from description
   → Action: Assignment deletion refinement.
   → Target: Selective deletion of recurring assignments for a specific aide.
   → Actor: Staff managing the timetable.
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION]
4. Fill User Scenarios & Testing section
   → Success
5. Generate Functional Requirements
   → Success
6. Identify Key Entities
   → Assignment, RecurringSeries, Task
7. Run Review Checklist
   → Success
8. Return: SUCCESS (spec ready for planning)

## Clarifications

### Session 2025-12-29
- Q: If one assignment in a recurring series has been manually moved to a different time or date, should it still be included in the bulk deletion? → A: No: Only delete assignments that still match the series' original time/date.
- Q: Should the deletion affect the entire history of the series (including past assignments), or only "this and all future" instances? → A: This and Future: Only delete the selected assignment and those occurring after it.
- Q: If an assignment in the series was moved to the Relief Pool (due to an absence), should it still be deleted by this bulk action for that aide? → A: Yes: Delete it from the Relief Pool too, as it was part of their original schedule.
- Q: What should be the exact label for this new deletion option in the dialog? → A: Remove this and future recurring instances for this aide

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a timetable administrator, when I assign a task to a teacher aide for a recurring period (e.g., 4 weeks), I want to be able to delete that specific aide's entire series of assignments in one action if their schedule changes, without affecting the same task assigned to other aides or deleting the task template itself.

### Acceptance Scenarios
1. **Given** Task "Reading Support" is assigned to "Aide Smith" every Monday for 4 weeks (4 assignments), **When** I choose to delete the Monday Week 1 assignment and select "Delete this and all recurring instances for this aide", **Then** all 4 assignments for Aide Smith are deleted, but the "Reading Support" task template remains.
2. **Given** Task "Reading Support" is assigned to "Aide Smith" (4 weeks) AND "Aide Jones" (4 weeks), **When** I delete Aide Smith's Monday Week 1 assignment with the new option, **Then** Aide Smith's 4 assignments are gone, but Aide Jones's 4 assignments remain untouched.
3. **Given** An assignment that is NOT part of a recurring series, **When** I attempt to delete it, **Then** the new option is either hidden or disabled.

### Edge Cases
- **Modified Assignments**: Assignments in the series that have been manually moved to a different time or date MUST NOT be deleted during this bulk operation.
- **Past Assignments**: The deletion operation MUST only affect assignments on the current date and future dates within the recurring series. Past assignments must be preserved.
- **Absences/Relief Pool**: Assignments that were moved to the Relief Pool (aide_id is NULL, but original_aide_id matches) MUST be included in the deletion if they are part of the series and haven't been modified.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The Assignment Deletion dialog MUST include a new option: "Remove this and future recurring instances for this aide".
- **FR-002**: Selecting this option MUST delete the current assignment and all other assignments associated with the same recurring series that were originally assigned to the same aide.
- **FR-003**: This operation MUST NOT delete assignments for the same task that belong to different recurring series (other aides or other recurring setups for the same aide).
- **FR-004**: This operation MUST NOT delete the underlying `Task` template.
- **FR-005**: The new option MUST only be visible if the assignment is part of a recurring series.
- **FR-006**: The system SHOULD provide a confirmation message indicating the total number of assignments that will be deleted.
- **FR-007**: The operation MUST skip any assignments in the series that have been modified from their original scheduled time or date.
- **FR-008**: The operation MUST only delete the selected assignment and future occurrences within that series. Past assignments MUST NOT be affected.
- **FR-009**: The operation MUST include assignments currently in the Relief Pool that were originally assigned to the aide as part of the series.

### Key Entities *(include if feature involves data)*
- **Assignment**: Represents a single scheduled task occurrence.
- **RecurringSeries**: Metadata that groups assignments created as part of a recurring pattern.
- **Task**: The template definition for what the assignment represents.

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
- [x] Clarifications integrated (Session 2025-12-29)
