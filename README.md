# Synth Input-to-Music Prototype (Web + Electron)

Turn your keyboard and mouse into a live instrument. This app maps keystrokes, mouse movement, clicks, and wheel rotations to musical sounds with very low latency. It runs as a web app and can run as a desktop background agent via Electron to capture global inputs.

## Highlights
- Web Audio engine with multiple voices, sweet dual-oscillator tones, and ADSR envelopes
- Effects: bass emphasis (low‑pass), echo, reverb, compressor, and master volume
- Polyphony so overlapping sounds don’t cut each other off
- Input mapping: keyboard, mouse move, mouse click, mouse wheel
- Keystroke counter that increments on every keydown (including repeats)
- Optional recording to `audio/webm`
- Electron background agent (tray) using global input hooks (Windows compatible) – captures input when the app is not focused

---

## 1) Quickstart

Requirements
- Node.js ≥ 20.19 (LTS) or ≥ 22.12
- Windows 10/11 recommended for background capture (uiohook-napi)

Install
```bash
# from project root
npm install           # installs root dev tools and app dependencies
```

Run as Web (browser tab)
```bash
npm run dev           # starts Vite dev server in app/
# open the URL shown (usually http://localhost:5173)
```

Run as Desktop Background Agent (Electron)
```bash
# one-time: install Electron and global hook (already in package.json devDeps)
npm i

# in one terminal (starts Vite):
npm --prefix app run dev

# in another terminal (starts Electron after Vite is ready):
wait-on tcp:5173 && npx electron ..

# Or from project root if you add the convenience script there:
# npm run electron:dev
```

Build web
```bash
npm run build         # outputs to app/dist
```

Notes
- On first sound use, click “Resume Audio” if the browser suspends audio.
- Electron tray menu shows “Show” and “Quit”. Close the window; sounds still work.

---

## 2) Project Structure
```
.
├─ app/                     # Vite React + TypeScript renderer (Web UI + Audio)
│  ├─ src/
│  │  ├─ audio/AudioEngine.ts      # Web Audio engine (voices, effects, recording)
│  │  ├─ input/InputMapper.ts      # Maps inputs to notes/drums; exposes trigger APIs
│  │  ├─ ui/ControlPanel.tsx       # Instrument/effects controls + recording
│  │  ├─ App.tsx                   # Wires engine, input, UI, and (if present) IPC
│  │  └─ vite-env.d.ts             # Types for window.synthIPC
│  └─ ...
├─ ../main.js              # Electron main process (window, tray, global hooks)
├─ ../preload.js           # Electron preload; exposes IPC to renderer
├─ ../package.json         # Root scripts (web + electron)
```

---

## 3) How It Works

Renderer (Web)
- `AudioEngine` creates a low‑latency `AudioContext` and a voice pool.
  - Instrument types: `sine`, `square`, `sawtooth`, `triangle`, `noise`.
  - Sweet tone: dual detuned oscillators per voice (+/‑ a few cents).
  - ADSR envelope on each note for natural attack/release.
  - Effects chain: voice → low‑pass (bass tone shaping) → delay (feedback loop) → convolver (reverb) → compressor → master gain.
  - Recording: routes master to `MediaStreamAudioDestinationNode` and uses `MediaRecorder` to produce `audio/webm`.

- `InputMapper` handles on‑page inputs and also exposes `trigger*` methods for global IPC events:
  - `triggerByKeyCode(code: string)`
  - `triggerMouseMove(deltaX: number)`
  - `triggerMouseDown()`
  - `triggerWheel(deltaY: number)`
  - Keeps a keystroke counter; notifies via `onCountChange` callback.

- `ControlPanel` lets you:
  - Select instrument
  - Adjust volume, bass cutoff/Q, echo time/feedback, and reverb mix
  - Toggle recording; download `session.webm`

Electron (Background Agent)
- `main.js` starts an Electron window pointing at the Vite dev server (or packaged app), creates a tray icon, and wires global input hooks using `uiohook-napi`.
- `preload.js` exposes a safe `window.synthIPC` bridge to the renderer with event listeners:
  - `onGlobalKey`, `onGlobalMouseDown`, `onGlobalMouseMove`, `onGlobalWheel`
- In `App.tsx`, if `window.synthIPC` exists, we listen and forward to `InputMapper.trigger*` so sounds are generated even when the app is unfocused.

Security model
- `contextIsolation: true` and `nodeIntegration: false`.
- Only a minimal, read‑only IPC surface is exposed.

---

## 4) Configuration

Instruments
- Use the dropdown in the control panel to switch instrument type.
- For “sweeter” leads/harmonies, keep `sawtooth` or `triangle` with short attack.

Effects (real‑time)
- Volume: overall level
- Bass (Hz/Q): low‑pass shaping for warmth
- Echo (time/feedback): short values for groove; long for ambience
- Reverb mix: space/room

Mappings
- Default keyboard: `A S D F G H J K` → major scale from C4
- Number row `1..4`: drum-ish hits
- Mouse move: small pitch blips
- Click: percussive noise
- Wheel: transpose base note (step size configured internally)

Customizing mappings
- Edit `app/src/input/InputMapper.ts` → `defaultKeyMap()` and sensitivity values.
- For global key codes via `uiohook`, adjust the lookup map in `App.tsx` (see comment) to expand which keycodes map to `KeyboardEvent.code` strings.

Profiles (roadmap)
- We will add save/load of mapping/effect presets to `localStorage` or JSON files. Hook points already exist; UI TBD.

---

## 5) Performance & Latency Tips
- Use Node ≥ 22 on dev for best Vite perf; browser choice affects audio latency.
- Keep `attack` small (≈ 0.004–0.01) for snappy notes.
- Avoid very high echo feedback (> 0.85) to prevent runaway.
- On laptops, disable power saving that throttles the CPU.

---

## 6) Packaging Electron (Windows)
This prototype uses dev scripts for speed. For a distributable, add a packager:
- Recommended: `electron-builder` or `electron-forge`.
- Example with builder (not added yet):
  - `npm i -D electron-builder`
  - Add `build` config and script in root `package.json`

Background behavior
- Close the Electron window; the tray remains and continues capturing global input.
- Use the tray menu → Quit to exit fully.

Permissions
- On some systems, you may need to allow the process to capture input globally.

---

## 7) Troubleshooting
- No sound: click “Resume Audio” in the panel; some browsers suspend AudioContext until user interaction.
- Laggy audio: try Chrome/Edge, keep effects moderate, close heavy tabs.
- Global keys not working: ensure Electron is running; check if `uiohook-napi` installed successfully.
- Build errors on Windows: run terminal as Administrator for native module build if needed.

---

## 8) Scripts (root)
```json
{
  "scripts": {
    "dev": "npm --prefix app run dev",
    "build": "npm --prefix app run build",
    "start-electron": "wait-on tcp:5173 && electron .",
    "electron:dev": "concurrently \"npm:start-electron\" \"npm --prefix app run dev\""
  }
}
```

If you don’t have `concurrently`/`wait-on` installed yet:
```bash
npm i -D concurrently wait-on electron uiohook-napi
```

---

## 9) Roadmap
- Mapping editor UI with multiple profiles and persistence
- More instruments (FM/AM synth, sample player), drum kits
- Better keycode mapping for uiohook across layouts
- Packaging flow (electron-builder) with auto-start in background
- Browser extension variant using Web Extensions API (limited global access)

---

## 10) License
MIT for the prototype code. Verify licenses of third‑party deps (`uiohook-napi`, `electron`).
