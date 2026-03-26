// ============================================================
// simulation/audio/useMusicManager.ts
// React hook — drives MusicManager from SimulationState.
//
// Track selection logic:
//   1. phase === 'victory'                          → victory
//   2. activeThreat.specialMechanic === 'system-patch'   → system-patch
//   3. activeThreat.specialMechanic === 'rootkit-trojan' → rootkit
//   4. activeThreat.specialMechanic === 'ai-adapter'     → ai-adapter
//   5. everything else                              → main-ui
//
// The hook also re-exports initMusic() which must be called
// on the first user interaction (same contract as AudioEngine.init).
// ============================================================

import { useEffect, useCallback, useRef } from 'react';
import { MusicManager, type MusicTrack } from './MusicManager';
import type { SimulationState } from '../engine/types';

// ── Track resolution ──────────────────────────────────────────

function trackForState(state: SimulationState): MusicTrack {
  // Terminal phases
  if (state.phase === 'victory') return 'victory';
  // Defeat / compromised → no music change (stay on whatever was playing)
  if (state.phase === 'defeat' || state.phase === 'compromised') {
    return 'main-ui';
  }

  // Boss threat mechanics drive their own themes
  const mechanic = state.activeThreat?.specialMechanic;
  if (mechanic === 'system-patch')   return 'system-patch';
  if (mechanic === 'rootkit-trojan') return 'rootkit';
  if (mechanic === 'ai-adapter')     return 'ai-adapter';

  return 'main-ui';
}

// ── Hook ──────────────────────────────────────────────────────

export function useMusicManager(state: SimulationState) {
  const prevTrackRef = useRef<MusicTrack | null>(null);

  /** Must be called on first user interaction to unlock audio. */
  const initMusic = useCallback(() => MusicManager.init(), []);

  // React to state changes and update the active track
  useEffect(() => {
    if (!MusicManager.ready) return;   // not unlocked yet — user hasn't clicked

    const desired = trackForState(state);
    if (desired === prevTrackRef.current) return;

    MusicManager.setTrack(desired);
    prevTrackRef.current = desired;
  }, [
    state.phase,
    // Re-run if the active threat or its mechanic changes
    state.activeThreat?.id,
    state.activeThreat?.specialMechanic,
  ]);

  return { initMusic };
}

// Re-export type so callers don't need a second import
export type { MusicTrack };
