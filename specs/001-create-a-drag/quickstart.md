# Quickstart: Drag-and-Drop Assignment Integration Test

**Feature**: 001-create-a-drag  
**Purpose**: Validate primary user journey - administrator assigns tasks via drag-and-drop  
**Test Type**: Integration test (API-level validation of user story)

## Test Scenario

Validate that an administrator can:
1. View the weekly timetable with unassigned tasks
2. Drag a task to an aide's time slot (assignment creation)
3. Handle conflicts when time slot is occupied
4. Mark an aide absent (automatic task reassignment)
5. Undo the absence (restore assignments if possible)

---

## Prerequisites

### 1. Database Setup
```bash
# Reset database and seed with test data
rm -f instance/timetable.db
python seed.py
```

### 2. Start Backend Server
```bash
python app.py
# Backend should be running at http://localhost:5000
```

### 3. Test Data Required
- **Teacher Aides**: At least 2 aides (John Smith, Mary Johnson)
- **Classrooms**: Room 101, Library
- **Tasks**: 
  - Morning Playground Duty (PLAYGROUND, 10:30-11:00, recurring MO-FR)
  - Grade 3A Reading Support (CLASS_SUPPORT, 09:00-10:00, one-off)
- **Week**: 2025-W41 (October 6-10, 2025)

---

## Test Steps

### STEP 1: View Weekly Timetable

**Request**:
```http
GET /api/assignments/weekly-matrix?week=2025-W41
```

**Expected Response** (200 OK):
```json
{
  "week": "2025-W41",
  "start_date": "2025-10-06",
  "end_date": "2025-10-10",
  "time_slots": [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", 
    "14:00", "14:30", "15:00", "15:30"
  ],
  "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "aides": [
    {
      "id": 1,
      "name": "John Smith",
      "qualifications": "Special Education",
      "colour_hex": "#FF5733"
    },
    {
      "id": 2,
      "name": "Mary Johnson",
      "qualifications": "Reading Specialist",
      "colour_hex": "#33C1FF"
    }
  ],
  "assignments": {},
  "absences": {}
}
```

**Validation**:
- ✅ Response status 200
- ✅ Week metadata correct (2025-W41, start/end dates)
- ✅ 16 time slots (08:00 to 15:30 in 30-min increments)
- ✅ 5 days (Monday-Friday)
- ✅ Aides list populated (at least 2 aides)
- ✅ Assignments initially empty (or show only pre-seeded data)

---

### STEP 2: Get Unassigned Tasks

**Request**:
```http
GET /api/assignments?status=UNASSIGNED&week=2025-W41
```

**Expected Response** (200 OK):
```json
[
  {
    "id": 1,
    "task_id": 101,
    "aide_id": null,
    "date": "2025-10-06",
    "start_time": "10:30",
    "end_time": "11:00",
    "status": "UNASSIGNED",
    "task_title": "Morning Playground Duty",
    "task_category": "PLAYGROUND"
  },
  {
    "id": 2,
    "task_id": 102,
    "aide_id": null,
    "date": "2025-10-06",
    "start_time": "09:00",
    "end_time": "10:00",
    "status": "UNASSIGNED",
    "task_title": "Grade 3A Reading Support",
    "task_category": "CLASS_SUPPORT",
    "classroom": "Room 101"
  }
]
```

**Validation**:
- ✅ Response status 200
- ✅ All assignments have `aide_id: null`
- ✅ All assignments have `status: "UNASSIGNED"`
- ✅ Task details included (title, category, classroom)

---

### STEP 3: Assign Task via Drag-Drop (Collision Check)

**Request** (Dry-run collision check):
```http
POST /api/assignments/check
Content-Type: application/json

{
  "task_id": 101,
  "aide_id": 1,
  "date": "2025-10-06",
  "start_time": "10:30",
  "end_time": "11:00"
}
```

**Expected Response** (200 OK - No Conflict):
```json
{
  "conflict": false
}
```

**Validation**:
- ✅ Response status 200
- ✅ `conflict: false` (slot is available)

---

### STEP 4: Create Assignment (Drag-Drop Commit)

**Request**:
```http
POST /api/assignments
Content-Type: application/json

{
  "task_id": 101,
  "aide_id": 1,
  "date": "2025-10-06",
  "start_time": "10:30",
  "end_time": "11:00"
}
```

**Expected Response** (201 Created):
```json
{
  "id": 1,
  "task_id": 101,
  "aide_id": 1,
  "date": "2025-10-06",
  "start_time": "10:30",
  "end_time": "11:00",
  "status": "ASSIGNED",
  "version": "2025-10-01T10:30:00Z",
  "task_title": "Morning Playground Duty",
  "task_category": "PLAYGROUND"
}
```

