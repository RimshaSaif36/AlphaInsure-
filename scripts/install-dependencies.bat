@echo off
echo Installing Dependencies for AlphaInsure System...
echo ================================================

echo.
echo [1/3] Installing Backend Dependencies...
cd backend
npm install
if %ERRORLEVEL% neq 0 (
    echo Backend dependency installation failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Installing Frontend Dependencies...
cd ..\frontend
npm install
if %ERRORLEVEL% neq 0 (
    echo Frontend dependency installation failed!
    pause
    exit /b 1
)

echo.
echo [3/3] Installing AI Engine Dependencies...
cd ..\ai-engine
pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo AI Engine dependency installation failed!
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo ==================================
echo.
echo You can now run the system with: scripts\start-system.bat
echo.
pause