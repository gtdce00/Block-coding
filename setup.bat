@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo.
echo  Installing Robot Mission 3D ...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
if errorlevel 1 (
  echo  [!] Setup failed.
  pause
  exit /b 1
)
echo  Done. Look for "Robot Mission 3D" on the Desktop.
echo.
pause
exit /b 0
