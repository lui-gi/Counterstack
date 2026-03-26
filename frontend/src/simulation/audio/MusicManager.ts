// ============================================================
// simulation/audio/MusicManager.ts
// Background music manager for Simulation / Tabletop Mode.
//
// Uses two HTMLAudioElement slots (A / B) for seamless
// crossfading between tracks.  Volume ramps are done with
// a fixed-interval stepper — no Web Audio API required for
// music, keeping it independent of AudioEngine's SFX context.
//
// Track → gameplay mapping (set by useMusicManager hook):
//   main-ui      → default idle / between-threat state
//   system-patch → active System Patch boss threat
//   rootkit      → active Rootkit Trojan boss threat
//   ai-adapter   → active AI Adapter boss threat
//   victory      → phase === 'victory'  (plays once, no loop)
// ============================================================

export type MusicTrack =
  | 'main-ui'
  | 'system-patch'
  | 'wesker'
  | 'rootkit'        // alias for wesker — kept for backward compat
  | 'ai-adapter'
  | 'victory';

// ── Static asset paths (files live in public/assets/audio/) ──
const TRACK_SRC: Record<MusicTrack, string> = {
  'main-ui':      '/assets/audio/mainuitheme.mp3',
  'system-patch': '/assets/audio/systempatchtheme.mp3',
  'wesker':       '/assets/audio/weskertheme.mp3',
  'rootkit':      '/assets/audio/weskertheme.mp3',   // alias
  'ai-adapter':   '/assets/audio/aiadaptertheme.mp3',
  'victory':      '/assets/audio/victorytheme.mp3',
};

// Tracks that loop indefinitely
const LOOPING_TRACKS = new Set<MusicTrack>([
  'main-ui', 'system-patch', 'wesker', 'rootkit', 'ai-adapter',
]);


const MASTER_VOLUME  = 0.35;

// Per-track volume overrides — system-patch is quieter than the rest
const TRACK_VOLUME: Partial<Record<MusicTrack, number>> = {
  'system-patch': 0.12,
};
const trackVolume = (track: MusicTrack) => TRACK_VOLUME[track] ?? MASTER_VOLUME;

const FADE_DURATION  = 900;   // ms — crossfade length
const FADE_STEPS     = 18;    // number of volume updates during fade
const FADE_STEP_MS   = FADE_DURATION / FADE_STEPS;

// ── MusicManagerClass ─────────────────────────────────────────
class MusicManagerClass {
  // Two audio slots — we alternate which is "active"
  private slots: [HTMLAudioElement | null, HTMLAudioElement | null] = [null, null];
  private activeSlot = 0;       // index of the currently-playing element

  private currentTrack: MusicTrack | null = null;
  private _muted  = false;
  private _ready  = false;      // true after first user interaction

  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  // ── Lifecycle ───────────────────────────────────────────────

  /**
   * Call on first user interaction to satisfy browser autoplay policy.
   * Creates the audio elements and starts the default main-ui track.
   */
  init(): void {
    if (this._ready) return;
    this._ready = true;

    this.slots[0] = this._makeElement();
    this.slots[1] = this._makeElement();

    // Start with the main-ui theme immediately
    this._loadAndPlay(this.slots[0], 'main-ui');
    this.currentTrack = 'main-ui';
    this.activeSlot   = 0;
  }

  get ready(): boolean { return this._ready; }
  get muted(): boolean { return this._muted; }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Switch to a new track.  Crossfades over FADE_DURATION ms.
   * Calling with the same track that is already playing is a no-op.
   */
  setTrack(track: MusicTrack): void {
    if (!this._ready) return;
    if (track === this.currentTrack) return;

    this._crossfadeTo(track);
    this.currentTrack = track;
  }

  setMute(muted: boolean): void {
    this._muted = muted;
    const vol = muted ? 0 : MASTER_VOLUME;
    for (const el of this.slots) {
      if (el) el.volume = vol;
    }
  }

  /** Instantly stop all music (e.g. when leaving simulation view). */
  stop(): void {
    this._clearFade();
    for (const el of this.slots) {
      if (!el) continue;
      el.pause();
      el.currentTime = 0;
      el.volume = 0;
    }
    this.currentTrack = null;
  }

  // ── Private helpers ─────────────────────────────────────────

  private _makeElement(): HTMLAudioElement {
    const el = new Audio();
    el.volume = 0;
    el.preload = 'auto';
    return el;
  }

  private _loadAndPlay(el: HTMLAudioElement, track: MusicTrack): void {
    el.src   = TRACK_SRC[track];
    el.loop  = LOOPING_TRACKS.has(track);
    el.volume = this._muted ? 0 : trackVolume(track);

    // Auto-transitions for one-shot tracks
    if (track === 'victory') {
      el.onended = () => {
        if (this.currentTrack === 'victory') this.setTrack('main-ui');
      };
    } else {
      el.onended = null;
    }

    el.play().catch(() => {
      // Autoplay still blocked — nothing to do, user hasn't interacted yet
    });
  }

  private _crossfadeTo(track: MusicTrack): void {
    this._clearFade();

    const outSlot = this.activeSlot;
    const inSlot  = 1 - outSlot;
    const outEl   = this.slots[outSlot];
    const inEl    = this.slots[inSlot];
    if (!outEl || !inEl) return;

    // Prepare incoming element
    inEl.pause();
    inEl.currentTime = 0;
    inEl.volume = 0;
    inEl.src  = TRACK_SRC[track];
    inEl.loop = LOOPING_TRACKS.has(track);

    if (track === 'victory') {
      inEl.onended = () => {
        if (this.currentTrack === 'victory') this.setTrack('main-ui');
      };
    } else {
      inEl.onended = null;
    }

    inEl.play().catch(() => {});

    // Record the starting volume of the outgoing element so we ramp from
    // wherever it currently is (handles interrupting a previous fade).
    const outStart = outEl.volume;
    const target   = this._muted ? 0 : trackVolume(track);

    let step = 0;
    this.fadeTimer = setInterval(() => {
      step++;
      const t = step / FADE_STEPS; // 0 → 1

      // Linear ramp — sounds clean for music crossfades
      inEl.volume  = Math.min(target,  t * target);
      outEl.volume = Math.max(0, outStart * (1 - t));

      if (step >= FADE_STEPS) {
        this._clearFade();
        outEl.pause();
        outEl.currentTime = 0;
        outEl.volume = 0;

        this.activeSlot = inSlot;
      }
    }, FADE_STEP_MS);
  }

  private _clearFade(): void {
    if (this.fadeTimer !== null) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────
export const MusicManager = new MusicManagerClass();
