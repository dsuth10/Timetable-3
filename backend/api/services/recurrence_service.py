"""
T037: RRULE Parser and Occurrence Generator
Generates assignment instances from recurring tasks using iCal RRULE
"""
from datetime import date, datetime, time as dt_time, timedelta
from typing import List, Optional
from dateutil.rrule import rrulestr, rrule, DAILY, WEEKLY, MO, TU, WE, TH, FR


class RecurrenceService:
    """
    Service for parsing RRULE and generating recurring task occurrences.
    
    Supports:
    - FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR (weekday recurrence)
    - FREQ=WEEKLY;BYDAY=MO,WE,FR (specific days)
    - Configurable horizon (default: 12 weeks ahead)
    """
    
    DEFAULT_HORIZON_WEEKS = 12
    
    @staticmethod
    def parse_rrule(rrule_string: str, dtstart: Optional[datetime] = None) -> rrule:
        """
        Parse an iCal RRULE string into a dateutil rrule object.
        
        Args:
            rrule_string: iCal RRULE format (e.g., "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR")
            dtstart: Start datetime (defaults to today)
        
        Returns:
            Parsed rrule object
        
        Raises:
            ValueError: If RRULE format is invalid
        """
        if not rrule_string:
            raise ValueError("RRULE string cannot be empty")
        
        if dtstart is None:
            dtstart = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        try:
            return rrulestr(rrule_string, dtstart=dtstart)
        except Exception as e:
            raise ValueError(f"Invalid RRULE format: {e}")
    
    @staticmethod
    def generate_occurrences(
        rrule_string: str,
        start_date: date,
        end_date: date,
        task_start_time: dt_time,
        task_end_time: dt_time
    ) -> List[dict]:
        """
        Generate assignment occurrences for a recurring task.
        
        Args:
            rrule_string: iCal RRULE format
            start_date: Start of date range
            end_date: End of date range (or task expiry)
            task_start_time: Task start time
            task_end_time: Task end time
        
        Returns:
            List of occurrence dictionaries:
            [
                {
                    'date': date(2025, 10, 6),
                    'start_time': time(9, 0),
                    'end_time': time(10, 0)
                },
                ...
            ]
        """
        if not rrule_string:
            return []
        
        # Parse RRULE
        dtstart = datetime.combine(start_date, dt_time(0, 0))
        rule = RecurrenceService.parse_rrule(rrule_string, dtstart)
        
        # Generate dates
        occurrence_dates = []
        for dt in rule:
            occurrence_date = dt.date()
            
            # Stop if past end date
            if occurrence_date > end_date:
                break
            
            # Only include dates >= start_date
            if occurrence_date >= start_date:
                occurrence_dates.append(occurrence_date)
        
        # Convert to occurrence dictionaries
        occurrences = [
            {
                'date': occ_date,
                'start_time': task_start_time,
                'end_time': task_end_time
            }
            for occ_date in occurrence_dates
        ]
        
        return occurrences
    
    @staticmethod
    def generate_assignments_for_task(
        task_id: int,
        rrule_string: str,
        task_start_time: dt_time,
        task_end_time: dt_time,
        expires_on: date,
        horizon_weeks: int = DEFAULT_HORIZON_WEEKS,
        aide_id: Optional[int] = None,
        exclude_date: Optional[date] = None
    ) -> List[dict]:
        """
        Generate assignment instances for a recurring task.
        
        Args:
            task_id: Task ID
            rrule_string: iCal RRULE format
            task_start_time: Task start time
            task_end_time: Task end time
            expires_on: Task expiration date
            horizon_weeks: How many weeks ahead to generate (default: 12)
            aide_id: Optional aide ID to assign to (if None, assignments will be unassigned)
            exclude_date: Optional date to exclude from generation (e.g., existing assignment)
        
        Returns:
            List of assignment data dictionaries ready for database insertion
        """
        today = date.today()
        horizon_end = today + timedelta(weeks=horizon_weeks)
        
        # Use the earlier of horizon_end or expires_on
        end_date = min(horizon_end, expires_on) if expires_on else horizon_end
        
        # Generate occurrences
        occurrences = RecurrenceService.generate_occurrences(
            rrule_string=rrule_string,
            start_date=today,
            end_date=end_date,
            task_start_time=task_start_time,
            task_end_time=task_end_time
        )
        
        # Filter out the excluded date if provided
        if exclude_date:
            occurrences = [occ for occ in occurrences if occ['date'] != exclude_date]
        
        # Convert to assignment dictionaries
        assignments = [
            {
                'task_id': task_id,
                'aide_id': aide_id,  # Use provided aide_id or None for unassigned
                'date': occ['date'],
                'start_time': occ['start_time'],
                'end_time': occ['end_time'],
                'status': 'ASSIGNED' if aide_id is not None else 'UNASSIGNED',
                'version': 1
            }
            for occ in occurrences
        ]
        
        return assignments
    
    @staticmethod
    def extend_horizon_for_task(
        task_id: int,
        rrule_string: str,
        task_start_time: dt_time,
        task_end_time: dt_time,
        expires_on: date,
        current_latest_date: date,
        horizon_weeks: int = DEFAULT_HORIZON_WEEKS,
        aide_id: Optional[int] = None
    ) -> List[dict]:
        """
        Extend assignment generation horizon for an existing recurring task.
        
        Used by background scheduler to maintain rolling horizon.
        
        Args:
            task_id: Task ID
            rrule_string: iCal RRULE format
            task_start_time: Task start time
            task_end_time: Task end time
            expires_on: Task expiration date
            current_latest_date: Latest date currently in assignments table
            horizon_weeks: How many weeks ahead to maintain
            aide_id: Optional aide ID to assign to (if None, assignments will be unassigned)
        
        Returns:
            List of new assignment dictionaries to create
        """
        today = date.today()
        target_horizon = today + timedelta(weeks=horizon_weeks)
        
        # Only generate if current_latest_date is behind target horizon
        if current_latest_date >= target_horizon:
            return []
        
        # Generate from day after current latest to target horizon
        start_date = current_latest_date + timedelta(days=1)
        end_date = min(target_horizon, expires_on) if expires_on else target_horizon
        
        occurrences = RecurrenceService.generate_occurrences(
            rrule_string=rrule_string,
            start_date=start_date,
            end_date=end_date,
            task_start_time=task_start_time,
            task_end_time=task_end_time
        )
        
        assignments = [
            {
                'task_id': task_id,
                'aide_id': aide_id,
                'date': occ['date'],
                'start_time': occ['start_time'],
                'end_time': occ['end_time'],
                'status': 'ASSIGNED' if aide_id is not None else 'UNASSIGNED',
                'version': 1
            }
            for occ in occurrences
        ]
        
        return assignments
    
    @staticmethod
    def get_next_occurrence(rrule_string: str, after_date: date) -> Optional[date]:
        """
        Get the next occurrence date after a given date.
        
        Args:
            rrule_string: iCal RRULE format
            after_date: Find next occurrence after this date
        
        Returns:
            Next occurrence date, or None if no more occurrences
        """
        if not rrule_string:
            return None
        
        dtstart = datetime.combine(after_date, dt_time(0, 0))
        rule = RecurrenceService.parse_rrule(rrule_string, dtstart)
        
        # Get next occurrence
        for dt in rule:
            occurrence_date = dt.date()
            if occurrence_date > after_date:
                return occurrence_date
        
        return None



