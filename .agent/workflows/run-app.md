---
description: how to start the backend and frontend development servers
---

To start the application in development mode, follow these steps:

1. **Start the Backend API Server**
   - Open a terminal and navigate to the `backend` directory.
   - Run the following command:
     ```powershell
     python -m flask run
     ```
   - The server will be available at `http://127.0.0.1:5000/`.

// turbo
2. **Start the Frontend Development Server**
   - Open another terminal and navigate to the `frontend` directory.
   - Run the following command:
     ```powershell
     npm run dev
     ```
   - The application will be available at `http://localhost:3000/`.

3. **Verify the Connection**
   - Ensure the backend is running before using the frontend, as the frontend depends on the API for data.
   - You can check the backend health by visiting `http://127.0.0.1:5000/api/health`.
