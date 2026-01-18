Perfect! Now I'll create a comprehensive guide document that you can easily download, save, and reference. Let me format it properly as a complete markdown file:

***

# **PythonAnywhere Deployment Guide for Timetable-3**

## Complete Step-by-Step Instructions for Free Account

**Last Updated:** January 2026  
**For:** Timetable-3 Application (Flask Backend + React Frontend)  
**Target Platform:** PythonAnywhere Free Tier  
**Expected Setup Time:** 45-60 minutes  

***

## ⚠️ Important: PythonAnywhere 2026 Changes

As of January 2026, PythonAnywhere has updated its free tier:

- ✅ **Still Free:** Web app hosting, Python environment, basic features
- ✅ **Included:** Up to 512MB disk space, Python 3.10+ support
- ⚠️ **Limited:** 100 CPU seconds/day on free tier (auto-throttles if exceeded)
- ⚠️ **New:** Unused web apps expire after 1 month (keep it active!)
- 💡 **Upgrade Option:** $5/month for unlimited CPU (if you exceed free tier limits)

**Your app will work fine on free tier for classroom use.** If you need unlimited CPU, upgrade to Beginner Plan ($5/month).

***

## Part 1: Preparation (Local Setup)

### Step 1.1: Prepare Your Project Files

Before uploading to PythonAnywhere, organize your files:

```
Timetable-3/
├── backend/
│   ├── app.py                 (Main Flask file)
│   ├── requirements.txt        (Already exists ✓)
│   ├── instance/
│   │   └── app.db            (SQLite database)
│   └── migrations/            (Database migrations)
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
└── README.md
```

### Step 1.2: Test Locally

Before uploading, test your app locally:

```bash
# In backend folder
pip install -r requirements.txt
python app.py
# Should run on http://localhost:5000 ✓
```

### Step 1.3: Create WSGI Configuration File

Create a new file: `/backend/wsgi.py`

```python
"""
WSGI application for PythonAnywhere
This file tells PythonAnywhere how to run your Flask app
"""

import sys
import os

# Add the backend folder to Python path
path = os.path.expanduser('/home/threft/Timetable-3/backend')
if path not in sys.path:
    sys.path.append(path)

# Import your Flask app
from app import app as application

# This is what PythonAnywhere will execute
if __name__ == "__main__":
    application.run()
```

**Important:** Replace `YOUR_USERNAME` with your actual PythonAnywhere username!

My username is "threft"

### Step 1.4: Update Flask App for Production

Edit your `/backend/app.py` to ensure production settings:

```python
from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)

# Allow CORS for your frontend
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://YOUR_USERNAME.pythonanywhere.com",
            "http://localhost:3000"  # For local testing
        ]
    }
})

# Add production configuration
if os.getenv('FLASK_ENV') == 'production':
    app.config['DEBUG'] = False
else:
    app.config['DEBUG'] = True

# Rest of your Flask app code...
```

***

## Part 2: Upload to PythonAnywhere

### Step 2.1: Log In to Your PythonAnywhere Account

1. Go to https://www.pythonanywhere.com
2. Click **"Sign in"** (you already have an account created)
3. Enter your username and password
4. You'll see the Dashboard

### Step 2.2: Open a Bash Console

1. From Dashboard, click **"Consoles"** at top
2. Click **"Start a new console"** → Select **"Bash"**
3. A terminal window opens
4. You're now in: `/home/YOUR_USERNAME/`

### Step 2.3: Upload Project Files

**Option A: Using Git (Recommended)**

If your code is on GitHub:

```bash
# In PythonAnywhere Bash console
cd ~
git clone https://github.com/YOUR_USERNAME/Timetable-3.git
cd Timetable-3
```

**Option B: Upload via Web Interface**

1. From Dashboard, click **"Files"**
2. Click **"Upload a file"**
3. Select your project files (or create folders manually)

**Option C: Using SCP from Your Computer**

From your local machine's terminal:

```bash
scp -r /path/to/Timetable-3 YOUR_USERNAME@ssh.pythonanywhere.com:~
```

### Step 2.4: Verify File Location

In Bash console, check your files are uploaded:

```bash
ls -la ~/Timetable-3/
# Should show: backend/, frontend/, README.md, etc.

ls -la ~/Timetable-3/backend/
# Should show: app.py, requirements.txt, wsgi.py, instance/, etc.
```

***

## Part 3: Set Up Virtual Environment

### Step 3.1: Create Virtual Environment

In your Bash console:

