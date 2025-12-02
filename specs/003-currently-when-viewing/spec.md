# Feature Specification: Interactive Task Selection on Aide Assignment

**Feature Branch**: `003-currently-when-viewing`  
**Created**: 2025-12-02  
**Status**: Draft  
**Input**: User description: "Currently, when viewing a class schedule, we can drag teacher aids from the teacher aid column provided they are available on the selected time slot. But when we drag that teacher aid over, it's creating a whole new task in the task system. Originally, this was required, but as it turns out, it's making far too many tasks in the task system, and it's clogging up the list of tasks. Every time we drag a teacher aid over, it will always call the new task "class support." I'd like to have a pop-up appear when a new teacher aid is dragged over into the class schedule, and that pop-up should be the list of all the tasks that are assigned to that class. That is, all the tasks with that class in its dataset. If there is a new task in the dialog modal pop-up that should appear when you drag the teacher aid over, I'd like it to include a system where the user chooses the task, assuming that it's already made, or gets the option to create a new task."

## Clarifications
### Session 2025-12-02
- Q: When selecting "Create New Task" from the assignment popup, how should the creation interface be presented? → A: **Inline Quick-Create**: Expand the current modal to show a simplified form (e.g., just Name + Description) to create and assign immediately.

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a scheduler, when I drag a teacher aide to a class time slot, I want to choose from existing tasks associated with that class or quickly create a new one in the same view, so that I can avoid cluttering the system with duplicate "class support" tasks.

### Acceptance Scenarios
1. **Given** I am on the class schedule view and drag an available teacher aide to a class time slot, **When** I drop the aide, **Then** a modal dialog appears titled "Select Task".
2. **Given** the "Select Task" modal is open, **When** I view the list, **Then** I see all existing tasks that are associated with the target class.
3. **Given** I select an existing task from the list, **When** I confirm the selection, **Then** the aide is assigned to that specific task for the selected time slot.
4. **Given** the "Select Task" modal is open, **When** I select the "Create New Task" option, **Then** the modal expands or changes state to show a simplified task creation form (e.g., Name, Description) without navigating away.
5. **Given** I have filled out the quick-create form, **When** I submit, **Then** the new task is created, the aide is assigned to it, and the modal closes.
6. **Given** the "Select Task" modal is open, **When** I click cancel or close the modal, **Then** the assignment is cancelled and the aide returns to the available list.

### Edge Cases
- What happens if there are no existing tasks for the class? (The list should be empty, "Create New Task" should be the primary/only option).
- What happens if the task creation is cancelled? (The assignment process should be aborted).

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The system MUST trigger a selection modal when a teacher aide is dropped onto a class time slot.
- **FR-002**: The modal MUST retrieve and display a list of all Tasks currently associated with the target Classroom.
- **FR-003**: The modal MUST allow the user to select exactly one task from the list of existing tasks.
- **FR-004**: The modal MUST provide a distinct option to "Create New Task".
- **FR-005**: Upon selecting an existing task, the system MUST create an assignment linking the Aide, the chosen Task, and the Time Slot.
- **FR-006**: Upon selecting "Create New Task", the system MUST present an inline, simplified form (Name, Description) within the same modal context.
- **FR-007**: The system MUST NOT automatically create a "class support" task without user confirmation via this modal.
- **FR-008**: The inline task creation MUST persist the new task and immediately associate the aide with it upon submission.

### Key Entities *(include if feature involves data)*
- **Task**: Represents the activity the aide is helping with. Must be linkable to a Class.
- **Assignment**: The resulting record linking Aide, Task, and Time (and Class).
- **Classroom**: The context used to filter relevant Tasks.

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
