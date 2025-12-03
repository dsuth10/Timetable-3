# Teacher Aide Scheduler 🎓

**A drag-and-drop timetable scheduling system for Queensland primary schools**

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Overview

The Teacher Aide Scheduler is a desktop-optimized web application that enables school administrators to visually assign teacher aides to classroom tasks and playground duties using an intuitive drag-and-drop interface. The system features a modern Material Design UI with a weekly view that allows administrators to see individual aide schedules across Monday-Friday, supports cross-day task dragging, and operates completely offline using a local SQLite database with real-time conflict detection.

### Key Features

✅ **Drag-and-Drop Interface** - Assign tasks by dragging them to aide time slots with real-time updates  
✅ **Class-based Interface** - Alternative view focusing on classroom schedules and aide allocations  
✅ **Dual View Modes** - Seamlessly toggle between Teacher Aide and Class-centric views  
✅ **Smart Aide Filtering** - Filter available aides by time slot with drag-and-drop allocation  
✅ **Interactive Task Selection** - When assigning aides to classes, choose from existing tasks or create new ones via modal dialog  
✅ **Flexible Time Slots** - Support for 5-minute increments (e.g. school bell times)  
✅ **Simplified Task Creation** - Create task templates with just title, category, classroom, and notes  
✅ **Task Bank** - Unscheduled tasks shown as "Not scheduled" until dragged to calendar  
✅ **Automatic Time Assignment** - Times set automatically based on where task is dropped  
✅ **Weekly View** - View individual aide schedules across Monday-Friday with aide selector  
✅ **Enhanced Week Navigation** - Navigate weeks with previous/next/today buttons plus date picker for jumping to specific weeks  
✅ **Cross-Day Dragging** - Drag tasks between different days with automatic date updates and persistence  
✅ **Aide Availability Management** - Set weekly availability patterns with visual grid editor and time slot management  
✅ **Recurring Tasks** - Convert assigned tasks to recurring with simple weekday selection and week count  
✅ **Conflict Detection** - Real-time collision detection with replace/shorten/cancel options  
✅ **Task Editing** - Edit task details and recurring patterns with smart updates  
✅ **Granular Deletion** - Delete individual assignments or entire task series  
✅ **Classroom Management** - Manage classrooms, assigned teachers, and room numbers  
✅ **Absence Management** - Mark aides absent with automatic task reassignment  
✅ **Relief Pool** - Orphaned tasks from absent aides are preserved in a Relief Pool with date-restricted reassignment  
✅ **Multi-Day Assignment** - Apply recurring tasks to multiple selected days at once  
✅ **Undo/Redo** - 10-level undo buffer for all timetable modifications  
✅ **Material Design UI** - Modern, intuitive interface with consistent theming  
✅ **Unified Single View** - All management functions accessible without page navigation  
✅ **Offline-First** - No internet required, all data stored locally in SQLite  
✅ **WCAG AA Compliant** - Full keyboard navigation and screen reader support  
✅ **Concurrent Editing** - Optimistic locking for multi-administrator use  

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.12 or higher
- **Node.js** 18 or higher
- **npm** 9 or higher

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/timetable-scheduler.git
cd timetable-scheduler
```

2. **Setup Backend**
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python seed.py  # Optional: Load sample data
```

3. **Setup Frontend**
```bash
cd frontend
npm install
```

4. **Run Application**

**Terminal 1** (Backend):
```bash
cd backend
python app.py
# Backend runs on http://localhost:5000
```

**Terminal 2** (Frontend):
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

5. **Access Application**

Open your browser to: **http://localhost:3000**

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (Desktop)                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │          React 18 + TypeScript Frontend            │ │
│  │  • Material-UI Components                          │ │
│  │  • Zustand State Management                        │ │
│  │  • @hello-pangea/dnd (Drag & Drop)                 │ │
│  │  • Axios API Client                                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/JSON
┌─────────────────────────────────────────────────────────┐
│              Flask 3.x REST API (Backend)                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  • API Routes (Aides, Tasks, Assignments, etc.)    │ │
│  │  • Business Logic Services                         │ │
│  │  • RRULE Recurrence Engine                         │ │
│  │  • Collision Detection Service                     │ │
│  │  • Background Scheduler (Horizon Extension)        │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────┐
│               SQLite Database (Local File)               │
│  • Teacher Aides & Availability                          │
│  • Tasks (One-off & Recurring)                           │
│  • Assignments (w/ Optimistic Locking)                   │
│  • Absences & Classrooms                                 │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Backend
- **Framework**: Flask 3.x
- **ORM**: SQLAlchemy 2.x
- **Database**: SQLite (local file)
- **Migrations**: Alembic
- **Recurrence**: python-dateutil (iCal RRULE)
- **Testing**: pytest, pytest-flask

