// ============================================================
// simulation/gameplay/useJackpot.ts
// Tracks jackpot readiness and drives the hat glow animation.
// After JACKPOT_UNLOCK_TURN turns the hat becomes interactive.
// ============================================================

import { useMemo } from 'react';
import { JACKPOT_UNLOCK_TURN } from '../engine/types';

export interface JackpotStatus {
  available: boolean;
  used:      boolean;
  /** Turns remaining until unlock (0 when available). */
  turnsUntil: number;
  /** 0.0–1.0 progress toward unlock (for a progress ring on the hat). */
  progress:   number;
}

export function useJackpot(
  turn: number,
  jackpotAvailable: boolean,
  jackpotUsed: boolean,
): JackpotStatus {
  return useMemo(() => {
    const turnsUntil = Math.max(0, JACKPOT_UNLOCK_TURN - turn);
    const progress   = Math.min(1, turn / JACKPOT_UNLOCK_TURN);

    return {
      available:  jackpotAvailable && !jackpotUsed,
      used:       jackpotUsed,
      turnsUntil,
      progress,
    };
  }, [turn, jackpotAvailable, jackpotUsed]);
}
