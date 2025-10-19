# Testing Guide for Modern UI Redesign

## Overview

This guide outlines the testing considerations following the Modern UI Redesign. The application has been restructured from a multi-page app to a unified single-view interface with Material Design components.

## Major Changes Requiring Test Updates

### 1. Navigation Structure
**Changed**: Removed React Router navigation in favor of unified single view
- **Old**: Multi-page routing with `/`, `/aides`, `/tasks`, `/requests`
- **New**: Single unified Schedule view with bottom drawer for management

**Tests to Update**:
- Remove routing-based navigation tests
- Update tests that navigate between pages
- Focus tests on the unified Schedule component

### 2. Component Structure

#### Layout Components (New)
- `AppBar` - Top navigation bar with week controls
- `AideDrawer` - Left drawer for aide management
- `ManagementPanel` - Bottom drawer with tabs
- All use Material-UI components

**Test Files to Create/Update**:
- `tests/components/AppBar.test.tsx` (new)
- `tests/components/AideDrawer.test.tsx` (new)
- `tests/components/ManagementPanel.test.tsx` (new)

#### Updated Components
- `TimetableGrid.tsx` - Now uses MUI components, includes TimeAxis
- `TaskCard.tsx` - Material Design styling, enhanced features
- `UnassignedPanel.tsx` - Now a permanent MUI Drawer
- All modals upgraded to Material Design

**Test Files to Update**:
- `tests/components/TimetableGrid.test.tsx` - Update selectors for MUI components
- `tests/components/Schedule.test.tsx` - Major restructuring needed
- `tests/components/UnassignedPanel.test.tsx` - Update for MUI Drawer

### 3. Test Selectors

#### Data-testid Mapping
Most `data-testid` attributes remain unchanged, but some components have been restructured:

**Still Valid**:
- `nav-prev`, `nav-next`, `nav-today` - Week navigation (now in AppBar)
- `aide-col-{id}` - Aide columns
- `assignment-card-{id}` - Assignment cards
- `unassigned-item-{id}` - Unassigned items
- `open-create-task` - Create task button
- `open-multiday` - Multi-day button
- `conflict-cancel`, `conflict-replace`, `conflict-close` - Conflict modal
- `absence-aide`, `absence-date`, `absence-reason`, `absence-submit` - Absence modal

**Changed/Moved**:
- Week navigation controls now in AppBar component
- Create task button now in AppBar
- Aide/Task/Request management now in bottom drawer tabs

### 4. Cypress E2E Tests

#### Files Requiring Updates

**`cypress/e2e/drag-assign.cy.ts`**
- Update selectors to account for new layout
- Drawer components may affect element visibility
- MUI components may have different DOM structure

**`cypress/e2e/absence-handling.cy.ts`**
- Absence modal now uses MUI Dialog
- Test MUI Select component instead of native select

**`cypress/e2e/conflict-resolution.cy.ts`**
- Conflict modal upgraded to MUI Dialog
- Update button selectors for MUI Button components

**`cypress/e2e/recurring-multiday.cy.ts`**
- Multi-day dialog now uses ToggleButtonGroup
- Update day selection tests

**`cypress/e2e/undo-redo.cy.ts`**
- Undo/Redo controls position may have changed
- Now in Schedule view (not in separate location)

### 5. Material-UI Testing Considerations

#### Component Queries
Material-UI components render with additional wrapper elements. Use:
- `getByRole` for semantic queries (preferred)
- `data-testid` for specific components
- Avoid brittle class-based selectors

#### Example Updates

**Old**:
```tsx
const button = screen.getByText('Create Task');
```

**New**:
```tsx
const button = screen.getByRole('button', { name: /create task/i });
```

**MUI Select**:
```tsx
// Open select
fireEvent.mouseDown(screen.getByLabelText('Aide'));
// Select option
fireEvent.click(screen.getByText('Jane Smith'));
```

**MUI Dialog**:
```tsx
// Dialog renders in portal, use getByRole
const dialog = screen.getByRole('dialog');
expect(within(dialog).getByText('Create New Task')).toBeInTheDocument();
```

### 6. Accessibility Tests

#### New Components to Test
All new Material-UI components should maintain WCAG AA compliance:

