# **Quick-Click Task Creation Feature - Complete Description**



## **Clarifications**

### **Session 2025-01-27**

- Q: How should quick-click handle the mismatch between 5-minute increment durations in the UI and 30-minute increment requirement in backend validation? → A: Allow 5-minute increments and update backend validation to accept 5-minute increments for assignments created via quick-click
- Q: How should quick-click handle conflicts when creating an assignment that overlaps with an existing assignment in the same time slot? → A: Block creation and show an error message if the new assignment would conflict with an existing assignment (same aide, same date, overlapping times)
- Q: How should the classroom be pre-filled in the quick-click modal? → A: Always leave empty (no pre-filling) and require manual selection from the modal
- Q: What should the default duration be when clicking a slot that isn't 30 minutes? → A: Default to 30 minutes for all slots, but if slot is shorter than 30 minutes, default to the slot length (e.g., 15 min slot → 15 min default)
- Q: How should the quick-click feature be implemented at the API level? → A: Create a new dedicated endpoint (e.g., `POST /api/quick-create-task`) that accepts task and assignment data together and creates both atomically in one transaction



## **Feature Overview**



The Quick-Click Task Creation feature enables teachers to instantly create and assign tasks directly from the Teacher Aide schedule view without leaving the timetable. By clicking a subtle "+" button in any time slot, a teacher can define a new task, set its duration, assign it to the currently-viewed aide, and simultaneously add it to the reusable Task Bank—all in a single workflow. This eliminates the friction of manually creating tasks in one location and then dragging them to assign them elsewhere, making task creation and assignment a seamless, context-aware operation.



## **Core Functionality**



The feature works by detecting a click on the "+" button positioned in the top-right corner of each time slot cell in the Teacher Aide schedule grid. When clicked, a modal dialog opens pre-populated with contextual information: the date of the clicked slot, the start time of that slot, a default duration (30 minutes for slots 30 minutes or longer, or the slot length for slots shorter than 30 minutes), and the aide ID of the teacher aide whose schedule is currently being viewed. The user then provides only the essential new information—a task title, a category (Playground, Class Support, Group Support, or Individual Support), and optional notes—before submitting the form.



Upon submission, the frontend calls a dedicated API endpoint (e.g., `POST /api/quick-create-task`) that accepts both task and assignment data in a single request. The backend performs two atomic operations in one database transaction: it creates a new task template in the Task Bank with placeholder times (09:00-10:00) that lock no specific schedule, ensuring the task can be reused across multiple assignments and time slots; and it simultaneously creates an assignment linking that task to the specific date, time, and aide context where the user clicked. The frontend then immediately updates both the schedule view (showing the new assignment in the clicked slot) and the Task Bank (adding the newly created task to the list), providing instant visual feedback.



## **Task Bank Integration**



The task created through quick-click is identical to tasks created through the traditional Task Creation Modal: it lives in the Task Bank with no locked times, making it fully reusable. A teacher can drag the same task to multiple time slots, multiple aides, and multiple weeks. The task retains its title, category, classroom association, and notes, while the individual assignments carry the specific date, time, and aide information. This design ensures that if a teacher frequently assigns "One-on-one reading support," they can create it once via quick-click and then reuse it throughout the week without re-entering the task details.



## **Duration and Time Control**



The modal includes a duration dropdown that allows users to extend or reduce the default slot duration. The default duration logic: if the clicked slot is 30 minutes or longer, the duration defaults to 30 minutes; if the slot is shorter than 30 minutes (e.g., 15 minutes), the duration defaults to match the slot length. Users can then select any duration from the dropdown: 15, 30, 45, 60 minutes, or any 5-minute increment (5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60) depending on the needs of the task. The backend validation for assignments created via quick-click will accept 5-minute increments to support this flexibility. The start time is locked to the clicked slot's start time and cannot be changed in this quick-create flow—if a teacher needs a different start time, they can edit the assignment after creation or drag the task to a different slot. This constraint keeps the quick-create flow fast while maintaining full flexibility through existing edit and drag-to-schedule features.



## **Aide Assignment and Context**



The aide is automatically assigned based on the schedule being viewed and is not exposed in the form, reducing cognitive load and eliminating the possibility of accidentally assigning to the wrong aide. If a teacher is viewing "Alex Smith's" schedule and clicks a time slot, the created assignment is automatically for Alex Smith. The classroom field is always empty by default and must be manually selected from the modal dropdown, ensuring the teacher explicitly chooses the appropriate classroom for each task.



## **Subtle and Non-Intrusive UI**



The "+" button appears in the top-right corner of every time slot cell, styled as a small, muted icon with low opacity (approximately 0.4) that becomes fully opaque on hover. This design ensures the button is always discoverable but doesn't visually clutter the schedule when not needed. Empty cells and occupied cells both display the button, allowing teachers to create new tasks in any slot. However, if a new assignment would conflict with an existing assignment (same aide, same date, overlapping times), the creation will be blocked and an error message will be displayed to prevent scheduling conflicts.



