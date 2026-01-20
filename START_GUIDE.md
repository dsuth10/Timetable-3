# How to Start the Teacher‑Aide Scheduler Application

This guide assumes you are using a Windows 11 machine with the same restrictions as the author (PowerShell execution policies disabled, no global `package.json` in the project root, etc.). Follow the steps below to get the backend **Flask** server and the frontend **Vite** development server running and accessible on your local network.

---

## Prerequisites

1. **Python 3.12+** installed and added to `PATH`.  
2. **Node.js** (>= 20) installed and added to `PATH`.  
3. **Git** installed (optional, for cloning the repo).  

> **Tip:** If you do not have admin rights, you can use the **Portable** versions of Python and Node and add their `bin` directories to your user `PATH`.

---

## 1. Clone the Repository (or copy the folder)

```cmd
git clone https://github.com/dsuth10/Timetable-3.git
cd Timetable-3
```

If you already have the folder, just `cd` into it:

```cmd
cd "D:\dsuth10\My Documents\Coding projects\Timetable-3"
```

---

## 2. Set Up the Python Backend

### 2.1 Create a virtual environment

```cmd
python -m venv venv
```

### 2.2 Activate the virtual environment

```cmd
.\venv\Scripts\activate
```

### 2.3 Install backend dependencies

```cmd
pip install -r backend/requirements.txt
```

### 2.4 Run the Flask server

The entry‑point is `backend/app.py`. It is already configured to listen on **all interfaces** (`0.0.0.0`) so it can be reached from other machines on the same network.

```cmd
python backend/app.py
```

You should see something like:

```
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://<your‑machine‑IP>:5000
```

Leave this terminal open; the server will keep running until you stop it with `Ctrl+C`.

---

## 3. Set Up the Frontend (Vite + React)

### 3.1 Install Node dependencies

> **Important:** The project does **not** have a `package.json` in the root folder; it lives inside `frontend`.  
> PowerShell’s execution policy may block script execution. The commands below use `cmd.exe` to avoid that restriction.

Open a **new** terminal (do **not** use the same terminal that is running the Flask server) and run:

```cmd
cd frontend
cmd /c "npm install"
```

If you encounter the *“scripts are disabled”* error, you can temporarily bypass it by invoking `npm` through `cmd.exe` as shown above.

### 3.2 Start the Vite development server

```cmd
cmd /c "npm run dev"
```

The Vite config (`frontend/vite.config.ts`) has `host: true`, so the dev server binds to the network. You should see output similar to:

```
 > Local:    http://localhost:3000/
 > Network:  http://<your‑machine‑IP>:3000/
```

Leave this terminal open as well.

---

## 4. Access the Application from Other Devices

1. Determine your machine’s IP address (shown in the Flask and Vite logs, e.g., `10.156.254.237`).  
2. From another device on the same LAN, open a browser and navigate to:

```
http://<your‑machine‑IP>:3000
<|end|><|start|>assistant<|channel|>final<|message|><attempt_completion>
<result>
A markdown guide (`START_GUIDE.md`) has been created in the project root. It contains step‑by‑step instructions for starting the backend Flask server and the frontend Vite dev server on a Windows machine with the same restrictions, and explains how to access the app from other devices on the network.
</result>
<task_progress>
- [x] Created START_GUIDE.md with full startup guide
- [x] Task completed
</task_progress>
</attempt_completion>
