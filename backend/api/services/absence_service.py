"""
T040: Absence Service
Cascade-unassign assignments when an absence is created
"""
from __future__ import annotations

from datetime import date
from typing import List, Dict

from api.models import db
from api.models.assignment import Assignment


class AbsenceService:
    """
    Handles absence cascade effects on assignments.

    Behavior:
    - On absence creation: set aide_id = NULL and status = UNASSIGNED for that date
    - Returns affected assignments (after-state)
    """

    @staticmethod
    def release_assignments_for_date(aide_id: int, absence_date: date) -> List[Dict]:
        """
        Release all assignments for the aide on the specified date.
        Only affects assignments currently assigned to that aide on that date.
        """
        assignments: list[Assignment] = (
            Assignment.query
            .filter(
                Assignment.aide_id == aide_id,
                Assignment.date == absence_date,
            )
            .all()
        )

        released: List[Dict] = []
        for a in assignments:
            # Only change those assigned to the aide on that date
            a.aide_id = None
            a.status = 'UNASSIGNED'
            a.version += 1
            db.session.add(a)
            released.append(a.to_dict())

        db.session.flush()
        return released
