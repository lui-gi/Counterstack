// ============================================================
// simulation/audio/useAudio.ts
// React hook — wires AudioEngine to simulation state changes.
// Initializes audio context on first user interaction.
// Per web-games skill: never block on audio load.
// ============================================================

import { useEffect, useCallback, useRef } from 'react';
import { AudioEngine, type SoundId } from './AudioEngine';
import type { SimulationState } from '../engine/types';

export function useAudio(state: SimulationState) {
  const prevPhaseRef   = useRef(state.phase);
  const prevHealthRef  = useRef(state.resources.health);
  const prevPostureRef = useRef(state.posture.level);

  /** Call this on any user click to unlock AudioContext. */
  const initAudio = useCallback(() => AudioEngine.init(), []);

  const play = useCallback((id: SoundId) => AudioEngine.play(id), []);

  // React to phase changes
  useEffect(() => {
    const prev = prevPhaseRef.current;
    const curr = state.phase;
    if (prev === curr) return;
    prevPhaseRef.current = curr;

    switch (curr) {
      case 'threat-appears':  play('threat-appear'); break;
      case 'victory':         play('threat-die');    break;
      case 'defeat':          play('defeat');        break;
      case 'enemy-respond':   play('threat-attack'); break;
    }
  }, [state.phase, play]);

  // React to health drops (damage taken)
  useEffect(() => {
    const prev = prevHealthRef.current;
    const curr = state.resources.health;
    if (curr < prev) {
      play('threat-hit');
    }
    prevHealthRef.current = curr;
  }, [state.resources.health, play]);

  // React to posture level changes
  useEffect(() => {
    const prev = prevPostureRef.current;
    const curr = state.posture.level;
    if (prev === curr) return;
    prevPostureRef.current = curr;

    const levels = ['breached', 'critical', 'strained', 'stable', 'secure'];
    const prevIdx = levels.indexOf(prev);
    const currIdx = levels.indexOf(curr);

    if (currIdx > prevIdx) play('posture-up');
    else                   play('posture-down');
  }, [state.posture.level, play]);

  return { initAudio, play };
}

// ----------------------------
// Card-play sound helper (call directly from UI components)
// ----------------------------

export function soundForCard(suit: string): SoundId {
  const map: Record<string, SoundId> = {
    spades:   'card-attack',
    clubs:    'card-mana',
    hearts:   'card-heal',
    diamonds: 'card-reinforce',
  };
  return map[suit] ?? 'card-play';
}
