"""
Integration test for multiple recurring instances of same task
Tests the bug scenario from the user report.
"""
import pytest
from datetime import date, timedelta, time as dt_time


def test_same_task_multiple_recurring_instances(client, sample_classroom):
    """
    Test that the same task can have multiple independent recurring instances
    assigned to different aides with different recurrence patterns.
    
    This tests the fix for the bug where the second aide couldn't create
    a recurring series because the task already had recurrence settings.
    """
    # Create a task template
    task_payload = {
        "title": "Year 3 Reading Support",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "classroom_id": sample_classroom.id
    }
    task_response = client.post('/api/tasks', json=task_payload)
    assert task_response.status_code == 201
    task_id = task_response.json['id']
    
    # Create two teacher aides
    aide1_response = client.post('/api/aides', json={
        "name": "Aide One",
        "colour_hex": "#FF0000"
    })
    aide1_id = aide1_response.json['id']
    
    aide2_response = client.post('/api/aides', json={
        "name": "Aide Two",
        "colour_hex": "#00FF00"
    })
    aide2_id = aide2_response.json['id']
    
    # Get next Monday for consistent test dates
    today = date.today()
    days_until_monday = (7 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7  # If today is Monday, go to next Monday
    next_monday = today + timedelta(days=days_until_monday)
    
    # Step 1: Drop task into aide1's schedule
    assignment1_response = client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide1_id,
        "date": next_monday.isoformat(),
        "start_time": "09:00",
        "end_time": "10:00"
    })
    assert assignment1_response.status_code == 201
    assignment1_id = assignment1_response.json['id']
    
    # Step 2: Make it recurring for 4 weeks in aide1's schedule
    four_weeks_later = next_monday + timedelta(weeks=4)
    update_task1_response = client.put(f'/api/tasks/{task_id}', json={
        "title": "Year 3 Reading Support",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO",
        "expires_on": four_weeks_later.isoformat(),
        "aide_id": aide1_id,
        "existing_assignment_date": next_monday.isoformat()
    })
    assert update_task1_response.status_code == 200
    
    # Verify aide1 has recurring assignments (4 weeks, excluding the base date)
    assignments1_response = client.get(f'/api/tasks/{task_id}/assignments')
    assert assignments1_response.status_code == 200
    aide1_assignments = [a for a in assignments1_response.json if a['aide_id'] == aide1_id]
    # Should have 4 more assignments (1 base + 4 new = 5 total for aide1)
    assert len(aide1_assignments) >= 4
    
    # Step 3: Drop the same task into aide2's schedule on a different day (Tuesday)
    next_tuesday = next_monday + timedelta(days=1)
    assignment2_response = client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide2_id,
        "date": next_tuesday.isoformat(),
        "start_time": "09:00",
        "end_time": "10:00"
    })
    assert assignment2_response.status_code == 201
    assignment2_id = assignment2_response.json['id']
    
    # Step 4: Make it recurring for 6 weeks in aide2's schedule (THIS IS THE BUG FIX TEST)
    six_weeks_later = next_tuesday + timedelta(weeks=6)
    update_task2_response = client.put(f'/api/tasks/{task_id}', json={
        "title": "Year 3 Reading Support",
        "category": "CLASS_SUPPORT",
        "start_time": "09:00",
        "end_time": "10:00",
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=TU",
        "expires_on": six_weeks_later.isoformat(),
        "aide_id": aide2_id,
        "existing_assignment_date": next_tuesday.isoformat()
    })
    assert update_task2_response.status_code == 200
    
    # Verify aide2 HAS recurring assignments (this was the bug - it didn't work before)
    assignments2_response = client.get(f'/api/tasks/{task_id}/assignments')
    assert assignments2_response.status_code == 200
    aide2_assignments = [a for a in assignments2_response.json if a['aide_id'] == aide2_id]
    # Should have 6 more assignments (1 base + 6 new = 7 total for aide2)
    assert len(aide2_assignments) >= 6, f"Aide2 should have at least 6 recurring assignments, but has {len(aide2_assignments)}"
    
    # Step 5: Verify the two recurring series are independent
    # Check that aide1 still has only 4 weeks of assignments
    aide1_assignments_final = [a for a in assignments2_response.json if a['aide_id'] == aide1_id]
    assert len(aide1_assignments_final) >= 4
    assert len(aide1_assignments_final) < 7  # Should not have 6 weeks like aide2
    
    # Check that aide2 has 6 weeks of assignments
    assert len(aide2_assignments) >= 6
    
    # Step 6: Verify assignments are on correct days
    # Aide1's assignments should be on Mondays
    for assignment in aide1_assignments:
        assignment_date = date.fromisoformat(assignment['date'])
        assert assignment_date.weekday() == 0, "Aide1 assignments should be on Monday"
    
    # Aide2's assignments should be on Tuesdays
    for assignment in aide2_assignments:
        assignment_date = date.fromisoformat(assignment['date'])
        assert assignment_date.weekday() == 1, "Aide2 assignments should be on Tuesday"
    
    # Step 7: Verify recurring assignments (not the base) have a recurring_series_id
    aide1_recurring = [a for a in aide1_assignments if a.get('recurring_series_id') is not None]
    aide2_recurring = [a for a in aide2_assignments if a.get('recurring_series_id') is not None]
    
    assert len(aide1_recurring) >= 4, f"Aide1 should have at least 4 recurring assignments, has {len(aide1_recurring)}"
    assert len(aide2_recurring) >= 6, f"Aide2 should have at least 6 recurring assignments, has {len(aide2_recurring)}"
    
    # Step 8: Verify the two series are different
    aide1_series_ids = set(a['recurring_series_id'] for a in aide1_recurring)
    aide2_series_ids = set(a['recurring_series_id'] for a in aide2_recurring)
    
    assert len(aide1_series_ids) == 1, "Aide1's recurring assignments should all belong to one series"
    assert len(aide2_series_ids) == 1, "Aide2's recurring assignments should all belong to one series"
    assert aide1_series_ids != aide2_series_ids, "The two recurring series should be different"