#### Frontend
- **Framework**: React 18
- **Language**: TypeScript (strict mode)
- **Build Tool**: Vite
- **UI Library**: Material-UI v5
- **Date Picker**: @mui/x-date-pickers
- **State Management**: Zustand with auto-refresh on updates
- **Drag & Drop**: @hello-pangea/dnd with cross-day support
- **HTTP Client**: Axios with optimistic locking
- **Testing**: Vitest, React Testing Library, Cypress

---

## 📁 Project Structure

```
timetable-scheduler/
├── backend/                      # Python Flask backend
│   ├── api/
│   │   ├── models/               # SQLAlchemy models (7 entities)
│   │   ├── routes/               # API endpoints (aides, tasks, assignments, etc.)
│   │   ├── services/             # Business logic (collision, recurrence, conflicts)
│   │   ├── middleware/           # Validation middleware
│   │   ├── scheduler.py          # Background scheduler for horizon extension
│   │   └── __init__.py
│   ├── migrations/               # Alembic database migrations
│   ├── tests/
│   │   ├── contract/             # API contract tests
│   │   └── integration/          # Integration tests
│   ├── app.py                    # Flask application entry point
│   ├── seed.py                   # Database seeding script
│   ├── requirements.txt          # Python dependencies
│   └── alembic.ini               # Alembic configuration
│
├── frontend/                     # React TypeScript frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Layout/           # Layout components (AppBar, AideDrawer, ManagementPanel)
│   │   │   ├── Management/       # Management components (Aides, Tasks, Requests, Classrooms)
│   │   │   ├── common/           # Common UI components (LoadingState, EmptyState)
│   │   │   ├── TimetableGrid/    # Timetable grid & slots (weekly view)
│   │   │   ├── TaskModals/       # Task creation/editing modals
│   │   │   ├── ConflictModal.tsx # Conflict resolution dialog
│   │   │   ├── MultiDayDialog.tsx# Multi-day assignment dialog
│   │   │   └── ...
│   │   ├── pages/                # Main pages (App, Schedule)
│   │   ├── store/
│   │   │   └── stores/           # Zustand stores (6 stores)
│   │   ├── services/             # API client layer
│   │   ├── hooks/                # Custom React hooks (useDragDrop)
│   │   ├── theme/                # Material Design theme system
│   │   ├── types/                # TypeScript type definitions
│   │   └── main.tsx
│   ├── tests/
│   │   ├── components/           # Component tests
│   │   ├── accessibility/        # WCAG AA compliance tests
│   │   └── setup.ts
│   ├── cypress/
│   │   └── e2e/                  # End-to-end tests
│   ├── package.json
│   ├── vite.config.ts
│   └── vitest.config.ts
│
├── instance/
│   └── timetable.db              # SQLite database file
│
├── docs/                         # Documentation
│   ├── api-reference.md          # API documentation
│   └── deployment.md             # Deployment guide
│
├── specs/                        # Design specifications
│   ├── 001-create-a-drag/        # Feature specification
│   │   ├── spec.md               # Feature spec
│   │   ├── plan.md               # Implementation plan
│   │   ├── tasks.md              # Task breakdown
│   │   ├── data-model.md         # Entity relationship model
│   │   ├── quickstart.md         # Integration test scenario
│   │   └── contracts/            # API & RRULE specs
│   └── 002-i-want-a/             # Class Interface specification
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       └── ...
│
└── README.md                     # This file
```

---

## 📊 Data Model

The application manages 7 core entities:

