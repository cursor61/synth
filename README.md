# Vercel Sound Client (Minimal)

A minimal background client that connects to your Vercel WebSocket backend and plays server-triggered WAV sounds with caching.

## Features
- WebSocket client with auto-reconnect and backoff
- Plays WAV files from provided URLs
- Caches downloads to avoid repeated network fetches
- Optional Authorization header via `API_KEY`
- Windows-friendly; can be bundled to a single `.exe`

## Message schema (from server)
Send JSON frames over WebSocket like:
```json
{"type": "play", "soundUrl": "https://your-app.vercel.app/api/sounds/notify.wav"}
```
The key may be `soundUrl` or `url`.

## Configuration
Environment variables (use `.env` locally):
- `BACKEND_WS_URL` (required): WebSocket endpoint, e.g. `wss://your-app.vercel.app/api/ws`
- `API_KEY` (optional): If your backend requires Authorization: Bearer
- `CACHE_DIR` (optional): Directory for downloaded sounds. Default: `~/.vercel_sound_cache`
- `ALLOW_OVERLAP` (optional): `true|false` to allow overlapping playback. Default: `false`
- `REQUEST_TIMEOUT_SECONDS` (optional): HTTP timeout for sound downloads. Default: `20`
- `RECONNECT_MIN_SECONDS` (optional): Min reconnect delay. Default: `1.0`
- `RECONNECT_MAX_SECONDS` (optional): Max reconnect delay. Default: `30.0`

## Setup
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env  # edit values
```

## Run
```bash
python -m vercel_sound_client.main
# or
python vercel_sound_client/main.py
```

## Build single-file Windows .exe (PyInstaller)
On Windows (recommended):
```bash
pip install pyinstaller==6.10.0
pyinstaller --onefile --noconsole -n VercelSoundClient vercel_sound_client/main.py
```
The output will be in `dist/VercelSoundClient.exe`.

Notes:
- `simpleaudio` is bundled. On Linux, ensure ALSA libs are available if you build for Linux.
- If your sounds are not WAV, convert to WAV on the server or prior to playback.

## Minimal resource usage tips
- Keep messages small and send only when needed.
- Use WAV files with modest sample rates to reduce decode overhead.
- Let the client idle; it reconnects automatically if the network drops.
