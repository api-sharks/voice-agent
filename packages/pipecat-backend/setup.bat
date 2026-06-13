@echo off
REM Pipecat Backend Setup Script for Windows

echo.
echo 🎤 Pipecat Backend Setup
echo ========================
echo.

REM Check Python
echo ✓ Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo   Found %PYTHON_VERSION%
echo.

REM Create virtual environment
echo ✓ Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ❌ Failed to create virtual environment
    pause
    exit /b 1
)
echo.

REM Activate virtual environment
echo ✓ Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install dependencies
echo ✓ Installing dependencies...
python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo ✓ Creating .env file from template...
    copy .env.example .env >nul
    echo   ⚠️  Edit .env and add your API keys:
    echo      - OPENAI_API_KEY
    echo      - ELEVENLABS_API_KEY
    echo.
)

echo ✅ Setup complete!
echo.
echo Next steps:
echo   1. Edit .env and add your API keys
echo   2. Run: python server.py
echo   3. Server will start on ws://localhost:8765
echo.
pause
