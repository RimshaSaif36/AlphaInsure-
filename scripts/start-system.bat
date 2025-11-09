@echo off
echo Starting AlphaInsure AI-Powered Insurance System...
echo ===============================================

echo.
echo [1/3] Starting AI Engine (Python Flask)...
cd ai-engine
start cmd /k "python app.py"

echo [2/3] Starting Backend API (Node.js Express)...
cd ..\backend
start cmd /k "npm run dev"

echo [3/3] Starting Frontend (Next.js)...
cd ..\frontend
start cmd /k "npm run dev"

echo.
echo System started successfully!
echo ========================
echo.
echo Services running on:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:3001
echo - AI Engine: http://localhost:5000
echo.
echo Press any key to continue...
pause