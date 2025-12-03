"""
T041: Background Scheduler
Extends recurring task assignment horizons and manages Relief Pool cleanup
"""
from __future__ import annotations

from datetime import date
from typing import List, Dict, Any

from api.models import db
from api.models.task import Task
from api.models.assignment import Assignment
from api.services.recurrence_service import RecurrenceService
from api.services.relief_pool_service import ReliefPoolService


class HorizonScheduler:
    """
    Maintains a rolling horizon of generated assignments for recurring tasks.

    This is a simple on-demand runner; integrate with a background job runner later if needed.
    """

    @staticmethod
    def extend_all_tasks(horizon_weeks: int = RecurrenceService.DEFAULT_HORIZON_WEEKS) -> int:
        """
        Extend horizon for all recurring tasks.

        Returns number of new assignments created.
        """
        tasks: list[Task] = Task.query.filter(Task.recurrence_rule.isnot(None)).all()
        created_total = 0

        for task in tasks:
            # Find current latest assignment date for the task
            latest: Assignment | None = (
                Assignment.query
                .filter(Assignment.task_id == task.id)
                .order_by(Assignment.date.desc())
                .first()
            )

            current_latest = latest.date if latest else date.today()

            new_assignments = RecurrenceService.extend_horizon_for_task(
                task_id=task.id,
                rrule_string=task.recurrence_rule,
                task_start_time=task.start_time,
                task_end_time=task.end_time,
                expires_on=task.expires_on,
                current_latest_date=current_latest,
                horizon_weeks=horizon_weeks,
            )

            # Persist
            for a in new_assignments:
                db.session.add(
                    Assignment(
                        task_id=a['task_id'],
                        aide_id=a['aide_id'],
                        date=a['date'],
                        start_time=a['start_time'],
                        end_time=a['end_time'],
                        status=a['status'],
                        version=a['version'],
                    )
                )
                created_total += 1

        if created_total:
            db.session.commit()

        return created_total


class ReliefPoolScheduler:
    """
    Manages Relief Pool cleanup jobs.
    
    Removes expired Relief Pool tasks at end of day or on demand.
    Tasks are expired when their date has passed or their end_time has passed today.
    """

    @staticmethod
    def cleanup_expired() -> Dict[str, Any]:
        """
        Remove all expired Relief Pool tasks.
        
        Should be called periodically (e.g., every hour or at end of day)
        to clean up tasks that are past their scheduled time.
        
        Returns:
            Dictionary with count of cleaned up tasks
        """
        return ReliefPoolService.cleanup_expired()

    @staticmethod
    def run_all_maintenance() -> Dict[str, Any]:
        """
        Run all scheduled maintenance tasks.
        
        Combines horizon extension and Relief Pool cleanup.
        
        Returns:
            Dictionary with results from each maintenance task
        """
        results = {}
        
        # Extend recurring task horizons
        try:
            created = HorizonScheduler.extend_all_tasks()
            results['horizon_extension'] = {
                'success': True,
                'assignments_created': created
            }
        except Exception as e:
            results['horizon_extension'] = {
                'success': False,
                'error': str(e)
            }
        
        # Clean up expired Relief Pool tasks
        try:
            cleanup = ReliefPoolScheduler.cleanup_expired()
            results['relief_pool_cleanup'] = {
                'success': True,
                **cleanup
            }
        except Exception as e:
            results['relief_pool_cleanup'] = {
                'success': False,
                'error': str(e)
            }
        
        return results


