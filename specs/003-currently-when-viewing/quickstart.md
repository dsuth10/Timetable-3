# Quickstart Guide: Interactive Task Selection

## Feature Overview
This feature prevents the automatic creation of duplicate "Class Support" tasks by interrupting the assignment drag-and-drop flow with a selection modal.

## Prerequisites
- The application must be running (`npm start` frontend, `flask run` backend).
- There must be at least one **Classroom** and one **Teacher Aide** in the system.
- There should be some existing tasks for testing the selection list.

## Testing Steps

### 1. Verify Drag Interception
1. Navigate to the **Schedule** view.
2. Ensure "Class View" is active (columns are classes).
3. Drag a **Teacher Aide** from the sidebar.
4. Drop the aide onto a time slot for "Classroom A".
5. **EXPECT**: A modal titled "Select Task" appears. The aide is NOT immediately assigned.

### 2. Select Existing Task
1. In the "Select Task" modal, observe the list of tasks.
2. Ensure only tasks for "Classroom A" are visible.
3. Click on an existing task (e.g., "Math Support").
4. **EXPECT**: The modal closes. The aide is assigned to the slot. The assignment label matches the selected task ("Math Support").

### 3. Quick Create Task
1. Drag an aide to a slot again (trigger modal).
2. Click "Create New Task".
3. **EXPECT**: The list is replaced/expanded with a form.
4. Enter Title: "Reading Circle". Description: "Group B".
5. Click "Create & Assign".
6. **EXPECT**: The modal closes. The aide is assigned. The assignment label says "Reading Circle".
7. **VERIFY**: Go to the Task List view (if available) or check DB; "Reading Circle" should exist linked to "Classroom A".

### 4. Cancel Flow
1. Drag an aide to a slot (trigger modal).
2. Click "Cancel" or click outside the modal.
3. **EXPECT**: The modal closes. No assignment is made. The aide remains in the sidebar/available list.

### 5. Empty State
1. Create a new empty Classroom.
2. Drag an aide to this classroom.
3. **EXPECT**: The modal appears. The task list is empty or shows "No existing tasks". The "Create New Task" option is prominent.

