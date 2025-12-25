# Tasks: Task Card Enhancements

**Feature**: `008-each-task-card`

Implementation plan for enhancing task card display across Aide, Daily, and Class views.

## Setup & Research
- [x] T001: Research and document iconography and layout strategy (Phase 0)

## Test Preparation [P]
- [x] T002: Create Vitest tests for `TaskCard` to cover different view modes. [P]

## Implementation: Core Component
- [x] T003: Update `TaskCard` to support enhanced display requirements.

## Integration: Prop Drilling & Parent Updates
- [x] T004: Update `TimeSlottedColumn` to pass necessary data to `TaskCard`. [P]
- [x] T005: Update `AideRow` (Daily View) to ensure consistent display. [P]

## Polish & Documentation [P]
- [x] T006: Verify all scenarios from `quickstart.md` manually. [P]
- [x] T007: Ensure consistent styling and spacing across all 3 views. [P]
- [x] T008: Update `spec.md` and `plan.md` progress tracking to completed. [P]

## Parallel Execution Examples
```bash
# Example 1: Run independent tests and parent component updates in parallel
# (assuming different terminals/sessions)
T002: vitest frontend/src/components/TimetableGrid/__tests__/TaskCard.test.tsx
T004: code frontend/src/components/TimetableGrid/TimeSlottedColumn.tsx
T005: code frontend/src/components/AideRow.tsx

# Example 2: Polish tasks
T006: [Manual Verification]
T008: code specs/008-each-task-card/spec.md
```

