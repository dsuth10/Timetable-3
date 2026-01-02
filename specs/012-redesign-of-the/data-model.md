# Data Model: PDF Export Redesign

No changes to the persistent database schema are required for this feature. The existing entities (`Assignment`, `TeacherAide`, `Classroom`, `Task`) provide all necessary data for the export.

## Transient Entities (Frontend State)

### `ExportConfig`
Represents the configuration used by the PDF generation service.
- `orientation`: `'landscape'` (fixed)
- `pageSize`: `'a4'` (fixed)
- `theme`: `'light'` (forced)
- `scaling`: `'auto-fit'` (continuous scaling logic)
- `header`:
    - `staffName`: string
    - `dateRange`: string

### `TimetableSnapshot`
The rendered DOM state captured by `html2canvas` before being converted to PDF.
- `width`: Number (pixels)
- `height`: Number (pixels)
- `canvas`: HTMLCanvasElement