| Entity | Description | Key Relationships |
|--------|-------------|-------------------|
| **TeacherAide** | Staff member providing support | Has Availability, Assignments, Absences |
| **Availability** | Weekly availability pattern (Monday-Friday time windows) | Belongs to TeacherAide, one per weekday |
| **Task** | Support duty template (title, category, classroom, notes) | Has Assignments, optional Classroom |
| **Assignment** | Specific task occurrence assigned to aide | Belongs to Task and TeacherAide |
| **Absence** | Aide unavailability record | Belongs to TeacherAide |
| **Classroom** | Physical learning space (includes Name, Room Number, Teacher) | Has Tasks |
| **Request** | Teacher request for aide support | Optional Classroom |

See [data-model.md](specs/001-create-a-drag/data-model.md) for full entity definitions.

---

## 🗓️ Weekly View Interface

The application features a modern weekly view that allows administrators to:

- **Select Individual Aides**: Use the dropdown to switch between different teacher aides
- **View Full Week**: See Monday-Friday schedule for the selected aide
- **Cross-Day Dragging**: Drag tasks between different days of the week
- **Enhanced Week Navigation**: 
  - Navigate backward/forward with arrow buttons
  - Jump to current week with "Today" button
  - Jump to any specific week with date picker calendar
  - Visual week indicator showing week number (e.g., "Week 42")
  - Full date range display (e.g., "Oct 13-17, 2025")
- **Day Headers**: Clear day names and dates (e.g., "Monday - Oct 13")
- **Time Slots**: 30-minute intervals from 8:00 AM to 5:00 PM
- **Visual Feedback**: Color-coded headers and drag-over indicators

### Weekly View Layout
```
┌─────────┬───────────┬───────────┬───────────┬───────────┬───────────┐
│ Time    │  Monday   │  Tuesday  │ Wednesday │ Thursday  │  Friday   │
│         │  Oct 13   │  Oct 14   │  Oct 15   │  Oct 16   │  Oct 17   │
├─────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│ 08:00   │ [Task]    │           │           │  [Task]   │           │
│ 08:30   │           │           │           │           │           │
│ 09:00   │           │  [Task]   │  [Task]   │           │  [Task]   │
│ ...     │           │           │           │           │           │
└─────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

---

## 🎯 Core Workflows

### 1. Drag-and-Drop Assignment

```
1. Navigate to desired week using:
   - Previous/Next week buttons
   - "Today" button to jump to current week
   - "Jump to Week" date picker for specific dates
2. Select aide from dropdown to view their weekly schedule
3. View weekly timetable grid (Monday-Friday × time slots)
4. See unassigned tasks in right panel
5. Drag task to aide's time slot:
   - Same day: Updates aide assignment only
   - Different day: Updates both aide and date automatically
6. System checks for conflicts:
   ✓ No conflict → Assign immediately with optimistic locking
   ⚠ Partial overlap → Auto-shorten first task
   ❌ Full overlap → Show replace/cancel modal
7. Update reflected in grid immediately with automatic refresh
8. All changes persisted to backend with version control
9. Cross-day moves update task date and persist across page refreshes
```

### 2. Task Creation & Scheduling

```
Creating Tasks:
1. Click "Create Task" button
2. Enter essential information:
   - Task Title (required)
   - Category (required) - Playground, Class Support, etc.
   - Classroom (optional)
   - Notes (optional)
3. Task created and appears in Task Bank as "Not scheduled"
4. No times or dates set yet - those come when assigned

Assigning Tasks:
1. Drag task from Task Bank to calendar time slot
2. Times automatically set based on drop location
3. Assignment created for that specific aide and date
4. Task can be reassigned by dragging to different slots

Making Tasks Recurring:
1. Drag task to calendar (creates first assignment)
2. Double-click the assignment to edit
3. Check "Make this a recurring task"
4. Select weekdays (Mon-Fri checkboxes)
5. Enter number of weeks to recur
6. Save - system generates all future instances for same aide
7. No duplicates on first day (existing assignment preserved)
```

### 3. Absence Management

```
1. Mark aide absent for specific date
2. System finds all assignments for that aide/date
3. Assignments automatically unassigned (aide_id = NULL)
4. Tasks return to unassigned panel
5. When absence removed:
   → Restore assignments if slots still available
   → Report conflicts if slots now occupied
