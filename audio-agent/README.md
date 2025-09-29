Audio Agent (SSE → Sound)

Minimal cross-platform Python agent that listens to a Vercel-hosted SSE endpoint and plays sounds locally (generated tones or remote WAV files). Designed to be tiny and low-overhead; suitable for packaging into a Windows .exe with PyInstaller.

Features
- Listens to SSE events from a configurable URL
- Plays generated tones fully locally (no heavy libraries)
- Plays remote WAV files fetched over HTTPS
- Resilient reconnect with exponential backoff
- Minimal dependencies: requests, simpleaudio

Local-only Mode (no Vercel required)
- Run a tiny local HTTP server and trigger sounds via HTTP.
- Endpoints:
  - POST /tone  JSON: {"frequency_hz":440, "duration_ms":300, "volume":0.5, "blocking":false}
  - POST /wav   JSON: {"url":"https://example.com/notify.wav", "blocking":false}
  - GET  /health
```
python -m src.local_server  # starts http://127.0.0.1:8765
# Example triggers
curl -X POST http://127.0.0.1:8765/tone -H 'Content-Type: application/json' \
  -d '{"frequency_hz":660,"duration_ms":200,"volume":0.6}'
curl -X POST http://127.0.0.1:8765/wav -H 'Content-Type: application/json' \
  -d '{"url":"https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav"}'
```

SSE Event Format
Send JSON objects in the SSE `data:` field. Supported actions:

1) Tone generation
```
event: message
data: {"action":"tone","frequency_hz":440,"duration_ms":400,"volume":0.5}
```

2) WAV playback from URL
```
event: message
data: {"action":"wav","url":"https://example.com/sounds/notify.wav"}
```

Configuration (Env Vars)
- `AGENT_SSE_URL` (required): SSE endpoint URL
- `AGENT_AUTH_TOKEN` (optional): Bearer token sent as `Authorization: Bearer <token>`
- `AGENT_VERIFY_SSL` (optional, default: `true`): `true`/`false`
- `AGENT_LOG_LEVEL` (optional, default: `INFO`): `DEBUG` | `INFO` | `WARNING` | `ERROR`
- `AGENT_MIN_BACKOFF_SECONDS` (optional, default: `1.0`)
- `AGENT_MAX_BACKOFF_SECONDS` (optional, default: `30.0`)

Quick Start (Dev)
1. Python 3.10+
2. Create venv and install deps
```
python -m venv .venv
. .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```
3. Set environment variables, e.g.
```
export AGENT_SSE_URL="https://your-vercel-app.vercel.app/api/events"
export AGENT_AUTH_TOKEN="YOUR_TOKEN_IF_ANY"
```
4. Run
```
python -m src.main
```

Run in Local-only Mode
```
python -m src.local_server
```

Packaging a Windows .exe (PyInstaller)
Note: PyInstaller must build on the target OS. To produce a Windows .exe, run these steps on Windows.

```
pip install pyinstaller
pyinstaller --onefile --name AudioAgent --distpath dist --workpath build src/main.py
```

- The resulting executable will be at `dist/AudioAgent.exe`.
- To hide the console window, append `--noconsole`.
- Ensure the same Python version on build machine as you plan to target.

Security & Privacy
- This agent only plays sounds on events you send. It does not capture keystrokes.
- All network calls are outbound to your configured SSE URL.

Troubleshooting
- If no sound plays, verify output device and system volume.
- For WAVs, ensure the file is PCM WAV (common formats are supported). If a URL returns a non-WAV file, playback will fail gracefully.
- Run with `AGENT_LOG_LEVEL=DEBUG` for verbose logs.