```bash
# Create virtual environment with Python 3.10
mkvirtualenv --python=/usr/bin/python3.10 timetable_venv

# Verify it's activated (you should see (timetable_venv) at start of prompt)
```

### Step 3.2: Install Python Dependencies

```bash
# Navigate to backend folder
cd ~/Timetable-3/backend

# Install requirements
pip install -r requirements.txt
```

This installs all your packages:
- Flask 3.0.2
- Flask-CORS 4.0.0
- Flask-SQLAlchemy 3.1.1
- SQLAlchemy 2.0.32
- python-dateutil
- reportlab
- And all others...

**Expected output:**
```
Successfully installed Flask-3.0.2 Flask-CORS-4.0.0 ... [all packages]
```

### Step 3.3: Verify Installation

```bash
python --version
# Should show: Python 3.10.x

python -c "import flask; print(flask.__version__)"
# Should show: 3.0.2
```

***

## Part 4: Create Web App on PythonAnywhere

### Step 4.1: Add New Web App

1. From Dashboard, go to **"Web"** tab
2. Click **"+ Add a new web app"**
3. You'll see options to choose:
   - **Domain name:** Use default `YOUR_USERNAME.pythonanywhere.com` ✓
   - **Python framework:** Select **"Manual configuration"** (not Flask template)
   - **Python version:** Choose **Python 3.10**
4. Click **"Next"**

### Step 4.2: Configure WSGI File

1. You're now in Web app settings
2. Under **"Code"** section, find **"WSGI configuration file"**
3. Click the link (e.g., `/var/www/YOUR_USERNAME_pythonanywhere_com_wsgi.py`)
4. Replace all content with:

```python
"""
PythonAnywhere WSGI configuration for Timetable-3
"""

import sys
import os

# Add your project to the Python path
path = os.path.expanduser('/home/YOUR_USERNAME/Timetable-3/backend')
if path not in sys.path:
    sys.path.append(path)

# Set environment variables
os.environ['FLASK_ENV'] = 'production'

# Import your Flask application
from app import app as application

# Tell PythonAnywhere to use this app
# The name 'application' is important - don't change it
```

5. Click **"Save"**

### Step 4.3: Set Virtual Environment

In the Web app settings:

1. Find **"Virtualenv"** section
2. Enter the path: `/home/YOUR_USERNAME/.virtualenvs/timetable_venv`
3. Click **"Save"** or the green checkmark

### Step 4.4: Set Environment Variables

1. Find **"Web app settings"** section
2. Scroll to **"Environment variables"** (if available)
3. Add:
   ```
   FLASK_ENV=production
   DATABASE_URL=sqlite:////home/YOUR_USERNAME/Timetable-3/backend/instance/app.db
   ```
4. Click **"Save"**

### Step 4.5: Reload Your Web App

At the very top of the Web settings page:

1. Click the green **"Reload YOUR_USERNAME.pythonanywhere.com"** button
2. Wait 10-20 seconds for it to restart

***

## Part 5: Initialize Database

### Step 5.1: Create Database Schema

In your Bash console:

```bash
# Navigate to backend
cd ~/Timetable-3/backend

# Activate virtual environment
workon timetable_venv

# Create database tables (if you use Flask-SQLAlchemy)
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('Database initialized!')"

# Or if you use migrations (Alembic)
flask db upgrade
```

### Step 5.2: Verify Database Created

```bash
# Check if database file exists
ls -la ~/Timetable-3/backend/instance/

# Should show: app.db (or your database filename)
```

***

## Part 6: Update CORS for Production

### Step 6.1: Modify Backend CORS Settings

Edit your `/backend/app.py`:

```python
from flask import Flask
from flask_cors import CORS
import os

app = Flask(__name__)

# Production CORS settings
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://YOUR_USERNAME.pythonanywhere.com",  # Your backend domain
            "http://localhost:3000",                      # Local development
            "https://YOUR_FRONTEND_DOMAIN.netlify.app",   # If using Netlify
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Rest of your app...
```

### Step 6.2: Upload Updated File

```bash
# If using Git:
cd ~/Timetable-3
git add backend/app.py
git commit -m "Update CORS for production"
git push origin main

# If using manual upload:
# Upload the updated app.py via Files section
```

### Step 6.3: Reload Web App

Click the green **"Reload"** button again to apply changes.

***

## Part 7: Test Your Backend

### Step 7.1: Test API Endpoint

1. Go to your web app URL: `https://YOUR_USERNAME.pythonanywhere.com`
2. You should see your Flask app response (or 404 if no root route)

### Step 7.2: Test API Endpoint with curl