```

### 4. Conflict Resolution

```
Scenario: Dragging task to occupied slot

Option 1: Replace Existing
  → Unassign first task
  → Assign new task
  → First task returns to unassigned

Option 2: Cancel
  → No changes made
  → New task remains unassigned

Option 3: Auto-Shorten (Partial Overlap)
  → First task end time adjusted
  → New task assigned to remaining slot
```

### 5. Task Management

```
Editing Task Templates (Task Bank):
1. Tasks in Task Bank are templates without assigned times/dates
2. Display as "Not scheduled" until dragged to calendar
3. Can edit title, category, classroom, notes at any time

Editing Assignments (Calendar):
1. Double-click any assignment on the calendar
2. Update title, category, times, classroom, notes
3. Toggle "Make this a recurring task" to enable recurrence
4. For recurring tasks:
   - Select weekdays to repeat on
   - Enter number of weeks to continue
   - System auto-generates future instances for same aide
5. Changes to recurring tasks update template only (not existing instances)

Deleting Tasks:
1. Click "Delete" in the task edit dialog
2. Choose deletion scope:
   → "Delete only this instance": Removes just this specific assignment (when deleting from calendar)
   → "Reset task": Removes all assignments but keeps the task template in Task Bank
   → "Permanently delete task": Completely removes the task and all assignments (default when deleting from Task Bank)
3. When deleting from Task Bank, task is permanently removed by default
4. When deleting from assignment context, all three options are available
```

### 6. Classroom Management

The application allows administrators to manage a database of classrooms, each with an assigned teacher and room number.

- **Create Classrooms**: Add new classrooms with Name (e.g., "3A"), Room Number, Teacher Name, and optional notes.
- **Assign Teachers**: Directly link a teacher's name to a classroom entity.
- **Management**: Edit or delete classroom details from the management panel.
- **Integration**: Classrooms can be selected when creating or editing tasks, making it easy to see where support is needed.

### 7. Class-based Allocation

```
1. Switch to "Class" view using the toggle in the top bar
2. Select a specific classroom from the left drawer
3. View the classroom's weekly schedule showing all allocated support
4. Click any time slot to see a filtered list of *available* teacher aides
5. Drag an aide from the right panel into the slot to allocate them
6. Task Selection Modal appears:
   - Select from existing tasks for that classroom
   - Or click "Create New Task" to quickly create a specific task
   - Prevents duplicate "Class Support" tasks from cluttering the system
7. Assignment created with the selected or newly created task
```

---

## 👥 Aide Availability Management

The system includes comprehensive availability management that allows administrators to set weekly availability patterns for teacher aides, ensuring proper scheduling and conflict prevention.

### Key Features

✅ **Weekly Availability Grid** - Visual Monday-Friday availability editor with toggle switches  
✅ **Time Slot Management** - Set start/end times with 15-minute increment validation  
✅ **Real-time Updates** - Changes saved immediately with optimistic locking  
✅ **Visual Indicators** - Clear available/unavailable day status with color coding  
✅ **Default Times** - Smart defaults (08:00-17:00) matching school hours  
✅ **Conflict Prevention** - Unavailable days prevent task assignment  
✅ **Intuitive Interface** - Toggle days on/off with time picker dropdowns  

### How Availability Works

#### Setting Up Aide Availability

1. **Open Aide Management**: Click "Aides" in the management panel
2. **Edit Aide**: Click the edit button for any aide
3. **Availability Section**: Scroll to the "Weekly Availability" section
4. **Configure Days**: 
   - Toggle each day on/off using the switch
   - Set start/end times using the dropdown selectors
   - Times are automatically validated for 15-minute increments
5. **Save Changes**: Availability is saved immediately to the backend

#### Making an Aide Unavailable on Specific Days

**To make an aide unavailable on Monday (or any day)**:
1. Open the aide's edit form
2. Find the "Monday" section in the availability grid
3. Toggle the "Available" switch to OFF
4. The day will show as "Unavailable" with a gray indicator
5. Changes are saved automatically

**Result**: The aide will not appear as available for task assignment on that day, and the timetable grid will show a gray overlay indicating unavailability.

#### Availability Display in Timetable

- **Available Days**: Show normal time slots for task assignment
- **Unavailable Days**: Display gray overlay with "No availability set" tooltip
- **Absent Days**: Show red diagonal pattern overlay (separate from availability)
- **Time Slots**: Only available time windows are highlighted for assignment

### Technical Implementation

#### Backend API Endpoints

```bash
# Get aide availability
GET /api/aides/{id}/availability

