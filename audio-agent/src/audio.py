from __future__ import annotations

import io
import logging
import math
import wave
from typing import Optional

import requests
import simpleaudio as sa


logger = logging.getLogger(__name__)


def clamp(value: float, min_value: float, max_value: float) -> float:
    return max(min_value, min(max_value, value))


def generate_sine_pcm_16bit(
    frequency_hz: float,
    duration_ms: int,
    volume: float = 0.5,
    sample_rate_hz: int = 44100,
) -> bytes:
    duration_seconds = max(0.0, duration_ms / 1000.0)
    total_samples = int(duration_seconds * sample_rate_hz)
    two_pi_f = 2.0 * math.pi * frequency_hz

    volume = clamp(volume, 0.0, 1.0)
    amplitude = int(32767 * volume)

    # Generate little-endian 16-bit PCM samples
    frames = bytearray()
    for n in range(total_samples):
        sample = math.sin(two_pi_f * (n / sample_rate_hz))
        sample_val = int(sample * amplitude)
        sample_val = max(-32768, min(32767, sample_val))
        frames.extend(sample_val.to_bytes(2, byteorder="little", signed=True))
    return bytes(frames)


def play_tone(
    frequency_hz: float,
    duration_ms: int,
    volume: float = 0.5,
    sample_rate_hz: int = 44100,
    blocking: bool = False,
) -> Optional[sa.PlayObject]:
    frequency_hz = clamp(frequency_hz, 20.0, 20000.0)
    duration_ms = int(max(1, duration_ms))
    pcm = generate_sine_pcm_16bit(frequency_hz, duration_ms, volume, sample_rate_hz)
    play_obj = sa.play_buffer(pcm, num_channels=1, bytes_per_sample=2, sample_rate=sample_rate_hz)
    if blocking:
        play_obj.wait_done()
        return None
    return play_obj


def play_wav_url(url: str, verify_ssl: bool = True, blocking: bool = False) -> Optional[sa.PlayObject]:
    logger.debug("Fetching WAV: %s", url)
    resp = requests.get(url, stream=True, timeout=30, verify=verify_ssl)
    resp.raise_for_status()

    content = resp.content
    with io.BytesIO(content) as bio:
        with wave.open(bio, 'rb') as wav:
            num_channels = wav.getnchannels()
            sample_width = wav.getsampwidth()
            frame_rate = wav.getframerate()
            frames = wav.readframes(wav.getnframes())

    if sample_width not in (1, 2, 3, 4):
        raise ValueError("Unsupported WAV sample width")

    play_obj = sa.play_buffer(frames, num_channels=num_channels, bytes_per_sample=sample_width, sample_rate=frame_rate)
    if blocking:
        play_obj.wait_done()
        return None
    return play_obj

