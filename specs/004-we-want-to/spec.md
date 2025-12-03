# Feature Specification: Relief Pool - Absent Aide Task Reassignment

**Feature Branch**: `004-we-want-to`  
**Created**: 2025-12-03  
**Status**: Draft  
**Input**: User description: "System where when a teacher aid is marked absent, their assigned tasks are moved to a secondary task bank (Relief Pool) with full assignment details retained, allowing reassignment to other aides on the same day, with automatic cleanup at end of day."

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-12-03
- Q: When an aide is marked absent mid-day, what should happen to tasks currently in-progress? → A: Include in Relief Pool - another aide can take over mid-task
- Q: When reassigning a Relief Pool task, can users adjust the start/end time? → A: Yes, flexible - users can adjust times to fit the new aide's schedule
- Q: When should automatic cleanup of unassigned Relief Pool tasks occur? → A: After the latest task end time for that day
- Q: What date scope should the Relief Pool display? → A: All pending tasks from any absence date until they expire
- Q: For multi-day absences with recurring tasks, how should instances be handled? → A: Each day's instance goes to Relief Pool independently

---

## Feature Overview

When a teacher aide is marked absent, their scheduled tasks for that day become "orphaned" - they still need coverage but have no assigned aide. Currently, these tasks are simply unassigned and return to the general Task Bank, losing their scheduled time information.

This feature introduces the **Relief Pool** - a specialized secondary task bank that:
1. Automatically captures all assigned tasks from an absent aide
2. Preserves the full assignment context (times, classroom, all details)
3. Enables quick reassignment to available aides
4. Constrains reassignment to the original date only
5. Automatically clears at end of day

### Recommended Name: "Relief Pool"

**Alternative names considered:**
- Coverage Queue
- Absent Coverage Bank
- Reassignment Pool
- Pending Coverage

**Recommendation: "Relief Pool"** - This name is concise, professionally appropriate, and clearly conveys the purpose: a pool of tasks needing relief coverage due to aide absence.

---

## User Scenarios & Testing

### Primary User Story

As a school administrator, when I mark a teacher aide as absent for the day, I want all of their scheduled tasks to be automatically moved to a Relief Pool so that I can quickly see what tasks need coverage and easily reassign them to other available aides without losing any of the original scheduling details.

### Secondary User Stories

**Story 2**: As an administrator, I want to see the Relief Pool tasks displayed with their original time slots clearly visible, so I know exactly when coverage is needed.

**Story 3**: As an administrator, I want to drag a Relief Pool task to another aide's schedule and have it retain its original time, so reassignment is quick and the school day runs smoothly.

**Story 4**: As an administrator, I want Relief Pool tasks to only be assignable on the same day they were originally scheduled, so I don't accidentally create scheduling errors on wrong dates.

**Story 5**: As an administrator, I want the Relief Pool to automatically clear at the end of the school day, so I don't have stale tasks cluttering the interface the next day.

### Acceptance Scenarios

1. **Given** John Smith (aide) has 3 tasks scheduled for Monday Dec 3rd,  
   **When** I mark John Smith as absent for Dec 3rd,  
   **Then** all 3 tasks appear in the Relief Pool tab with their original times, classroom, and details preserved.

2. **Given** a task "Reading Support - Grade 3A (9:10-9:40)" is in the Relief Pool for Dec 3rd,  
   **When** I drag this task to Sarah Jones's schedule for Dec 3rd at 9:10-9:40,  
   **Then** the task is assigned to Sarah Jones and removed from the Relief Pool.

3. **Given** a task "Reading Support - Grade 3A (9:10-9:40)" is in the Relief Pool for Dec 3rd,  
   **When** I attempt to drag this task to Sarah Jones's schedule for Dec 4th,  
   **Then** the system prevents the drop and shows a message indicating the task can only be assigned on Dec 3rd.

4. **Given** there are 2 tasks in the Relief Pool for Dec 3rd,  
   **When** the school day ends (after the latest task end time for that day),  
   **Then** both tasks are automatically removed from the Relief Pool.

5. **Given** John Smith is marked absent with tasks in the Relief Pool,  
   **When** I remove John Smith's absence status for that day,  
   **Then** the tasks in the Relief Pool should return to John Smith's schedule (if not already reassigned).

6. **Given** the Relief Pool contains tasks from multiple absent aides,  
   **When** I view the Relief Pool tab,  
   **Then** tasks are grouped or labeled by original aide name for clarity.

### Edge Cases

- **What happens when the same task time slot is needed by two Relief Pool tasks?**  
  → The system should allow both to be in the Relief Pool; conflict detection occurs only when assigning to a new aide.

- **What happens if an aide is marked absent mid-day after some tasks are already completed?**  
  → Only future/current tasks (not yet completed based on time) should move to the Relief Pool.

- **What happens if a task is partially completed when the aide is marked absent?**  
  → In-progress tasks ARE included in the Relief Pool, allowing another aide to take over mid-task.

- **What happens if a Relief Pool task conflicts with the target aide's existing assignment?**  
  → Normal conflict resolution should apply (replace/cancel modal).

- **What happens if I restore an absence but the original time slot is now occupied?**  
  → System should report the conflict and keep the task in Relief Pool.

- **What is the exact time for end-of-day cleanup?**  
  → Cleanup occurs after the latest task end time for that day (e.g., if last task ends at 3:30 PM, cleanup runs shortly after).

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST automatically move all assigned tasks from an aide to the Relief Pool when that aide is marked absent for a specific date.

- **FR-002**: System MUST preserve all original assignment details when moving tasks to the Relief Pool, including:
  - Scheduled start time
  - Scheduled end time
  - Classroom assignment
  - Task title and category
  - Task notes/description
  - Original aide name (for reference)
  - Original date

