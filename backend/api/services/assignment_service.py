"""
Service for managing assignment series and bulk operations.
"""
from datetime import datetime
from typing import List, Tuple, Optional, Dict, Any
from api.models import db
from api.models.assignment import Assignment
from api.models.recurring_series import RecurringSeries


class AssignmentSeriesService:
    """Service for handling operations on series of assignments."""

    @staticmethod
    def is_assignment_modified(assignment: Assignment, series: RecurringSeries) -> bool:
        """
        Check if an assignment has been manually modified from its original series template.
        Currently checks start_time and end_time.
        """
        if not series:
            return False
            
        # Check time modifications
        if assignment.start_time != series.start_time or assignment.end_time != series.end_time:
            return True
            
        # In the future, we could also check for date modifications by parsing the RRULE
        # and checking if the assignment date matches the expected recurrence pattern.
        
        return False

    @classmethod
    def get_deletable_assignments(cls, assignment_id: int) -> Tuple[List[int], int]:
        """
        Identify all deletable assignments in the same recurring series for the same aide.
        
        Rules:
        1. Must have the same recurring_series_id
        2. Must belong to the same aide (aide_id OR original_aide_id for Relief Pool)
        3. Date must be >= selected assignment date
        4. Must not be modified from the series pattern (times must match)
        
        Returns:
            Tuple of (list of deletable assignment IDs, count of skipped modified assignments)
        """
        selected_assignment = db.session.get(Assignment, assignment_id)
        if not selected_assignment or not selected_assignment.recurring_series_id:
            return [], 0
            
        series = db.session.get(RecurringSeries, selected_assignment.recurring_series_id)
        if not series:
            return [], 0
            
        # Determine the target aide
        # If in relief pool, use original_aide_id. Otherwise use current aide_id.
        target_aide_id = selected_assignment.aide_id if selected_assignment.aide_id else selected_assignment.original_aide_id
        
        if target_aide_id is None:
            # Unassigned recurring series
            pass

        # Query all assignments in the series for this aide on or after the selected date
        assignments = Assignment.query.filter(
            Assignment.recurring_series_id == series.id,
            (Assignment.aide_id == target_aide_id) | (Assignment.original_aide_id == target_aide_id),
            Assignment.date >= selected_assignment.date
        ).all()
        
        deletable_ids = []
        skipped_count = 0
        
        for a in assignments:
            if cls.is_assignment_modified(a, series):
                skipped_count += 1
            else:
                deletable_ids.append(a.id)
                
        return deletable_ids, skipped_count

    @classmethod
    def delete_recurring_series_for_aide(cls, assignment_id: int, version: int) -> Dict[str, Any]:
        """
        Delete current and future assignments in the recurring series for the aide.
        
        Args:
            assignment_id: ID of the selected assignment
            version: Version of the selected assignment for optimistic locking
            
        Returns:
            Dict with counts and IDs of deleted/skipped assignments
        """
        selected_assignment = db.session.get(Assignment, assignment_id)
        if not selected_assignment:
            raise ValueError("Assignment not found")
            
        if not selected_assignment.recurring_series_id:
            raise ValueError("Assignment is not part of a recurring series")
            
        if selected_assignment.version != version:
            raise ValueError(f"Version mismatch: expected {selected_assignment.version}, got {version}")
            
        deletable_ids, skipped_count = cls.get_deletable_assignments(assignment_id)
        
        if not deletable_ids:
            return {
                "deleted_count": 0,
                "deleted_ids": [],
                "skipped_count": skipped_count,
                "skipped_reason": f"{skipped_count} modified assignment(s) preserved",
                "message": "No assignments were deleted (all future instances are modified)"
            }
            
        # Perform bulk deletion in a transaction
        try:
            # Assignment.query.filter(Assignment.id.in_(deletable_ids)).delete(synchronize_session=False)
            # Using a loop to ensure triggers and hooks are fired if any exist
            for a_id in deletable_ids:
                a = db.session.get(Assignment, a_id)
                if a:
                    db.session.delete(a)
                    
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise RuntimeError(f"Failed to delete recurring series: {str(e)}")
        
        return {
            "deleted_count": len(deletable_ids),
            "deleted_ids": deletable_ids,
            "skipped_count": skipped_count,
            "skipped_reason": f"{skipped_count} modified assignment(s) preserved" if skipped_count > 0 else None,
            "message": f"Removed {len(deletable_ids)} recurring instance(s) for this aide"
        }

    @classmethod
    def get_tooltip_data(cls, assignment_id: int) -> Optional[Dict[str, Any]]:
        """
        Fetch aggregated data for a task tooltip.
        
        Includes:
        - Task details (title, category, notes)
        - Classroom details
        - All aides assigned to this task instance (same time/date)
        - Recurrence dates (up to 10)
        """
        assignment = db.session.get(Assignment, assignment_id)
        if not assignment:
            return None
            
        task = assignment.task
        classroom = task.classroom if task else None
        
        # 1. Find all aides assigned to this same task instance (same task, date, time)
        # This handles tasks that might be split across multiple aides
        other_assignments = Assignment.query.filter(
            Assignment.task_id == task.id,
            Assignment.date == assignment.date,
            Assignment.start_time == assignment.start_time,
            Assignment.end_time == assignment.end_time
        ).all()
        
        # Collect unique aide names
        aide_names = set()
        for asg in other_assignments:
            if asg.aide:
                aide_names.add(asg.aide.name)
        
        assigned_aides = sorted(list(aide_names))
        if not assigned_aides:
            assigned_aides = ["None"]
            
        # 2. Handle recurrence details
        recurrence_info = {
            "is_recurring": False,
            "dates": [],
            "has_more": False
        }
        
        if assignment.recurring_series_id:
            recurrence_info["is_recurring"] = True
            # Fetch up to 11 upcoming assignments in the series to detect overflow
            # We filter by aide_id to show the dates for this specific aide's stream in the series
            future_assignments = Assignment.query.filter(
                Assignment.recurring_series_id == assignment.recurring_series_id,
                Assignment.date >= assignment.date,
                Assignment.aide_id == assignment.aide_id
            ).order_by(Assignment.date).limit(11).all()
            
            dates = [a.date.isoformat() for a in future_assignments[:10]]
            recurrence_info["dates"] = dates
            recurrence_info["has_more"] = len(future_assignments) > 10

        start_dt = datetime.combine(assignment.date, assignment.start_time)
        end_dt = datetime.combine(assignment.date, assignment.end_time)
        duration_minutes = int((end_dt - start_dt).total_seconds() / 60)

        return {
            "task_title": task.title if task else "Missing Task",
            "category": task.category if task else "UNKNOWN",
            "classroom": {
                "name": classroom.name,
                "room_number": classroom.room_number,
                "teacher": classroom.teacher
            } if classroom else None,
            "start_time": assignment.start_time.strftime('%H:%M'),
            "end_time": assignment.end_time.strftime('%H:%M'),
            "duration_minutes": duration_minutes,
            "assigned_aides": assigned_aides,
            "recurrence": recurrence_info,
            "notes": task.notes if task and task.notes else "No notes provided"
        }

