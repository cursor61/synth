from __future__ import annotations

import logging
import os
import signal
import sys
from typing import Optional

from .audio import play_tone, play_wav_url
from .config import load_config_from_env
from .logging_utils import configure_logging
from .sse import connect_and_stream, decode_event_data_to_json


logger = logging.getLogger(__name__)


def run() -> int:
    try:
        config = load_config_from_env()
    except Exception as ex:  # noqa: BLE001
        print(f"Config error: {ex}")
        return 2

    configure_logging(config.log_level)
    logger.info("Audio Agent starting")

    auth_headers: dict[str, str] | None = None
    if config.auth_token:
        auth_headers = {"Authorization": f"Bearer {config.auth_token}"}

    shutting_down = False

    def handle_term(signum, frame):  # noqa: ARG001
        nonlocal shutting_down
        shutting_down = True
        logger.info("Received signal %s; terminating...", signum)

    # Graceful shutdown signals
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            signal.signal(sig, handle_term)
        except Exception:  # noqa: BLE001
            pass

    try:
        for event in connect_and_stream(
            config.sse_url,
            headers=auth_headers,
            verify_ssl=config.verify_ssl,
            min_backoff_seconds=config.min_backoff_seconds,
            max_backoff_seconds=config.max_backoff_seconds,
        ):
            if shutting_down:
                break

            if event.event not in ("message", "audio"):
                continue

            payload = decode_event_data_to_json(event)
            if not isinstance(payload, dict):
                continue

            action = str(payload.get("action", "")).lower()
            if action == "tone":
                freq = float(payload.get("frequency_hz", 440))
                dur = int(payload.get("duration_ms", 400))
                vol = float(payload.get("volume", 0.5))
                blocking = bool(payload.get("blocking", False))
                try:
                    play_tone(freq, dur, vol, blocking=blocking)
                except Exception as ex:  # noqa: BLE001
                    logger.error("Tone playback failed: %s", ex)
            elif action == "wav":
                url = payload.get("url")
                if not url or not isinstance(url, str):
                    logger.warning("Invalid wav action; missing url")
                    continue
                blocking = bool(payload.get("blocking", False))
                try:
                    play_wav_url(url, verify_ssl=config.verify_ssl, blocking=blocking)
                except Exception as ex:  # noqa: BLE001
                    logger.error("WAV playback failed: %s", ex)
            else:
                logger.debug("Unknown action: %s", action)
    except KeyboardInterrupt:
        logger.info("Interrupted by user")

    logger.info("Audio Agent stopped")
    return 0


if __name__ == "__main__":
    sys.exit(run())

