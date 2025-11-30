"""
T039: Conflict Resolution Service
Handles automatic shortening of tasks when partial overlaps occur
"""
from datetime import time as dt_time
from typing import Optional, Dict, List
from api.models import db
from api.models.assignment import Assignment
from .collision_service import CollisionService


class ConflictResolver:
    """
    Service for resolving scheduling conflicts through automatic adjustments.
    
    Strategies:
    - Auto-shorten: Shorten first task to accommodate second task
    - Replace: Replace existing assignment with new one
    """
    
    @staticmethod
    def can_auto_shorten(
        existing_start: dt_time,
        existing_end: dt_time,
        new_start: dt_time,
        new_end: dt_time
    ) -> tuple[bool, Optional[dt_time]]:
        """
        Determine if auto-shortening is possible and calculate new end time.
        
        Auto-shortening rules:
        - First task starts before second task
        - First task ends after second task starts (partial overlap)
        - Shorten first task to end when second task starts
        
        Args:
            existing_start, existing_end: Existing assignment times
            new_start, new_end: New assignment times
        
        Returns:
            Tuple of (can_shorten: bool, new_end_time: time | None)
        """
        # Can only shorten if existing starts before new
        if existing_start >= new_start:
            return False, None
        
        # Can only shorten if there's actual overlap
        if existing_end <= new_start:
            return False, None  # No overlap
        
        # Can shorten: existing ends when new starts
        return True, new_start
    
    @staticmethod
    def auto_shorten_assignment(
        assignment: Assignment,
        new_end_time: dt_time
    ) -> Assignment:
        """
        Shorten an existing assignment's end time.
        
        Args:
            assignment: Assignment to shorten
            new_end_time: New end time
        
        Returns:
            Updated assignment
        """
        assignment.end_time = new_end_time
        assignment.version += 1  # Increment version for optimistic locking
        db.session.add(assignment)
        return assignment
    
    @staticmethod
    def resolve_with_auto_shorten(
        aide_id: int,
        assignment_date,
        start_time: dt_time,
        end_time: dt_time,
        exclude_assignment_id: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Attempt to resolve conflicts using auto-shorten strategy.
        
        Args:
            aide_id: Teacher aide ID
            assignment_date: Date of new assignment
            start_time: Start time of new assignment
            end_time: End time of new assignment
            exclude_assignment_id: Assignment to exclude (for updates)
        
        Returns:
            Dictionary with resolution results:
            {
                'can_resolve': bool,
                'shortened_assignments': List[Assignment],
                'error': str | None
            }
        """
        result = {
            'can_resolve': True,
            'shortened_assignments': [],
            'error': None
        }
        
        # Find conflicts
        conflicts = CollisionService.find_assignment_conflicts(
            aide_id=aide_id,
            assignment_date=assignment_date,
            start_time=start_time,
            end_time=end_time,
            exclude_assignment_id=exclude_assignment_id
        )
        
        if not conflicts:
            return result  # No conflicts to resolve
        
        # Try to auto-shorten each conflict
        for conflict in conflicts:
            can_shorten, new_end = ConflictResolver.can_auto_shorten(
                existing_start=conflict.start_time,
                existing_end=conflict.end_time,
                new_start=start_time,
                new_end=end_time
            )
            
            if can_shorten:
                # Shorten the conflicting assignment
                shortened = ConflictResolver.auto_shorten_assignment(conflict, new_end)
                result['shortened_assignments'].append(shortened)
            else:
                # Cannot resolve this conflict
                result['can_resolve'] = False
                result['error'] = (
                    f"Cannot auto-shorten assignment {conflict.id}: "
                    f"new task ({start_time}-{end_time}) does not start after "
                    f"existing task ({conflict.start_time}-{conflict.end_time})"
                )
                return result
        
        return result
    
    @staticmethod
    def resolve_with_replace(
        existing_assignment: Assignment,
        new_aide_id: int
    ) -> Assignment:
        """
        Resolve conflict by replacing aide assignment.
        
        Args:
            existing_assignment: Assignment to modify
            new_aide_id: New aide ID
        
        Returns:
            Updated assignment
        """
        existing_assignment.aide_id = new_aide_id
        existing_assignment.status = 'ASSIGNED'
        existing_assignment.version += 1
        db.session.add(existing_assignment)
        return existing_assignment
    
    @staticmethod
    def calculate_shortened_time(
        original_start: dt_time,
        original_end: dt_time,
        conflict_start: dt_time
    ) -> Optional[dt_time]:
        """
        Calculate new end time for auto-shortened task.
        
        Args:
            original_start: Original task start
            original_end: Original task end
            conflict_start: Conflicting task start
        
        Returns:
            New end time, or None if shortening not possible
        """
        # Can only shorten if conflict starts after original starts
        if conflict_start <= original_start:
            return None
        
        # Can only shorten if conflict starts before original ends
        if conflict_start >= original_end:
            return None
        
        # New end time is when conflict starts
        return conflict_start
    
    @staticmethod
    def validate_shortened_task(
        original_start: dt_time,
        new_end: dt_time,
        minimum_duration_minutes: int = 15
    ) -> tuple[bool, Optional[str]]:
        """
        Validate that shortened task meets minimum duration.
        
        Args:
            original_start: Task start time
            new_end: Proposed new end time
            minimum_duration_minutes: Minimum task duration (default: 30 min)
        
        Returns:
            Tuple of (is_valid: bool, error_message: str | None)
        """
        # Calculate duration in minutes
        start_minutes = original_start.hour * 60 + original_start.minute
        end_minutes = new_end.hour * 60 + new_end.minute
        duration = end_minutes - start_minutes
        
        if duration < minimum_duration_minutes:
            return False, (
                f"Shortened task duration ({duration} min) would be less than "
                f"minimum ({minimum_duration_minutes} min)"
            )
        
        return True, None



