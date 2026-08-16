#!/usr/bin/env bash
set -euo pipefail

DEST="$HOME/.local/share/RobotMission3D"
APP="$HOME/.local/share/applications/robot-mission-3d.desktop"
if command -v xdg-user-dir >/dev/null 2>&1; then
  DESKTOP="$(xdg-user-dir DESKTOP)/robot-mission-3d.desktop"
else
  DESKTOP="$HOME/Desktop/robot-mission-3d.desktop"
fi

echo
echo "  Removing Robot Mission 3D shortcuts and installed files."
echo "  The original project folder will not be deleted."
echo

rm -f "$APP" "$DESKTOP"
rm -rf "$DEST"

echo "  Done."
echo
