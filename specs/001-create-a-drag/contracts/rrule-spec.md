# iCal RRULE Specification for Recurring Tasks

**Feature**: 001-create-a-drag  
**Standard**: RFC 5545 (iCalendar)  
**Library**: python-dateutil (backend)

## Supported RRULE Patterns

### 1. Daily Recurring Tasks

**Pattern**: Tasks that repeat every school day (Monday-Friday)

**RRULE**: `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR`

**Example Use Case**: Morning announcements duty (occurs every weekday)

**Generated Occurrences** (4-week horizon starting 2025-10-06):
- 2025-10-06 (Monday)
- 2025-10-07 (Tuesday)
- 2025-10-08 (Wednesday)
- 2025-10-09 (Thursday)
- 2025-10-10 (Friday)
- 2025-10-13 (Monday) ... continues for 4 weeks

---

### 2. Weekly Recurring Tasks (Specific Days)

**Pattern**: Tasks that repeat on specific days of the week

**RRULE**: `FREQ=WEEKLY;BYDAY=MO,WE,FR`

**Example Use Case**: Playground duty on Monday, Wednesday, Friday

**Generated Occurrences** (4-week horizon starting 2025-10-06):
- 2025-10-06 (Monday)
- 2025-10-08 (Wednesday)
- 2025-10-10 (Friday)
- 2025-10-13 (Monday)
- 2025-10-15 (Wednesday)
- 2025-10-17 (Friday) ... continues for 4 weeks

---

### 3. Single Weekday Recurring

**Pattern**: Tasks that repeat every specific weekday

**RRULE**: `FREQ=WEEKLY;BYDAY=TU`

**Example Use Case**: Library support every Tuesday

**Generated Occurrences** (4-week horizon starting 2025-10-06):
- 2025-10-07 (Tuesday)
- 2025-10-14 (Tuesday)
- 2025-10-21 (Tuesday)
- 2025-10-28 (Tuesday)

---

### 4. Expiration Date

**Pattern**: Recurring tasks that stop after a specific date

**RRULE**: `FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20251231T000000Z`

**Example Use Case**: Term 4 playground duty (ends December 31, 2025)

**Behavior**:
- Generate occurrences up to `expires_on` date
- Do not generate occurrences beyond expiration
- Task remains in database but no new assignments created

---

## RRULE Components Reference

### FREQ (Frequency) - Required
- `DAILY`: Every day (filtered to school days via BYDAY)
- `WEEKLY`: Every week on specified days

**Note**: `MONTHLY`, `YEARLY` not used in MVP (playground/classroom duties are weekly)

### BYDAY (By Day) - Required for School Context
- `MO`: Monday
- `TU`: Tuesday
- `WE`: Wednesday
- `TH`: Thursday
- `FR`: Friday

**Note**: `SA`, `SU` excluded (no weekend duties)

### UNTIL (Until Date) - Mapped to `expires_on` Column
- ISO 8601 format: `YYYYMMDDTHHmmssZ`
- Task expiration date stored separately in `tasks.expires_on`
- RRULE regenerated with UNTIL clause when needed

### COUNT (Occurrence Count) - Not Used
- Replaced by horizon-based generation (4-10 weeks)
- More predictable for timetable UI

### INTERVAL - Default to 1
- `INTERVAL=2` would mean every other week
- MVP uses default (INTERVAL=1) for simplicity

---

## Assignment Generation Algorithm

### 1. Eager Generation (On Task Creation)

```python
from dateutil.rrule import rrulestr
from datetime import datetime, timedelta

def generate_assignments(task):
    if not task.recurrence_rule:
        # One-off task: create single assignment
        return [create_assignment(task, task.date)]
    
    # Parse RRULE
    rrule = rrulestr(task.recurrence_rule, dtstart=datetime.now())
    
    # Determine horizon (4 weeks default, 10 weeks max)
    horizon_weeks = 4  # configurable
    end_date = min(
        datetime.now() + timedelta(weeks=horizon_weeks),
        task.expires_on or datetime.max
    )
    
    # Generate occurrences
    occurrences = rrule.between(datetime.now(), end_date, inc=True)
    
    # Limit to max 200 occurrences (safety)
    occurrences = occurrences[:200]
    
    # Create assignment shells
    assignments = []
    for date in occurrences:
        assignment = Assignment(
            task_id=task.id,
            aide_id=None,  # UNASSIGNED initially
            date=date,
            start_time=task.start_time,
            end_time=task.end_time,
            status='UNASSIGNED'
        )
        assignments.append(assignment)
    
    return assignments
```

