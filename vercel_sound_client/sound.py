import hashlib
import os
from pathlib import Path
from typing import Optional

import requests

try:
    import simpleaudio as sa  # type: ignore
    _BACKEND = "simpleaudio"
except Exception:
    try:
        import winsound  # type: ignore
        _BACKEND = "winsound"
    except Exception:
        _BACKEND = "none"


class SoundPlayer:
    def __init__(
        self,
        cache_dir: Path,
        request_timeout_seconds: int,
        allow_overlap: bool = False,
        api_key: Optional[str] = None,
    ) -> None:
        self.cache_dir = cache_dir
        self.request_timeout_seconds = request_timeout_seconds
        self.allow_overlap = allow_overlap
        self.api_key = api_key
        self._current_play_obj = None

    def _filename_for_url(self, url: str) -> Path:
        hash_prefix = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
        # Default to .wav if not present
        ext = os.path.splitext(url.split("?")[0])[1].lower() or ".wav"
        if ext not in (".wav",):
            ext = ".wav"
        return self.cache_dir / f"{hash_prefix}{ext}"

    def _download(self, url: str) -> Path:
        dest = self._filename_for_url(url)
        if dest.exists():
            return dest

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        with requests.get(url, stream=True, timeout=self.request_timeout_seconds, headers=headers) as response:
            response.raise_for_status()
            tmp_path = dest.with_suffix(dest.suffix + ".part")
            with open(tmp_path, "wb") as handle:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        handle.write(chunk)
            os.replace(tmp_path, dest)
        return dest

    def play_from_url(self, url: str) -> None:
        path = self._download(url)
        self.play_file(path)

    def play_file(self, path: Path) -> None:
        if _BACKEND == "simpleaudio":
            wave_obj = sa.WaveObject.from_wave_file(str(path))
            if not self.allow_overlap and self._current_play_obj is not None:
                try:
                    self._current_play_obj.stop()
                except Exception:
                    pass
            play_obj = wave_obj.play()
            self._current_play_obj = play_obj
            return

        if _BACKEND == "winsound":
            import winsound  # type: ignore

            winsound.PlaySound(str(path), winsound.SND_FILENAME | winsound.SND_ASYNC)
            return

        raise RuntimeError(
            "No audio backend available. Install 'simpleaudio' or enable winsound on Windows."
        )