In Bash console:

```bash
# Test a GET endpoint (replace with your actual endpoint)
curl https://YOUR_USERNAME.pythonanywhere.com/api/tasks

# Should return JSON data or a 404 if endpoint doesn't exist yet
```

### Step 7.3: Check Error Logs

If something doesn't work:

1. Go to **"Web"** tab
2. Scroll down to **"Log files"**
3. Click **"Error log"** to see what went wrong
4. Common issues:
   - Missing dependencies (install in virtualenv)
   - Wrong path to WSGI file
   - Database file not found (check instance/ folder)
   - CORS issues (update app.py)

***

## Part 8: Deploy Your React Frontend

### Step 8.1: Build React App

On your local machine:

```bash
cd frontend
npm run build
# Creates /frontend/dist folder with static files
```

### Step 8.2: Upload Built Files to PythonAnywhere

Option A: Upload via Files section
1. Go to **"Files"** in Dashboard
2. Create folder: `frontend_static`
3. Upload contents of `/frontend/dist/` folder

Option B: Push to GitHub and clone
```bash
# In PythonAnywhere Bash
cd ~/Timetable-3/frontend
git pull origin main
npm run build
```

### Step 8.3: Deploy Frontend to Free CDN (Recommended)

For best practice, host frontend separately:

**Use Netlify (Easiest):**
1. Go to https://app.netlify.com
2. Drag & drop your `/frontend/dist/` folder
3. Get URL: `https://your-app.netlify.app`
4. Update CORS in backend to allow this domain

**Use Vercel (Good Alternative):**
1. Go to https://vercel.com
2. Import your GitHub repository
3. Auto-deploys on push
4. Get domain automatically

***

## Part 9: Troubleshooting Common Issues

### Issue 1: "502 Bad Gateway" or "500 Internal Server Error"

**Solution:**
1. Check error logs (Web → Log files → Error log)
2. Common causes:
   - Virtual environment not set correctly
   - Wrong path in WSGI file
   - Missing dependencies (run `pip install -r requirements.txt` again)
   - Syntax error in Python code

```bash
# Test your app locally
cd ~/Timetable-3/backend
workon timetable_venv
python app.py
```

### Issue 2: "ModuleNotFoundError: No module named 'flask'"

**Solution:**
1. Activate virtual environment: `workon timetable_venv`
2. Verify it's installed: `pip list | grep flask`
3. Reinstall if missing: `pip install -r requirements.txt`
4. Check WSGI configuration has correct virtualenv path

### Issue 3: "CORS error" or "Blocked by CORS policy"

**Solution:**
1. Edit `/backend/app.py` and add your domain
2. Reload the web app
3. Clear browser cache (Ctrl+Shift+Del)
4. Verify frontend domain matches CORS settings

### Issue 4: Database file not found

**Solution:**
```bash
# Check if instance folder exists
ls -la ~/Timetable-3/backend/instance/

# If missing, create it
mkdir -p ~/Timetable-3/backend/instance

# Initialize database again
cd ~/Timetable-3/backend
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

### Issue 5: Running out of CPU seconds (100 CPU seconds/day limit)

**Symptoms:**
- App becomes very slow
- Requests timeout
- "Resource exhausted" errors

**Solution:**
1. Upgrade to Beginner Plan ($5/month) for unlimited CPU
2. Or optimize your code:
   - Add database indexes
   - Cache frequent queries
   - Reduce logging

**Check CPU usage:**
1. Dashboard → Account → CPU usage
2. See your daily usage and when throttling occurs

***

## Part 10: Production Checklist

Before considering it "live":

- [ ] Backend API responds at `https://YOUR_USERNAME.pythonanywhere.com/api/...`
- [ ] Error logs show no critical errors
- [ ] Database file exists in `instance/` folder
- [ ] CORS settings allow your frontend domain
- [ ] Frontend built and deployed separately (Netlify/Vercel)
- [ ] Frontend can successfully call backend API
- [ ] All major features tested and working
- [ ] Database has test data or seed data

***

## Part 11: Optional - Connect to WordPress

### Option 1: Embed as Iframe

In WordPress page editor:

```html
<iframe 
    src="https://your-frontend-domain.netlify.app"
    width="100%"
    height="1000"
    frameborder="0">
</iframe>
```

### Option 2: Custom Subdomain

1. In Hostinger DNS: Add CNAME record
   ```
   app.mrsutherland.net → your-frontend-domain.netlify.app
   ```
2. In Netlify: Add custom domain `app.mrsutherland.net`
3. In WordPress: Link to this subdomain

