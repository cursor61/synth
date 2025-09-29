import React from 'react';
import type { AudioEngine, EffectSettings, InstrumentType } from '../audio/AudioEngine';

type Props = {
  engine: AudioEngine;
  settings: EffectSettings;
  onChangeSettings: (s: Partial<EffectSettings>) => void;
  instrument: InstrumentType;
  onChangeInstrument: (i: InstrumentType) => void;
  onRecordToggle: () => void;
  isRecording: boolean;
};

export const ControlPanel: React.FC<Props> = ({ engine, settings, onChangeSettings, instrument, onChangeInstrument, onRecordToggle, isRecording }) => {
  return (
    <div style={{ padding: 12, background: '#1f1f1f', color: '#fff', borderRadius: 8, display: 'grid', gap: 10, maxWidth: 560 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Instrument
          <select value={instrument} onChange={(e) => onChangeInstrument(e.target.value as InstrumentType)} style={{ marginLeft: 8 }}>
            {['sine','square','sawtooth','triangle','noise'].map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </label>
        <button onClick={() => engine.resume()}>Resume Audio</button>
        <button onClick={onRecordToggle}>{isRecording ? 'Stop Recording' : 'Start Recording'}</button>
      </div>

      <Knob label="Volume" min={0} max={1} step={0.01} value={settings.masterVolume} onChange={(v)=>onChangeSettings({ masterVolume: v })} />
      <Knob label="Bass (Hz)" min={60} max={800} step={1} value={settings.bassHz} onChange={(v)=>onChangeSettings({ bassHz: v })} />
      <Knob label="Bass Q" min={0.1} max={2} step={0.01} value={settings.bassQ} onChange={(v)=>onChangeSettings({ bassQ: v })} />
      <Knob label="Echo Time" min={0} max={1.5} step={0.01} value={settings.echoTime} onChange={(v)=>onChangeSettings({ echoTime: v })} />
      <Knob label="Echo Feedback" min={0} max={0.95} step={0.01} value={settings.echoFeedback} onChange={(v)=>onChangeSettings({ echoFeedback: v })} />
      <Knob label="Reverb Mix" min={0} max={1} step={0.01} value={settings.reverbMix} onChange={(v)=>onChangeSettings({ reverbMix: v })} />
    </div>
  );
};

const Knob: React.FC<{ label: string; min: number; max: number; step?: number; value: number; onChange: (v:number)=>void }> = ({ label, min, max, step, value, onChange }) => {
  return (
    <label style={{ display: 'grid', gridTemplateColumns: '140px 1fr 60px', alignItems: 'center', gap: 8 }}>
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e)=>onChange(parseFloat(e.target.value))} />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value.toFixed(2)}</span>
    </label>
  );
};

export default ControlPanel;
