// ============================================================
// simulation/audio/AudioEngine.ts
// Web Audio API singleton.
// Per web-games skill: AudioContext requires user interaction.
// Create on first click; resume if suspended.
// All sound generation is procedural (no audio files needed).
// ============================================================

export type SoundId =
  | 'card-play'         // Any card played
  | 'card-attack'       // Spade hits threat
  | 'card-heal'         // Heart recovery
  | 'card-mana'         // Club mana restore
  | 'card-reinforce'    // Diamond reinforce
  | 'threat-appear'     // New threat spawns
  | 'threat-hit'        // Threat takes damage
  | 'threat-die'        // Threat neutralized
  | 'threat-attack'     // Enemy Exploit executes
  | 'posture-down'      // Posture level drops
  | 'posture-up'        // Posture level rises
  | 'defeat'            // Player health hits 0
  | 'victory'           // Threat eliminated
  | 'compromise';       // System Patch violated

class AudioEngineClass {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _muted = false;

  /** Call on first user interaction to unlock audio. */
  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.ctx.destination);
  }

  get muted(): boolean { return this._muted; }

  setMute(muted: boolean): void {
    this._muted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.4;
    }
  }

  play(id: SoundId): void {
    if (!this.ctx || this._muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const fn = SOUND_MAP[id];
    if (fn) fn(this.ctx, this.masterGain!);
  }
}

// ----------------------------
// Procedural sound generators
// Each returns immediately — synthesized via OscillatorNode + GainNode.
// ----------------------------

type SoundFn = (ctx: AudioContext, out: GainNode) => void;

function beep(
  ctx: AudioContext,
  out: GainNode,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.3,
): void {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(out);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function chord(
  ctx: AudioContext,
  out: GainNode,
  freqs: number[],
  duration: number,
  type: OscillatorType = 'sine',
): void {
  freqs.forEach(f => beep(ctx, out, f, duration, type, 0.15));
}

const SOUND_MAP: Record<SoundId, SoundFn> = {
  'card-play':      (c, o) => beep(c, o, 440, 0.12, 'square', 0.2),
  'card-attack':    (c, o) => chord(c, o, [220, 440, 880], 0.25, 'sawtooth'),
  'card-heal':      (c, o) => chord(c, o, [523, 659, 784], 0.4, 'sine'),
  'card-mana':      (c, o) => beep(c, o, 880, 0.2, 'sine', 0.25),
  'card-reinforce': (c, o) => chord(c, o, [330, 440], 0.3, 'triangle'),

  'threat-appear':  (c, o) => {
    beep(c, o, 110, 0.5, 'sawtooth', 0.4);
    beep(c, o, 150, 0.5, 'square',   0.2);
  },
  'threat-hit':     (c, o) => beep(c, o, 300, 0.1, 'square', 0.35),
  'threat-die':     (c, o) => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, c.currentTime + 0.6);
    gain.gain.setValueAtTime(0.4, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6);
    osc.connect(gain); gain.connect(o);
    osc.start(); osc.stop(c.currentTime + 0.6);
  },
  'threat-attack':  (c, o) => chord(c, o, [80, 120], 0.3, 'sawtooth'),

  'posture-down': (c, o) => {
    beep(c, o, 440, 0.2, 'sine', 0.3);
    setTimeout(() => beep(c, o, 330, 0.2, 'sine', 0.3), 150);
    setTimeout(() => beep(c, o, 220, 0.4, 'sine', 0.3), 300);
  },
  'posture-up':   (c, o) => {
    beep(c, o, 330, 0.15, 'sine', 0.25);
    setTimeout(() => beep(c, o, 440, 0.15, 'sine', 0.25), 120);
    setTimeout(() => beep(c, o, 523, 0.3,  'sine', 0.25), 240);
  },

  'defeat':  (c, o) => chord(c, o, [110, 138, 165], 1.5, 'sawtooth'),
  'victory': (c, o) => chord(c, o, [523, 659, 784, 1046], 1.2, 'sine'),
  'compromise': (c, o) => {
    // Harsh two-burst alarm — short rising beep then heavy descending chord
    beep(c, o, 880, 0.08, 'square', 0.5);
    setTimeout(() => beep(c, o, 1100, 0.08, 'square', 0.4), 90);
    setTimeout(() => {
      beep(c, o, 220, 0.5, 'sawtooth', 0.55);
      beep(c, o, 440, 0.5, 'square',   0.3);
    }, 200);
    setTimeout(() => beep(c, o, 110, 0.6, 'sawtooth', 0.5), 450);
  },
};

// Singleton export
export const AudioEngine = new AudioEngineClass();
