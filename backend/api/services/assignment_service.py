"""
Service for managing assignment series and bulk operations.
"""
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
        # Assignment.query.filter(Assignment.id.in_(deletable_ids)).delete(synchronize_session=False)
        # Using a loop to ensure triggers and hooks are fired if any exist
        for a_id in deletable_ids:
            a = db.session.get(Assignment, a_id)
            if a:
                db.session.delete(a)
                
        db.session.commit()
        
        return {
            "deleted_count": len(deletable_ids),
            "deleted_ids": deletable_ids,
            "skipped_count": skipped_count,
            "skipped_reason": f"{skipped_count} modified assignment(s) preserved" if skipped_count > 0 else None,
            "message": f"Removed {len(deletable_ids)} recurring instance(s) for this aide"
        }