**Required Checks**:
- [ ] AppBar has proper landmark roles
- [ ] Drawers have proper aria labels
- [ ] Buttons have descriptive labels
- [ ] Form inputs have associated labels
- [ ] Dialogs have proper focus management
- [ ] Color contrast meets WCAG AA standards
- [ ] Keyboard navigation works throughout

**Test Files**:
- `tests/accessibility/aria-labels.test.ts` - Update for new components
- `tests/accessibility/keyboard-nav.test.ts` - Test new drawers and modals
- `tests/accessibility/wcag-audit.test.ts` - Run on unified view

### 7. Integration Test Updates

#### Key Flows to Retest

**1. Complete Assignment Flow**
- Open app → unified view loads
- Drag task from unassigned → aide column
- Verify update
- Test undo

**2. Absence Flow**
- Click aide drawer (new)
- Click absence icon for aide
- Fill MUI form
- Submit
- Verify assignments unassigned

**3. Multi-day Assignment**
- (This flow may have changed - verify in UI)
- Open multi-day dialog
- Use ToggleButtonGroup
- Apply

**4. Conflict Resolution**
- Drag task causing conflict
- MUI conflict dialog appears
- Choose action
- Verify resolution

### 8. Component Test Examples

#### Testing AppBar
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../theme/theme';
import AppBar from '../../components/Layout/AppBar';

test('navigates to next week', () => {
  const onNextWeek = jest.fn();
  render(
    <ThemeProvider theme={theme}>
      <AppBar
        onMenuClick={() => {}}
        weekLabel="2025-10-20"
        onPrevWeek={() => {}}
        onNextWeek={onNextWeek}
        onToday={() => {}}
        onCreateTask={() => {}}
      />
    </ThemeProvider>
  );
  
  const nextButton = screen.getByTestId('nav-next');
  fireEvent.click(nextButton);
  expect(onNextWeek).toHaveBeenCalled();
});
```

#### Testing MUI Drawer
```tsx
test('toggles aide visibility', () => {
  const onToggle = jest.fn();
  render(
    <ThemeProvider theme={theme}>
      <AideDrawer
        open={true}
        onClose={() => {}}
        aides={mockAides}
        visibleAideIds={new Set([1, 2])}
        onToggleAideVisibility={onToggle}
        onMarkAbsence={() => {}}
        onAddAide={() => {}}
      />
    </ThemeProvider>
  );
  
  const toggle = screen.getByRole('checkbox', { name: /toggle.*visibility/i });
  fireEvent.click(toggle);
  expect(onToggle).toHaveBeenCalledWith(1);
});
```

### 9. Known Test Failures

After this redesign, the following tests are likely to fail and need updates:

1. **App.test.tsx** - Routing removed, needs restructure
2. **Schedule.test.tsx** - Major layout changes
3. **TimetableGrid.test.tsx** - MUI components, new props
4. **Absence tests** - MUI Dialog and Select
5. **Conflict tests** - MUI Dialog structure
6. **Multi-day tests** - ToggleButtonGroup

### 10. Running Tests

```bash
# Unit/Component tests
cd frontend
npm test

# E2E tests
npm run e2e:headless

# Accessibility audit
npm run test -- tests/accessibility/
```

### 11. Test Migration Priority

**High Priority** (Core functionality):
1. Schedule.test.tsx - Main view
2. drag-assign.cy.ts - Core feature
3. TimetableGrid.test.tsx - Core component
4. useDragDrop hook tests

**Medium Priority** (User flows):
5. Absence handling tests
6. Conflict resolution tests
7. Multi-day tests
8. Undo/redo tests

**Low Priority** (Nice to have):
9. Management panel tests
10. Aide drawer tests
11. Visual regression tests

### 12. New Features to Test

Features added in this redesign:
- [ ] Aide visibility toggle
- [ ] Bottom management drawer
- [ ] Enhanced task cards with status chips
- [ ] Search in unassigned panel
- [ ] Context menu on task cards
- [ ] Material Design theme application
- [ ] Loading and empty states
- [ ] Improved error handling

## Notes

- All tests should wrap components with `ThemeProvider` from MUI
- Use `within()` from @testing-library/react for scoped queries
- MUI components may require `act()` for async state updates
- Portal-rendered components (Dialog, Menu) need special queries

## Resources

- [Material-UI Testing Guide](https://mui.com/material-ui/guides/testing/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [Cypress MUI Recipes](https://docs.cypress.io/guides/component-testing/third-party-definitions)

