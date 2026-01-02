# API Reference: CHARLOTTE

**Version**: 1.0.0  
**Base URL**: `http://localhost:5000/api`  
**Content-Type**: `application/json`

## Table of Contents

1. [Teacher Aides](#teacher-aides)
2. [Availability](#availability)
3. [Tasks](#tasks)
4. [Assignments](#assignments)
5. [Absences](#absences)
6. [Classrooms](#classrooms)
7. [Requests](#requests)
8. [Scheduler](#scheduler)
9. [Error Responses](#error-responses)

---

## Teacher Aides

Manage teacher aide profiles and information.

### List All Aides

```http
GET /api/aides
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "John Smith",
    "qualifications": "Special Education",
    "colour_hex": "#FF5733",
    "created_at": "2025-10-01T10:00:00Z",
    "updated_at": "2025-10-01T10:00:00Z"
  }
]
```

### Create Aide

```http
POST /api/aides
```

**Request Body**:
```json
{
  "name": "Mary Johnson",
  "qualifications": "Reading Specialist",
  "colour_hex": "#33C1FF"
}
```

**Validation**:
- `name`: Required, 1-100 characters
- `colour_hex`: Required, valid hex format (#RRGGBB)
- `qualifications`: Optional

**Response** (201 Created):
```json
{
  "id": 2,
  "name": "Mary Johnson",
  "qualifications": "Reading Specialist",
  "colour_hex": "#33C1FF",
  "created_at": "2025-10-01T10:30:00Z",
  "updated_at": "2025-10-01T10:30:00Z"
}
```

### Get Aide by ID

```http
GET /api/aides/{id}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "John Smith",
  "qualifications": "Special Education",
  "colour_hex": "#FF5733",
  "created_at": "2025-10-01T10:00:00Z",
  "updated_at": "2025-10-01T10:00:00Z"
}
```

### Update Aide

```http
PUT /api/aides/{id}
```

**Request Body** (all fields optional):
```json
{
  "name": "John Smith Jr.",
  "qualifications": "Special Education, Literacy",
  "colour_hex": "#FF6644"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "John Smith Jr.",
  "qualifications": "Special Education, Literacy",
  "colour_hex": "#FF6644",
  "created_at": "2025-10-01T10:00:00Z",
  "updated_at": "2025-10-01T11:00:00Z"
}
```

### Delete Aide

```http
DELETE /api/aides/{id}
```

**Response** (204 No Content)

**Note**: Deleting an aide cascades to:
- All availability records
- All absences
- Sets `aide_id` to NULL on assignments (preserves historical data)

---

## Availability

Manage weekly availability patterns for teacher aides.

### Get Aide Availability

```http
GET /api/aides/{id}/availability
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "aide_id": 1,
    "weekday": "MO",
    "start_time": "08:00",
    "end_time": "15:30"
  },
  {
    "id": 2,
    "aide_id": 1,
    "weekday": "TU",
    "start_time": "08:00",
    "end_time": "15:30"
  }
]
```

### Add Availability Slot

```http
POST /api/aides/{id}/availability
```

**Request Body**:
```json
{
  "weekday": "WE",
  "start_time": "09:00",
  "end_time": "14:00"
}
```

**Validation**:
- `weekday`: Required, one of [MO, TU, WE, TH, FR]
- `start_time` / `end_time`: Required, 30-minute increments (HH:MM format)
- `end_time` must be greater than `start_time`

**Response** (201 Created):
```json
{
  "id": 3,
  "aide_id": 1,
  "weekday": "WE",
  "start_time": "09:00",
  "end_time": "14:00"
}
```

**Error** (409 Conflict - Duplicate slot):
```json
{
  "error": "Duplicate availability slot",
  "message": "Availability slot for MO 08:00 already exists"
}
```

### Delete Availability Slot

```http
DELETE /api/availability/{id}
```

**Response** (204 No Content)

---

## Tasks

Manage task definitions (one-off or recurring).

### List Tasks

```http
GET /api/tasks?status={status}&category={category}&date={date}
```

**Query Parameters**:
- `status`: Filter by status (UNASSIGNED, ASSIGNED, IN_PROGRESS, COMPLETE)
- `category`: Filter by category (PLAYGROUND, CLASS_SUPPORT, GROUP_SUPPORT, INDIVIDUAL_SUPPORT)
- `date`: Filter by date (YYYY-MM-DD)

**Response** (200 OK):
```json
[
  {
    "id": 101,
    "title": "Morning Playground Duty",
    "category": "PLAYGROUND",
    "start_time": "10:30",
    "end_time": "11:00",
    "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    "expires_on": "2025-12-31",
    "classroom_id": null,
    "notes": "",
    "status": "ASSIGNED",
    "created_at": "2025-10-01T10:00:00Z",
    "updated_at": "2025-10-01T10:00:00Z"
  }
]
```

### Create One-Off Task

```http
POST /api/tasks
```

**Request Body**:
```json
{
  "title": "Grade 3A Reading Support",
  "category": "CLASS_SUPPORT",
  "start_time": "09:00",
  "end_time": "10:00",
  "classroom_id": 1,
  "notes": "Focus on phonics"
}
```

**Response** (201 Created):
```json
{
  "id": 102,
  "title": "Grade 3A Reading Support",
  "category": "CLASS_SUPPORT",
  "start_time": "09:00",
  "end_time": "10:00",
  "recurrence_rule": null,
  "expires_on": null,
  "classroom_id": 1,
  "notes": "Focus on phonics",
  "status": "UNASSIGNED",
  "created_at": "2025-10-01T10:30:00Z",
  "updated_at": "2025-10-01T10:30:00Z"
}
```

### Create Recurring Task

```http
POST /api/recurring-tasks
```

**Request Body**:
```json
{
  "title": "Daily Playground Duty",
  "category": "PLAYGROUND",
  "start_time": "10:30",
  "end_time": "11:00",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  "expires_on": "2025-12-31",
  "notes": "Monitor main playground area"
}
```

**Validation**:
- `recurrence_rule`: Valid iCal RRULE format (see RRULE spec)
- `expires_on`: Required for recurring tasks

**Response** (201 Created):
```json
{
  "task": {
    "id": 103,
    "title": "Daily Playground Duty",
    "category": "PLAYGROUND",
    "start_time": "10:30",
    "end_time": "11:00",
    "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
    "expires_on": "2025-12-31",
    "status": "UNASSIGNED"
  },
  "assignments_created": 20,
  "horizon_weeks": 4
}
```

### Get Task by ID

```http
GET /api/tasks/{id}
```

**Response** (200 OK):
```json
{
  "id": 101,
  "title": "Morning Playground Duty",
  "category": "PLAYGROUND",
  "start_time": "10:30",
  "end_time": "11:00",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  "expires_on": "2025-12-31",
  "classroom_id": null,
  "notes": "",
  "status": "ASSIGNED"
}
```

### Update Task

```http
PUT /api/tasks/{id}
```

**Request Body**:
```json
{
  "title": "Updated Playground Duty",
  "start_time": "10:00",
  "end_time": "10:30"
}
```

**Note**: For recurring tasks, this regenerates future assignments.

**Response** (200 OK):
```json
{
  "task": {
    "id": 101,
    "title": "Updated Playground Duty",
    "start_time": "10:00",
    "end_time": "10:30"
  },
  "assignments_regenerated": 15
}
```

### Delete Task

```http
DELETE /api/tasks/{id}
```

**Response** (204 No Content)

**Note**: Deletes future occurrences only (preserves historical assignments).

---

## Assignments

Manage task assignments to specific aides and time slots.

### List Assignments

```http
GET /api/assignments?week={week}&aide_id={aide_id}&status={status}
```

**Query Parameters**:
- `week`: ISO week (YYYY-WW) - defaults to current week
- `aide_id`: Filter by aide ID
- `status`: Filter by status

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "task_id": 101,
    "aide_id": 1,
    "date": "2025-10-06",
    "start_time": "10:30",
    "end_time": "11:00",
    "status": "ASSIGNED",
    "version": "2025-10-01T10:00:00Z",
    "task_title": "Morning Playground Duty",
    "task_category": "PLAYGROUND",
    "aide_name": "John Smith"
  }
]
```

### Get Weekly Matrix

```http
GET /api/assignments/weekly-matrix?week={week}
```

**Purpose**: Returns structured grid data for timetable UI.

**Query Parameters**:
- `week`: ISO week (YYYY-WW) - defaults to current week

**Response** (200 OK):
```json
{
  "week": "2025-W41",
  "start_date": "2025-10-06",
  "end_date": "2025-10-10",
  "time_slots": ["08:00", "08:30", "09:00", "...", "15:30"],
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "aides": [
    {
      "id": 1,
      "name": "John Smith",
      "qualifications": "Special Education",
      "colour_hex": "#FF5733"
    }
  ],
  "assignments": {
    "1_Monday_10:30": {
      "assignment_id": 1,
      "task_id": 101,
      "task_title": "Morning Playground Duty",
      "task_category": "PLAYGROUND",
      "start_time": "10:30",
      "end_time": "11:00",
      "status": "ASSIGNED"
    }
  },
  "absences": {
    "1_Tuesday": {
      "absence_id": 2,
      "reason": "Sick leave",
      "date": "2025-10-07"
    }
  }
}
```

### Create Assignment

```http
POST /api/assignments
```

**Request Body**:
```json
{
  "task_id": 101,
  "aide_id": 1,
  "date": "2025-10-06",
  "start_time": "10:30",
  "end_time": "11:00"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "task_id": 101,
  "aide_id": 1,
  "date": "2025-10-06",
  "start_time": "10:30",
  "end_time": "11:00",
  "status": "ASSIGNED",
  "version": "2025-10-01T10:00:00Z"
}
```

**Error** (409 Conflict - Time collision):
```json
{
  "error": "Assignment conflict",
  "conflict_type": "time_collision",
  "conflicting_assignment": {
    "id": 5,
    "task_title": "Existing Task",
    "start_time": "10:30",
    "end_time": "11:00",
    "aide_name": "John Smith"
  },
  "suggestion": "replace"
}
```

### Batch Create Assignments

```http
POST /api/assignments/batch
```

**Purpose**: Create multiple assignments (e.g., recurring task across selected days).

**Request Body**:
```json
{
  "task_id": 101,
  "aide_id": 2,
  "dates": ["2025-10-06", "2025-10-08", "2025-10-10"]
}
```

**Response** (201 Created):
```json
{
  "assignments": [
    {
      "id": 4,
      "task_id": 101,
      "aide_id": 2,
      "date": "2025-10-06",
      "start_time": "10:30",
      "end_time": "11:00",
      "status": "ASSIGNED"
    }
  ],
  "conflicts": []
}
```

### Check Collision (Dry Run)

```http
POST /api/assignments/check
```

**Request Body**:
```json
{
  "task_id": 101,
  "aide_id": 1,
  "date": "2025-10-06",
  "start_time": "10:30",
  "end_time": "11:00"
}
```

**Response** (200 OK - No conflict):
```json
{
  "conflict": false
}
```

**Response** (409 Conflict):
```json
{
  "conflict": true,
  "conflicting_assignment": {
    "id": 1,
    "task_title": "Morning Playground Duty",
    "start_time": "10:30",
    "end_time": "11:00"
  },
  "suggestion": "replace"
}
```

### Update Assignment

```http
PUT /api/assignments/{id}
```

**Request Body** (with optimistic locking):
```json
{
  "aide_id": 2,
  "start_time": "10:00",
  "end_time": "10:30",
  "version": "2025-10-01T10:00:00Z"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "task_id": 101,
  "aide_id": 2,
  "date": "2025-10-06",
  "start_time": "10:00",
  "end_time": "10:30",
  "status": "ASSIGNED",
  "version": "2025-10-01T11:00:00Z"
}
```

**Error** (409 Conflict - Version mismatch):
```json
{
  "error": "Concurrent modification detected",
  "current_state": {
    "aide_id": 3,
    "version": "2025-10-01T10:30:00Z"
  },
  "your_changes": {
    "aide_id": 2,
    "version": "2025-10-01T10:00:00Z"
  }
}
```

### Delete Assignment

```http
DELETE /api/assignments/{id}
```

**Response** (204 No Content)

---

## Absences

Manage aide absences with automatic assignment reassignment.

### List Absences

```http
GET /api/absences?week={week}
```

**Query Parameters**:
- `week`: ISO week (YYYY-WW) - defaults to current week

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "aide_id": 1,
    "date": "2025-10-06",
    "reason": "Sick leave",
    "created_at": "2025-10-01T10:00:00Z",
    "aide_name": "John Smith"
  }
]
```

### Create Absence

```http
POST /api/absences
```

**Request Body**:
```json
{
  "aide_id": 1,
  "date": "2025-10-06",
  "reason": "Sick leave"
}
```

**Response** (201 Created):
```json
{
  "absence": {
    "id": 1,
    "aide_id": 1,
    "date": "2025-10-06",
    "reason": "Sick leave",
    "created_at": "2025-10-01T10:00:00Z"
  },
  "affected_assignments": [
    {
      "id": 1,
      "task_id": 101,
      "aide_id": null,
      "date": "2025-10-06",
      "start_time": "10:30",
      "end_time": "11:00",
      "status": "UNASSIGNED",
      "task_title": "Morning Playground Duty"
    }
  ]
}
```

**Note**: Creating an absence automatically unassigns all tasks for that aide on that date.

### Delete Absence

```http
DELETE /api/absences/{id}
```

**Response** (200 OK):
```json
{
  "restored_assignments": [1, 3],
  "conflicts": [2]
}
```

**Note**:
- `restored_assignments`: Assignment IDs successfully restored to the aide
- `conflicts`: Assignment IDs that couldn't be restored (slot occupied)

---

## Classrooms

Manage classroom resources.

### List Classrooms

```http
GET /api/classrooms
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Room 101",
    "capacity": 25,
    "notes": "Primary classroom",
    "created_at": "2025-10-01T10:00:00Z"
  }
]
```

### Create Classroom

```http
POST /api/classrooms
```

**Request Body**:
```json
{
  "name": "Library",
  "capacity": 50,
  "notes": "Main library area"
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "name": "Library",
  "capacity": 50,
  "notes": "Main library area",
  "created_at": "2025-10-01T10:30:00Z"
}
```

### Update Classroom

```http
PUT /api/classrooms/{id}
```

**Request Body**:
```json
{
  "name": "Updated Library",
  "capacity": 60
}
```

**Response** (200 OK)

### Delete Classroom

```http
DELETE /api/classrooms/{id}
```

**Response** (204 No Content)

**Note**: Sets `classroom_id` to NULL on associated tasks.

---

## Requests

Manage teacher requests for aide support.

### List Requests

```http
GET /api/requests?status={status}
```

**Query Parameters**:
- `status`: Filter by status (PENDING, APPROVED, REJECTED)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "requesting_teacher": "Ms. Smith",
    "task_title": "Reading Support",
    "task_category": "CLASS_SUPPORT",
    "preferred_date": "2025-10-08",
    "preferred_time": "09:00",
    "classroom_id": 1,
    "notes": "Focus on struggling readers",
    "status": "PENDING",
    "created_at": "2025-10-01T10:00:00Z"
  }
]
```

### Create Request

```http
POST /api/requests
```

**Request Body**:
```json
{
  "requesting_teacher": "Ms. Smith",
  "task_title": "Reading Support",
  "task_category": "CLASS_SUPPORT",
  "preferred_date": "2025-10-08",
  "preferred_time": "09:00",
  "classroom_id": 1,
  "notes": "Focus on struggling readers"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "requesting_teacher": "Ms. Smith",
  "task_title": "Reading Support",
  "task_category": "CLASS_SUPPORT",
  "preferred_date": "2025-10-08",
  "preferred_time": "09:00",
  "classroom_id": 1,
  "notes": "Focus on struggling readers",
  "status": "PENDING",
  "created_at": "2025-10-01T10:00:00Z"
}
```

### Update Request Status

```http
PUT /api/requests/{id}
```

**Request Body**:
```json
{
  "status": "APPROVED"
}
```

**Response** (200 OK):
```json
{
  "request": {
    "id": 1,
    "status": "APPROVED"
  },
  "task_created": {
    "id": 105,
    "title": "Reading Support"
  },
  "assignment_created": {
    "id": 10,
    "status": "UNASSIGNED"
  }
}
```

**Note**: Approving a request automatically creates a Task and an unassigned Assignment.

---

## Scheduler

Manage the background scheduler for recurring task horizon extension.

### Get Scheduler Status

```http
GET /api/scheduler/status
```

**Response** (200 OK):
```json
{
  "status": "running",
  "last_run": "2025-10-01T00:00:00Z",
  "next_run": "2025-10-08T00:00:00Z",
  "horizon_weeks": 4
}
```

### Control Scheduler

```http
POST /api/scheduler/control
```

**Request Body**:
```json
{
  "action": "start"
}
```

**Actions**: `start`, `stop`

**Response** (200 OK):
```json
{
  "status": "running",
  "message": "Scheduler started"
}
```

### Manually Extend Horizon

```http
POST /api/scheduler/extend-horizon
```

**Request Body**:
```json
{
  "weeks": 2
}
```

**Response** (200 OK):
```json
{
  "assignments_created": 45,
  "new_horizon_end": "2025-11-15"
}
```

---

## Error Responses

All error responses follow this format:

### 400 Bad Request

```json
{
  "error": "Validation error",
  "message": "Invalid time format",
  "details": {
    "field": "start_time",
    "value": "25:00",
    "constraint": "Time must be in HH:MM format with 30-minute increments"
  }
}
```

### 404 Not Found

```json
{
  "error": "Resource not found",
  "message": "Teacher aide with ID 999 does not exist"
}
```

### 409 Conflict

```json
{
  "error": "Assignment conflict",
  "conflict_type": "time_collision",
  "conflicting_assignment": {
    "id": 1,
    "task_title": "Morning Playground Duty",
    "start_time": "10:30",
    "end_time": "11:00",
    "aide_name": "John Smith"
  },
  "suggestion": "replace"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "request_id": "abc-123-def"
}
```

---

## Data Types & Enums

### Task Categories
- `PLAYGROUND`: Playground supervision
- `CLASS_SUPPORT`: In-class assistance
- `GROUP_SUPPORT`: Small group work
- `INDIVIDUAL_SUPPORT`: One-on-one student support

### Assignment/Task Status
- `UNASSIGNED`: No aide assigned
- `ASSIGNED`: Aide assigned, not started
- `IN_PROGRESS`: Aide currently performing task
- `COMPLETE`: Task finished

### Request Status
- `PENDING`: Awaiting admin review
- `APPROVED`: Request approved, task created
- `REJECTED`: Request declined

### Weekdays
- `MO`: Monday
- `TU`: Tuesday
- `WE`: Wednesday
- `TH`: Thursday
- `FR`: Friday

### Time Constraints
- All times must be in 30-minute increments (00, 30)
- Valid range: 08:00 to 16:00 (school hours)
- Format: HH:MM (24-hour)

### Date Formats
- **ISO Date**: YYYY-MM-DD (e.g., "2025-10-06")
- **ISO Week**: YYYY-WW (e.g., "2025-W41")
- **Timestamp**: ISO 8601 format (e.g., "2025-10-01T10:00:00Z")

---

## RRULE Recurrence Patterns

See [RRULE Specification](../specs/001-create-a-drag/contracts/rrule-spec.md) for detailed patterns.

**Common Examples**:

**Daily (weekdays only)**:
```
FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
```

**Every Monday and Wednesday**:
```
FREQ=WEEKLY;BYDAY=MO,WE
```

**First Monday of each month**:
```
FREQ=MONTHLY;BYDAY=1MO
```

**Ends on specific date**:
```
FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20251231
```

---

## Rate Limits

**MVP**: No rate limits (local operation)  
**Future**: May implement rate limiting for multi-user deployments

---

## Authentication

**MVP**: No authentication required (trusted local environment)  
**Future**: JWT-based authentication planned for post-MVP

---

## Changelog

### Version 1.0.0 (2025-10-01)
- Initial API release
- Teacher aide management
- Task and assignment management
- Recurring tasks with RRULE support
- Absence handling with cascade reassignment
- Conflict detection and resolution
- Weekly matrix endpoint for timetable grid
- Background scheduler for horizon extension

---

**Last Updated**: 2025-10-03  
**OpenAPI Specification**: See `specs/001-create-a-drag/contracts/api-spec.yaml`

