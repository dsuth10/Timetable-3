# Quickstart Test: Relief Pool

**Feature**: Relief Pool - Absent Aide Task Reassignment  
**Date**: 2025-12-03

## Overview

This document defines the integration test scenarios that validate the Relief Pool feature works end-to-end. These scenarios map directly to the acceptance criteria in the specification.

---

## Prerequisites

### Test Data Setup

```python
# Create test aides
john = TeacherAide(name="John Smith", email="john@school.edu")
sarah = TeacherAide(name="Sarah Jones", email="sarah@school.edu")

# Create classroom
grade_3a = Classroom(name="Grade 3A", room_number="101", teacher="Ms. Brown")

# Create tasks
reading_support = Task(
    title="Reading Support",
    category="CLASS_SUPPORT",
    classroom_id=grade_3a.id,
    notes="Focus on phonics"
)
math_help = Task(
    title="Math Help",
    category="CLASS_SUPPORT",
    classroom_id=grade_3a.id
)
playground_duty = Task(
    title="Morning Playground",
    category="PLAYGROUND"
)

# Create assignments for John on Dec 3rd
assignment_1 = Assignment(
    task_id=reading_support.id,
    aide_id=john.id,
    date="2025-12-03",
    start_time="09:10:00",
    end_time="09:40:00",
    status="ASSIGNED"
)
assignment_2 = Assignment(
    task_id=math_help.id,
    aide_id=john.id,
    date="2025-12-03",
    start_time="10:00:00",
    end_time="10:30:00",
    status="ASSIGNED"
)
assignment_3 = Assignment(
    task_id=playground_duty.id,
    aide_id=john.id,
    date="2025-12-03",
    start_time="11:00:00",
    end_time="11:30:00",
    status="ASSIGNED"
)
```

---

## Scenario 1: Absence Creates Relief Pool Tasks

**Given** John Smith has 3 tasks scheduled for Dec 3rd  
**When** I mark John Smith as absent for Dec 3rd  
**Then** all 3 tasks appear in the Relief Pool with original details preserved

### Test Steps

```python
def test_absence_creates_relief_pool_tasks():
    # Given: John has 3 assigned tasks for Dec 3rd (setup above)
    
    # When: Mark John absent
    response = client.post('/api/absences', json={
        'aide_id': john.id,
        'date': '2025-12-03',
        'reason': 'Sick leave'
    })
    
    # Then: Absence created
    assert response.status_code == 201
    data = response.json
    assert data['relief_pool_count'] == 3
    
    # Then: Tasks are in Relief Pool
    pool_response = client.get('/api/relief-pool')
    assert pool_response.status_code == 200
    pool_data = pool_response.json
    
    assert pool_data['total_count'] == 3
    
    # Verify first task details preserved
    task_1 = next(t for t in pool_data['tasks'] if t['id'] == assignment_1.id)
    assert task_1['status'] == 'RELIEF_POOL'
    assert task_1['original_aide_id'] == john.id
    assert task_1['start_time'] == '09:10:00'
    assert task_1['end_time'] == '09:40:00'
    assert task_1['task']['title'] == 'Reading Support'
    assert task_1['original_aide']['name'] == 'John Smith'
```

---

## Scenario 2: Reassign Relief Pool Task

**Given** a task "Reading Support - Grade 3A (9:10-9:40)" is in the Relief Pool for Dec 3rd  
**When** I reassign this task to Sarah Jones for Dec 3rd  
**Then** the task is assigned to Sarah and removed from the Relief Pool

### Test Steps

```python
def test_reassign_relief_pool_task():
    # Given: Task is in Relief Pool (after absence created)
    pool_response = client.get('/api/relief-pool')
    relief_task = pool_response.json['tasks'][0]
    
    # When: Reassign to Sarah
    response = client.post(f'/api/relief-pool/{relief_task["id"]}/reassign', json={
        'aide_id': sarah.id,
        'version': relief_task['version']
    })
    
    # Then: Success
    assert response.status_code == 200
    data = response.json
    assert data['aide_id'] == sarah.id
    assert data['status'] == 'ASSIGNED'
    assert data['original_aide_id'] is None  # Cleared after reassignment
    
    # Then: Task no longer in Relief Pool
    pool_response = client.get('/api/relief-pool')
    task_ids = [t['id'] for t in pool_response.json['tasks']]
    assert relief_task['id'] not in task_ids
```

---

## Scenario 3: Date Restriction Enforcement

**Given** a task "Reading Support - Grade 3A (9:10-9:40)" is in the Relief Pool for Dec 3rd  
**When** I attempt to view Sarah Jones's schedule for Dec 4th and try to drop the task  
**Then** the system prevents the drop with a date restriction message

### Test Steps (Backend Validation)

