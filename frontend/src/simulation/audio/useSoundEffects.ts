// ============================================================
// simulation/audio/useSoundEffects.ts
// Watches SimulationState and fires file-based SFX + procedural
// AudioEngine sounds at the correct gameplay moments.
//
// Card-play sounds are handled in PlayerHand (suit known at click).
//
// Trigger map
// ─────────────────────────────────────────────────────────────
// phase → 'enemy-respond'              virusattack.mp3
// phase → 'victory'                    victoryse.mp3
// phase → 'compromised'                AudioEngine 'compromise' alarm
// activeThreat changes
//   → rootkit-trojan appears           wesker7mins.mp3
//     (fires in sync with dialogue "7 minutes..." appearing)
//   → ai-adapter appears               sequence:
//       virusdefeat → aiadaptertransform → beginningroaraiadapter
//       then MusicManager switches to aiadaptertheme
// ============================================================

import { useEffect, useRef } from 'react';
import { SfxPlayer, SFX }   from './SfxPlayer';
import { MusicManager }      from './MusicManager';
import type { SimulationState } from '../engine/types';

export function useSoundEffects(state: SimulationState): void {
  const prevPhase       = useRef(state.phase);
  const prevThreatId    = useRef(state.activeThreat?.id ?? null);

  // Prevent useMusicManager from crossfading during the AI Adapter
  // cinematic sequence — music only starts after the chain finishes.
  const sequenceRunning = useRef(false);

  // ── Phase changes ────────────────────────────────────────────
  useEffect(() => {
    const prev = prevPhase.current;
    const curr = state.phase;
    if (prev === curr) return;
    prevPhase.current = curr;

    // Enemy attacks player
    if (curr === 'enemy-respond') {
      SfxPlayer.play(SFX.virusAttack);
    }

    // Any threat neutralised — play victory stinger.
    // victoryse.mp3 fires here, which is the same moment the
    // "THREAT NEUTRALIZED" text appears in the victory overlay.
    if (curr === 'victory') {
      SfxPlayer.play(SFX.victorySe);
    }

    // System Patch violated — play real systemcompromised.mp3 stinger.
    // Fires when the "SYSTEM COMPROMISED" overlay text appears.
    if (curr === 'compromised') {
      SfxPlayer.playId('systemCompromised');
    }
  }, [state.phase]);

  // ── New active threat ─────────────────────────────────────────
  useEffect(() => {
    const currId = state.activeThreat?.id ?? null;
    if (currId === prevThreatId.current) return;
    prevThreatId.current = currId;

    const mechanic = state.activeThreat?.specialMechanic;

    // ── Rootkit Trojan ──────────────────────────────────────────
    // wesker7mins.mp3 fires exactly when the dialogue box renders
    // "7 minutes... 7 minutes is all I can spare to play with you."
    if (mechanic === 'rootkit-trojan') {
      SfxPlayer.play(SFX.wesker7mins);
      return;
    }

    // ── AI Adapter cinematic intro ──────────────────────────────
    // The three SFX chain together, then the music track begins.
    // This fires simultaneously with the dialogue typewriter and
    // the "ADAPTATION SEQUENCE INITIATED" text appearing.
    if (mechanic === 'ai-adapter') {
      sequenceRunning.current = true;

      SfxPlayer.playSequence(
        [SFX.virusDefeat, SFX.aiAdapterTransform, SFX.aiAdapterBeginning],
        () => {
          sequenceRunning.current = false;
          // Explicitly hand off to the music manager now that
          // the cinematic chain has finished.
          MusicManager.setTrack('ai-adapter');
        },
      );
      return;
    }
  }, [state.activeThreat?.id]);   // eslint-disable-line react-hooks/exhaustive-deps

}
