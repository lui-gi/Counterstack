// ============================================================
// simulation/engine/resources.ts
// Pure functions for manipulating PlayerResources.
// Each suit card maps to a specific resource effect.
// ============================================================

import type { PlayerResources, SimCard, DiamondRollResult } from './types';
import { RESOURCE_CAPS, STRENGTH_DECAY_PER_TURN } from './types';

// ----------------------------
// Clamp helpers
// ----------------------------

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val));
}

export function clampResources(r: PlayerResources): PlayerResources {
  return {
    health:   clamp(r.health,   0, RESOURCE_CAPS.health),
    mana:     clamp(r.mana,     0, RESOURCE_CAPS.mana),
    strength: clamp(r.strength, 0, RESOURCE_CAPS.strength),
  };
}

// ----------------------------
// Spades — Attack (deal damage to the threat, NOT the player)
// Player resource cost: high-rank Spades cost mana.
// Returns updated resources after paying the mana cost.
// ----------------------------

export function applySpadeCardCost(
  resources: PlayerResources,
  card: SimCard,
): PlayerResources {
  return clampResources({
    ...resources,
    mana: resources.mana - card.manaCost,
  });
}

// ----------------------------
// Clubs — Mana Recovery (restores mana ONLY, never health)
// Free to play (manaCost = 0 for all Clubs).
// Recovery amount scales with card power.
// ----------------------------

export function applyClubCard(
  resources: PlayerResources,
  card: SimCard,
): PlayerResources {
  const manaGain = Math.round(card.power * 0.8); // e.g. Ace (14) → +11 mana
  return clampResources({
    ...resources,
    mana: resources.mana + manaGain,
  });
}

// ----------------------------
// Hearts — Health Recovery
// Restores health and a small amount of mana (SIEM correlation side-effect).
// ----------------------------

export function applyHeartCard(
  resources: PlayerResources,
  card: SimCard,
): PlayerResources {
  const healthGain = Math.round(card.power * 1.5);  // e.g. King (13) → +19 HP
  const manaBonus  = Math.max(1, Math.floor(card.power / 4));
  return clampResources({
    ...resources,
    health: resources.health + healthGain,
    mana:   resources.mana   + manaBonus,
  });
}

// ----------------------------
// Diamonds — Reinforce
// Costs mana. Boosts strength.
// Chance mechanics per the tabletop spec:
//   10% — block the next incoming threat attack
//   20% — grant an extra action this turn
// ----------------------------

export function applyDiamondCard(
  resources: PlayerResources,
  card: SimCard,
): { resources: PlayerResources; roll: DiamondRollResult } {
  if (resources.mana < card.manaCost) {
    // Not enough mana — card fizzles, no effect
    return {
      resources,
      roll: { blockedAttack: false, extraTurn: false, strengthGained: 0 },
    };
  }

  const strengthGain = Math.round(card.power * 1.2); // e.g. Queen (12) → +14 strength

  const roll1 = Math.random();
  const roll2 = Math.random();

  const roll: DiamondRollResult = {
    blockedAttack: roll1 < 0.10,   // 10% block
    extraTurn:     roll2 < 0.20,   // 20% extra turn
    strengthGained: strengthGain,
  };

  return {
    resources: clampResources({
      ...resources,
      mana:     resources.mana     - card.manaCost,
      strength: resources.strength + strengthGain,
    }),
    roll,
  };
}

// ----------------------------
// Incoming Damage — applied during enemy-respond phase
// Strength absorbs damage before health.
// Damage is 0 if attackBlocked (Diamond proc).
// ----------------------------

export function applyIncomingDamage(
  resources: PlayerResources,
  rawDamage: number,
  attackBlocked: boolean,
): PlayerResources {
  if (attackBlocked) return resources;

  const absorbed = Math.min(resources.strength, rawDamage);
  const remainder = rawDamage - absorbed;

  return clampResources({
    ...resources,
    strength: resources.strength - absorbed,
    health:   resources.health   - remainder,
  });
}

// ----------------------------
// Turn decay — strength falls each turn
// ----------------------------

export function applyTurnDecay(resources: PlayerResources): PlayerResources {
  return clampResources({
    ...resources,
    strength: Math.max(0, resources.strength - STRENGTH_DECAY_PER_TURN),
  });
}

// ----------------------------
// Jackpot resource recovery
// ----------------------------

export function applyJackpotRecovery(resources: PlayerResources): PlayerResources {
  return clampResources({
    health:   Math.max(resources.health,   80),
    mana:     Math.max(resources.mana,     80),
    strength: Math.max(resources.strength, 30),
  });
}
