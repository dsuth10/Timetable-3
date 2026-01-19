from datetime import date, time
from typing import Dict, Any, List
from api.models import db
from api.models.teacher_aide import TeacherAide
from api.models.assignment import Assignment
from api.models.task import Task
from api.models.absence import Absence
from api.models.term_week import TermWeek
from api.services.collision_service import CollisionService
from api.config import SCHEDULE_CONFIG

class DailyViewService:
    def __init__(self):
        self.collision_service = CollisionService()

    def get_daily_data(self, view_date: date) -> Dict[str, Any]:
        """
        Fetch all data for the daily display:
        - All teacher aides with their status (is_absent) and assignments for the day.
        - Relief pool assignments for the day.
        - Task bank templates.
        - Timeline configuration.
        """
        # 1. Fetch all teacher aides
        aides = TeacherAide.query.order_by(TeacherAide.name).all()
        
        # 2. Fetch absences for the date
        absences = {a.aide_id for a in Absence.query.filter(Absence.date == view_date).all()}
        
        # 3. Fetch all assignments for the date
        all_assignments = Assignment.query.filter(Assignment.date == view_date).all()
        
        # 4. Fetch task bank templates
        task_bank = Task.query.order_by(Task.category, Task.title).all()
        
        # 5. Group assignments by aide
        aide_assignments = {}
        relief_pool = []
        for assignment in all_assignments:
            if assignment.status == 'RELIEF_POOL':
                relief_pool.append(assignment.to_dict(include_relationships=True))
            elif assignment.aide_id:
                if assignment.aide_id not in aide_assignments:
                    aide_assignments[assignment.aide_id] = []
                aide_assignments[assignment.aide_id].append(assignment.to_dict(include_relationships=True))
        
        # 6. Prepare aides with status and assignments
        aides_data = []
        for aide in aides:
            aides_data.append({
                **aide.to_dict(include_relationships=True),  # Include availability for validation
                "is_absent": aide.id in absences,
                "assignments": aide_assignments.get(aide.id, [])
            })
            
        # 7. Define timeline configuration
        # Use centralized schedule segments from config
        schedule_segments = SCHEDULE_CONFIG["SEGMENTS"]
        
        # 7. Define timeline configuration
        # Use centralized schedule segments from config
        schedule_segments = SCHEDULE_CONFIG["SEGMENTS"]
        
        slots = []
        for start_time, duration in schedule_segments:
            slots.append({"start_time": start_time, "duration_minutes": duration})

        # 8. Fetch Term Information
        term_info = TermWeek.query.filter_by(date=view_date).first()
        term_data = term_info.to_dict() if term_info else None
        # Fallback if no data (optional, but good for UI safety)
        if not term_data:
            term_data = {
                "date": view_date.isoformat(),
                "term_number": None,
                "week_number": None,
                "display_label": None
            }
        
        return {
            "aides": aides_data,
            "relief_pool": relief_pool,
            "task_bank": [t.to_dict() for t in task_bank],
            "timeline_config": {
                "slots": slots,
                "start_time": SCHEDULE_CONFIG["START_TIME"],
                "end_time": SCHEDULE_CONFIG["END_TIME"]
            },
            "term_info": term_data
        }

    def assign_task(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assign a task template or reassign a relief assignment.
        Payload: { type: 'FROM_BANK'|'FROM_RELIEF', id: ID, date: string, aide_id: ID, start_time: string, end_time: string }
        """
        assignment_type = data.get('type')
        item_id = data.get('id')
        aide_id = data.get('aide_id')
        assign_date = date.fromisoformat(data.get('date'))
        
        def parse_time(t_str):
            parts = t_str.split(':')
            return time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
            
        start_time = parse_time(data.get('start_time'))
        end_time = parse_time(data.get('end_time'))
        
        # Validate assignment (collision + availability)
        validation = self.collision_service.validate_assignment(
            aide_id=aide_id,
            assignment_date=assign_date,
            start_time=start_time,
            end_time=end_time
        )
        
        if not validation['valid']:
            return {
                "error": validation['error'],
                "availability_issue": validation['availability_issue'],
                "conflicts": [c.to_dict() for c in validation['conflicts']] if validation['conflicts'] else []
            }
            
        try:
            if assignment_type == 'FROM_BANK':
                # Create new assignment from template
                task = db.session.get(Task, item_id)
                if not task:
                    return {"error": "Task template not found"}
                    
                new_assignment = Assignment(
                    task_id=task.id,
                    aide_id=aide_id,
                    date=assign_date,
                    start_time=start_time,
                    end_time=end_time,
                    status='ASSIGNED'
                )
                db.session.add(new_assignment)
                
            elif assignment_type == 'FROM_RELIEF':
                # Reassign existing relief assignment
                assignment = db.session.get(Assignment, item_id)
                if not assignment:
                    return {"error": "Relief assignment not found"}
                if assignment.status != 'RELIEF_POOL':
                    return {"error": "Assignment is not in relief pool"}
                    
                assignment.aide_id = aide_id
                assignment.status = 'ASSIGNED'
                assignment.date = assign_date 
                assignment.start_time = start_time
                assignment.end_time = end_time
                assignment.original_aide_id = None 
                assignment.version += 1 # Increment version for optimistic locking
                
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return {"error": f"Failed to assign task: {str(e)}"}
        
        # Return the resulting assignment for frontend sync
        if assignment_type == 'FROM_BANK':
            return new_assignment.to_dict(include_relationships=True)
        else:
            return assignment.to_dict(include_relationships=True)

