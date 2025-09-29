/*
 High-level, low-latency Web Audio engine with:
 - Polyphonic voices (multiple channels)
 - Basic instruments (sine, square, saw, triangle, noise)
 - Effects chain: input -> filter(bass) -> delay(echo) -> convolver(reverb) -> compressor -> master gain
 - Real-time parameter control
 - Simple recorder using MediaRecorder on a destination stream
*/

export type InstrumentType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';

export type EffectSettings = {
  masterVolume: number; // 0..1
  bassHz: number; // low-pass cutoff for bass emphasis
  bassQ: number;
  echoTime: number; // seconds
  echoFeedback: number; // 0..0.95
  echoMix: number; // 0..1
  reverbMix: number; // 0..1
};

export type VoiceOptions = {
  instrument: InstrumentType;
  frequency: number; // Hz
  durationMs?: number; // if provided, schedules stop
  velocity?: number; // 0..1
};

export type EngineOptions = {
  numVoices?: number;
  initialInstrument?: InstrumentType;
  sampleRate?: number;
};

export class AudioEngine {
  readonly context: AudioContext;
  private masterGain: GainNode;
  private filter: BiquadFilterNode;
  private delay: DelayNode;
  private delayGain: GainNode;
  private reverb: ConvolverNode;
  private reverbGain: GainNode;
  private compressor: DynamicsCompressorNode;
  private destination: MediaStreamAudioDestinationNode;
  private recorder?: MediaRecorder;
  private recordedChunks: Blob[] = [];

  private voices: Array<{
    isBusy: boolean;
    osc?: OscillatorNode;
    noise?: AudioBufferSourceNode;
    gain: GainNode;
  }> = [];

  public instrument: InstrumentType;
  public settings: EffectSettings;
  public adsr = { attack: 0.006, decay: 0.12, sustain: 0.6, release: 0.08 };
  public detuneCents = 7; // for dual-osc sweetness

