# Teacher Aide Scheduler 🎓

**A drag-and-drop timetable scheduling system for Queensland primary schools**

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Overview

The Teacher Aide Scheduler is a desktop-optimized web application that enables school administrators to visually assign teacher aides to classroom tasks and playground duties using an intuitive drag-and-drop interface. The system operates completely offline using a local SQLite database, supports recurring tasks with iCal RRULE patterns, and provides real-time conflict detection with automatic resolution.

### Key Features

✅ **Drag-and-Drop Interface** - Assign tasks by dragging them to aide time slots  
✅ **Recurring Tasks** - Create weekly, daily, or custom recurring patterns using iCal RRULE  
✅ **Conflict Detection** - Real-time collision detection with replace/shorten/cancel options  
✅ **Absence Management** - Mark aides absent with automatic task reassignment  
✅ **Multi-Day Assignment** - Apply recurring tasks to multiple selected days at once  
✅ **Undo/Redo** - 10-level undo buffer for all timetable modifications  
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
# Frontend runs on http://localhost:5173
```

5. **Access Application**

Open your browser to: **http://localhost:5173**

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
- **State Management**: Zustand
- **Drag & Drop**: @hello-pangea/dnd
- **HTTP Client**: Axios
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
│   │   │   ├── TimetableGrid/    # Timetable grid & slots
│   │   │   ├── TaskModals/       # Task creation/editing modals
│   │   │   ├── ConflictModal.tsx # Conflict resolution dialog
│   │   │   ├── MultiDayDialog.tsx# Multi-day assignment dialog
│   │   │   └── ...
│   │   ├── pages/                # Route pages (Schedule, Aides, Tasks, Requests)
│   │   ├── store/
│   │   │   └── stores/           # Zustand stores (6 stores)
│   │   ├── services/             # API client layer
│   │   ├── hooks/                # Custom React hooks (useDragDrop)
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
│   └── 001-create-a-drag/        # Feature specification
│       ├── spec.md               # Feature spec
│       ├── plan.md               # Implementation plan
│       ├── tasks.md              # Task breakdown
│       ├── data-model.md         # Entity relationship model
│       ├── quickstart.md         # Integration test scenario
│       └── contracts/            # API & RRULE specs
│
└── README.md                     # This file
```

---

## 📊 Data Model

The application manages 7 core entities:

| Entity | Description | Key Relationships |
|--------|-------------|-------------------|
| **TeacherAide** | Staff member providing support | Has Availability, Assignments, Absences |
| **Availability** | Weekly availability pattern | Belongs to TeacherAide |
| **Task** | Support duty definition (one-off or recurring) | Has Assignments, optional Classroom |
| **Assignment** | Specific task occurrence assigned to aide | Belongs to Task and TeacherAide |
| **Absence** | Aide unavailability record | Belongs to TeacherAide |
| **Classroom** | Physical learning space | Has Tasks |
| **Request** | Teacher request for aide support | Optional Classroom |

See [data-model.md](specs/001-create-a-drag/data-model.md) for full entity definitions.

---

## 🎯 Core Workflows

### 1. Drag-and-Drop Assignment

```
1. View weekly timetable grid (5 days × time slots)
2. See unassigned tasks in left panel
3. Drag task to aide's time slot
4. System checks for conflicts:
   ✓ No conflict → Assign immediately
   ⚠ Partial overlap → Auto-shorten first task
   ❌ Full overlap → Show replace/cancel modal
5. Update reflected in grid with visual feedback
```

### 2. Recurring Task Creation

```
1. Create task with RRULE pattern (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
2. Set expiration date
3. System generates assignments for 4-week horizon
4. Assignments appear in weekly grid as unassigned
5. Background scheduler extends horizon weekly
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
- ✅ Drag task to assign
- ✅ Conflict resolution flow
- ✅ Absence handling
- ✅ Recurring task multi-day assignment
- ✅ Undo/redo actions

---

## 🔧 Configuration

### Backend Configuration

Create `backend/.env`:

```env
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///instance/timetable.db
CORS_ORIGINS=http://localhost:5173
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
- [x] Drag-and-drop assignment
- [x] Recurring tasks (RRULE)
- [x] Conflict detection
- [x] Absence management
- [x] Undo/redo
- [x] WCAG AA compliance

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

**Made with ❤️ for Queensland Primary Schools**

**Version**: 1.0.0  
**Last Updated**: 2025-10-03

