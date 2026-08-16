#!/usr/bin/env bash
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.local/share/RobotMission3D"
APP_DIR="$HOME/.local/share/applications"
if command -v xdg-user-dir >/dev/null 2>&1; then
  DESKTOP="$(xdg-user-dir DESKTOP)"
else
  DESKTOP="$HOME/Desktop"
fi
ICON="$DEST/assets/ui/icon.png"
LAUNCHER="$DEST/start-game.sh"
DESKTOP_FILE_NAME="robot-mission-3d.desktop"

echo
echo "  Robot Mission 3D  -  Linux Setup"
echo "  --------------------------------"
echo "  From: $SRC"
echo "  To:   $DEST"
echo

mkdir -p "$DEST"
LB_BACKUP=""
if [ -f "$DEST/data/leaderboard.json" ]; then
  LB_BACKUP="$(mktemp)"
  cp "$DEST/data/leaderboard.json" "$LB_BACKUP"
fi

if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude ".git" "$SRC/" "$DEST/"
else
  cp -a "$SRC"/. "$DEST/"
  rm -rf "$DEST/.git"
fi

if [ -n "$LB_BACKUP" ]; then
  mkdir -p "$DEST/data"
  cp "$LB_BACKUP" "$DEST/data/leaderboard.json"
  rm -f "$LB_BACKUP"
fi

chmod +x "$DEST/start-game.sh" "$DEST/setup.sh" "$DEST/uninstall.sh" 2>/dev/null || true

write_desktop() {
  local path="$1"
  mkdir -p "$(dirname "$path")"
  cat > "$path" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Robot Mission 3D
Comment=Forest Adventure - block coding game
Exec=$LAUNCHER
Path=$DEST
Icon=$ICON
Terminal=true
StartupNotify=true
Categories=Game;Education;
EOF
  chmod +x "$path"
  if command -v gio >/dev/null 2>&1; then
    gio set "$path" metadata::trusted true >/dev/null 2>&1 || true
  fi
}

write_desktop "$APP_DIR/$DESKTOP_FILE_NAME"
if [ -d "$DESKTOP" ]; then
  write_desktop "$DESKTOP/$DESKTOP_FILE_NAME"
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$APP_DIR" >/dev/null 2>&1 || true
fi

echo "  Created desktop shortcut: $DESKTOP_FILE_NAME"
echo "  Created app menu shortcut"
echo
if command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1; then
  echo "  Python is ready. Double-click the desktop icon to play."
else
  echo "  [!] Python 3 not found. Install with:  sudo apt install python3"
fi
echo
echo "  Host PC: keep the terminal window open."
echo "  Other PCs: open the LAN URL shown in that window."
echo
