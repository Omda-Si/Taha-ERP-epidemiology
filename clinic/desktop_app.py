"""Taha Clinic desktop window. No Odoo. Local SQLite + HQ sync."""

from __future__ import annotations

import sys
import threading
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import uvicorn

from app.config import settings
from app.main import app

HOST = "127.0.0.1"
PORT = settings.http_port
URL = f"http://{HOST}:{PORT}"


def _serve() -> None:
    uvicorn.run(app, host=HOST, port=PORT, log_level="warning", access_log=False)


def _wait_until_up(timeout: float = 20.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(URL + "/health", timeout=1) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(0.2)
    raise RuntimeError("Taha Clinic server did not start.")


def main() -> None:
    thread = threading.Thread(target=_serve, daemon=True)
    thread.start()
    _wait_until_up()
    import shutil
    import subprocess

    for browser in ("brave-browser", "google-chrome", "chromium-browser", "chromium"):
        binary = shutil.which(browser)
        if not binary:
            continue
        subprocess.Popen(
            [
                binary,
                f"--app={URL}",
                "--class=TahaClinic",
                "--new-window",
                "--name=Taha Clinic",
            ]
        )
        thread.join()
        return
    try:
        import webview

        webview.create_window("Taha Clinic", URL, width=1280, height=840, min_size=(960, 640))
        webview.start()
        return
    except Exception:
        import webbrowser

        webbrowser.open(URL)
        thread.join()


if __name__ == "__main__":
    main()
