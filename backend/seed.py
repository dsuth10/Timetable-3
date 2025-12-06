"""
Seed script for Teacher Aide Scheduler
Populates database with test data for development
"""
import os
import sys
from datetime import date, time, datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from api import create_app
from api.models import db

# Import all models
from api.models.teacher_aide import TeacherAide
from api.models.availability import Availability
from api.models.classroom import Classroom
from api.models.task import Task
from api.models.assignment import Assignment
from api.models.absence import Absence
from api.models.request import Request


def seed_database():
    """Seed the database with test data"""
    app = create_app()
    with app.app_context():
        print("Seeding database...")
        session = db.session
        try:
            print("\n=== Seeding Teacher Aides ===")

            # Create 2 teacher aides
            aide1 = TeacherAide(
                name="John Smith",
                details="Special Education, Behavior Management",
                colour_hex="#FF5733"
            )
            aide2 = TeacherAide(
                name="Mary Johnson",
                details="Reading Specialist, ESL Support",
                colour_hex="#33C1FF"
            )

            session.add_all([aide1, aide2])
            session.flush()  # Get IDs

            print(f"Created aide: {aide1.name} (ID: {aide1.id})")
            print(f"Created aide: {aide2.name} (ID: {aide2.id})")

            # Add availability for aides
            print("\n=== Seeding Availability ===")

            # John Smith - Available Monday-Friday, 08:00-16:00
            for day in ['MO', 'TU', 'WE', 'TH', 'FR']:
                avail = Availability(
                    aide_id=aide1.id,
                    weekday=day,
                    start_time=time(8, 0),
                    end_time=time(16, 0)
                )
                session.add(avail)
                print(f"  {aide1.name} available: {day} 08:00-16:00")

            # Mary Johnson - Available Monday, Wednesday, Friday, 09:00-15:00
            for day in ['MO', 'WE', 'FR']:
                avail = Availability(
                    aide_id=aide2.id,
                    weekday=day,
                    start_time=time(9, 0),
                    end_time=time(15, 0)
                )
                session.add(avail)
                print(f"  {aide2.name} available: {day} 09:00-15:00")

            print("\n=== Seeding Classrooms ===")

            classrooms = [
                Classroom(name="Grade 3A", room_number="101", teacher="Mrs. Anderson", capacity=25, notes="Grade 3A - Mrs. Anderson"),
                Classroom(name="Grade 3B", room_number="102", teacher="Mr. Thompson", capacity=22, notes="Grade 3B - Mr. Thompson"),
                Classroom(name="Grade 4A", room_number="201", teacher="Ms. Rodriguez", capacity=28, notes="Grade 4A - Ms. Rodriguez"),
                Classroom(name="Library", room_number="LIB", teacher="Mrs. Librarian", capacity=50, notes="Multi-purpose learning space"),
                Classroom(name="Playground", room_number="OUT", teacher="N/A", capacity=100, notes="Outdoor supervision area")
            ]
            session.add_all(classrooms)
            session.flush()
            for classroom in classrooms:
                print(f"Created classroom: {classroom.name} (capacity: {classroom.capacity})")

            print("\n=== Seeding Tasks ===")

            # Get next Monday (for consistent test data)
            today = date.today()
            days_ahead = 0 - today.weekday()  # Monday is 0
            if days_ahead <= 0:
                days_ahead += 7
            next_monday = today + timedelta(days=days_ahead)

            tasks = []
            # Task templates use placeholder times (09:00-10:00) as per current paradigm
            # Times will be set when tasks are assigned to the calendar
            tasks.append(Task(
                title="Morning Playground Duty",
                category="PLAYGROUND",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[4].id,
                notes="Supervise students during morning recess"
            ))
            tasks.append(Task(
                title="Grade 3A Reading Support",
                category="CLASS_SUPPORT",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[0].id,
                notes="Small group reading intervention"
            ))
            tasks.append(Task(
                title="Grade 4A Math Support",
                category="CLASS_SUPPORT",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[2].id,
                notes="One-on-one math tutoring"
            ))
            tasks.append(Task(
                title="Lunch Supervision",
                category="PLAYGROUND",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[4].id,
                notes="Cafeteria and playground supervision"
            ))
            tasks.append(Task(
                title="Library Book Fair Setup",
                category="CLASS_SUPPORT",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[3].id,
                notes="Help set up book fair displays"
            ))
            tasks.append(Task(
                title="Student A - Behavior Support",
                category="INDIVIDUAL_SUPPORT",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[1].id,
                notes="1:1 behavior intervention plan support"
            ))
            tasks.append(Task(
                title="ESL Small Group",
                category="GROUP_SUPPORT",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[3].id,
                notes="English language learners support group"
            ))
            tasks.append(Task(
                title="School Assembly Support",
                category="CLASS_SUPPORT",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[3].id,
                notes="Assist with student seating and crowd control"
            ))
            tasks.append(Task(
                title="Afternoon Playground Duty",
                category="PLAYGROUND",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[4].id,
                notes="Supervise afternoon outdoor activities"
            ))
            tasks.append(Task(
                title="Parent-Teacher Conference Support",
                category="CLASS_SUPPORT",
                start_time=time(9, 0),  # Placeholder time
                end_time=time(10, 0),   # Placeholder time
                classroom_id=classrooms[0].id,
                notes="Provide childcare during parent conferences"
            ))

            session.add_all(tasks)
            session.flush()
            for i, task in enumerate(tasks, 1):
                print(f"Created task {i}: {task.title} ({task.category})")

            print("\n=== Seeding Sample Assignments ===")
            assignments = []
            assignments.append(Assignment(
                task_id=tasks[0].id,
                aide_id=aide1.id,
                date=next_monday,
                start_time=time(10, 30),
                end_time=time(11, 0),
                status='ASSIGNED'
            ))
            assignments.append(Assignment(
                task_id=tasks[1].id,
                aide_id=aide2.id,
                date=next_monday,
                start_time=time(9, 0),
                end_time=time(10, 0),
                status='ASSIGNED'
            ))
            assignments.append(Assignment(
                task_id=tasks[4].id,
                aide_id=None,
                date=next_monday + timedelta(days=2),
                start_time=time(14, 0),
                end_time=time(15, 30),
                status='UNASSIGNED'
            ))
            assignments.append(Assignment(
                task_id=tasks[7].id,
                aide_id=None,
                date=next_monday + timedelta(days=4),
                start_time=time(13, 30),
                end_time=time(14, 30),
                status='UNASSIGNED'
            ))
            session.add_all(assignments)
            session.flush()
            for assignment in assignments:
                aide_name = session.get(TeacherAide, assignment.aide_id).name if assignment.aide_id else "UNASSIGNED"
                task = session.get(Task, assignment.task_id)
                print(f"Created assignment: {task.title} -> {aide_name} on {assignment.date}")

            print("\n=== Seeding Sample Absence ===")
            absence = Absence(
                aide_id=aide1.id,
                date=next_monday + timedelta(days=3),
                reason="Medical appointment"
            )
            session.add(absence)
            print(f"Created absence: {aide1.name} on {absence.date} ({absence.reason})")

            print("\n=== Seeding Sample Request ===")
            request = Request(
                requesting_teacher="Mrs. Anderson",
                task_title="Extra Reading Support Needed",
                task_category="CLASS_SUPPORT",
                preferred_date=next_monday + timedelta(days=1),
                preferred_time=time(10, 0),
                classroom_id=classrooms[0].id,
                notes="Student struggling with comprehension, needs 1:1 support",
                status='PENDING'
            )
            session.add(request)
            print(f"Created request: {request.task_title} by {request.requesting_teacher} (status: {request.status})")

            # Commit all changes
            session.commit()
            print("\nDatabase seeded successfully!")
            print(f"\nSummary:")
            print(f"  - 2 teacher aides")
            print(f"  - 8 availability patterns")
            print(f"  - 5 classrooms")
            print(f"  - 10 tasks (7 recurring, 3 one-off)")
            print(f"  - 4 sample assignments")
            print(f"  - 1 sample absence")
            print(f"  - 1 pending request")
            print(f"\nDatabase location: ../instance/timetable.db")
        except Exception as e:
            session.rollback()
            print(f"\nError seeding database: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == '__main__':
    seed_database()
