"""
T041: Background Scheduler
Extends recurring task assignment horizons
"""
from __future__ import annotations

from datetime import date
from typing import List

from api.models import db
from api.models.task import Task
from api.models.assignment import Assignment
from api.services.recurrence_service import RecurrenceService


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