# Create availability window
POST /api/aides/{id}/availability
{
  "weekday": "MO",
  "start_time": "09:00:00", 
  "end_time": "15:00:00"
}

# Delete availability window
DELETE /api/availability/{id}
```

#### Data Model

**Availability Entity**:
- `id`: Primary key
- `aide_id`: Foreign key to TeacherAide
- `weekday`: Day of week (MO, TU, WE, TH, FR)
- `start_time`: Time in HH:MM:SS format
- `end_time`: Time in HH:MM:SS format
- **Constraint**: Only one availability window per aide per weekday

#### Validation Rules

- **Time Format**: Must be in HH:MM:SS format
- **Time Increments**: Must be in 15-minute increments (00, 15, 30, 45)
- **Time Logic**: End time must be after start time
- **Weekday Range**: Only Monday-Friday (MO, TU, WE, TH, FR)
- **Uniqueness**: One availability window per aide per weekday

#### Frontend Components

**AvailabilityEditor.tsx**:
- Weekly grid with Monday-Friday toggles
- Time picker dropdowns with 15-minute slots
- Real-time API integration
- Visual status indicators
- Error handling and loading states

**Integration with AideFormModal**:
- Loads existing availability when editing
- Saves changes immediately
- Handles both create and edit modes
- Proper state management

### User Experience

#### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│                    Weekly Availability                   │
├─────────────┬─────────────┬─────────────┬─────────────┤
│   Monday    │   Tuesday   │  Wednesday  │  Thursday   │
│  Available  │ Unavailable │  Available  │  Available  │
│ 08:00-17:00 │      —      │ 09:00-15:00 │ 08:00-17:00 │
│     ✓       │      ✗      │      ✓      │      ✓      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### Status Indicators

- **🟢 Available**: Green background, time range displayed
- **⚪ Unavailable**: Gray background, "Unavailable" label
- **⏰ Time Display**: Shows start and end times when available
- **🔄 Loading**: Spinner during API operations
- **❌ Error**: Red alert for failed operations

#### Interaction Patterns

1. **Toggle Day**: Click switch to enable/disable availability
2. **Set Times**: Use dropdown selectors for start/end times
3. **Auto-save**: Changes saved immediately (no "Save" button needed)
4. **Validation**: Invalid times show error messages
5. **Feedback**: Visual confirmation of successful changes

### Best Practices

#### For Administrators

- **Set Realistic Hours**: Use actual aide availability (e.g., 08:30-15:30)
- **Consider Breaks**: Account for lunch breaks in availability windows
- **Regular Updates**: Update availability when aide schedules change
- **Document Changes**: Use absence management for temporary unavailability

#### For System Usage

- **Default Times**: New aides get 08:00-17:00 availability by default
- **Conflict Prevention**: Unavailable days prevent task assignment
- **Visual Clarity**: Always show availability status in timetable
- **Error Handling**: Clear messages for validation failures

### Troubleshooting Availability Issues

**Aide shows as unavailable when they should be available**:
1. Check aide's availability settings in management panel
2. Verify the day is toggled ON with correct times
3. Ensure times are in 15-minute increments
4. Check for conflicting absence records

**Time picker shows wrong options**:
- System uses 15-minute increments (08:00, 08:15, 08:30, etc.)
- Times are validated against backend constraints
- Invalid times will show error messages

**Changes not saving**:
- Check network connection
- Verify backend is running
- Look for error messages in the interface
- Try refreshing the page and re-entering changes

---

## 🧪 Testing

### Backend Tests (pytest)

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=api --cov-report=html

# Run specific test category
pytest tests/contract/
pytest tests/integration/
```