  constructor(options: EngineOptions = {}) {
    const sampleRate = options.sampleRate ?? undefined;
    // Prefer low-latency context if available
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: 'interactive', sampleRate });

    // Nodes
    this.masterGain = this.context.createGain();
    this.filter = this.context.createBiquadFilter();
    this.delay = this.context.createDelay(2.0);
    this.delayGain = this.context.createGain();
    this.reverb = this.context.createConvolver();
    this.reverbGain = this.context.createGain();
    this.compressor = this.context.createDynamicsCompressor();
    this.destination = this.context.createMediaStreamDestination();

    // Wire: (voice) -> filter -> [delay->mix] + [reverb->mix] -> compressor -> master -> context + recorder dest
    this.filter.connect(this.delay);
    this.delay.connect(this.delayGain);
    this.delayGain.connect(this.filter); // feedback loop via filter
    this.filter.connect(this.reverb);

    const post = this.context.createGain();
    this.filter.connect(post); // dry path
    this.delay.connect(post); // wet echo path (via delayGain loop already)
    this.reverb.connect(post); // wet reverb path

    post.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.context.destination);
    this.masterGain.connect(this.destination);

    // Default settings
    this.instrument = options.initialInstrument ?? 'sine';
    this.settings = {
      masterVolume: 0.6,
      bassHz: 180,
      bassQ: 0.7,
      echoTime: 0.2,
      echoFeedback: 0.25,
      echoMix: 0.25,
      reverbMix: 0.3,
    };
    this.applySettings(this.settings);

    const numVoices = Math.max(8, options.numVoices ?? 16);
    for (let i = 0; i < numVoices; i += 1) {
      const g = this.context.createGain();
      g.gain.value = 0;
      g.connect(this.filter);
      this.voices.push({ isBusy: false, gain: g });
    }

    // Create a small impulse response for reverb by default
    this.reverb.buffer = createImpulseResponse(this.context, 1.8, 2.5);
  }

  async resume(): Promise<void> {
    if (this.context.state !== 'running') {
      await this.context.resume();
    }
  }

  applySettings(s: Partial<EffectSettings>): void {
    this.settings = { ...this.settings, ...s };
    this.masterGain.gain.value = this.settings.masterVolume;
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.settings.bassHz;
    this.filter.Q.value = this.settings.bassQ;
    this.delay.delayTime.value = this.settings.echoTime;
    this.delayGain.gain.value = this.settings.echoFeedback;
    this.reverbGain.gain.value = this.settings.reverbMix; // not used directly but retained for future
  }

  setInstrument(type: InstrumentType): void {
    this.instrument = type;
  }

  private takeFreeVoice(): { index: number; voice: (typeof this.voices)[number] } | null {
    for (let i = 0; i < this.voices.length; i += 1) {
      if (!this.voices[i].isBusy) return { index: i, voice: this.voices[i] };
    }
    // Steal the first voice if all busy (simple voice stealing)
    return { index: 0, voice: this.voices[0] };
  }

  trigger(options: VoiceOptions): void {
    const now = this.context.currentTime;
    const { voice } = this.takeFreeVoice()!;
    voice.isBusy = true;

    // Always fade in/out to avoid clicks
    const velocity = Math.max(0, Math.min(1, options.velocity ?? 0.85));
    const gain = voice.gain.gain;
    const { attack, decay, sustain } = this.adsr;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(0.0001, now);
    // ADSR envelope
    gain.linearRampToValueAtTime(Math.max(0.001, velocity), now + attack);
    gain.linearRampToValueAtTime(Math.max(0.001, velocity * sustain), now + attack + decay);

    const stopAt = options.durationMs ? now + options.durationMs / 1000 : undefined;

    if (options.instrument === 'noise' || (options.instrument ?? this.instrument) === 'noise') {
      const buffer = createNoiseBuffer(this.context);
      const src = this.context.createBufferSource();
      src.buffer = buffer;
      src.connect(voice.gain);
      src.start(now);
      if (stopAt) src.stop(stopAt);
      voice.noise = src;
    } else {
      // Dual detuned oscillators mixed for a sweeter tone
      const osc1 = this.context.createOscillator();
      const osc2 = this.context.createOscillator();
      const type = options.instrument ?? this.instrument;
      osc1.type = type; osc2.type = type;
      const det = this.detuneCents;
      osc1.frequency.setValueAtTime(options.frequency, now);
      osc2.frequency.setValueAtTime(options.frequency, now);
      osc1.detune.setValueAtTime(-det, now);
      osc2.detune.setValueAtTime(det, now);
      osc1.connect(voice.gain);
      osc2.connect(voice.gain);
      osc1.start(now);
      osc2.start(now);
      if (stopAt) { osc1.stop(stopAt); osc2.stop(stopAt); }
      // store only one ref
      voice.osc = osc1;
    }

    const release = () => {
      const t = this.context.currentTime;
      gain.cancelScheduledValues(t);
      gain.setTargetAtTime(0.0001, t, this.adsr.release);
      setTimeout(() => {
        voice.osc?.disconnect();
        voice.noise?.disconnect();
        voice.osc = undefined;
        voice.noise = undefined;
        voice.isBusy = false;
      }, 80);
    };

    if (stopAt) setTimeout(release, options.durationMs!);
  }

  startRecording(): void {
    if (this.recorder && this.recorder.state !== 'inactive') return;
    this.recordedChunks = [];
    this.recorder = new MediaRecorder(this.destination.stream);
    this.recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) this.recordedChunks.push(ev.data);
    };
    this.recorder.start();
  }

  stopRecording(): Blob | null {
    if (!this.recorder) return null;
    return new Promise<Blob | null>((resolve) => {
      if (!this.recorder) return resolve(null);
      this.recorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        resolve(blob);
      };
      this.recorder.stop();
    }) as unknown as Blob | null;
  }
}

// Utilities

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteInScale(rootMidi: number, degree: number, scale: number[] = [0,2,4,5,7,9,11,12]): number {
  const octave = Math.floor(degree / scale.length);
  const index = degree % scale.length;
  return rootMidi + scale[index] + 12 * octave;
}

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function createImpulseResponse(context: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = context.sampleRate;
  const length = rate * seconds;
  const impulse = context.createBuffer(2, length, rate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return impulse;
}
