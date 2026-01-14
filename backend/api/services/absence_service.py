"""
T040: Absence Service
Cascade-unassign assignments when an absence is created.
Now moves assignments to Relief Pool instead of unassigning.
"""
from __future__ import annotations

from datetime import date
from typing import List, Dict, Tuple

from api.models import db
from api.models.assignment import Assignment
from api.services.collision_service import CollisionService


class AbsenceService:
    """
    Handles absence cascade effects on assignments.

    Behavior:
    - On absence creation: Move assignments to Relief Pool (status=RELIEF_POOL, 
      store original aide in original_aide_id)
    - On absence deletion: Attempt to restore Relief Pool tasks to original aide
    """

    @staticmethod
    def release_assignments_to_relief_pool(aide_id: int, absence_date: date) -> List[Dict]:
        """
        Move all assignments for the aide on the specified date to Relief Pool.
        
        This replaces the old behavior of setting status to UNASSIGNED.
        Now preserves the original aide reference for potential restoration.
        
        Args:
            aide_id: ID of the absent aide
            absence_date: Date of the absence
            
        Returns:
            List of assignments moved to Relief Pool
        """
        assignments: list[Assignment] = (
            Assignment.query
            .filter(
                Assignment.aide_id == aide_id,
                Assignment.date == absence_date,
                Assignment.status.in_(['ASSIGNED', 'IN_PROGRESS'])
            )
            .all()
        )

        released: List[Dict] = []
        try:
            for a in assignments:
                # Store original aide and move to Relief Pool
                a.original_aide_id = a.aide_id
                a.aide_id = None
                a.status = 'RELIEF_POOL'
                a.version += 1
                db.session.add(a)
                released.append(a.to_dict())

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise RuntimeError(f"Failed to release assignments to relief pool: {str(e)}")
        return released

    @staticmethod
    def restore_assignments_from_relief_pool(
        aide_id: int, 
        absence_date: date
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Attempt to restore Relief Pool tasks to the original aide when absence is cancelled.
        
        For each task in Relief Pool that was originally assigned to this aide:
        - If the time slot is available: restore the assignment
        - If there's a conflict: keep in Relief Pool and report the conflict
        
        Args:
            aide_id: ID of the aide whose absence is being cancelled
            absence_date: Date of the absence being cancelled
            
        Returns:
            Tuple of (restored_tasks, conflict_tasks)
        """
        # Find Relief Pool tasks for this aide/date
        relief_tasks: list[Assignment] = (
            Assignment.query
            .filter(
                Assignment.status == 'RELIEF_POOL',
                Assignment.original_aide_id == aide_id,
                Assignment.date == absence_date
            )
            .all()
        )
        
        restored: List[Dict] = []
        conflicts: List[Dict] = []
        
        try:
            for task in relief_tasks:
                # Check if the time slot is available
                conflict = CollisionService.check_collision(
                    aide_id=aide_id,
                    date=task.date,
                    start_time=task.start_time,
                    end_time=task.end_time,
                    exclude_assignment_id=task.id
                )
                
                if conflict:
                    # Slot is occupied, report conflict
                    conflicts.append({
                        'id': task.id,
                        'task_id': task.task_id,
                        'reason': 'Time slot now occupied',
                        'conflict_with': conflict
                    })
                else:
                    # Slot is available, restore the assignment
                    task.aide_id = task.original_aide_id
                    task.original_aide_id = None
                    task.status = 'ASSIGNED'
                    task.version += 1
                    db.session.add(task)
                    restored.append(task.to_dict())
            
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise RuntimeError(f"Failed to restore assignments from relief pool: {str(e)}")
        return restored, conflicts

    # Keep old method name as alias for backward compatibility during transition
    @staticmethod
    def release_assignments_for_date(aide_id: int, absence_date: date) -> List[Dict]:
        """
        Backward compatible method - now uses Relief Pool.
        
        DEPRECATED: Use release_assignments_to_relief_pool instead.
        """
        return AbsenceService.release_assignments_to_relief_pool(aide_id, absence_date)