**Test Coverage**:
- ✅ 20+ contract tests (API endpoint validation)
- ✅ 5 integration tests (user journey scenarios)
- ✅ Model unit tests

### Frontend Tests (Vitest)

```bash
cd frontend

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

**Test Coverage**:
- ✅ Component tests (TimetableGrid, UnassignedPanel, modals)
- ✅ Accessibility tests (keyboard nav, ARIA labels, WCAG AA)
- ✅ Store tests (Zustand state management)

### End-to-End Tests (Cypress)

```bash
cd frontend

# Open Cypress UI
npm run e2e

# Run headless
npm run e2e:headless
```

**Test Scenarios**:
- ✅ Drag task to assign (same day and cross-day)
- ✅ Aide switching and weekly view navigation
- ✅ Conflict resolution flow
- ✅ Absence handling
- ✅ Recurring task multi-day assignment
- ✅ Undo/redo actions
- ✅ Enhanced week navigation (previous/next/today/date picker)

---

## 🔧 Configuration

### Backend Configuration

Create `backend/.env`:

```env
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///instance/timetable.db
CORS_ORIGINS=http://localhost:3000
SCHEDULER_HORIZON_WEEKS=4
LOG_LEVEL=INFO
```

### Frontend Configuration

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_TITLE=Teacher Aide Scheduler
VITE_DEFAULT_WEEK_VIEW=current
```

---

## 📖 API Documentation

Full API documentation available at: [docs/api-reference.md](docs/api-reference.md)

### Quick API Examples

**List all aides**:
```bash
curl http://localhost:5000/api/aides
```

**Create assignment**:
```bash
curl -X POST http://localhost:5000/api/assignments \
  -H "Content-Type: application/json" \
  -d '{"task_id": 101, "aide_id": 1, "date": "2025-10-06", "start_time": "10:30", "end_time": "11:00"}'
```

**Get weekly matrix**:
```bash
curl http://localhost:5000/api/assignments/weekly-matrix?week=2025-W41
```

**Mark aide absent**:
```bash
curl -X POST http://localhost:5000/api/absences \
  -H "Content-Type: application/json" \
  -d '{"aide_id": 1, "date": "2025-10-06", "reason": "Sick leave"}'
```

---

## 🚢 Deployment

See [docs/deployment.md](docs/deployment.md) for full deployment guide.

### Quick Production Build

**Backend**:
```bash
cd backend
pip install -r requirements.txt
export FLASK_ENV=production
python app.py
```

**Frontend**:
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

**Deployment Options**:
1. **Standalone Desktop App** (Electron) - Recommended for MVP
2. **Web Server** (nginx + Flask) - For network deployment
3. **Docker** (docker-compose) - Containerized deployment

---

## 🛠️ Development

### Running Tests During Development

**Watch mode** (auto-rerun on file changes):
```bash
# Frontend
cd frontend
npm test -- --watch

# Backend
cd backend
pytest-watch
```

### Linting & Code Quality

**Backend** (ruff + black):
```bash
cd backend
ruff check .
black --check .
```

**Frontend** (ESLint):
```bash
cd frontend
npm run lint
npm run lint:fix
```

### Database Migrations

**Create migration**:
```bash
cd backend
alembic revision --autogenerate -m "Add new column"
```

**Apply migration**:
```bash
alembic upgrade head
```

**Rollback migration**:
```bash
alembic downgrade -1
```

---

## 🔒 Security

### MVP (Current)

- **Offline operation**: No network exposure
- **Input validation**: All API endpoints validate input
- **SQLite permissions**: User read/write only
- **CORS**: Restricted to localhost

### Future Enhancements

- JWT-based authentication
- Role-based access control (admin, teacher, aide)
- HTTPS/SSL encryption
- Database encryption
- Audit logging

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**:
```bash
# Check Python version
python --version  # Should be 3.12+

# Reinstall dependencies
pip install -r requirements.txt

# Check port availability
lsof -ti:5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

**Frontend build fails**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
```

**Database errors**:
```bash
# Reset database
rm instance/timetable.db
alembic upgrade head
python seed.py
```

