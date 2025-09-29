from dataclasses import dataclass
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Config:
    websocket_url: str
    api_key: str | None
    cache_dir: Path
    allow_overlap: bool
    request_timeout_seconds: int
    reconnect_min_seconds: float
    reconnect_max_seconds: float


def load_config() -> Config:
    websocket_url = os.getenv("BACKEND_WS_URL", "wss://your-app.vercel.app/api/ws")
    api_key = os.getenv("API_KEY")

    cache_dir_env = os.getenv("CACHE_DIR")
    default_cache = Path.home() / ".vercel_sound_cache"
    cache_dir = Path(cache_dir_env).expanduser() if cache_dir_env else default_cache

    allow_overlap = os.getenv("ALLOW_OVERLAP", "false").lower() in ("1", "true", "yes", "y")
    request_timeout_seconds = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "20"))
    reconnect_min_seconds = float(os.getenv("RECONNECT_MIN_SECONDS", "1.0"))
    reconnect_max_seconds = float(os.getenv("RECONNECT_MAX_SECONDS", "30.0"))

    cache_dir.mkdir(parents=True, exist_ok=True)

    return Config(
        websocket_url=websocket_url,
        api_key=api_key,
        cache_dir=cache_dir,
        allow_overlap=allow_overlap,
        request_timeout_seconds=request_timeout_seconds,
        reconnect_min_seconds=reconnect_min_seconds,
        reconnect_max_seconds=reconnect_max_seconds,
    )