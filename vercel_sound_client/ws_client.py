import asyncio
import json
import random
from typing import Awaitable, Callable, Dict, Optional

import websockets


class WebSocketClient:
    def __init__(
        self,
        url: str,
        on_message: Callable[[Dict], Awaitable[None]],
        headers: Optional[dict] = None,
        reconnect_min_seconds: float = 1.0,
        reconnect_max_seconds: float = 30.0,
    ) -> None:
        self.url = url
        self.on_message = on_message
        self.headers = headers or {}
        self.reconnect_min_seconds = reconnect_min_seconds
        self.reconnect_max_seconds = reconnect_max_seconds
        self._should_run = True

    async def run_forever(self) -> None:
        delay = self.reconnect_min_seconds
        while self._should_run:
            try:
                async with websockets.connect(
                    self.url,
                    extra_headers=self.headers,
                    ping_interval=20,
                    ping_timeout=20,
                    close_timeout=10,
                    max_queue=32,
                ) as ws:
                    delay = self.reconnect_min_seconds
                    async for raw in ws:
                        try:
                            data = json.loads(raw)
                        except json.JSONDecodeError:
                            continue
                        await self.on_message(data)
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(delay + random.random())
                delay = min(delay * 2, self.reconnect_max_seconds)

    def stop(self) -> None:
        self._should_run = False