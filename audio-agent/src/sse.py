from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import Generator, Iterable, Optional

import requests


logger = logging.getLogger(__name__)


@dataclass
class SSEEvent:
    event: str
    data: str
    id: Optional[str] = None
    retry: Optional[int] = None


def _iter_lines(response: requests.Response) -> Iterable[str]:
    for line in response.iter_lines(decode_unicode=True):
        if line is None:
            continue
        yield line


def parse_sse_stream(lines: Iterable[str]) -> Generator[SSEEvent, None, None]:
    field_event = "message"
    field_data_parts: list[str] = []
    field_id: Optional[str] = None
    field_retry: Optional[int] = None

    for raw_line in lines:
        if raw_line == "":
            if not field_data_parts and not field_id and field_event == "message":
                continue
            event = SSEEvent(
                event=field_event,
                data="\n".join(field_data_parts),
                id=field_id,
                retry=field_retry,
            )
            yield event
            field_event = "message"
            field_data_parts = []
            field_id = None
            field_retry = None
            continue

        if raw_line.startswith(":"):
            # Comment / keep-alive
            continue

        if ":" in raw_line:
            field, value = raw_line.split(":", 1)
            value = value[1:] if value.startswith(" ") else value
        else:
            field, value = raw_line, ""

        if field == "event":
            field_event = value
        elif field == "data":
            field_data_parts.append(value)
        elif field == "id":
            field_id = value
        elif field == "retry":
            try:
                field_retry = int(value)
            except ValueError:
                field_retry = None
        else:
            # ignore other fields
            pass


def connect_and_stream(
    url: str,
    headers: dict[str, str] | None = None,
    verify_ssl: bool = True,
    min_backoff_seconds: float = 1.0,
    max_backoff_seconds: float = 30.0,
) -> Generator[SSEEvent, None, None]:
    backoff = min_backoff_seconds
    last_event_id: Optional[str] = None

    while True:
        req_headers = {"Accept": "text/event-stream"}
        if headers:
            req_headers.update(headers)
        if last_event_id:
            req_headers["Last-Event-ID"] = last_event_id

        try:
            with requests.get(url, headers=req_headers, stream=True, verify=verify_ssl, timeout=60) as resp:
                if resp.status_code != 200:
                    logger.warning("SSE connect failed: %s %s", resp.status_code, resp.text[:200])
                    raise RuntimeError(f"SSE connect failed: status={resp.status_code}")

                logger.info("Connected to SSE: %s", url)
                backoff = min_backoff_seconds

                for event in parse_sse_stream(_iter_lines(resp)):
                    last_event_id = event.id or last_event_id
                    yield event

                logger.warning("SSE stream ended by server; reconnecting...")
        except requests.RequestException as ex:
            logger.error("SSE request error: %s", ex)
        except Exception as ex:  # noqa: BLE001
            logger.exception("SSE unexpected error: %s", ex)

        time.sleep(backoff)
        backoff = min(backoff * 2, max_backoff_seconds)


def decode_event_data_to_json(event: SSEEvent) -> Optional[dict]:
    if not event.data:
        return None
    try:
        return json.loads(event.data)
    except json.JSONDecodeError:
        logger.debug("Non-JSON event data: %s", event.data)
        return None