**Validation**:
- ✅ Response status 201
- ✅ Assignment created with `aide_id: 1`
- ✅ Status changed to `ASSIGNED`
- ✅ `version` timestamp set (for optimistic locking)

---

### STEP 5: Verify Assignment in Timetable

**Request**:
```http
GET /api/assignments/weekly-matrix?week=2025-W41
```

**Expected Response** (200 OK):
```json
{
  ...
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
  ...
}
```

**Validation**:
- ✅ Assignment appears in `assignments` object
- ✅ Key format: `{aide_id}_{day}_{time}` = `"1_Monday_10:30"`
- ✅ Assignment details correct (task title, times, status)

---

### STEP 6: Conflict Detection (Assign to Occupied Slot)

**Request** (Attempt to assign different task to same slot):
```http
POST /api/assignments/check
Content-Type: application/json

{
  "task_id": 102,
  "aide_id": 1,
  "date": "2025-10-06",
  "start_time": "10:30",
  "end_time": "11:00"
}
```

**Expected Response** (409 Conflict):
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

**Validation**:
- ✅ Response status 409 (Conflict)
- ✅ Error message identifies conflict type
- ✅ Conflicting assignment details provided
- ✅ Suggestion offered (replace/cancel)

---

### STEP 7: Partial Overlap Auto-Shorten

**Scenario**: Drag 30-minute task (09:30-10:00) when 09:00-10:30 task exists

**Request** (Create first assignment):
```http
POST /api/assignments
Content-Type: application/json

{
  "task_id": 102,
  "aide_id": 1,
  "date": "2025-10-07",
  "start_time": "09:00",
  "end_time": "10:30"
}
```

**Expected Response** (201 Created):
```json
{
  "id": 2,
  "aide_id": 1,
  "date": "2025-10-07",
  "start_time": "09:00",
  "end_time": "10:30",
  "status": "ASSIGNED"
}
```

**Request** (Drop overlapping task):
```http
POST /api/assignments
Content-Type: application/json

{
  "task_id": 103,
  "aide_id": 1,
  "date": "2025-10-07",
  "start_time": "09:30",
  "end_time": "10:00"
}
```

**Expected Response** (201 Created + Auto-Shorten):
```json
{
  "id": 3,
  "aide_id": 1,
  "date": "2025-10-07",
  "start_time": "09:30",
  "end_time": "10:00",
  "status": "ASSIGNED",
  "auto_shortened": {
    "assignment_id": 2,
    "old_end_time": "10:30",
    "new_end_time": "09:30"
  }
}
```

**Validation**:
- ✅ New assignment created successfully
- ✅ First assignment automatically shortened (end_time: 10:30 → 09:30)
- ✅ Response includes `auto_shortened` details

---

### STEP 8: Mark Aide Absent

**Request**:
```http
POST /api/absences
Content-Type: application/json

{
  "aide_id": 1,
  "date": "2025-10-06",
  "reason": "Sick leave"
}
```

**Expected Response** (201 Created):
```json
{
  "absence": {
    "id": 1,
    "aide_id": 1,
    "date": "2025-10-06",
    "reason": "Sick leave",
    "created_at": "2025-10-01T10:45:00Z"
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

**Validation**:
- ✅ Response status 201
- ✅ Absence record created
- ✅ Affected assignments returned (aide_id set to null, status = UNASSIGNED)
- ✅ Assignment returned to unassigned pool

---

### STEP 9: Verify Absence in Timetable

**Request**:
```http
GET /api/assignments/weekly-matrix?week=2025-W41
```

**Expected Response** (200 OK):
```json
{
  ...
  "absences": {
    "1_Monday": {
      "absence_id": 1,
      "reason": "Sick leave",
      "date": "2025-10-06"
    }
  },
  "assignments": {}
}
```

**Validation**:
- ✅ Absence appears in `absences` object
- ✅ Key format: `{aide_id}_{day}` = `"1_Monday"`
- ✅ Assignments for that aide/date removed from grid
- ✅ Frontend can render striped overlay on aide's Monday column

---

### STEP 10: Undo Absence (Restore Assignments)

**Request**:
```http
DELETE /api/absences/1
```

**Expected Response** (200 OK):
```json
{
  "restored_assignments": [1],
  "conflicts": []
}
```

**Validation**:
- ✅ Response status 200
- ✅ Assignment ID 1 restored (if slot still available)
- ✅ `conflicts: []` (no conflicts during restore)

**Alternative Response** (if slot occupied):
```json
{
  "restored_assignments": [],
  "conflicts": [1]
}
```

**Validation**:
- ✅ Assignment ID 1 in `conflicts` array (slot occupied, cannot restore)
- ✅ Assignment remains UNASSIGNED

---

### STEP 11: Recurring Task Multi-Day Assignment

**Request** (Drag recurring task to Monday slot):
```http
POST /api/assignments/batch
Content-Type: application/json

