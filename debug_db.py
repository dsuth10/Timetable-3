
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import create_app
from api.models import db
from api.models.assignment import Assignment
from api.models.task import Task

app = create_app()
with app.app_context():
    print("--- Checking Assignments with aide_id=None ---")
    unassigned_aide = Assignment.query.filter(Assignment.aide_id == None).all()
    print(f"Found {len(unassigned_aide)} assignments with aide_id=None.")
    
    for a in unassigned_aide:
        print(f"Assignment ID: {a.id}, Task ID: {a.task_id}, Date: {a.date}, Status: {a.status}")

    print("\n--- Checking All Tasks ---")
    tasks = Task.query.all()
    print(f"Total tasks: {len(tasks)}")
    for t in tasks:
        print(f"Task: {t.title} (ID: {t.id})")
