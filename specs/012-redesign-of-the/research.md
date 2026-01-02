# Research: PDF Export Redesign

## Decision: High-Fidelity Frontend PDF Generation
We will use `jsPDF` and `html2canvas` to perform client-side PDF generation. This approach allows us to capture the exact CSS styles, MUI component layouts, and colors used in the digital timetable without having to replicate complex rendering logic on the backend.

## Rationale
- **Fidelity**: `html2canvas` captures the actual rendered DOM, ensuring the "direct reproduction" requirement is met.
- **Scaling**: We can calculate the scale factor required to fit the resulting canvas into a standard A4 landscape page (297mm x 210mm).
- **Theme Isolation**: By rendering the timetable into a hidden DOM element with a forced `light` theme, we can capture the light-mode version even if the user is in dark mode.
- **Local-First**: This logic runs entirely in the browser, adhering to the local-first principle of the constitution.

## Alternatives Considered
- **Backend WeasyPrint**: Rejected because it would require mirroring all MUI and custom styles in a separate CSS environment, increasing maintenance and risk of visual drift.
- **Native Browser Print**: Rejected because it's difficult to force "exactly one page" across different browsers and print settings.
- **react-pdf**: Rejected because it uses its own layout engine which doesn't support complex CSS Grid/Flexbox as used in the digital timetable, making "direct reproduction" very difficult.

## Implementation Details

### Continuous Scaling Algorithm
1. Render the full logical timetable (un-virtualized) into a hidden container.
2. Capture the container using `html2canvas` with a high scale factor (e.g., `scale: 2` for clarity).
3. Get canvas dimensions: `w_canvas`, `h_canvas`.
4. Target A4 Landscape dimensions (points): `w_pdf = 841.89`, `h_pdf = 595.28`.
5. Calculate scale factor: `min(w_pdf / w_canvas, h_pdf / h_canvas)`.
6. Use `jsPDF.addImage()` with the calculated dimensions to center and fit the content on one page.

### Theme & Clean Export
- A dedicated `TimetableExportView` component will be used.
- This component will wrap the grid in a `ThemeProvider` with `mode: 'light'`.
- Interactive elements (Add buttons, etc.) will be hidden using a CSS class `.hide-for-export` applied to those sub-components.

### Full Logical Period
- The component will receive the full dataset for the week and render all rows/columns, ensuring no content is missing due to scroll position or virtualization.

## Data Fetching
- If the current frontend state only holds visible data, a separate fetch to the existing aide/timetable endpoints may be required to get the full week's worth of assignments.

## New Dependencies
- `jspdf`: For PDF document creation.
- `html2canvas`: For DOM to image conversion.
- `@types/jspdf`: TypeScript definitions.

