import logging
import os
import sys


def configure_logging(level_name: str) -> None:
    level = getattr(logging, level_name.upper(), logging.INFO)
    fmt = "%(asctime)s %(levelname)s %(name)s - %(message)s"
    datefmt = "%Y-%m-%d %H:%M:%S"
    # If already configured, skip adding another handler
    if logging.getLogger().handlers:
        logging.getLogger().setLevel(level)
        return

    handler = logging.StreamHandler(stream=sys.stdout)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt=datefmt))
    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)

