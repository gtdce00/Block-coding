#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

find_python() {
  if command -v python3 >/dev/null 2>&1; then
    echo python3
    return 0
  fi
  if command -v python >/dev/null 2>&1; then
    echo python
    return 0
  fi
  return 1
}

port_open() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | grep -Eq ':8080([^0-9]|$)'
    return $?
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -ltn 2>/dev/null | grep -Eq ':8080([^0-9]|$)'
    return $?
  fi
  python3 - <<'PY'
import socket, sys
s = socket.socket()
s.settimeout(0.4)
try:
    s.connect(("127.0.0.1", 8080))
    sys.exit(0)
except OSError:
    sys.exit(1)
finally:
    s.close()
PY
}

open_browser() {
  (xdg-open "http://127.0.0.1:8080/" >/dev/null 2>&1 || true) &
}

if ! PY="$(find_python)"; then
  echo
  echo "  [!] Python 3 was not found."
  echo "      Ubuntu/Debian:  sudo apt install python3"
  echo "      Fedora:         sudo dnf install python3"
  echo
  read -r -p "  Press Enter to close..."
  exit 1
fi

if port_open; then
  echo
  echo "  Server is already running on port 8080"
  echo "  Opening http://127.0.0.1:8080"
  echo
  open_browser
  read -r -p "  Press Enter to close..."
  exit 0
fi

echo
echo "  Starting Robot Mission 3D ..."
echo "  Keep this window open while students are playing."
echo

(sleep 2; open_browser) &
exec "$PY" server.py