def test_delete_one_recurring_series_doesnt_affect_another(client, sample_classroom):
    """
    Test that deleting one recurring series doesn't affect another series
    for the same task.
    """
    # Create task and two aides
    task_response = client.post('/api/tasks', json={
        "title": "Reading Support Year 4",
        "category": "CLASS_SUPPORT",
        "start_time": "10:00",
        "end_time": "11:00",
        "classroom_id": sample_classroom.id
    })
    task_id = task_response.json['id']
    
    aide1_response = client.post('/api/aides', json={
        "name": "Aide Alpha",
        "colour_hex": "#FF0000"
    })
    aide1_id = aide1_response.json['id']
    
    aide2_response = client.post('/api/aides', json={
        "name": "Aide Beta",
        "colour_hex": "#00FF00"
    })
    aide2_id = aide2_response.json['id']
    
    # Create two recurring series for the same task
    today = date.today()
    next_monday = today + timedelta(days=(7 - today.weekday()) % 7 or 7)
    
    # Series 1 for aide1
    assignment1_response = client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide1_id,
        "date": next_monday.isoformat(),
        "start_time": "10:00",
        "end_time": "11:00"
    })
    
    client.put(f'/api/tasks/{task_id}', json={
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO",
        "expires_on": (next_monday + timedelta(weeks=3)).isoformat(),
        "aide_id": aide1_id,
        "existing_assignment_date": next_monday.isoformat()
    })
    
    # Series 2 for aide2
    next_wednesday = next_monday + timedelta(days=2)
    assignment2_response = client.post('/api/assignments', json={
        "task_id": task_id,
        "aide_id": aide2_id,
        "date": next_wednesday.isoformat(),
        "start_time": "10:00",
        "end_time": "11:00"
    })
    
    client.put(f'/api/tasks/{task_id}', json={
        "recurrence_rule": "FREQ=WEEKLY;BYDAY=WE",
        "expires_on": (next_wednesday + timedelta(weeks=3)).isoformat(),
        "aide_id": aide2_id,
        "existing_assignment_date": next_wednesday.isoformat()
    })
    
    # Get series IDs
    all_assignments = client.get(f'/api/tasks/{task_id}/assignments').json
    aide1_series_id = next((a['recurring_series_id'] for a in all_assignments if a['aide_id'] == aide1_id and a['recurring_series_id']), None)
    aide2_series_id = next((a['recurring_series_id'] for a in all_assignments if a['aide_id'] == aide2_id and a['recurring_series_id']), None)
    
    assert aide1_series_id is not None
    assert aide2_series_id is not None
    assert aide1_series_id != aide2_series_id
    
    # Delete aide1's series
    delete_response = client.delete(f'/api/recurring-series/{aide1_series_id}?delete_all=true')
    assert delete_response.status_code == 200
    
    # Verify aide1's recurring assignments are gone (base assignment may remain)
    assignments_after = client.get(f'/api/tasks/{task_id}/assignments').json
    aide1_recurring_after = [a for a in assignments_after if a['aide_id'] == aide1_id and a.get('recurring_series_id')]
    aide2_recurring_after = [a for a in assignments_after if a['aide_id'] == aide2_id and a.get('recurring_series_id')]
    
    assert len(aide1_recurring_after) == 0, "Aide1's recurring assignments should be deleted"
    assert len(aide2_recurring_after) > 0, "Aide2's recurring assignments should still exist"

