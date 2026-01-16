import requests
from datetime import datetime, timedelta

BASE_URL = 'http://127.0.0.1:5000/api'

def run_test():
    # 1. Setup: Create a task and an aide
    print("Setting up test data...")
    
    # Create or find an Aide (Bart Simpson - ID might vary, let's fetch one)
    aides_resp = requests.get(f'{BASE_URL}/aides')
    if not aides_resp.ok:
        print(f"Failed to fetch aides: {aides_resp.text}")
        return
    
    aides = aides_resp.json()
    if not aides:
        print("No aides found. Cannot test.")
        return
        
    aide = aides[0]
    aide_id = aide['id']
    print(f"Using Aide: {aide['name']} (ID: {aide_id})")

    # Create a Task
    task_data = {
        'title': 'Test Task for Absence',
        'duration_minutes': 30,
        'category': 'CLASS_SUPPORT'
    }
    task_resp = requests.post(f'{BASE_URL}/tasks', json=task_data)
    if not task_resp.ok:
        print(f"Failed to create task: {task_resp.text}")
        return
    task = task_resp.json()
    task_id = task['id']
    print(f"Created Task: {task['title']} (ID: {task_id})")

    # 2. Assign the task to the aide for day after tomorrow
    tomorrow = (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d')
    start_time = '09:00:00'
    end_time = '09:30:00'
    
    assign_data = {
        'task_id': task_id,
        'aide_id': aide_id,
        'date': tomorrow,
        'start_time': start_time,
        'end_time': end_time
    }
    assign_resp = requests.post(f'{BASE_URL}/assignments', json=assign_data)
    if not assign_resp.ok:
        print(f"Failed to assign task: {assign_resp.text}")
        return
    assignment = assign_resp.json()
    assignment_id = assignment['id']
    print(f"Assigned Task (ID: {assignment_id}) to Aide on {tomorrow}")

    # Verify assignment status
    print(f"Initial Assignment Status: {assignment['status']}")
    if assignment['status'] != 'ASSIGNED':
        print("Error: Assignment status is not ASSIGNED")
        return

    # 3. Create an Absence for that aide and date
    absence_data = {
        'aide_id': aide_id,
        'date': tomorrow,
        'reason': 'Sick leave test'
    }
    print(f"Creating absence for {tomorrow}...")
    absence_resp = requests.post(f'{BASE_URL}/absences', json=absence_data)
    
    if not absence_resp.ok:
        print(f"Failed to create absence: {absence_resp.text}")
        # Retrieve logs if possible?
        return

    absence = absence_resp.json()
    print(f"Created Absence (ID: {absence['id']})")
    print(f"Response - Released Assignments Count: {absence.get('relief_pool_count')}")
    print(f"Response - Released Assignments: {absence.get('released_assignments')}")

    # 4. Verify the task is now in RELIEF_POOL
    # Fetch the assignment again
    # We can fetch via /assignments/{id} if that endpoint exists or query via assignments list
    # Assuming GET /assignments existence or logic to find it.
    # Alternatively check task bank relief pool.
    
    # Let's inspect the returned released assignments first
    released = absence.get('released_assignments', [])
    found = False
    for rel in released:
        if rel['id'] == assignment_id:
            print(f"SUCCESS: Assignment {assignment_id} is in released list.")
            print(f"Status: {rel['status']}")
            print(f"Original Aide ID: {rel.get('original_aide_id')}")
            found = True
            break
            
    if not found:
        print(f"FAILURE: Assignment {assignment_id} was NOT found in released list.")
        
    # Cleanup (Optional)
    # requests.delete(f'{BASE_URL}/absences/{absence["id"]}')
    # requests.delete(f'{BASE_URL}/assignments/{assignment_id}')
    # requests.delete(f'{BASE_URL}/tasks/{task_id}')

if __name__ == '__main__':
    run_test()
