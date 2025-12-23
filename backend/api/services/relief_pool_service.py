"""
Relief Pool Service
Handles Relief Pool operations: listing, reassignment, dismissal, and cleanup.
"""
from __future__ import annotations

from datetime import date, datetime, time
from typing import List, Dict, Optional, Any

from sqlalchemy import func
from api.models import db
from api.models.assignment import Assignment
from api.models.teacher_aide import TeacherAide
from api.services.collision_service import CollisionService


class ReliefPoolService:
    """
    Service for managing Relief Pool tasks.
    
    Relief Pool tasks are assignments with status='RELIEF_POOL' that have been
    orphaned due to an aide being marked absent. They retain their original
    scheduling information and can be reassigned to other aides.
    """

    @staticmethod
    def get_all(
        filter_date: Optional[date] = None,
        include_expired: bool = False
    ) -> Dict[str, Any]:
        """
        Get all Relief Pool tasks, optionally filtered by date.
        
        Args:
            filter_date: Optional date to filter tasks
            include_expired: Whether to include tasks past their end time
            
        Returns:
            Dictionary with tasks, by_date grouping, and total_count
        """
        query = (
            Assignment.query
            .filter(Assignment.status == 'RELIEF_POOL')
        )
        
        if filter_date:
            query = query.filter(Assignment.date == filter_date)
        
        # Exclude expired tasks unless explicitly requested
        if not include_expired:
            now = datetime.now()
            today = now.date()
            current_time = now.time()
            
            # Include tasks from future dates, or today's tasks that haven't ended
            query = query.filter(
                db.or_(
                    Assignment.date > today,
                    db.and_(
                        Assignment.date == today,
                        Assignment.end_time > current_time
                    )
                )
            )
        
        assignments = query.order_by(Assignment.date, Assignment.start_time).all()
        
        # Build response with relationships
        tasks = []
        by_date: Dict[str, List[int]] = {}
        
        for assignment in assignments:
            task_data = assignment.to_dict(include_relationships=True)
            
            # Add classroom info if available
            if assignment.task and assignment.task.classroom:
                task_data['classroom'] = assignment.task.classroom.to_dict()
            
            tasks.append(task_data)
            
            # Group by date
            date_str = assignment.date.isoformat()
            if date_str not in by_date:
                by_date[date_str] = []
            by_date[date_str].append(assignment.id)
        
        return {
            'tasks': tasks,
            'by_date': by_date,
            'total_count': len(tasks)
        }

    @staticmethod
    def get_count() -> Dict[str, Any]:
        """
        Get count of pending Relief Pool tasks.
        
        Returns:
            Dictionary with total count and count by date
        """
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        
        # Count non-expired Relief Pool tasks
        assignments = (
            Assignment.query
            .filter(Assignment.status == 'RELIEF_POOL')
            .filter(
                db.or_(
                    Assignment.date > today,
                    db.and_(
                        Assignment.date == today,
                        Assignment.end_time > current_time
                    )
                )
            )
            .all()
        )
        
        by_date: Dict[str, int] = {}
        for assignment in assignments:
            date_str = assignment.date.isoformat()
            by_date[date_str] = by_date.get(date_str, 0) + 1
        
        return {
            'count': len(assignments),
            'by_date': by_date
        }

    @staticmethod
    def reassign(
        assignment_id: int,
        aide_id: int,
        version: int,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Reassign a Relief Pool task to a new aide.
        
        Args:
            assignment_id: ID of the assignment to reassign
            aide_id: ID of the aide to assign to
            version: Current version for optimistic locking
            start_time: Optional new start time (HH:MM:SS)
            end_time: Optional new end time (HH:MM:SS)
            
        Returns:
            Updated assignment data
            
        Raises:
            ValueError: If assignment not found, not in Relief Pool, or version mismatch
            PermissionError: If date restriction violated
            RuntimeError: If time conflict exists
        """
        assignment = db.session.get(Assignment, assignment_id)
        
        if not assignment:
            raise ValueError("Assignment not found")
        
        if assignment.status != 'RELIEF_POOL':
            raise ValueError("Assignment is not in Relief Pool")
        
        if assignment.version != version:
            raise ValueError(f"Version mismatch: expected {assignment.version}, got {version}")
        
        # Verify aide exists
        aide = db.session.get(TeacherAide, aide_id)
        if not aide:
            raise ValueError("Aide not found")
        
        # Parse times if provided
        new_start = assignment.start_time
        new_end = assignment.end_time
        
        if start_time:
            parts = start_time.split(':')
            new_start = time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
        
        if end_time:
            parts = end_time.split(':')
            new_end = time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
        
        # Check for time conflicts with the new aide
        conflict = CollisionService.check_collision(
            aide_id=aide_id,
            date=assignment.date,
            start_time=new_start,
            end_time=new_end,
            exclude_assignment_id=assignment_id
        )
        
        if conflict:
            raise RuntimeError(f"Time conflict with assignment {conflict['id']}")
        
        # Update assignment
        assignment.aide_id = aide_id
        assignment.original_aide_id = None  # Clear original aide reference
        assignment.status = 'ASSIGNED'
        assignment.start_time = new_start
        assignment.end_time = new_end
        assignment.version += 1
        
        db.session.commit()
        
        return assignment.to_dict()

    @staticmethod
    def dismiss(
        assignment_id: int,
        version: int,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dismiss a Relief Pool task (mark as not needing coverage).
        
        Args:
            assignment_id: ID of the assignment to dismiss
            version: Current version for optimistic locking
            reason: Optional reason for dismissal
            
        Returns:
            Confirmation message
            
        Raises:
            ValueError: If assignment not found, not in Relief Pool, or version mismatch
        """
        assignment = db.session.get(Assignment, assignment_id)
        
        if not assignment:
            raise ValueError("Assignment not found")
        
        if assignment.status != 'RELIEF_POOL':
            raise ValueError("Assignment is not in Relief Pool")
        
        if assignment.version != version:
            raise ValueError(f"Version mismatch: expected {assignment.version}, got {version}")
        
        # Delete the assignment
        db.session.delete(assignment)
        db.session.commit()
        
        return {
            'id': assignment_id,
            'status': 'dismissed',
            'message': 'Task removed from Relief Pool'
        }

    @staticmethod
    def cleanup_expired() -> Dict[str, Any]:
        """
        Remove expired Relief Pool tasks.
        
        Tasks are considered expired when their scheduled date has passed
        or when they're from today but past their end time.
        
        Returns:
            Dictionary with count of cleaned up tasks
        """
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        
        # Find expired Relief Pool tasks
        expired_tasks = (
            Assignment.query
            .filter(Assignment.status == 'RELIEF_POOL')
            .filter(
                db.or_(
                    Assignment.date < today,  # Past dates
                    db.and_(
                        Assignment.date == today,
                        Assignment.end_time <= current_time  # Today but past end time
                    )
                )
            )
            .all()
        )
        
        count = len(expired_tasks)
        
        for task in expired_tasks:
            db.session.delete(task)
        
        db.session.commit()
        
        return {
            'cleaned_up': count,
            'message': f'Removed {count} expired Relief Pool tasks'
        }






















