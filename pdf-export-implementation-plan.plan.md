# PDF Export Implementation Plan

## Overview

Add a "Export PDF" option that generates a printable PDF of the currently displayed weekly schedule. The PDF will include the matrix of assignments, similar to the visual grid.

## Backend Implementation

1.  **Dependencies**

    -   Add `reportlab` to `backend/requirements.txt` for PDF generation.

2.  **PDF Service** (`backend/api/services/pdf_service.py`)

    -   Create `PdfService` class.
    -   Method `generate_weekly_pdf(assignments, start_date, end_date, aide_id=None)`:
        -   Setup PDF document (A4 landscape).
        -   Draw header (Week of X, optional Aide Name).
        -   Draw grid structure (Days columns, Time rows).
        -   Fill cells with assignment details (Task title, location).
        -   Handle cell merging or text wrapping for readability.
        -   Return PDF bytes.

3.  **API Routes** (`backend/api/routes/calendar.py`)

    -   Add endpoint: `GET /api/calendar/export-pdf`
    -   Parameters: Same as export (start_date, end_date, aide_id).
    -   Logic:
        -   Fetch assignments.
        -   Call `PdfService.generate_weekly_pdf`.
        -   Return `application/pdf`.

## Frontend Implementation

1.  **API Client** (`frontend/src/services/calendarApi.ts`)

    -   Add `exportPdf(params: ExportParams): Promise<Blob>`.

2.  **UI Updates** (`frontend/src/pages/Schedule.tsx`)

    -   Update the "Export" button to be a Split Button or Menu.
    -   Options: "Export to Calendar (.ics)" and "Export to PDF".
    -   Action: Calls the respective API endpoint and triggers download.

## Verification

-   **Manual Test**: Generate PDF for a busy week and check layout/wrapping.

### To-dos

- [x] Add icalendar dependency to backend/requirements.txt
- [x] Create CalendarService for ICS generation
- [x] Implement API endpoint for calendar export
- [x] Register calendar blueprint in app.py
- [x] Add export function to frontend API client
- [x] Add Export button to Schedule page toolbar
- [x] Add Export action to Aides page
- [x] Add reportlab dependency to backend/requirements.txt
- [x] Create PdfService for PDF generation
- [x] Add PDF export endpoint to calendar routes
- [x] Update frontend API to support PDF export
- [x] Update Schedule page UI with Export menu




