### 2. Horizon Extension (Background Scheduler)

**Trigger**: Every Saturday midnight (configurable)

**Logic**:
1. Find all recurring tasks with `recurrence_rule` not NULL
2. For each task, check latest assignment date
3. If latest date < 4 weeks from today, generate more occurrences
4. Extend up to configured horizon (4-10 weeks)

**Safety Limits**:
- Max 200 occurrences per task total
- Max 50 new assignments per extension cycle
- Skip if task expired (`expires_on` < today)

### 3. Task Modification Handling

**Scenario**: Admin updates recurring task (e.g., changes time from 09:00 to 10:00)

**Behavior**:
1. Delete all future assignments (date >= today, status = UNASSIGNED)
2. Regenerate assignments from today using new task details
3. Preserve past/in-progress assignments

**Response**:
```json
{
  "task": {...},
  "assignments_updated": 12
}
```

---

## Multi-Day Selection on Drag-Drop

**Scenario**: Admin drags recurring task stub to Monday 09:00 slot

**UI Flow**:
1. Detect task has `recurrence_rule`
2. Parse RRULE to extract BYDAY values
3. Show dialog: "Which days should this assignment apply?"
   - Pre-tick days from BYDAY (e.g., MO, WE, FR already selected)
   - Allow admin to adjust selection
4. On confirm: POST /api/assignments/batch with selected dates

**Backend** (`POST /api/assignments/batch`):
```json
{
  "task_id": 123,
  "aide_id": 5,
  "dates": ["2025-10-06", "2025-10-08", "2025-10-10"]
}
```

**Response**:
```json
{
  "assignments": [
    {"id": 1, "date": "2025-10-06", ...},
    {"id": 2, "date": "2025-10-08", ...},
    {"id": 3, "date": "2025-10-10", ...}
  ],
  "conflicts": []
}
```

---

## Edge Cases & Validation

### 1. Invalid RRULE Format
**Input**: `FREQ=DAILY` (missing BYDAY for school context)  
**Validation**: Reject with error "School tasks must specify BYDAY (MO-FR)"

### 2. Weekend Days in BYDAY
**Input**: `FREQ=WEEKLY;BYDAY=SA,SU`  
**Validation**: Reject with error "Tasks cannot be scheduled on weekends"

### 3. Expired Task
**Scenario**: Task with `expires_on=2025-09-30` (past date)  
**Behavior**: Do not generate new assignments, mark task as expired

### 4. Excessive Occurrences
**Scenario**: `FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR` for 1 year  
**Limit**: Cap at 200 occurrences, return warning in response

### 5. UNTIL vs expires_on Mismatch
**Scenario**: RRULE has `UNTIL=20251231` but `expires_on=20260630`  
**Resolution**: Use earlier date (UNTIL takes precedence)

---

## Examples

### Example 1: Morning Playground Duty (Daily Weekdays)

**Task**:
```json
{
  "title": "Morning Playground Duty",
  "category": "PLAYGROUND",
  "start_time": "10:30",
  "end_time": "11:00",
  "recurrence_rule": "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
  "expires_on": "2025-12-31"
}
```

**Generated Assignments** (Week 2025-W41, 4-week horizon):
- 2025-10-06 (Monday) 10:30-11:00 [UNASSIGNED]
- 2025-10-07 (Tuesday) 10:30-11:00 [UNASSIGNED]
- 2025-10-08 (Wednesday) 10:30-11:00 [UNASSIGNED]
- 2025-10-09 (Thursday) 10:30-11:00 [UNASSIGNED]
- 2025-10-10 (Friday) 10:30-11:00 [UNASSIGNED]
- ... continues for 4 weeks (20 assignments total)

