from __future__ import annotations

import json
import logging
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from .audio import play_tone, play_wav_url
from .logging_utils import configure_logging


logger = logging.getLogger(__name__)


class AudioRequestHandler(BaseHTTPRequestHandler):
    server_version = "AudioAgentLocal/1.0"

    def _send_json(self, code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _parse_json(self) -> dict[str, Any]:
        length_str = self.headers.get("Content-Length", "0")
        try:
            length = int(length_str)
        except ValueError:
            length = 0
        raw = self.rfile.read(length) if length > 0 else b""
        if not raw:
            return {}
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def do_POST(self) -> None:  # noqa: N802
        try:
            if self.path == "/tone":
                data = self._parse_json()
                freq = float(data.get("frequency_hz", 440))
                dur = int(data.get("duration_ms", 300))
                vol = float(data.get("volume", 0.5))
                blocking = bool(data.get("blocking", False))
                play_tone(freq, dur, vol, blocking=blocking)
                self._send_json(200, {"status": "ok"})
                return

            if self.path == "/wav":
                data = self._parse_json()
                url = data.get("url")
                if not isinstance(url, str) or not url:
                    self._send_json(400, {"error": "missing url"})
                    return
                blocking = bool(data.get("blocking", False))
                play_wav_url(url, verify_ssl=True, blocking=blocking)
                self._send_json(200, {"status": "ok"})
                return

            self._send_json(404, {"error": "not found"})
        except Exception as ex:  # noqa: BLE001
            logger.exception("Request error: %s", ex)
            self._send_json(500, {"error": "internal error"})

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send_json(200, {"status": "healthy"})
        else:
            self._send_json(404, {"error": "not found"})


def run_server(host: str = "127.0.0.1", port: int = 8765) -> None:
    configure_logging("INFO")
    server = ThreadingHTTPServer((host, port), AudioRequestHandler)
    logger.info("Audio Agent local server listening on http://%s:%d", host, port)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        logger.info("Server stopped")


if __name__ == "__main__":
    run_server()