- **FR-003**: System MUST display the Relief Pool as a separate tab within the Task Bank panel, clearly distinguishing it from regular unassigned tasks.

- **FR-004**: System MUST allow drag-and-drop assignment of Relief Pool tasks to any available aide's schedule.

- **FR-005**: System MUST restrict Relief Pool tasks to being assigned only on their original date (the date the absent aide was scheduled).

- **FR-006**: System MUST remove a task from the Relief Pool when it is successfully assigned to another aide.

- **FR-007**: System MUST automatically clear all Relief Pool tasks after the latest scheduled task end time for that date (dynamic based on actual task times, not a fixed hour).

- **FR-008**: System MUST display Relief Pool tasks with their time slot prominently visible (e.g., "Grade 3A Reading Support • 9:10 - 9:40").

- **FR-009**: System MUST allow a Relief Pool task to be "dismissed" manually if coverage is not needed (optional user action).

- **FR-010**: System MUST restore tasks from Relief Pool back to the original aide's schedule if their absence is cancelled (assuming no conflicts).

- **FR-011**: System MUST handle multiple absent aides by showing all their Relief Pool tasks, clearly labeled by original aide.

- **FR-012**: System MUST apply standard conflict detection when dropping a Relief Pool task onto an aide's schedule.

- **FR-013**: Users MUST be able to view the Relief Pool contents without affecting the current aide view selection.

- **FR-014**: System MUST show a visual indicator on the Relief Pool tab when it contains tasks requiring attention.

- **FR-015**: System MUST only move tasks scheduled for the absence date (not future recurring instances on other dates) to the Relief Pool.

- **FR-016**: System MUST display ALL pending Relief Pool tasks from any absence date (not limited to current day/week), grouped or filterable by date, until each task expires after its scheduled day ends.

### Non-Functional Requirements

- **NFR-001**: Relief Pool should update in real-time when absences are marked or removed.
- **NFR-002**: End-of-day cleanup should happen automatically without requiring administrator action.
- **NFR-003**: Relief Pool UI should follow the same Material Design patterns as the existing Task Bank.

### Key Entities

- **Relief Pool Task**: A special representation of an assigned task that has been "orphaned" by an aide absence. Contains:
  - Reference to original task definition
  - Original scheduled date
  - Original scheduled start/end times
  - Original classroom
  - Original aide reference (for display/restoration)
  - Status (pending reassignment, reassigned, dismissed, expired)

- **Absence**: Existing entity, now triggers Relief Pool population when created and Relief Pool restoration when removed.

### Business Rules

1. **Date Restriction Rule**: Relief Pool tasks can ONLY be assigned on their original scheduled date. Dragging to a different date is prohibited.

2. **Time Flexibility Rule**: When a Relief Pool task is assigned to a new aide, the original time slot is shown by default but users CAN adjust the start/end times during reassignment to fit the new aide's schedule.

3. **Auto-Cleanup Rule**: Relief Pool tasks expire and are removed at end of day if not reassigned or dismissed.

4. **One-Way Movement Rule**: Once a Relief Pool task is reassigned to a new aide, it becomes a normal assignment and cannot return to the Relief Pool unless that new aide is also marked absent.

5. **Absence Restoration Rule**: If an absence is cancelled, Relief Pool tasks for that aide should be automatically restored to the aide's schedule (if slots are still available).

6. **Multi-Day Independence Rule**: For multi-day absences with recurring tasks, each day's task instance is treated independently in the Relief Pool. Monday's instance, Tuesday's instance, etc. are separate entries that can be reassigned to different aides.

---

## UI/UX Considerations

### Relief Pool Tab Design
- Tab should appear alongside existing Task Bank tabs
- Badge/indicator showing count of pending tasks
- Tasks displayed as cards similar to existing task cards but with enhanced time display
- Color coding or icon to indicate urgency/time remaining
- Shows ALL pending tasks from any absence date (multi-day view)
- Tasks grouped or filterable by date for clarity when multiple days have pending coverage

### Task Card Display in Relief Pool
Each task card should show:
- Task title (e.g., "Reading Support")
- Classroom (e.g., "Grade 3A")
- **Prominent time slot** (e.g., "9:10 - 9:40 AM")
- Original aide name (e.g., "Originally: John Smith")
- Category icon

### Drag-and-Drop Behavior
- Dragging from Relief Pool should feel identical to dragging regular tasks
- Drop target highlighting should only appear on valid same-day slots
- Invalid drop attempts should show clear feedback explaining the date restriction

### Notifications/Alerts
- When absences create Relief Pool tasks, show a notification/toast
- When end-of-day cleanup occurs, optionally notify if tasks were cleared unassigned

---

## Out of Scope

The following are explicitly NOT part of this feature:
- Automatic reassignment suggestions or AI-powered aide matching
- Notification to aides about reassigned tasks (future feature)
- Historical tracking of Relief Pool activity (audit log)
- Mobile-specific Relief Pool interface
- Integration with external absence management systems

---

## Dependencies & Assumptions

### Dependencies
- Existing Absence Management system (marking aides absent)
- Existing Task Bank UI infrastructure
- Existing drag-and-drop assignment system
- Existing conflict detection system

### Assumptions
- School operates Monday-Friday only
- End-of-day cleanup is dynamic, occurring after the latest scheduled task end time for each day
- All users have permission to reassign Relief Pool tasks (no special permissions needed for MVP)
- Task templates are not affected - only the specific day's assignments move to Relief Pool

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

## Open Questions

All clarification questions have been resolved. See **Clarifications** section above for the session log.

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
