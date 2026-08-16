@echo off
setlocal EnableExtensions
title Uninstall Robot Mission 3D

set "DEST=%LOCALAPPDATA%\RobotMission3D"
set "LNK=Robot Mission 3D.lnk"
set "DESKTOP=%USERPROFILE%\Desktop"
set "PUBLIC=%PUBLIC%\Desktop"
set "START=%APPDATA%\Microsoft\Windows\Start Menu\Programs"

echo.
echo  Removing Robot Mission 3D shortcuts and installed files.
echo  The original project folder will not be deleted.
echo.

del /f /q "%DESKTOP%\%LNK%" 2>nul
del /f /q "%PUBLIC%\%LNK%" 2>nul
del /f /q "%START%\%LNK%" 2>nul

if exist "%DEST%" (
  rmdir /s /q "%DEST%"
  echo  Removed: %DEST%
) else (
  echo  Install folder not found.
)

echo  Desktop / Start Menu shortcuts removed.
echo.
pause
