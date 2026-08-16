"""Serve Robot Mission 3D and a shared LAN leaderboard.

Run on the HOST PC:
    python server.py

Other PCs on the same Wi-Fi open the LAN URL printed below.
"""
from __future__ import annotations

import json
import socket
import threading
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "leaderboard.json"
SHEETS_FILE = ROOT / "data" / "google_sheets.json"
SETTINGS_FILE = ROOT / "data" / "settings.json"
PORT = 8080
LOCK = threading.Lock()
SHEETS_PREFIX = "https://script.google.com/"


def lan_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        sock.close()


def load_rows() -> list:
    if not DATA.exists():
        return []
    try:
        rows = json.loads(DATA.read_text(encoding="utf-8"))
        return rows if isinstance(rows, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def write_rows(rows: list) -> list:
    DATA.parent.mkdir(parents=True, exist_ok=True)
    ranked = sort_rows(rows)[:50]
    tmp = DATA.with_suffix(".tmp")
    tmp.write_text(json.dumps(ranked, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(DATA)
    return ranked


def snapshot() -> list:
    with LOCK:
        return list(load_rows())


def add_row(entry: dict) -> list:
    with LOCK:
        rows = load_rows()
        rows.append(entry)
        return write_rows(rows)


def clear_rows() -> list:
    with LOCK:
        return write_rows([])


def sort_rows(rows: list) -> list:
    return sorted(
        rows,
        key=lambda r: (
            -int(r.get("score") or 0),
            -int(r.get("treasures") or 0),
            -int(r.get("correct") or 0),
            int(r.get("timeUsed") or 0),
        ),
    )


def clean_entry(raw: dict) -> dict:
    def text(key, limit):
        return str(raw.get(key) or "")[:limit].strip()

    def num(key):
        try:
            return int(raw.get(key) or 0)
        except (TypeError, ValueError):
            return 0

    return {
        "name": text("name", 60) or "ผู้เล่น",
        "grade": text("grade", 20),
        "school": text("school", 80),
        "score": max(0, num("score")),
        "treasures": max(0, num("treasures")),
        "correct": max(0, num("correct")),
        "wrong": max(0, num("wrong")),
        "time": text("time", 12) or "00:00",
        "timeUsed": max(0, num("timeUsed")),
        "world": max(1, num("world") or 1),
        "reason": text("reason", 40),
        "date": text("date", 40),
    }


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def sheets_url() -> str:
    url = str(_read_json(SHEETS_FILE).get("webhookUrl") or "").strip()
    if not url:
        url = str(_read_json(SETTINGS_FILE).get("googleSheetsWebhookUrl") or "").strip()
    if url.startswith(SHEETS_PREFIX):
        return url
    return ""


def save_sheets_url(url: str) -> str:
    cleaned = str(url or "").strip()
    if cleaned and not cleaned.startswith(SHEETS_PREFIX):
        raise ValueError("url must start with https://script.google.com/")
    SHEETS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SHEETS_FILE.write_text(
        json.dumps({"webhookUrl": cleaned}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return cleaned


def push_google_sheets(entry: dict) -> None:
    url = sheets_url()
    if not url:
        return
    threading.Thread(target=_post_sheets, args=(url, entry), daemon=True).start()


def _post_sheets(url: str, entry: dict) -> None:
    body = json.dumps(entry, ensure_ascii=False).encode("utf-8")
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "RobotMission3D/1.0",
    }
    try:
        req = urllib.request.Request(url, data=body, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=20) as res:
            print("[sheets] sent", res.status)
    except Exception as err:
        print(f"[sheets] failed: {err}")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        try:
            print(f"[{self.log_date_time_string()}] {fmt % args}")
        except UnicodeEncodeError:
            print(f"[{self.log_date_time_string()}] {self.command} {self.path}")

    def end_headers(self):
        path = urlparse(self.path).path
        if path.endswith((".js", ".css", ".html", ".json")):
            self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def _json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _route(self) -> str:
        return urlparse(self.path).path.rstrip("/") or "/"

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        route = self._route()
        if route == "/api/leaderboard":
            self._json(200, snapshot())
            return
        if route == "/api/status":
            ip = lan_ip()
            self._json(
                200,
                {
                    "online": True,
                    "lan": f"http://{ip}:{PORT}",
                    "ip": ip,
                    "port": PORT,
                    "sheets": bool(sheets_url()),
                },
            )
            return
        super().do_GET()

    def do_POST(self):
        route = self._route()
        if route == "/api/sheets":
            length = min(int(self.headers.get("Content-Length") or 0), 4096)
            raw = self.rfile.read(length)
            try:
                data = json.loads(raw.decode("utf-8") or "{}")
                url = save_sheets_url((data or {}).get("url") if isinstance(data, dict) else "")
            except ValueError as err:
                self._json(400, {"ok": False, "error": str(err)})
                return
            except (json.JSONDecodeError, OSError):
                self._json(400, {"ok": False, "error": "bad json"})
                return
            self._json(200, {"ok": True, "sheets": bool(url)})
            return
        if route == "/api/sheets-test":
            url = sheets_url()
            if not url:
                self._json(400, {"ok": False, "error": "no webhook"})
                return
            push_google_sheets(
                {
                    "name": "ทดสอบระบบ",
                    "grade": "-",
                    "school": "-",
                    "score": 0,
                    "treasures": 0,
                    "correct": 0,
                    "wrong": 0,
                    "time": "00:00",
                    "timeUsed": 0,
                    "world": 1,
                    "reason": "ทดสอบ Google Sheets",
                    "date": "",
                }
            )
            self._json(200, {"ok": True, "sheets": True})
            return
        if route != "/api/leaderboard":
            self.send_error(404)
            return
        length = min(int(self.headers.get("Content-Length") or 0), 8192)
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8") or "{}")
            if not isinstance(data, dict):
                raise ValueError("invalid")
        except (json.JSONDecodeError, ValueError):
            self._json(400, {"ok": False, "error": "bad json"})
            return
        entry = clean_entry(data)
        rows = add_row(entry)
        push_google_sheets(entry)
        self._json(200, rows)

    def do_DELETE(self):
        if self._route() != "/api/leaderboard":
            self.send_error(404)
            return
        self._json(200, clear_rows())


def main():
    ip = lan_ip()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("=" * 52)
    print("Robot Mission 3D  --  shared LAN leaderboard")
    print(f"  This PC     http://127.0.0.1:{PORT}")
    print(f"  Other PCs   http://{ip}:{PORT}")
    print("  Same Wi-Fi/LAN required")
    print("  If others cannot connect, allow port 8080 on the firewall")
    print(f"  Google Sheets  {'ON' if sheets_url() else 'off (paste Web app URL in Settings)'}")
    print("=" * 52)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")


if __name__ == "__main__":
    main()
