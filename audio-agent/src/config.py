import os
from dataclasses import dataclass


@dataclass
class AppConfig:
    sse_url: str
    auth_token: str | None
    verify_ssl: bool
    log_level: str
    min_backoff_seconds: float
    max_backoff_seconds: float


def parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    lowered = value.strip().lower()
    if lowered in {"1", "true", "yes", "y"}:
        return True
    if lowered in {"0", "false", "no", "n"}:
        return False
    return default


def parse_float(value: str | None, default: float) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except ValueError:
        return default


def load_config_from_env() -> AppConfig:
    sse_url = os.environ.get("AGENT_SSE_URL", "").strip()
    if not sse_url:
        raise ValueError("AGENT_SSE_URL is required")

    auth_token = os.environ.get("AGENT_AUTH_TOKEN")
    verify_ssl = parse_bool(os.environ.get("AGENT_VERIFY_SSL"), True)
    log_level = os.environ.get("AGENT_LOG_LEVEL", "INFO").upper()
    min_backoff = parse_float(os.environ.get("AGENT_MIN_BACKOFF_SECONDS"), 1.0)
    max_backoff = parse_float(os.environ.get("AGENT_MAX_BACKOFF_SECONDS"), 30.0)

    if min_backoff <= 0:
        min_backoff = 1.0
    if max_backoff < min_backoff:
        max_backoff = min_backoff

    return AppConfig(
        sse_url=sse_url,
        auth_token=auth_token,
        verify_ssl=verify_ssl,
        log_level=log_level,
        min_backoff_seconds=min_backoff,
        max_backoff_seconds=max_backoff,
    )

