# Data Model: Delete Recurring Assignment Instances for Specific Aide

## Database Schema Changes

**No database schema changes required.** This feature uses existing tables and relationships.

## Existing Entities Used

### Assignment
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| task_id | INTEGER FK | Reference to Task |
| aide_id | INTEGER FK (nullable) | Current assigned aide (NULL if Relief Pool) |
| original_aide_id | INTEGER FK (nullable) | Original aide before Relief Pool |
| recurring_series_id | INTEGER FK (nullable) | Reference to RecurringSeries |
| date | DATE | Scheduled date |
| start_time | TIME | Start time |
| end_time | TIME | End time |
| status | VARCHAR(20) | ASSIGNED, RELIEF_POOL, etc. |
| version | INTEGER | Optimistic locking |

### RecurringSeries
| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Primary key |
| task_id | INTEGER FK | Reference to Task |
| aide_id | INTEGER FK (nullable) | Originally assigned aide |
| recurrence_rule | TEXT | iCal RRULE format |
| expires_on | DATE | Series expiration date |
| start_time | TIME | Original scheduled start time |
| end_time | TIME | Original scheduled end time |
| base_date | DATE | First assignment date |

## Query Logic

### Find Deletable Assignments
```sql
SELECT a.* 
FROM assignments a
JOIN recurring_series rs ON a.recurring_series_id = rs.id
WHERE a.recurring_series_id = :series_id
  AND (a.aide_id = :aide_id OR a.original_aide_id = :aide_id)
  AND a.date >= :selected_date
  AND a.start_time = rs.start_time  -- Not modified
  AND a.end_time = rs.end_time      -- Not modified
ORDER BY a.date;
```

### Modification Detection Rules
An assignment is considered "modified" and will be **skipped** if:
1. `assignment.start_time != recurring_series.start_time`
2. `assignment.end_time != recurring_series.end_time`

**Note**: Date changes are harder to detect (weekday shift). For MVP, we only check time modifications. Date modifications would require parsing the RRULE BYDAY pattern and comparing weekdays.

## Data Flow

### Delete Flow
```
1. Frontend: User clicks "Remove this and future recurring instances for this aide"
2. Frontend: Call preview endpoint to get count
3. Frontend: Show confirmation dialog with count
4. Frontend: User confirms deletion
5. Backend: Fetch assignment by ID → get recurring_series_id
6. Backend: Query all assignments in series for this aide on/after date
7. Backend: Filter out modified assignments
8. Backend: Delete remaining assignments in transaction
9. Backend: Return deleted count and skipped count
10. Frontend: Show success toast with counts
```

## Validation Rules

1. **Assignment must be part of a recurring series**: `recurring_series_id IS NOT NULL`
2. **Aide ownership**: `aide_id = :target_aide_id OR original_aide_id = :target_aide_id`
3. **Future-only**: `date >= :selected_assignment.date`
4. **Not modified**: Time fields match series template

## Edge Cases

### Empty Result Set
If no assignments match the criteria (all modified, none in future):
- Return `deleted_count: 0, skipped_count: X`
- Frontend should still show success, noting the skip reason

### Relief Pool with Different Original Aide
If a Relief Pool assignment has a different `original_aide_id` than the targeted aide:
- **Do not delete** it
- It was originally someone else's assignment

### Series with Multiple Aides
If the same `recurring_series_id` has assignments for multiple aides (via reassignment):
- Only delete assignments matching the target aide
- Other aides' assignments remain untouched

