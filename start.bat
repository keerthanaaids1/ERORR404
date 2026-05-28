@echo off
title WealthPath AI - Swarm Orchestrator
echo ======================================================
echo           Starting WealthPath AI Stack
echo ======================================================
echo.

:: Start Backend Service in a new cmd window
echo [SYSTEM] Launching Python FastAPI Backend...
start "WealthPath AI Backend" cmd /k "cd backend && echo [BACKEND] Activating virtual environment... && call venv\Scripts\activate && echo [BACKEND] Launching server... && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: Wait a brief moment to let backend initialize
timeout /t 2 /nobreak >nul

:: Start Frontend Service in a new cmd window
echo [SYSTEM] Launching React Frontend (Vite)...
start "WealthPath AI Frontend" cmd /k "cd frontend && echo [FRONTEND] Starting Dev Server... && npm run dev"

:: Wait for frontend server to bind
timeout /t 2 /nobreak >nul

:: Open browser
echo [SYSTEM] Opening application in default browser...
start http://localhost:5173/

echo.
echo ======================================================
echo [SUCCESS] Both backend and frontend services launched!
echo ======================================================
pause
