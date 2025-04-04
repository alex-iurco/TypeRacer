# Port Configuration

This document defines the standard port configuration for the SpeedType application.

## Port Assignments

- Frontend (Vite Development Server): `3000`
- Backend (Socket.IO Server): `3001`

## Configuration Files

The ports are configured in the following files:
- Frontend: `frontend/vite.config.ts`
- Backend: `backend/src/server.ts`
- Tests: `frontend/playwright.config.ts`

## Starting the Application

Always follow these steps in order:

1. Kill any existing Node.js processes:
```bash
pkill -f "node"
```

2. Start the backend server (port 3001):
```bash
cd backend && npm run dev
```

3. Start the frontend server (port 3000):
```bash
cd frontend && npm run dev
```

## Common Issues

- If you get `EADDRINUSE` error, it means the port is already in use. Run the kill command above and try again.
- Always start the backend before the frontend to ensure proper socket connection.
- The frontend proxy is configured to forward API requests to the backend port. 