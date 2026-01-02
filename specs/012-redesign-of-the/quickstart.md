# Quickstart: PDF Export Redesign

## Objective
Verify that the timetable can be exported as a high-fidelity, single-page A4 landscape PDF that matches the digital view's colors and layout, regardless of the app's current theme.

## Prerequisites
- Backend and Frontend are running.
- At least one Teacher Aide exists with assignments.

## Verification Steps

### 1. Data Setup
- Navigate to an aide's weekly timetable.
- Add several assignments across different categories:
    - `PLAYGROUND` (verify specific color)
    - `CLASS_SUPPORT` (verify specific color)
    - `GROUP_SUPPORT` (verify specific color)
- Ensure assignments span the full logical period (e.g., 08:50 to 15:00).

### 2. Theme Verification
- Toggle the application to **Dark Mode**.
- Verify the UI background is dark and text is light.

### 3. Export Execution
- Click the **Export PDF** button.
- A PDF download should trigger automatically.

### 4. Result Inspection
Open the downloaded PDF and verify:
- [ ] **One Page**: The document is exactly one page long.
- [ ] **Landscape**: The document is in A4 landscape orientation.
- [ ] **Colors**: Assignment colors (blue, red, green, etc.) match the digital UI.
- [ ] **Theme**: The background is white and text is dark (forced light theme).
- [ ] **Scaling**: The grid fits perfectly within the page margins.
- [ ] **Cleanliness**: No "Add Task" buttons or navigation menus are visible.
- [ ] **Header**: Staff name and date range are present at the top.

## Automated Testing
Run the following to verify logic:
```bash
# Frontend tests for scaling and theme forcing
npm test -- src/services/pdfExport.test.ts
```

