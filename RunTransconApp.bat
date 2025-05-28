@echo off
echo Starting Transcon Management System with debug console...

REM Set app name and path
set APP_NAME=Transcon Management System
set APP_PATH=dist_new\win-unpacked

REM We need administrator privileges to create a custom user data directory
net session >nul 2>&1
if %errorLevel% == 0 (
  echo Running with administrator privileges.
) else (
  echo Please run as administrator to enable a custom user data directory.
  echo Attempting to start normally...
)

REM Check if the app directory exists
if not exist "%APP_PATH%" (
  echo Application directory not found at: %APP_PATH%
  echo Please make sure you have built the application with 'npm run electron:build'
  pause
  exit /b 1
)

REM Check if the executable exists
if not exist "%APP_PATH%\%APP_NAME%.exe" (
  echo Executable not found: %APP_PATH%\%APP_NAME%.exe
  echo Looking for any .exe in the directory...
  dir /b "%APP_PATH%\*.exe"
  pause
  exit /b 1
)

REM Launch the app with inspect flag for debugging
cd "%APP_PATH%"
"%APP_NAME%.exe" --inspect

echo Application closed.
pause 