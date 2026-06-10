@echo off
echo Starting ArthaMind AI Backend + Frontend...
echo.

:: Start FastAPI backend in a new terminal window
echo [1/2] Starting FastAPI backend on http://127.0.0.1:8000 ...
start "ArthaMind Backend" cmd /k "cd /d "%~dp0" && .\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait 3 seconds for backend to initialize
timeout /t 3 /nobreak > nul

:: Start Next.js frontend dev server in a new terminal window
echo [2/2] Starting Next.js frontend on http://localhost:3000 ...
start "ArthaMind Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting up. 
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://localhost:3000
echo.
echo Open http://localhost:3000 in your browser.
pause
