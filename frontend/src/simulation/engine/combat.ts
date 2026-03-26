// ============================================================
// simulation/engine/combat.ts
// Card play resolution — maps each suit to its resource effect
// and threat interaction. Pure functions, no React.
// ============================================================

import type {
  SimulationState,
  SimCard,
  CardPlayResult,
  SimLogEntry,
} from './types';
import {
  applySpadeCardCost,
  applyClubCard,
  applyHeartCard,
  applyDiamondCard,
} from './resources';
import { applySpadeAttack } from './threats';
import {
  resolveSystemPatch,
  resolveRootkit,
  resolveAiAdapter,
} from './specialThreats';

export { resolveSystemPatch };   // re-export so useSimulation can inspect compromised flag

function logId(state: SimulationState, suffix: string): string {
  return `t${state.turn}-${suffix}-${Date.now()}`;
}

// ----------------------------
// Primary card play resolver
// Checks for special mechanics first, then dispatches by suit.
// ----------------------------

export function resolveCardPlay(
  state: SimulationState,
  card: SimCard,
): CardPlayResult {
  const ts = new Date().toISOString();
  const log: SimLogEntry[] = [];
  const mechanic = state.activeThreat?.specialMechanic;

  // ── Special mechanics override normal resolution ────────
  if (mechanic === 'system-patch') {
    // resolveSystemPatch returns { compromised, cardPlayResult }
    // The compromised flag is handled in useSimulation — here we just
    // return the cardPlayResult; the caller checks compromised separately.
    return resolveSystemPatch(state, card).cardPlayResult;
  }

  if (mechanic === 'rootkit-trojan') {
    return resolveRootkit(state, card);
  }

  if (mechanic === 'ai-adapter') {
    return resolveAiAdapter(state, card);
  }

  // ── Normal suit dispatch ────────────────────────────────
  switch (card.suit) {
    case 'spades':
      return resolveSpade(state, card, ts, log);
    case 'clubs':
      return resolveClub(state, card, ts, log);
    case 'hearts':
      return resolveHeart(state, card, ts, log);
    case 'diamonds':
      return resolveDiamond(state, card, ts, log);
  }
}

// ----------------------------
// Spades — Attack the threat
// ----------------------------

function resolveSpade(
  state: SimulationState,
  card: SimCard,
  ts: string,
  log: SimLogEntry[],
): CardPlayResult {
  if (state.resources.mana < card.manaCost) {
    log.push({
      id: logId(state, 'spade-fizzle'),
      turn: state.turn,
      phase: 'resolve',
      timestamp: ts,
      message: `[FIZZLE] Not enough mana to play ${card.label}. Need ${card.manaCost}, have ${state.resources.mana}.`,
      severity: 'warning',
    });
    return {
      updatedResources: state.resources,
      updatedThreat: state.activeThreat,
      logEntries: log,
      extraTurn: false,
    };
  }

  const updatedResources = applySpadeCardCost(state.resources, card);
  const threat = state.activeThreat;

  if (!threat) {
    log.push({
      id: logId(state, 'spade-no-target'),
      turn: state.turn,
      phase: 'resolve',
      timestamp: ts,
      message: `[ATTACK] ${card.label} played — no active threat to hit.`,
      severity: 'info',
    });
    return { updatedResources, updatedThreat: null, logEntries: log, extraTurn: false };
  }

  const updatedThreat = applySpadeAttack(threat, card.power);
  const dmgDealt = threat.hp - updatedThreat.hp;
  const neutralized = updatedThreat.hp === 0;

  log.push({
    id: logId(state, 'spade'),
    turn: state.turn,
    phase: 'resolve',
    timestamp: ts,
    message: neutralized
      ? `[NEUTRALIZED] ${card.label} destroyed ${threat.name}! Threat eliminated.`
      : `[ATTACK] ${card.label} dealt ${dmgDealt} damage to ${threat.name}. ${updatedThreat.hp}/${threat.maxHp} HP remaining.`,
    severity: neutralized ? 'success' : 'info',
  });

  return {
    updatedResources,
    updatedThreat: neutralized ? null : updatedThreat,
    logEntries: log,
    extraTurn: false,
  };
}

// ----------------------------
// Clubs — Mana Recovery
// ----------------------------

function resolveClub(
  state: SimulationState,
  card: SimCard,
  ts: string,
  log: SimLogEntry[],
): CardPlayResult {
  const updatedResources = applyClubCard(state.resources, card);
  const gained = updatedResources.mana - state.resources.mana;

  log.push({
    id: logId(state, 'club'),
    turn: state.turn,
    phase: 'resolve',
    timestamp: ts,
    message: `[PATCH] ${card.label} restored ${gained} mana. Operational capacity: ${updatedResources.mana}/100.`,
    severity: 'info',
  });

  return {
    updatedResources,
    updatedThreat: state.activeThreat,
    logEntries: log,
    extraTurn: false,
  };
}

// ----------------------------
// Hearts — Health Recovery
// ----------------------------

function resolveHeart(
  state: SimulationState,
  card: SimCard,
  ts: string,
  log: SimLogEntry[],
): CardPlayResult {
  const updatedResources = applyHeartCard(state.resources, card);
  const healthGained = updatedResources.health - state.resources.health;
  const manaGained   = updatedResources.mana   - state.resources.mana;

  log.push({
    id: logId(state, 'heart'),
    turn: state.turn,
    phase: 'resolve',
    timestamp: ts,
    message: `[RECOVERY] ${card.label} restored ${healthGained} HP (+${manaGained} mana). Health: ${updatedResources.health}/100.`,
    severity: 'success',
  });

  return {
    updatedResources,
    updatedThreat: state.activeThreat,
    logEntries: log,
    extraTurn: false,
  };
}

// ----------------------------
// Diamonds — Reinforce
// ----------------------------

function resolveDiamond(
  state: SimulationState,
  card: SimCard,
  ts: string,
  log: SimLogEntry[],
): CardPlayResult {
  const { resources: updatedResources, roll } = applyDiamondCard(state.resources, card);

  if (roll.strengthGained === 0 && !roll.blockedAttack && !roll.extraTurn) {
    log.push({
      id: logId(state, 'diamond-fizzle'),
      turn: state.turn,
      phase: 'resolve',
      timestamp: ts,
      message: `[FIZZLE] ${card.label} failed — insufficient mana (need ${card.manaCost}).`,
      severity: 'warning',
    });
  } else {
    const extras: string[] = [];
    if (roll.blockedAttack) extras.push('NEXT ATTACK BLOCKED');
    if (roll.extraTurn)     extras.push('EXTRA ACTION');
    const suffix = extras.length ? ` ★ ${extras.join(' + ')}` : '';

    log.push({
      id: logId(state, 'diamond'),
      turn: state.turn,
      phase: 'resolve',
      timestamp: ts,
      message: `[REINFORCE] ${card.label} +${roll.strengthGained} strength. Defenses hardened.${suffix}`,
      severity: roll.blockedAttack || roll.extraTurn ? 'success' : 'info',
    });
  }

  return {
    updatedResources,
    updatedThreat: state.activeThreat,
    logEntries: log,
    diamondRoll: roll,
    extraTurn: roll.extraTurn,
  };
}

// ----------------------------
// Win/loss condition checks
// ----------------------------

export function isDefeat(resources: { health: number }): boolean {
  return resources.health <= 0;
}

export function isVictory(threat: { hp: number } | null): boolean {
  return threat === null || threat.hp <= 0;
}