```python
def test_date_restriction_enforced():
    # Given: Task is in Relief Pool for Dec 3rd
    pool_response = client.get('/api/relief-pool')
    relief_task = pool_response.json['tasks'][0]
    assert relief_task['date'] == '2025-12-03'
    
    # When: Try to reassign to different date (via direct API)
    # Note: Frontend would prevent this, but backend must also enforce
    response = client.post(f'/api/relief-pool/{relief_task["id"]}/reassign', json={
        'aide_id': sarah.id,
        'target_date': '2025-12-04',  # Different date!
        'version': relief_task['version']
    })
    
    # Then: Rejected with 403
    assert response.status_code == 403
    assert 'original date' in response.json['error'].lower()
    assert response.json['original_date'] == '2025-12-03'
```

### Test Steps (Frontend Validation - Cypress)

```javascript
// cypress/e2e/relief-pool.cy.ts
it('prevents dropping Relief Pool task on wrong date', () => {
  // Given: Relief Pool has task for Dec 3rd
  cy.visit('/schedule');
  cy.get('[data-testid="relief-pool-tab"]').click();
  cy.get('[data-testid="relief-task-123"]').should('exist');
  
  // When: Navigate to Dec 4th and try to drop
  cy.get('[data-testid="next-week-btn"]').click();
  cy.get('[data-testid="day-column-2025-12-04"]').should('exist');
  
  // Drag task to Dec 4th slot
  cy.get('[data-testid="relief-task-123"]')
    .drag('[data-testid="slot-2025-12-04-09:10"]');
  
  // Then: Drop is rejected, error shown
  cy.get('[data-testid="date-restriction-error"]')
    .should('contain', 'can only be assigned on December 3');
  
  // Task still in Relief Pool
  cy.get('[data-testid="relief-pool-tab"]').click();
  cy.get('[data-testid="relief-task-123"]').should('exist');
});
```

---

## Scenario 4: End-of-Day Auto-Cleanup

**Given** there are 2 tasks in the Relief Pool for Dec 3rd  
**When** the school day ends (after latest task end time)  
**Then** both tasks are automatically removed from the Relief Pool

### Test Steps

```python
def test_end_of_day_cleanup():
    # Given: 2 tasks in Relief Pool for Dec 3rd
    # Latest task ends at 11:30
    pool_response = client.get('/api/relief-pool')
    assert pool_response.json['total_count'] == 2
    
    # When: Simulate time passing end of day
    # (In test, we call the cleanup function directly)
    with freeze_time('2025-12-03 17:00:00'):
        from api.services.relief_pool_service import cleanup_expired_relief_pool
        cleanup_expired_relief_pool()
    
    # Then: Relief Pool is empty for Dec 3rd
    pool_response = client.get('/api/relief-pool')
    dec_3_tasks = [t for t in pool_response.json['tasks'] if t['date'] == '2025-12-03']
    assert len(dec_3_tasks) == 0
```

---

## Scenario 5: Absence Restoration

**Given** John Smith is marked absent with tasks in the Relief Pool  
**When** I remove John Smith's absence for that day  
**Then** the tasks return to John Smith's schedule (if not already reassigned)

### Test Steps

```python
def test_absence_restoration():
    # Given: John is absent, tasks in Relief Pool
    absence_response = client.post('/api/absences', json={
        'aide_id': john.id,
        'date': '2025-12-03',
        'reason': 'Sick leave'
    })
    absence_id = absence_response.json['id']
    
    pool_response = client.get('/api/relief-pool')
    initial_count = pool_response.json['total_count']
    assert initial_count == 3
    
    # When: Remove absence
    response = client.delete(f'/api/absences/{absence_id}')
    
    # Then: Tasks restored to John
    assert response.status_code == 200
    data = response.json
    assert data['restored_count'] == 3
    assert data['conflict_count'] == 0
    
    # Then: Relief Pool is empty
    pool_response = client.get('/api/relief-pool')
    assert pool_response.json['total_count'] == 0
    
    # Then: John's schedule has tasks back
    matrix = client.get('/api/assignments/weekly-matrix?week=2025-W49').json
    john_assignments = matrix['matrix'].get(str(john.id), {}).get('2025-12-03', [])
    assert len(john_assignments) == 3
```

---

## Scenario 6: Multiple Absent Aides Display

**Given** the Relief Pool contains tasks from John Smith and Sarah Jones  
**When** I view the Relief Pool tab  
**Then** tasks are grouped or labeled by original aide name

### Test Steps

```python
def test_multiple_aides_display():
    # Given: Both John and Sarah marked absent
    client.post('/api/absences', json={'aide_id': john.id, 'date': '2025-12-03'})
    client.post('/api/absences', json={'aide_id': sarah.id, 'date': '2025-12-03'})
    
    # When: Fetch Relief Pool
    response = client.get('/api/relief-pool')
    
    # Then: Tasks from both aides present, labeled
    data = response.json
    john_tasks = [t for t in data['tasks'] if t['original_aide']['name'] == 'John Smith']
    sarah_tasks = [t for t in data['tasks'] if t['original_aide']['name'] == 'Sarah Jones']
    
    assert len(john_tasks) > 0
    assert len(sarah_tasks) > 0
    
    # Each task has original_aide populated
    for task in data['tasks']:
        assert task['original_aide'] is not None
        assert 'name' in task['original_aide']
```

