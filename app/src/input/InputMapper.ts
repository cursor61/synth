/*
 Maps keyboard and mouse inputs to musical actions.
 Provides simple defaults and allows updating mappings at runtime.
*/

import { AudioEngine, midiToFreq, noteInScale } from '../audio/AudioEngine';

export type MappingAction =
  | { type: 'note'; midi: number; durationMs?: number; instrument?: AudioEngine['instrument']; velocity?: number }
  | { type: 'scale-degree'; degree: number; rootMidi: number; durationMs?: number; instrument?: AudioEngine['instrument']; velocity?: number }
  | { type: 'drum'; noise: boolean; durationMs?: number; velocity?: number };

export type KeyMap = Record<string, MappingAction>; // KeyboardEvent.code

export type MouseConfig = {
  moveSensitivity: number; // pixels -> semitone step scaling
  wheelSemitoneStep: number;
  baseMidi: number;
};

export class InputMapper {
  private engine: AudioEngine;
  private keyMap: KeyMap;
  private mouse: MouseConfig;
  private lastMouseX = 0;

  constructor(engine: AudioEngine, keyMap?: KeyMap, mouse?: Partial<MouseConfig>) {
    this.engine = engine;
    this.keyMap = keyMap ?? defaultKeyMap();
    this.mouse = { moveSensitivity: 0.02, wheelSemitoneStep: 2, baseMidi: 60, ...mouse };
  }

  setKeyMap(next: KeyMap): void { this.keyMap = next; }

  attach(): void {
    window.addEventListener('keydown', this.onKeyDown, { passive: true, capture: true });
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    window.addEventListener('mousedown', this.onMouseDown, { passive: true });
    window.addEventListener('wheel', this.onWheel, { passive: true });
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('wheel', this.onWheel);
  }

  private keystrokeCount = 0;
  onCountChange?: (n: number) => void;

  triggerByKeyCode(code: string): void {
    this.keystrokeCount += 1;
    this.onCountChange?.(this.keystrokeCount);
    const action = this.keyMap[code];
    if (!action) return;
    if (action.type === 'note') {
      this.engine.trigger({ instrument: action.instrument ?? this.engine.instrument, frequency: midiToFreq(action.midi), durationMs: action.durationMs ?? 160, velocity: action.velocity ?? 0.9 });
    } else if (action.type === 'scale-degree') {
      const midi = noteInScale(action.rootMidi, action.degree);
      this.engine.trigger({ instrument: action.instrument ?? this.engine.instrument, frequency: midiToFreq(midi), durationMs: action.durationMs ?? 160, velocity: action.velocity ?? 0.85 });
    } else if (action.type === 'drum') {
      this.engine.trigger({ instrument: action.noise ? 'noise' : 'sine', frequency: 110, durationMs: action.durationMs ?? 100, velocity: action.velocity ?? 1 });
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Count every keydown, including repeats
    this.triggerByKeyCode(e.code)
  };

  triggerMouseMove(deltaX: number): void {
    const semitones = Math.round(deltaX * this.mouse.moveSensitivity);
    if (semitones === 0) return;
    const midi = this.mouse.baseMidi + semitones;
    this.engine.trigger({ instrument: 'sawtooth', frequency: midiToFreq(midi), durationMs: 80, velocity: 0.5 });
  }

  private onMouseMove = (e: MouseEvent) => {
    if (this.lastMouseX === 0) this.lastMouseX = e.clientX;
    const deltaX = e.clientX - this.lastMouseX;
    this.lastMouseX = e.clientX;
    this.triggerMouseMove(deltaX)
  };

  triggerMouseDown(): void {
    // Click as a percussive noise
    this.engine.trigger({ instrument: 'noise', frequency: 100, durationMs: 60, velocity: 1 });
  }

  private onMouseDown = (_e: MouseEvent) => {
    this.triggerMouseDown()
  };

  triggerWheel(deltaY: number): void {
    const direction = Math.sign(deltaY);
    const step = -direction * this.mouse.wheelSemitoneStep;
    this.mouse.baseMidi += step;
    const freq = midiToFreq(this.mouse.baseMidi);
    this.engine.trigger({ instrument: 'square', frequency: freq, durationMs: 120, velocity: 0.7 });
  }

  private onWheel = (e: WheelEvent) => {
    this.triggerWheel(e.deltaY)
  };
}

export function defaultKeyMap(): KeyMap {
  // ASDF row for a major scale from middle C
  const m: KeyMap = {};
  const keys = ['KeyA','KeyS','KeyD','KeyF','KeyG','KeyH','KeyJ','KeyK'];
  for (let i = 0; i < keys.length; i += 1) {
    m[keys[i]] = { type: 'scale-degree', degree: i, rootMidi: 60 };
  }
  // Number row as drums
  m['Digit1'] = { type: 'drum', noise: true, durationMs: 70 };
  m['Digit2'] = { type: 'drum', noise: true, durationMs: 120 };
  m['Digit3'] = { type: 'note', midi: 36, durationMs: 120 }; // kick-ish
  m['Digit4'] = { type: 'note', midi: 42, durationMs: 80 }; // hat-ish
  return m;
}
