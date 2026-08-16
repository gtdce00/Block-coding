@echo off
setlocal EnableExtensions
title Robot Mission 3D Server
cd /d "%~dp0"

set "PYCMD="
where py >nul 2>&1
if not errorlevel 1 (
  py -3 -c "import sys" >nul 2>&1
  if not errorlevel 1 set "PYCMD=py"
)
if not defined PYCMD (
  where python >nul 2>&1
  if not errorlevel 1 set "PYCMD=python"
)
if not defined PYCMD goto :nopy

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto :already

echo.
echo  Starting Robot Mission 3D ...
echo  Keep this window open while students are playing.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:8080/'"

if /i "%PYCMD%"=="py" (
  py -3 server.py
) else (
  python server.py
)
set "ERR=%ERRORLEVEL%"
if "%ERR%"=="0" goto :eof
echo.
echo  [!] Server exited with code %ERR%
echo      If port 8080 is in use, close the other program using it.
echo.
pause
exit /b %ERR%

:already
echo.
echo  Server is already running on port 8080
echo  Opening http://127.0.0.1:8080
echo.
start "" "http://127.0.0.1:8080/"
pause
exit /b 0

:nopy
echo.
echo  [!] Python was not found.
echo      Install from https://www.python.org/downloads/
echo      Check "Add python.exe to PATH" during setup.
echo.
pause
exit /b 1