---

## Scenario 7: Time Adjustment During Reassignment

**Given** a Relief Pool task originally scheduled 9:10-9:40  
**When** I reassign to Sarah with adjusted time 9:00-9:30  
**Then** the task is assigned with the new time

### Test Steps

```python
def test_time_adjustment_on_reassign():
    # Given: Relief Pool task with original time
    pool_response = client.get('/api/relief-pool')
    relief_task = pool_response.json['tasks'][0]
    assert relief_task['start_time'] == '09:10:00'
    
    # When: Reassign with different time
    response = client.post(f'/api/relief-pool/{relief_task["id"]}/reassign', json={
        'aide_id': sarah.id,
        'start_time': '09:00:00',
        'end_time': '09:30:00',
        'version': relief_task['version']
    })
    
    # Then: New time is applied
    assert response.status_code == 200
    data = response.json
    assert data['start_time'] == '09:00:00'
    assert data['end_time'] == '09:30:00'
```

---

## Scenario 8: Conflict During Reassignment

**Given** Sarah has an existing task at 9:00-9:30  
**When** I try to reassign a Relief Pool task to Sarah at 9:10-9:40  
**Then** the system shows a conflict modal

### Test Steps

```python
def test_conflict_during_reassign():
    # Given: Sarah has existing assignment
    existing = Assignment(
        task_id=some_task.id,
        aide_id=sarah.id,
        date='2025-12-03',
        start_time='09:00:00',
        end_time='09:30:00',
        status='ASSIGNED'
    )
    db.session.add(existing)
    db.session.commit()
    
    # Given: Relief Pool task at overlapping time
    pool_response = client.get('/api/relief-pool')
    relief_task = pool_response.json['tasks'][0]  # 9:10-9:40
    
    # When: Try to reassign to Sarah
    response = client.post(f'/api/relief-pool/{relief_task["id"]}/reassign', json={
        'aide_id': sarah.id,
        'version': relief_task['version']
    })
    
    # Then: Conflict returned
    assert response.status_code == 409
    assert 'conflict' in response.json
    assert response.json['conflict']['id'] == existing.id
```

---

## Scenario 9: Dismiss Relief Pool Task

**Given** a Relief Pool task exists  
**When** I dismiss the task (coverage not needed)  
**Then** the task is removed from Relief Pool

### Test Steps

```python
def test_dismiss_relief_pool_task():
    # Given: Task in Relief Pool
    pool_response = client.get('/api/relief-pool')
    relief_task = pool_response.json['tasks'][0]
    initial_count = pool_response.json['total_count']
    
    # When: Dismiss the task
    response = client.post(f'/api/relief-pool/{relief_task["id"]}/dismiss', json={
        'reason': 'Class cancelled',
        'version': relief_task['version']
    })
    
    # Then: Success
    assert response.status_code == 200
    
    # Then: Task removed from Relief Pool
    pool_response = client.get('/api/relief-pool')
    assert pool_response.json['total_count'] == initial_count - 1
```

---

## UI Integration Tests (Cypress)

### Test: Relief Pool Tab Appears with Badge

```javascript
it('shows Relief Pool tab with count badge', () => {
  // Setup: Create absence via API
  cy.request('POST', '/api/absences', {
    aide_id: 1,
    date: '2025-12-03'
  });
  
  // Visit schedule page
  cy.visit('/schedule');
  
  // Relief Pool tab visible with badge
  cy.get('[data-testid="relief-pool-tab"]')
    .should('exist')
    .find('[data-testid="relief-pool-badge"]')
    .should('contain', '3');
});
```

### Test: Drag from Relief Pool to Schedule

```javascript
it('allows dragging Relief Pool task to same-day slot', () => {
  cy.visit('/schedule');
  
  // Open Relief Pool tab
  cy.get('[data-testid="relief-pool-tab"]').click();
  
  // Drag task to Sarah's schedule for same date
  cy.get('[data-testid="relief-task-123"]')
    .drag('[data-testid="slot-sarah-2025-12-03-09:10"]');
  
  // Success toast appears
  cy.get('[data-testid="toast-success"]')
    .should('contain', 'Task reassigned');
  
  // Task removed from Relief Pool
  cy.get('[data-testid="relief-task-123"]').should('not.exist');
});
```

---

## Performance Validation

| Metric | Target | Test Method |
|--------|--------|-------------|
| Relief Pool fetch | <100ms | Time API response |
| Reassignment | <200ms | Time API response |
| UI update after reassign | <100ms | Measure React re-render |
| Badge update | Real-time | Verify WebSocket/polling |

---

*Quickstart tests complete. Ready for task generation.*