### Example 2: Reading Support (MWF Only)

**Task**:
```json
{
  "title": "Grade 3A Reading Support",
  "category": "CLASS_SUPPORT",
  "start_time": "09:00",
  "end_time": "10:00",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO,WE,FR",
  "expires_on": "2025-12-20",
  "classroom_id": 5
}
```

**Generated Assignments** (Week 2025-W41, 4-week horizon):
- 2025-10-06 (Monday) 09:00-10:00 [UNASSIGNED]
- 2025-10-08 (Wednesday) 09:00-10:00 [UNASSIGNED]
- 2025-10-10 (Friday) 09:00-10:00 [UNASSIGNED]
- 2025-10-13 (Monday) 09:00-10:00 [UNASSIGNED]
- 2025-10-15 (Wednesday) 09:00-10:00 [UNASSIGNED]
- 2025-10-17 (Friday) 09:00-10:00 [UNASSIGNED]
- ... continues for 4 weeks (12 assignments total)

### Example 3: Library Tuesday (Single Day)

**Task**:
```json
{
  "title": "Library Organization",
  "category": "CLASS_SUPPORT",
  "start_time": "14:00",
  "end_time": "15:30",
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=TU",
  "expires_on": null
}
```

**Generated Assignments** (Week 2025-W41, 4-week horizon):
- 2025-10-07 (Tuesday) 14:00-15:30 [UNASSIGNED]
- 2025-10-14 (Tuesday) 14:00-15:30 [UNASSIGNED]
- 2025-10-21 (Tuesday) 14:00-15:30 [UNASSIGNED]
- 2025-10-28 (Tuesday) 14:00-15:30 [UNASSIGNED]

---

## Testing

### Unit Tests (Backend)

**Test RRULE Parsing**:
```python
def test_parse_daily_weekdays():
    rule = "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"
    occurrences = generate_occurrences(rule, "2025-10-06", weeks=1)
    assert len(occurrences) == 5  # M-F of week 41

def test_parse_weekly_specific_days():
    rule = "FREQ=WEEKLY;BYDAY=MO,WE,FR"
    occurrences = generate_occurrences(rule, "2025-10-06", weeks=2)
    assert len(occurrences) == 6  # 3 days/week * 2 weeks

def test_expires_on_limit():
    rule = "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"
    occurrences = generate_occurrences(rule, "2025-10-06", expires_on="2025-10-15", weeks=4)
    assert occurrences[-1].date() <= date(2025, 10, 15)

def test_reject_weekend_days():
    rule = "FREQ=WEEKLY;BYDAY=SA,SU"
    with pytest.raises(ValidationError, match="weekends"):
        validate_rrule(rule)
```

### Integration Tests (API)

**Test Recurring Task Creation**:
```python
def test_create_recurring_task_generates_assignments(client):
    response = client.post('/api/recurring-tasks', json={
        "title": "Playground Duty",
        "category": "PLAYGROUND",
        "start_time": "10:30",
        "end_time": "11:00",
        "recurrence_rule": "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
        "expires_on": "2025-12-31"
    })
    assert response.status_code == 201
    assert response.json['assignments_created'] == 20  # 4 weeks * 5 days

def test_multi_day_selection_batch_assign(client):
    response = client.post('/api/assignments/batch', json={
        "task_id": 1,
        "aide_id": 5,
        "dates": ["2025-10-06", "2025-10-08", "2025-10-10"]
    })
    assert response.status_code == 201
    assert len(response.json['assignments']) == 3
```

---

## Summary

- ✅ **RFC 5545 Compliant**: Standard iCal RRULE format
- ✅ **School-Optimized**: Weekdays only (MO-FR), no weekends
- ✅ **Eager Generation**: 4-week horizon upfront (configurable to 10 weeks)
- ✅ **Multi-Day Selection**: UI prompts for which days to apply on drag-drop
- ✅ **Safety Limits**: Max 200 occurrences per task
- ✅ **Modification Handling**: Regenerate future assignments on task update
- ✅ **Expiration Support**: Tasks stop generating after `expires_on` date



