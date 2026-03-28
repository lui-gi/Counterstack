// ============================================================
// simulation/audio/SfxPlayer.ts
// File-based sound-effect player singleton.
//
// Plays individual MP3 SFX with no crossfade logic (fire-and-forget).
// Also supports sequenced playback — chains files end-to-end and
// notifies MusicManager when a sequence finishes so the correct
// music track can start after a dramatic intro.
//
// Volume hierarchy:
//   Music (MusicManager)  0.35
//   Regular SFX           0.60
//   Dialogue / stingers   0.80
// ============================================================

// ── Centralised asset paths ───────────────────────────────────
export const SFX = {
  // Card actions
  spadeAttack:        '/assets/audio/spadeattackse.mp3',
  diamondDefend:      '/assets/audio/diamonddefendse.mp3',
  heartHeal:          '/assets/audio/heartshealse.mp3',
  cloverRestore:      '/assets/audio/cloverrestorese.mp3',

  // Combat
  virusAttack:        '/assets/audio/virusattack.mp3',
  virusDefeat:        '/assets/audio/virusdefeat.mp3',

  // Narrative / boss intros
  wesker7mins:        '/assets/audio/wesker7mins.mp3',
  aiAdapterTransform: '/assets/audio/aiadaptertransform.mp3',
  aiAdapterBeginning: '/assets/audio/beginningroaraiadapter.mp3',

  // Victory
  victorySe:          '/assets/audio/victoryse.mp3',

  // System compromised stinger
  systemCompromised:  '/assets/audio/systemcompromised.mp3',

  // AI Adapter healing / adaptation
  adapting:           '/assets/audio/adapting.mp3',
} as const;

export type SfxId = keyof typeof SFX;

// ── Card-suit → SfxId map (used by PlayerHand) ──────────────
export const CARD_SFX: Record<string, SfxId> = {
  spades:   'spadeAttack',
  diamonds: 'diamondDefend',
  hearts:   'heartHeal',
  clubs:    'cloverRestore',
};

// ── SfxPlayerClass ────────────────────────────────────────────
const SFX_VOLUME      = 0.6;
const DIALOGUE_VOLUME = 0.8;

/** Sources whose volume should be raised (dialogue / narrative stingers). */
const DIALOGUE_SRCS = new Set<string>([
  SFX.wesker7mins,
  SFX.aiAdapterTransform,
  SFX.aiAdapterBeginning,
  SFX.victorySe,
]);

class SfxPlayerClass {
  /** Currently-running sequence, used by stopSequence(). */
  private seqEl: HTMLAudioElement | null = null;
  /** Last fire-and-forget element, tracked so stopAll() can cut it. */
  private lastEl: HTMLAudioElement | null = null;

  /**
   * Fire-and-forget single SFX.
   * Safe to call even if audio hasn't been explicitly unlocked —
   * by the time any in-game action fires a sound the user has clicked.
   */
  play(src: string): void {
    const el = new Audio(src);
    el.volume = DIALOGUE_SRCS.has(src) ? DIALOGUE_VOLUME : SFX_VOLUME;
    this.lastEl = el;
    el.play().catch(() => { /* silently ignore — file may be missing */ });
  }

  /** Convenience: play by SfxId key. */
  playId(id: SfxId): void {
    this.play(SFX[id]);
  }

  /**
   * Chain an array of audio files end-to-end.
   * Calls `onDone` (if provided) after the last file finishes.
   * Interrupts any previously-running sequence.
   *
   * Used for the AI Adapter intro:
   *   virusDefeat → aiAdapterTransform → aiAdapterBeginning → (onDone: music switch)
   */
  playSequence(srcs: string[], onDone?: () => void): void {
    this.stopSequence(); // cancel any in-progress chain

    let idx = 0;

    const playNext = () => {
      if (idx >= srcs.length) {
        this.seqEl = null;
        onDone?.();
        return;
      }

      const src = srcs[idx++];
      const el  = new Audio(src);
      el.volume = DIALOGUE_SRCS.has(src) ? DIALOGUE_VOLUME : SFX_VOLUME;

      el.onended  = playNext;
      el.onerror  = playNext; // skip missing file — keep chain moving

      this.seqEl = el;
      el.play().catch(playNext);
    };

    playNext();
  }

  /** Interrupt a running sequence (e.g. player skips the AI Adapter intro). */
  stopSequence(): void {
    if (this.seqEl) {
      this.seqEl.onended = null;
      this.seqEl.onerror = null;
      this.seqEl.pause();
      this.seqEl = null;
    }
  }

  /**
   * Synthesised threat-alert stinger — three descending beeps.
   * No audio file needed; generated via Web Audio API.
   */
  playThreatAlert(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)() as AudioContext;

      // Threat alarm: 3x rising siren woop + deep pulse bass underneath
      const woop = (startTime: number) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, startTime);
        osc.frequency.exponentialRampToValueAtTime(1100, startTime + 0.22);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
        gain.gain.setValueAtTime(0.4, startTime + 0.18);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.25);
        osc.start(startTime);
        osc.stop(startTime + 0.26);
      };

      // Deep menacing bass pulse under each woop
      const pulse = (startTime: number) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gain.gain.setValueAtTime(0.3, startTime + 0.14);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.22);
        osc.start(startTime);
        osc.stop(startTime + 0.23);
      };

      const t = ctx.currentTime;
      woop(t);        pulse(t);
      woop(t + 0.28); pulse(t + 0.28);
      woop(t + 0.56); pulse(t + 0.56);

      setTimeout(() => ctx.close(), 1400);
    } catch {
      // Web Audio API unavailable — skip silently
    }
  }

  /** Stop every active SFX — sequence AND last fire-and-forget. */
  stopAll(): void {
    this.stopSequence();
    if (this.lastEl) {
      this.lastEl.pause();
      this.lastEl.currentTime = 0;
      this.lastEl = null;
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────
export const SfxPlayer = new SfxPlayerClass();