## **Atomic Creation and Error Handling**



The backend creates the task and assignment in a single transaction, ensuring both succeed or both fail—there are no orphaned tasks in the Task Bank with no corresponding assignment, and no assignments pointing to non-existent tasks. The backend validation for quick-click assignments accepts 5-minute time increments (matching the duration dropdown options), allowing flexible task durations. Before creating an assignment, the backend performs collision detection: if the new assignment would conflict with an existing assignment (same aide, same date, overlapping times), the entire operation is blocked and the user receives a clear error message indicating the conflict. If any other validation fails (missing title, invalid aide, invalid time), the entire operation rolls back and the user receives a clear error message. Network errors are caught and displayed as toast notifications, allowing the user to retry without losing their form data.



## **State Management and Visual Feedback**



Once the user submits the form, the frontend immediately updates the Redux store (or equivalent state management) with the newly created task and assignment, triggering re-renders that update both the schedule grid and the Task Bank sidebar. The modal closes automatically on success, returning the teacher to their work. The new assignment appears as a colored block in the clicked time slot, and the new task appears in the Task Bank list, ready to be reused or edited.



***



## **User Stories**



### **User Story 1: Quick Support Task Creation**



**As a** special education coordinator managing teacher aide schedules,  

**I want to** create a one-on-one support task for an aide directly from their schedule,  

**So that** I can quickly assign work without leaving the timetable and maintain a reusable library of common support tasks.



**Scenario:**



Sarah is reviewing the Monday schedule for Alex Smith, a classroom aide. She notices that Alex has a free 30-minute slot from 10:00-10:30, perfect for one-on-one reading support with a student who is struggling. Rather than navigating away from the schedule to create a task and then drag it to this slot, Sarah clicks the subtle "+" button in the top-right corner of the 10:00-10:30 cell.



A modal appears with:

- **Start Time:** 10:00 (locked)

- **Duration:** 30 minutes (pre-selected, matching the slot)

- **Aide:** Alex Smith (automatically set, not shown in the form)

- **Classroom:** (empty, requires selection from dropdown)



Sarah types:

- **Title:** "One-on-one reading with Emma"

- **Category:** Individual Support

- **Notes:** "Focus on blending and digraphs"



She clicks "Create." The modal closes, and within seconds:

1. A new colored block (blue for Individual Support) appears in the Monday 10:00-10:30 slot with the title "One-on-one reading with Emma"

2. The task "One-on-one reading with Emma" appears in the Task Bank sidebar with no locked times, ready to be dragged to other slots if needed later (e.g., Friday 10:00-10:30 for a different student)



Sarah can now see at a glance that Alex is assigned this task on Monday morning, and if she needs to assign the same task to another aide or date, she simply drags it from the Task Bank instead of recreating it.



***



### **User Story 2: Rapid Task Library Building**



**As a** teacher managing multiple classroom aides across different times and classrooms,  

**I want to** quickly build a library of recurring task types while simultaneously assigning them,  

**So that** I can establish consistent task categories and reduce time spent on administrative setup.



**Scenario:**



James is reorganizing the weekly schedule for his team of four classroom aides. He has a standard set of recurring tasks (morning check-in, transition support, lunch supervision rotation, one-on-one academic support, break-time monitoring) that he needs to assign across different slots and aides.



Rather than pre-creating all tasks in a batch and then dragging them to assign them, James works through the schedule slot-by-slot:



**Monday 8:45-9:00 (Maria's slot):** James clicks "+", creates "Morning Check-in" (Playground category), duration 15 minutes, notes "Take attendance and check lunch orders."



**Monday 11:30-12:00 (Alex's slot):** James clicks "+", creates "Lunch Supervision" (Class Support category), duration 30 minutes, notes "Monitor food allergies and manage seating."



**Monday 1:15-1:45 (Jordan's slot):** James clicks "+", creates "Transition Support" (Group Support category), duration 30 minutes, notes "Support movement between art room and classroom."



**Tuesday 8:45-9:00 (Maria's slot again):** James clicks "+", and the modal appears. He sees "Morning Check-in" is already in the task bank, but he's in a quick-create flow, so he could:

- **Option A:** Cancel, drag the existing "Morning Check-in" task from the Task Bank to this slot (reusing it)

- **Option B:** Continue creating if this slot needs a variant (e.g., "Morning Check-in + Food Prep for field trip")



By the end of the week, James has:

- A Task Bank with all his standard recurring tasks (no locked times, reusable)

- Assignments for all aides across all slots (showing who does what, when)

- No orphaned tasks or mismatched assignments

- The ability to see at a glance which tasks are used frequently (and might become recurring series)



In the following week, if James wants to replicate a similar schedule, he can drag existing tasks from the Task Bank to new slots, or use the quick-click feature again to create new tasks only where the schedule changes.



***
