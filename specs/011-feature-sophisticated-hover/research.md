# Research: Sophisticated Hover Tooltip

## Decision: Lazy Data Fetching for Tooltips
- **Choice**: Fetch detailed tooltip data only when the 1-second hover delay is reached.
- **Rationale**: The timetable can display dozens of assignments. Including notes, classroom details, and 10 future recurring dates for every assignment in the initial page load would significantly bloat the `daily-view` API response and frontend memory usage. Lazy fetching ensures we only process this data when the user expresses intent.
- **Alternatives considered**: Pre-fetching all data. Rejected due to performance concerns at scale.

## Decision: Backend Aggregation Endpoint
- **Choice**: Create `GET /api/assignments/{id}/tooltip`.
- **Rationale**: A dedicated endpoint allows the backend to perform the necessary joins and subqueries (e.g., finding other aides for the same task and future recurrence dates) in a single request, returning a clean DTO optimized for the tooltip's display needs.
- **Implementation**:
  - `Assignment.recurring_series` to get future dates.
  - Query `Assignment` by `task_id`, `date`, `start_time`, `end_time` to find co-assigned aides.

## Decision: MUI Tooltip Integration
- **Choice**: Use MUI `Tooltip` with `enterDelay={1000}`.
- **Rationale**: Standardizes the behavior across the app and provides built-in accessibility (ARIA), position flipping, and mobile support.
- **Mobile**: MUI `Tooltip` handles long-press as a trigger for hover content on touch devices by default or with minor configuration.

## Decision: Recurrence Overflow
- **Choice**: Fetch 11 dates. Display 10. If an 11th exists, show ellipsis ("...").
- **Rationale**: Simple and efficient way to handle the "up to 10 dates" requirement while providing visual feedback for longer series.