{
  "task_id": 101,
  "aide_id": 2,
  "dates": [
    "2025-10-06",
    "2025-10-08",
    "2025-10-10"
  ]
}
```

**Expected Response** (201 Created):
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
    },
    {
      "id": 5,
      "task_id": 101,
      "aide_id": 2,
      "date": "2025-10-08",
      "start_time": "10:30",
      "end_time": "11:00",
      "status": "ASSIGNED"
    },
    {
      "id": 6,
      "task_id": 101,
      "aide_id": 2,
      "date": "2025-10-10",
      "start_time": "10:30",
      "end_time": "11:00",
      "status": "ASSIGNED"
    }
  ],
  "conflicts": []
}
```

**Validation**:
- ✅ Response status 201
- ✅ 3 assignments created (one per selected date)
- ✅ All assigned to aide_id 2 (Mary Johnson)
- ✅ No conflicts detected

---

## Success Criteria

All test steps must pass with expected responses:

- [x] **STEP 1**: Weekly matrix endpoint returns correct structure
- [x] **STEP 2**: Unassigned tasks are filterable and include task details
- [x] **STEP 3**: Collision check (dry-run) works correctly
- [x] **STEP 4**: Assignment creation succeeds with aide assignment
- [x] **STEP 5**: Assignment appears in weekly matrix
- [x] **STEP 6**: Conflict detection returns 409 with details
- [x] **STEP 7**: Partial overlap triggers auto-shorten
- [x] **STEP 8**: Absence creation unassigns tasks automatically
- [x] **STEP 9**: Absence appears in weekly matrix
- [x] **STEP 10**: Absence deletion restores assignments (or reports conflicts)
- [x] **STEP 11**: Batch assignment creates multiple occurrences

---

## Running the Test

### Option 1: Manual API Testing (Postman/cURL)

1. Start backend: `python app.py`
2. Import API spec: `specs/001-create-a-drag/contracts/api-spec.yaml`
3. Execute each step sequentially
4. Verify responses match expected results

### Option 2: Automated Integration Test (pytest)

Create `tests/test_quickstart.py`:

```python
import pytest
from flask import json

def test_drag_drop_assignment_flow(client):
    """Test complete user journey from spec quickstart.md"""
    
    # STEP 1: View weekly timetable
    response = client.get('/api/assignments/weekly-matrix?week=2025-W41')
    assert response.status_code == 200
    data = response.get_json()
    assert data['week'] == '2025-W41'
    assert len(data['time_slots']) == 16
    assert len(data['days']) == 5
    
    # STEP 2: Get unassigned tasks
    response = client.get('/api/assignments?status=UNASSIGNED&week=2025-W41')
    assert response.status_code == 200
    unassigned = response.get_json()
    assert all(a['aide_id'] is None for a in unassigned)
    
    # STEP 3: Collision check (should pass)
    response = client.post('/api/assignments/check', json={
        'task_id': 101,
        'aide_id': 1,
        'date': '2025-10-06',
        'start_time': '10:30',
        'end_time': '11:00'
    })
    assert response.status_code == 200
    assert response.get_json()['conflict'] == False
    
    # STEP 4: Create assignment
    response = client.post('/api/assignments', json={
        'task_id': 101,
        'aide_id': 1,
        'date': '2025-10-06',
        'start_time': '10:30',
        'end_time': '11:00'
    })
    assert response.status_code == 201
    assignment = response.get_json()
    assert assignment['aide_id'] == 1
    assert assignment['status'] == 'ASSIGNED'
    
    # STEP 8: Mark aide absent
    response = client.post('/api/absences', json={
        'aide_id': 1,
        'date': '2025-10-06',
        'reason': 'Sick leave'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['absence']['aide_id'] == 1
    assert len(data['affected_assignments']) > 0
    assert data['affected_assignments'][0]['aide_id'] is None
    
    # Continue with remaining steps...
```

Run: `pytest tests/test_quickstart.py -v`

---

## Cleanup

After testing, reset the database:

```bash
rm -f instance/timetable.db
python seed.py
```

---

## Summary

This quickstart validates the core drag-and-drop assignment flow:
1. ✅ View timetable grid
2. ✅ Assign tasks via API (simulating drag-drop)
3. ✅ Detect and handle conflicts
4. ✅ Manage absences with automatic reassignment
5. ✅ Restore assignments when absence removed
6. ✅ Handle recurring tasks with multi-day selection

**Next Steps**:
- Frontend E2E tests (Cypress) with actual drag-drop interaction
- Load testing (500+ assignments/week)
- Accessibility testing (keyboard navigation, screen readers)



