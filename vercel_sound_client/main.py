import asyncio
import signal
from typing import Dict

from config import load_config
from sound import SoundPlayer
from ws_client import WebSocketClient


async def handle_message(player: SoundPlayer, message: Dict) -> None:
    msg_type = message.get("type")
    if msg_type == "play":
        sound_url = message.get("soundUrl") or message.get("url")
        if isinstance(sound_url, str) and sound_url.startswith("http"):
            try:
                player.play_from_url(sound_url)
            except Exception:
                pass
    # Optionally handle keepalives or other event types here


async def main_async() -> None:
    cfg = load_config()
    player = SoundPlayer(
        cache_dir=cfg.cache_dir,
        request_timeout_seconds=cfg.request_timeout_seconds,
        allow_overlap=cfg.allow_overlap,
        api_key=cfg.api_key,
    )

    headers = {}
    if cfg.api_key:
        headers["Authorization"] = f"Bearer {cfg.api_key}"

    client = WebSocketClient(
        url=cfg.websocket_url,
        on_message=lambda msg: handle_message(player, msg),
        headers=headers,
        reconnect_min_seconds=cfg.reconnect_min_seconds,
        reconnect_max_seconds=cfg.reconnect_max_seconds,
    )

    loop = asyncio.get_running_loop()

    stop_event = asyncio.Event()

    def _signal_handler() -> None:
        client.stop()
        stop_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _signal_handler)
        except NotImplementedError:
            # Signals not supported (e.g., on Windows event loop)
            pass

    ws_task = asyncio.create_task(client.run_forever())
    await stop_event.wait()
    ws_task.cancel()
    try:
        await ws_task
    except Exception:
        pass


def main() -> None:
    try:
        asyncio.run(main_async())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()