**Drag-and-drop date issues**:
```
If tasks appear in wrong day columns after dragging:
- The system uses UTC-based date calculations to avoid timezone issues
- Week dates are calculated from Monday (first day of week)
- Dates are persisted in YYYY-MM-DD format
- Check browser console for any version conflict errors
- Ensure frontend hot-reload completed after code changes
```

See [docs/deployment.md#troubleshooting](docs/deployment.md#troubleshooting) for more solutions.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Development Guidelines**:
- Follow existing code style (TypeScript strict mode, ESLint, black/ruff)
- Write tests for new features (contract, integration, E2E)
- Update documentation (README, API reference, deployment guide)
- Ensure all tests pass (`pytest`, `npm test`, `npm run e2e`)

---

## 📞 Support

**Documentation**:
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Feature Specification](specs/001-create-a-drag/spec.md)
- [Quickstart Test](specs/001-create-a-drag/quickstart.md)

**Issues**: [GitHub Issues](https://github.com/your-org/timetable-scheduler/issues)

**Email**: support@yourschool.edu

---

## 🙏 Acknowledgments

- **Python Community**: Flask, SQLAlchemy, Alembic, python-dateutil
- **React Community**: React, TypeScript, Vite, Material-UI
- **Drag & Drop**: @hello-pangea/dnd team
- **State Management**: Zustand team
- **Testing**: pytest, Vitest, Cypress teams

---

## 📅 Roadmap

### Version 1.0 (MVP) ✅
- [x] Drag-and-drop assignment with real-time updates
- [x] Weekly view with aide selector
- [x] Enhanced week navigation with date picker
- [x] Cross-day dragging with automatic date persistence
- [x] Material Design UI
- [x] Unified single-view architecture
- [x] Recurring tasks (RRULE)
- [x] Conflict detection with optimistic locking
- [x] Absence management
- [x] Undo/redo with version control
- [x] WCAG AA compliance
- [x] UTC-based date handling (timezone-safe)

### Version 1.0.5 (Dec 2025) ✅
- [x] Class-based Interface
- [x] Dual view modes (Aide/Class)
- [x] Smart aide filtering by availability
- [x] Flexible time slots (5-min increments)

### Version 1.1 (Planned)
- [ ] User authentication & authorization
- [ ] Email notifications
- [ ] PDF/Excel report generation
- [ ] Mobile-responsive UI
- [ ] Calendar import/export (iCal)

### Version 2.0 (Future)
- [ ] Multi-school support
- [ ] Analytics dashboard
- [ ] Automated scheduling (AI suggestions)
- [ ] Mobile apps (iOS/Android)

---

## 🔄 Recent Updates

### Version 1.0.6 (2025-12-02)

**New Features**:
- ✅ **Interactive Task Selection Modal** - When dragging an aide to a class schedule slot, a modal appears allowing selection of existing tasks or quick creation of new ones
- ✅ **Prevent Duplicate Tasks** - No more automatic "Class Support" task creation; users choose or create specific tasks
- ✅ **Quick Task Creation** - Inline form in modal for creating tasks with just title and description

**Bug Fixes**:
- ✅ **Fixed Task Deletion** - Tasks deleted from Task Bank now properly disappear from the list (permanent deletion instead of reset)
- ✅ **Improved Deletion Options** - Clear distinction between "Reset task" (keep template) and "Permanently delete task" (remove completely)
- ✅ **Better Default Behavior** - When deleting from Task Bank, defaults to permanent deletion; when deleting from assignment, offers all options

**Technical Improvements**:
- Added `TaskSelectionModal` component with task list and inline creation form
- Updated `taskService` to fetch tasks by classroom and create tasks via API
- Enhanced `TaskDeleteDialog` with three deletion options: instance, reset, and permanent delete
- Updated task store to properly refresh after permanent deletion
- Backend `POST /api/tasks` now accepts `description` field (maps to `notes`) and defaults to `CLASS_SUPPORT` category for quick-create

### Version 1.0.5 (2025-12-01)

**New Features**:
- ✅ **Class-based Interface** - New view mode to manage schedules per classroom
- ✅ **Smart Aide Selector** - Right-side panel filters aides by availability when a time slot is selected
- ✅ **Drag-to-Allocate** - Drag available aides directly into class time slots
- ✅ **Flexible Timing** - Updated backend to support 5-minute time increments (e.g., 08:50)

**Technical Improvements**:
- Implemented `ClassTimetableGrid` for multi-aide slot display
- Added client-side availability filtering in `TeacherAideListPanel`
- Refactored `Schedule` page to support swappable views (Aide vs Class)
- Updated `Task` model validation to allow 5-minute increments

### Version 1.0.4 (2025-11-21)

**Major Improvements**:
- ✅ **Simplified Task Creation** - Task creation now only requires 4 fields (title, category, classroom, notes)
- ✅ **Template-Based Workflow** - Tasks created as templates in Task Bank, showing "Not scheduled"
- ✅ **Drag-to-Schedule** - Times automatically assigned when dragging task to calendar
- ✅ **Deferred Complexity** - Recurring options only available after task is scheduled
- ✅ **Number of Weeks Input** - Replaced confusing expiry date with simple "number of weeks" field
- ✅ **No Duplicate Instances** - Fixed bug where converting to recurring created duplicate on first day

**Removed Complexity**:
- Removed time selection from task creation (set automatically on assignment)
- Removed assignment date from task creation (set by drag location)
- Removed recurring options from creation dialog (moved to edit after assignment)
- Removed old `/recurring-tasks` endpoint (obsolete paradigm)

**Technical Changes**:
- Simplified `TaskCreationModal` to 4 essential fields
- Updated `TaskTemplateCard` to display "Not scheduled" instead of placeholder times
- Modified `POST /tasks` endpoint to create templates without assignments
- Added `exclude_date` parameter to prevent duplicate recurring instances
- Removed `createRecurring` API method (no longer needed)

**User Experience**:
- 📊 Cleaner, more intuitive task creation interface
- 🎯 Clear separation between creation (simple) and scheduling (complex)
- 🔄 Recurring tasks now assigned to same aide automatically
- ✨ Better mental model: Templates → Schedule → Make Recurring

### Version 1.0.3 (2025-11-21)

**New Features**:
- ✅ **Task Editing** - Double-click tasks on calendar or click in sidebar to edit all details
- ✅ **Granular Deletion** - Delete single instances of tasks without removing the entire series
- ✅ **Smart Recurrence Updates** - Editing recurring tasks safely updates the template for future use
- ✅ **Enhanced Task Management** - Improved sidebar interface for managing task definitions

**Technical Improvements**:
- Implemented `TaskEditModal` for unified editing experience
- Updated `TaskDeleteDialog` to support instance-level deletion for all task types
- Added `PUT /api/tasks/{id}` endpoint for full task updates
- Enhanced toast notifications for task operations

### Version 1.0.2 (2025-10-23)

**New Features**:
- ✅ **Aide Availability Management** - Complete weekly availability system with visual grid editor
- ✅ **Time Slot Management** - Set start/end times with 15-minute increment validation
- ✅ **Real-time Updates** - Availability changes saved immediately with optimistic locking
- ✅ **Visual Indicators** - Clear available/unavailable day status with color coding
- ✅ **Conflict Prevention** - Unavailable days prevent task assignment in timetable

**Technical Improvements**:
- Added DELETE endpoint for availability management (`DELETE /api/availability/{id}`)
- Created AvailabilityEditor component with Material-UI time pickers
- Integrated availability management into AideFormModal with load/save logic
- Enhanced timetable grid to show availability overlays for unavailable days
- Proper TypeScript typing with Weekday union type for type safety

### Version 1.0.1 (2025-10-18)

**Bug Fixes**:
- ✅ Fixed drag-and-drop date updates not persisting to backend
- ✅ Added version field support for optimistic locking in drag operations
- ✅ Implemented automatic UI refresh after successful drag-and-drop
- ✅ Fixed timezone bug causing one-day offset in week view dates
- ✅ Enhanced cross-day dragging to properly update and persist task dates

**Technical Improvements**:
- Backend now properly handles date field updates in assignment endpoint
- Frontend drag-drop hook fetches current version before updates
- Week date calculations now use UTC to prevent timezone conversion issues
- Added auto-refresh callback to keep UI synchronized with backend state

---

**Version**: 1.0.6  
**Last Updated**: 2025-12-02
