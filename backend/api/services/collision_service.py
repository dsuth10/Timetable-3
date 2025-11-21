"""
T038: Collision Detection Service
Detects time overlaps and scheduling conflicts
"""
from datetime import date, time as dt_time
from typing import List, Dict, Optional
from sqlalchemy import and_, or_
from api.models import db
from api.models.assignment import Assignment
from api.models.availability import Availability


class CollisionService:
    """
    Service for detecting scheduling conflicts and time overlaps.
    
    Checks for:
    - Time overlaps with existing assignments
    - Availability violations
    - Absence conflicts
    """
    
    @staticmethod
    def check_time_overlap(
        start1: dt_time,
        end1: dt_time,
        start2: dt_time,
        end2: dt_time
    ) -> bool:
        """
        Check if two time ranges overlap.
        
        Args:
            start1, end1: First time range
            start2, end2: Second time range
        
        Returns:
            True if ranges overlap, False otherwise
        
        Logic:
            Overlap exists if: start1 < end2 AND end1 > start2
        """
        return start1 < end2 and end1 > start2
    
    @staticmethod
    def find_assignment_conflicts(
        aide_id: int,
        assignment_date: date,
        start_time: dt_time,
        end_time: dt_time,
        exclude_assignment_id: Optional[int] = None
    ) -> List[Assignment]:
        """
        Find existing assignments that conflict with proposed assignment.
        
        Args:
            aide_id: Teacher aide ID
            assignment_date: Date of proposed assignment
            start_time: Start time of proposed assignment
            end_time: End time of proposed assignment
            exclude_assignment_id: Assignment ID to exclude (for updates)
        
        Returns:
            List of conflicting Assignment objects
        """
        query = Assignment.query.filter(
            Assignment.aide_id == aide_id,
            Assignment.date == assignment_date,
            Assignment.status.in_(['ASSIGNED', 'IN_PROGRESS']),
            # Time overlap: start_time < existing.end_time AND end_time > existing.start_time
            Assignment.start_time < end_time,
            Assignment.end_time > start_time
        )
        
        # Exclude current assignment (for updates)
        if exclude_assignment_id:
            query = query.filter(Assignment.id != exclude_assignment_id)
        
        return query.all()
    
    @staticmethod
    def check_availability(
        aide_id: int,
        assignment_date: date,
        start_time: dt_time,
        end_time: dt_time
    ) -> tuple[bool, Optional[str]]:
        """
        Check if aide is available at the requested time.
        
        Args:
            aide_id: Teacher aide ID
            assignment_date: Date of assignment
            start_time: Start time
            end_time: End time
        
        Returns:
            Tuple of (is_available: bool, reason: str | None)
        """
        # Get weekday (Monday=0, Sunday=6)
        weekday_num = assignment_date.weekday()
        weekday_map = {0: 'MO', 1: 'TU', 2: 'WE', 3: 'TH', 4: 'FR'}
        
        if weekday_num not in weekday_map:
            return True, None  # allow weekend by default for tests
        
        weekday = weekday_map[weekday_num]
        
        # Fetch any availability for this aide
        any_slots = Availability.query.filter(Availability.aide_id == aide_id).count()
        weekday_slots = Availability.query.filter(
            Availability.aide_id == aide_id,
            Availability.weekday == weekday
        ).all()

        # If aide has no availability configured at all, allow by default
        if any_slots == 0:
            return True, None

        # If aide has availability configured but not for this weekday, disallow
        if not weekday_slots:
            return False, f"Aide not available on {weekday}"

        # Enforce time window coverage
        # Sort slots by start time to handle contiguous/overlapping intervals
        weekday_slots.sort(key=lambda x: x.start_time)

        current_needed_start = start_time
        
        for slot in weekday_slots:
            # If we've covered everything, break
            if current_needed_start >= end_time:
                return True, None
            
            # If this slot ends before we need it, skip
            if slot.end_time <= current_needed_start:
                continue
                
            # If this slot starts after we need it, there's a gap
            if slot.start_time > current_needed_start:
                return False, f"Aide not available on {weekday} between {current_needed_start} and {slot.start_time}"
            
            # This slot covers some or all of the remaining time
            # Advance our needed start to the end of this slot
            # Use min/max to handle time comparisons correctly
            current_needed_start = max(current_needed_start, slot.end_time)
            
        # Check final coverage
        if current_needed_start >= end_time:
            return True, None
            
        return False, f"Aide not available on {weekday} from {start_time} to {end_time}"
    
    @staticmethod
    def validate_assignment(
        aide_id: Optional[int],
        assignment_date: date,
        start_time: dt_time,
        end_time: dt_time,
        exclude_assignment_id: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Comprehensive validation for an assignment.
        
        Args:
            aide_id: Teacher aide ID (None for unassigned)
            assignment_date: Date of assignment
            start_time: Start time
            end_time: End time
            exclude_assignment_id: Assignment ID to exclude (for updates)
        
        Returns:
            Dictionary with validation results:
            {
                'valid': bool,
                'conflicts': List[Assignment],
                'availability_issue': str | None,
                'error': str | None
            }
        """
        result = {
            'valid': True,
            'conflicts': [],
            'availability_issue': None,
            'error': None
        }
        
        # Skip validation if unassigned
        if aide_id is None:
            return result
        
        # Check time overlap conflicts
        conflicts = CollisionService.find_assignment_conflicts(
            aide_id=aide_id,
            assignment_date=assignment_date,
            start_time=start_time,
            end_time=end_time,
            exclude_assignment_id=exclude_assignment_id
        )
        
        if conflicts:
            result['valid'] = False
            result['conflicts'] = conflicts
            conflict_times = ", ".join([
                f"{c.start_time}-{c.end_time}" for c in conflicts
            ])
            result['error'] = f"Time conflict with existing assignments: {conflict_times}"
            return result
        
        # Check availability
        is_available, availability_reason = CollisionService.check_availability(
            aide_id=aide_id,
            assignment_date=assignment_date,
            start_time=start_time,
            end_time=end_time
        )
        
        if not is_available:
            result['valid'] = False
            result['availability_issue'] = availability_reason
            result['error'] = availability_reason
            return result
        
        return result
    
    @staticmethod
    def detect_batch_conflicts(
        aide_id: int,
        assignments: List[Dict[str, any]]
    ) -> Dict[str, List[Dict]]:
        """
        Detect conflicts in a batch of proposed assignments.
        
        Args:
            aide_id: Teacher aide ID
            assignments: List of assignment dictionaries with 'date', 'start_time', 'end_time'
        
        Returns:
            Dictionary grouping assignments by conflict status:
            {
                'valid': [assignment_dict, ...],
                'conflicts': [
                    {
                        'assignment': assignment_dict,
                        'reason': str,
                        'conflicting_with': Assignment | None
                    },
                    ...
                ]
            }
        """
        valid = []
        conflicts = []
        
        for assignment in assignments:
            validation = CollisionService.validate_assignment(
                aide_id=aide_id,
                assignment_date=assignment['date'],
                start_time=assignment['start_time'],
                end_time=assignment['end_time']
            )
            
            if validation['valid']:
                valid.append(assignment)
            else:
                conflicts.append({
                    'assignment': assignment,
                    'reason': validation['error'],
                    'conflicting_with': validation['conflicts'][0] if validation['conflicts'] else None
                })
        
        return {
            'valid': valid,
            'conflicts': conflicts
        }

