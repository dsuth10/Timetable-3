# Quickstart: Daily Display Timetable Validation

## Prerequisites
- Backend running on `localhost:5000`
- Database seeded with at least 5 Teacher Aides and 10 Task Templates.

## Test Scenarios

### 1. View Daily Layout
- **Path**: `/daily-display?date=2025-12-08`
- **Verification**:
  - Sticky left column shows all 5 aides.
  - Absence rows (if any) are highlighted in light red.
  - Task Bank (right panel) is grouped by category (e.g., "Playground").
  - Relief Pool shows unassigned assignments for today.

### 2. Drag from Task Bank (First Slot)
- **Action**: Drag "Math Support" from Task Bank to the first slot (08:50) of "Jane Doe".
- **Verification**:
  - API `POST /api/daily-view/assign` called with `type: FROM_BANK`.
  - Assignment duration defaults to 20 minutes (08:50 - 09:10).
  - UI updates row instantly.

### 3. Drag from Relief Pool (Modified Duration)
- **Action**: Drag a relief task to "John Smith" at 10:00.
- **Verification**:
  - Confirmation dialog appears showing original duration (e.g., 30m).
  - User changes end time to 11:00 in dialog.
  - API `POST /api/daily-view/assign` called with `type: FROM_RELIEF`.
  - Assignment reflects 60m duration on timeline.

### 4. Overlap Handling
- **Action**: Drag two tasks into the same 10:00 - 10:30 slot for "Jane Doe".
- **Verification**:
  - Both tasks are visible as thinner strips side-by-side (or split width).
  - No "Collision" error if overlaps are allowed in this view.

## Automated Validation
Run the following to verify backend contract compliance:
```bash
pytest backend/tests/api/test_daily_view.py
```
Run the following to verify frontend component behavior:
```bash
npm run test frontend/src/components/DailyTimeline.test.tsx
```