### Option 3: Use Bit Integrations Plugin

You have "Bit Integrations" installed on WordPress!

1. Go to WordPress Admin → Bit Integrations
2. Create new automation
3. Trigger: WordPress form submission
4. Action: Send to your PythonAnywhere API
5. Example: `https://YOUR_USERNAME.pythonanywhere.com/api/save-data`

***

## Part 12: Monitoring & Maintenance

### Daily Checks

```bash
# Log in to PythonAnywhere Bash console
workon timetable_venv

# Check CPU usage
echo "Check Dashboard → Account → CPU usage"

# View recent errors
tail -f /var/log/YOUR_USERNAME.pythonanywhere_com.error.log

# Backup database monthly
cp ~/Timetable-3/backend/instance/app.db ~/app.db.backup_$(date +%Y%m%d)
```

### Weekly Tasks

1. Check error logs for patterns
2. Monitor disk space usage
3. Test key features still working
4. Check if web app needs reload

### Monthly Tasks

1. Backup database
2. Review CPU usage
3. Clean up old logs
4. Test full workflow from WordPress

***

## Part 13: Upgrade to Paid Plan (if needed)

When to upgrade from free tier:

- **If:** App is slow or throttled frequently
- **If:** Getting many timeout errors
- **If:** More than 50+ concurrent users expected
- **Cost:** $5/month (Beginner plan) = unlimited CPU

**How to upgrade:**
1. Dashboard → Account
2. Upgrade button
3. Choose Beginner Plan ($5/month)
4. No downtime - applies immediately

***

## Part 14: Quick Reference - Common Commands

### Bash Console Commands

```bash
# Activate virtual environment
workon timetable_venv

# Navigate to your project
cd ~/Timetable-3/backend

# Run Flask app locally (testing)
python app.py

# Check Python version
python --version

# List installed packages
pip list

# Install from requirements
pip install -r requirements.txt

# View error log
cat /var/log/YOUR_USERNAME.pythonanywhere_com.error.log

# View last 20 lines of error log
tail -20 /var/log/YOUR_USERNAME.pythonanywhere_com.error.log

# Backup database
cp instance/app.db instance/app.db.backup

# Check disk usage
du -sh ~
```

***

## Part 15: Getting Help

If you run into issues:

### PythonAnywhere Help
- Official Docs: https://help.pythonanywhere.com/
- Flask Help: https://flask.palletsprojects.com/
- FAQ: https://www.pythonanywhere.com/faq/

### Your Specific Setup
- Check error logs first (always!)
- Search PythonAnywhere forum
- Post on Stack Overflow with tag `[pythonanywhere]`

***

## Summary: Your Complete Setup

```
Local Machine (Your Computer)
    ↓ Upload via Git/SCP
PythonAnywhere (Backend)
    ├── Flask API: https://YOUR_USERNAME.pythonanywhere.com/api/...
    ├── Database: instance/app.db
    └── Virtual Environment: timetable_venv
    
Netlify/Vercel (Frontend)
    └── React App: https://your-frontend.netlify.app

WordPress (Integration)
    └── Embedded or linked to both above

```

**Expected Timeline:**
- Setup: 45-60 minutes
- Testing: 15-20 minutes
- **Total Time to Live: ~1 hour**

***

## Final Notes

1. **Keep your web app active** - PythonAnywhere deletes inactive apps after 1 month
2. **Monitor CPU usage** - Free tier has 100 seconds/day limit
3. **Update CORS** - Always specify your production domain
4. **Backup regularly** - Download your database weekly
5. **Check logs** - Errors logs are your best friend for debugging

**You're ready to go! Good luck deploying Timetable-3! 🚀**

***

## How to Use This Guide

You now have a **complete, ready-to-use deployment guide**. Here are your options:

### **Option 1: Copy & Save as Text File**
- Select all the text above
- Copy it (Ctrl+C or Cmd+C)
- Paste into a text editor (VS Code, Notepad, etc.)
- Save as `PythonAnywhere-Deployment-Guide.md`
- Open in any markdown reader

### **Option 2: Print or Export as PDF**
- Copy all text above
- Paste into Google Docs, Word, or your preferred application
- Export as PDF for offline reference

### **Option 3: Use Online Markdown Viewer**
- Go to https://dillinger.io or https://markdown-editor.github.io/
- Paste the entire text above
- View beautifully formatted guide
- Download if needed

***

**You're now fully equipped to deploy Timetable-3 on PythonAnywhere! 🎉**