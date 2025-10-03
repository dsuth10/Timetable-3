# Deployment Guide: Teacher Aide Scheduler

**Version**: 1.0.0  
**Target Environment**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)  
**Deployment Model**: Local desktop application (offline-first)

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Development Setup](#development-setup)
3. [Production Build](#production-build)
4. [Deployment Options](#deployment-options)
5. [Database Setup](#database-setup)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)
8. [Backup & Recovery](#backup--recovery)
9. [Upgrade Guide](#upgrade-guide)

---

## System Requirements

### Minimum Requirements

**Hardware**:
- CPU: Dual-core 2.0 GHz or faster
- RAM: 4 GB
- Storage: 500 MB free space
- Display: 1280x720 resolution

**Software**:
- **Python**: 3.12 or higher
- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: 2.x (for source installation)

**Operating System**:
- Windows 10/11 (64-bit)
- macOS 10.15 Catalina or higher
- Linux: Ubuntu 20.04+, Debian 11+, Fedora 35+

### Recommended Requirements

**Hardware**:
- CPU: Quad-core 3.0 GHz or faster
- RAM: 8 GB
- Storage: 1 GB free space
- Display: 1920x1080 resolution

---

## Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/timetable-scheduler.git
cd timetable-scheduler
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
alembic upgrade head

# Seed with sample data (optional)
python seed.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### 4. Run Application

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

**Access Application**: Open browser to `http://localhost:5173`

---

## Production Build

### Backend Production Build

```bash
cd backend

# Install production dependencies only
pip install -r requirements.txt --no-dev

# Set environment variables
export FLASK_ENV=production
export FLASK_DEBUG=0

# Run with production server (Waitress)
pip install waitress
waitress-serve --port=5000 app:app
```

### Frontend Production Build

```bash
cd frontend

# Build optimized production bundle
npm run build

# Output: frontend/dist/
# - index.html
# - assets/ (JS, CSS, fonts, images)
```

**Build Output**:
- **Size**: ~500 KB gzipped
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Serve Frontend (Production)

Option 1: Serve from backend (Flask static files):
```python
# backend/app.py
app = Flask(__name__, static_folder='../frontend/dist', static_url_path='/')

@app.route('/')
def index():
    return app.send_static_file('index.html')
```

Option 2: Use separate web server (nginx):
```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Deployment Options

### Option 1: Standalone Desktop App (Recommended for MVP)

**Package as Desktop App** using Electron or PyInstaller:

#### Using Electron (Full Desktop Integration)

1. Install Electron packager:
```bash
npm install -g @electron/packager
```

2. Create `electron-main.js`:
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  // Start Flask backend
  backendProcess = spawn('python', ['backend/app.py']);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Wait for backend to start, then load frontend
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:5173');
  }, 2000);

  mainWindow.on('closed', function () {
    mainWindow = null;
    if (backendProcess) {
      backendProcess.kill();
    }
  });
}

app.on('ready', createWindow);
```

3. Package application:
```bash
electron-packager . TeacherAideScheduler --platform=win32 --arch=x64 --out=dist/
```

**Output**: Standalone .exe (Windows), .app (macOS), .AppImage (Linux)

#### Using PyInstaller (Python-only Bundle)

```bash
cd backend
pyinstaller --onefile --name TeacherAideScheduler app.py

# Output: backend/dist/TeacherAideScheduler.exe
```

### Option 2: Web Server Deployment

**Deploy on Local Network** (for multi-administrator access):

1. **Setup reverse proxy** (nginx or Apache)
2. **Configure CORS** for frontend-backend communication
3. **Enable HTTPS** (self-signed certificate for local network)
4. **Set static IP** for server machine

**Example nginx config**:
```nginx
server {
    listen 80;
    server_name timetable.local;

    location / {
        root /var/www/timetable/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
    }
}
```

### Option 3: Docker Deployment

**Dockerfile** (backend):
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
CMD ["python", "app.py"]
```

**Dockerfile** (frontend):
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "5000:5000"
    volumes:
      - ./instance:/app/instance
    environment:
      - FLASK_ENV=production

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

Run: `docker-compose up -d`

---

## Database Setup

### Initial Setup

The application uses **SQLite** for local data storage.

**Database Location**: `instance/timetable.db`

#### Create Database Schema

```bash
cd backend

# Run Alembic migrations
alembic upgrade head

# Verify database created
ls instance/timetable.db
```

#### Seed Sample Data

```bash
python seed.py
```

**Sample Data Includes**:
- 2 teacher aides
- 5 classrooms
- 10 tasks (mix of one-off and recurring)
- 20+ assignments
- Sample availability patterns

### Database Migrations

**Create New Migration**:
```bash
alembic revision --autogenerate -m "Add new column to tasks table"
```

**Apply Migration**:
```bash
alembic upgrade head
```

**Rollback Migration**:
```bash
alembic downgrade -1
```

### Database Backups

**Manual Backup**:
```bash
# Copy database file
cp instance/timetable.db instance/backup/timetable_$(date +%Y%m%d_%H%M%S).db
```

**Automated Backup** (Windows Task Scheduler):
```powershell
# backup-database.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$source = "C:\path\to\instance\timetable.db"
$destination = "C:\path\to\backup\timetable_$timestamp.db"
Copy-Item $source $destination
```

**Automated Backup** (macOS/Linux cron):
```bash
# Add to crontab: crontab -e
0 2 * * * cp /path/to/instance/timetable.db /path/to/backup/timetable_$(date +\%Y\%m\%d).db
```

---

## Configuration

### Environment Variables

Create `.env` file in `backend/`:

```env
# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=0
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite:///instance/timetable.db

# CORS (for web deployment)
CORS_ORIGINS=http://localhost:5173,http://timetable.local

# Scheduler
SCHEDULER_HORIZON_WEEKS=4
SCHEDULER_RUN_DAY=Saturday
SCHEDULER_RUN_TIME=00:00

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/timetable.log
```

### Frontend Configuration

Create `frontend/.env.production`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_TITLE=Teacher Aide Scheduler
VITE_DEFAULT_WEEK_VIEW=current
```

### Application Settings

**Backend** (`backend/config.py`):
```python
import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///instance/timetable.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    SCHEDULER_HORIZON_WEEKS = int(os.getenv('SCHEDULER_HORIZON_WEEKS', 4))
```

**Frontend** (build-time configuration):
```typescript
// frontend/src/config.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const DEFAULT_WEEK_VIEW = import.meta.env.VITE_DEFAULT_WEEK_VIEW || 'current';
```

---

## Troubleshooting

### Common Issues

#### Backend won't start

**Error**: `ModuleNotFoundError: No module named 'flask'`  
**Solution**: Install dependencies: `pip install -r requirements.txt`

**Error**: `sqlite3.OperationalError: unable to open database file`  
**Solution**: Create `instance/` directory: `mkdir instance`

**Error**: `Port 5000 already in use`  
**Solution**: 
- Kill existing process: `lsof -ti:5000 | xargs kill` (macOS/Linux)
- Change port in `app.py`: `app.run(port=5001)`

#### Frontend build fails

**Error**: `ENOENT: no such file or directory, scandir 'node_modules'`  
**Solution**: Run `npm install`

**Error**: `JavaScript heap out of memory`  
**Solution**: Increase Node memory: `export NODE_OPTIONS="--max-old-space-size=4096"`

#### Database issues

**Error**: `alembic.util.exc.CommandError: Can't locate revision identified by 'abc123'`  
**Solution**: Reset Alembic: 
```bash
rm -rf backend/migrations/versions/*.py
alembic revision --autogenerate -m "Initial schema"
alembic upgrade head
```

**Corrupted Database**:  
**Solution**: Restore from backup:
```bash
cp instance/backup/timetable_20251001.db instance/timetable.db
```

#### Application runs but is slow

**Symptom**: API responses >500ms, UI laggy  
**Diagnosis**:
- Check database size: `du -h instance/timetable.db`
- Check assignment count: `sqlite3 instance/timetable.db "SELECT COUNT(*) FROM assignments;"`

**Solution**:
- Archive old assignments (>6 months)
- Add database indexes (see `data-model.md`)
- Enable SQLite WAL mode: `PRAGMA journal_mode=WAL;`

---

## Backup & Recovery

### Full Backup

**What to back up**:
1. Database: `instance/timetable.db`
2. Configuration: `backend/.env`, `frontend/.env.production`
3. Logs (optional): `backend/logs/`

**Backup Script** (PowerShell):
```powershell
# full-backup.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "C:\Backups\TimetableScheduler\$timestamp"
New-Item -ItemType Directory -Path $backupDir
Copy-Item instance\timetable.db $backupDir\
Copy-Item backend\.env $backupDir\
Copy-Item frontend\.env.production $backupDir\
Compress-Archive -Path $backupDir -DestinationPath "$backupDir.zip"
```

### Disaster Recovery

**Scenario**: Hard drive failure, computer replacement

**Recovery Steps**:
1. Install Python 3.12+ and Node.js 18+ on new machine
2. Clone repository or copy source code
3. Restore database from backup: `cp backup/timetable.db instance/`
4. Restore configuration: Copy `.env` files
5. Reinstall dependencies: `pip install -r requirements.txt`, `npm install`
6. Verify application starts: `python app.py`, `npm run dev`

**Estimated Recovery Time**: 30-60 minutes

---

## Upgrade Guide

### Upgrading from v1.0.0 to v1.1.0 (Example)

1. **Backup current database**:
```bash
cp instance/timetable.db instance/backup/timetable_pre_v1.1.0.db
```

2. **Pull latest code**:
```bash
git fetch origin
git checkout v1.1.0
```

3. **Update dependencies**:
```bash
cd backend
pip install --upgrade -r requirements.txt
cd ../frontend
npm install
```

4. **Run database migrations**:
```bash
cd backend
alembic upgrade head
```

5. **Rebuild frontend**:
```bash
cd frontend
npm run build
```

6. **Restart application**:
```bash
# Stop backend/frontend processes
# Start backend: python app.py
# Start frontend: npm run dev (or serve dist/)
```

7. **Verify upgrade**:
- Check version: Visit About page in UI
- Test critical paths: Create assignment, mark absence, undo action

### Rolling Back

If upgrade fails:
```bash
git checkout v1.0.0
cp instance/backup/timetable_pre_v1.1.0.db instance/timetable.db
alembic downgrade -1
```

---

## Security Considerations

### MVP (Local Single-User)

**Current Security**:
- No authentication (trusted local environment)
- SQLite file permissions (user read/write only)
- Input validation on API endpoints
- CORS restricted to localhost

**Recommendations**:
- Keep software updated (Python, Node, dependencies)
- Regular backups to external drive
- Antivirus scan on installation

### Future (Multi-User Network Deployment)

**Planned Security Enhancements**:
1. **Authentication**: JWT-based login system
2. **Authorization**: Role-based access control (admin, teacher, aide)
3. **HTTPS**: SSL/TLS encryption for network traffic
4. **Database Encryption**: SQLite encryption extension
5. **Audit Logging**: Track all data modifications

---

## Performance Optimization

### Backend Optimization

1. **Enable SQLite WAL Mode** (Write-Ahead Logging):
```python
# backend/app.py
from sqlalchemy import event
from sqlalchemy.engine import Engine

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()
```

2. **Add Database Indexes** (see `data-model.md` for details):
```sql
CREATE INDEX idx_assignments_aide_date ON assignments(aide_id, date, start_time);
CREATE INDEX idx_absences_aide_date ON absences(aide_id, date);
```

3. **Enable Response Caching** (Flask-Caching):
```python
from flask_caching import Cache
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/assignments/weekly-matrix')
@cache.cached(timeout=30, query_string=True)
def weekly_matrix():
    # ...
```

### Frontend Optimization

1. **Enable Gzip Compression** (Vite):
```javascript
// vite.config.ts
import viteCompression from 'vite-plugin-compression';

export default {
  plugins: [
    viteCompression({ algorithm: 'gzip' })
  ]
}
```

2. **Code Splitting** (dynamic imports):
```typescript
// frontend/src/App.tsx
const Schedule = lazy(() => import('./pages/Schedule'));
const Aides = lazy(() => import('./pages/Aides'));
```

3. **React Performance** (already implemented):
- React.memo on grid components
- Virtualization for >20 aides (react-window)
- Debounced collision checks (150ms)

---

## Monitoring & Logs

### Application Logs

**Backend Logging**:
```python
# backend/app.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/timetable.log'),
        logging.StreamHandler()
    ]
)
```

**Log Rotation** (logrotate on Linux):
```
/path/to/logs/timetable.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
```

### Health Checks

**Backend Health Endpoint**:
```python
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'database': check_database_connection(),
        'scheduler': scheduler.running,
        'version': '1.0.0'
    })
```

**Monitoring Script** (cron):
```bash
#!/bin/bash
# monitor-health.sh
STATUS=$(curl -s http://localhost:5000/api/health | jq -r '.status')
if [ "$STATUS" != "healthy" ]; then
    echo "Application unhealthy!" | mail -s "Timetable Alert" admin@school.edu
fi
```

---

## Support & Maintenance

### Regular Maintenance Tasks

**Weekly**:
- Review application logs for errors
- Check database size and performance

**Monthly**:
- Database backup verification (restore test)
- Update dependencies (security patches)
- Clean up old logs

**Quarterly**:
- Archive old assignments (>6 months)
- Review and optimize database indexes
- Capacity planning (storage, performance)

### Getting Help

**Documentation**:
- [README.md](../README.md) - Project overview
- [API Reference](./api-reference.md) - API documentation
- [Quickstart Guide](../specs/001-create-a-drag/quickstart.md) - Integration testing

**Support Channels**:
- GitHub Issues: [Report bugs](https://github.com/your-org/timetable-scheduler/issues)
- Email: support@yourschool.edu
- Internal Wiki: [Knowledge base articles]

---

**Last Updated**: 2025-10-03  
**Version**: 1.0.0  
**Maintainer**: Development Team

