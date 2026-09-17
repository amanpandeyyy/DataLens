@echo off
echo =======================================================
echo Starting DataLens - AI Data Analyst
echo =======================================================

set PATH=C:\Users\ap640\.bin;%PATH%
set PYTHONPATH=%~dp0backend

echo Starting Backend Server on http://127.0.0.1:8000 ...
start "DataLens Backend" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo Starting Frontend Server on http://127.0.0.1:5173 ...
cd frontend
start "DataLens Frontend" cmd /k "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173"

echo.
echo =======================================================
echo DataLens is running!
echo URL: http://127.0.0.1:5173
echo =======================================================
pause

