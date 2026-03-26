// ============================================================
// simulation/engine/specialThreats.ts
// Three boss-tier special threats with unique mechanics that
// override the normal card resolution pipeline.
//
//  1. System Patch      — only Spades are valid; anything else → SYSTEM COMPROMISED
//  2. Rootkit Trojan    — 7 Diamonds to expose, then Spades deal 3× damage
//  3. AI Adapter        — immune to Spades, regenerates HP; only Jackpot can kill it
// ============================================================

import type {
  SimThreat,
  SimCard,
  SimulationState,
  CardPlayResult,
  SimLogEntry,
  RootkitState,
} from './types';
import { applyClubCard, applyHeartCard, applyDiamondCard, applySpadeCardCost } from './resources';

// ----------------------------
// Threat definitions
// ----------------------------

export const SYSTEM_PATCH_THREAT: Omit<SimThreat, 'id' | 'currentBehavior'> = {
  name: 'System Patch Window',
  description:
    'A critical patch is being applied to exposed systems. ALL security resources must focus on ' +
    'attack containment — any other action corrupts the patch and COMPROMISES the system.',
  hp: 45,
  maxHp: 45,
  attackPower: 14,
  difficulty: 'hard',
  behaviors: ['exploit', 'escalate'],
  evasion: 0.0,
  tags: ['patch', 'critical-window', 'SYSTEM-PATCH'],
  specialMechanic: 'system-patch',
};

export const ROOTKIT_TROJAN_THREAT: Omit<SimThreat, 'id' | 'currentBehavior'> = {
  name: 'Rootkit Trojan',
  description:
    'A deeply embedded rootkit masking its presence inside the kernel. Attacks do nothing ' +
    'until the rootkit is exposed via 7 Diamond reinforcement scans. Once exposed, strike hard.',
  hp: 90,
  maxHp: 90,
  attackPower: 16,
  difficulty: 'elite',
  behaviors: ['hide', 'exploit', 'escalate'],
  evasion: 1.0,   // Fully immune to Spades while unexposed
  tags: ['rootkit', 'kernel', 'stealth', 'EXPOSE-REQUIRED'],
  specialMechanic: 'rootkit-trojan',
  rootkitState: { diamondsApplied: 0, exposed: false },
};

export const AI_ADAPTER_THREAT: Omit<SimThreat, 'id' | 'currentBehavior'> = {
  name: 'AI Adapter',
  description:
    'A self-learning adaptive threat that analyzes every attack pattern and evolves countermeasures ' +
    'in real time. It regenerates after each turn. Conventional attacks are useless. ' +
    'Only the Black Hat Jackpot can break its adaptation loop.',
  hp: 60,
  maxHp: 60,
  attackPower: 18,
  difficulty: 'elite',
  behaviors: ['exploit', 'escalate', 'hide'],
  evasion: 0.0,
  tags: ['adaptive', 'AI', 'regenerating', 'JACKPOT-ONLY'],
  specialMechanic: 'ai-adapter',
};

// ----------------------------
// Constants
// ----------------------------

export const ROOTKIT_EXPOSE_THRESHOLD = 7;   // diamonds needed
export const ROOTKIT_EXPOSED_MULTIPLIER = 3; // damage multiplier once exposed
export const AI_ADAPTER_REGEN_PER_TURN = 8;  // HP regenerated each enemy-respond

// ----------------------------
// System Patch resolution
// Only Spades allowed. Any other suit → SYSTEM COMPROMISED.
// ----------------------------

export interface SystemPatchResult {
  compromised: boolean;
  cardPlayResult: CardPlayResult;
}

export function resolveSystemPatch(
  state: SimulationState,
  card: SimCard,
): SystemPatchResult {
  const ts = new Date().toISOString();
  const base: Omit<SimLogEntry, 'id' | 'message' | 'severity'> = {
    turn:      state.turn,
    phase:     'resolve',
    timestamp: ts,
  };

  // ── Non-Spade played → SYSTEM COMPROMISED ──────────────
  if (card.suit !== 'spades') {
    const logEntry: SimLogEntry = {
      ...base,
      id:       `t${state.turn}-patch-fail`,
      message:  `[SYSTEM COMPROMISED] ${card.label} played during patch window. ` +
                `Only Spade containment actions are permitted. System integrity lost.`,
      severity: 'critical',
    };
    return {
      compromised: true,
      cardPlayResult: {
        updatedResources: state.resources,
        updatedThreat:    state.activeThreat,
        logEntries:       [logEntry],
        extraTurn:        false,
      },
    };
  }

  // ── Spade played → normal attack ───────────────────────
  if (state.resources.mana < card.manaCost) {
    return {
      compromised: false,
      cardPlayResult: {
        updatedResources: state.resources,
        updatedThreat:    state.activeThreat,
        logEntries: [{
          ...base,
          id:       `t${state.turn}-patch-fizzle`,
          message:  `[FIZZLE] ${card.label} — not enough mana (need ${card.manaCost}).`,
          severity: 'warning',
        }],
        extraTurn: false,
      },
    };
  }

  const updatedResources = applySpadeCardCost(state.resources, card);
  const threat = state.activeThreat!;
  const dmg     = Math.round(card.power * (1 - threat.evasion));
  const newHp   = Math.max(0, threat.hp - dmg);
  const updatedThreat: SimThreat = { ...threat, hp: newHp };

  return {
    compromised: false,
    cardPlayResult: {
      updatedResources,
      updatedThreat: newHp === 0 ? null : updatedThreat,
      logEntries: [{
        ...base,
        id:       `t${state.turn}-patch-attack`,
        message:  newHp === 0
          ? `[CONTAINED] ${card.label} eliminated patch threat. Window secured.`
          : `[ATTACK] ${card.label} dealt ${dmg} damage during patch window. ${newHp}/${threat.maxHp} HP.`,
        severity: newHp === 0 ? 'success' : 'info',
      }],
      extraTurn: false,
    },
  };
}

// ----------------------------
// Rootkit Trojan resolution
// Diamonds → progress toward expose.
// Spades → 0 damage unexposed, 3× damage exposed.
// Hearts / Clubs → normal resource effects (allowed).
// ----------------------------

export function resolveRootkit(
  state: SimulationState,
  card: SimCard,
): CardPlayResult {
  const threat = state.activeThreat!;
  const rootkit: RootkitState = threat.rootkitState ?? { diamondsApplied: 0, exposed: false };
  const ts = new Date().toISOString();
  const base = { turn: state.turn, phase: 'resolve' as const, timestamp: ts };

  // ── Diamonds → expose progress ─────────────────────────
  if (card.suit === 'diamonds') {
    if (state.resources.mana < card.manaCost) {
      return {
        updatedResources: state.resources,
        updatedThreat:    threat,
        logEntries: [{
          ...base,
          id:       `t${state.turn}-rootkit-fizzle`,
          message:  `[FIZZLE] ${card.label} — not enough mana (need ${card.manaCost}).`,
          severity: 'warning',
        }],
        extraTurn: false,
      };
    }

    const { resources: updatedResources, roll } = applyDiamondCard(state.resources, card);
    const newApplied = rootkit.diamondsApplied + 1;
    const nowExposed = newApplied >= ROOTKIT_EXPOSE_THRESHOLD;
    const updatedThreat: SimThreat = {
      ...threat,
      evasion:      nowExposed ? 0.0 : 1.0,  // drops shield when exposed
      rootkitState: { diamondsApplied: newApplied, exposed: nowExposed },
    };

    const extras: string[] = [];
    if (roll.blockedAttack) extras.push('NEXT ATTACK BLOCKED');
    if (roll.extraTurn)     extras.push('EXTRA ACTION');
    const suffix = extras.length ? ` ★ ${extras.join(' + ')}` : '';

    const message = nowExposed
      ? `[ROOTKIT EXPOSED] All ${ROOTKIT_EXPOSE_THRESHOLD} Diamond scans complete. ` +
        `Rootkit surface area revealed — Spades now deal ${ROOTKIT_EXPOSED_MULTIPLIER}× damage!${suffix}`
      : `[SCAN] ${card.label} — Diamond scan ${newApplied}/${ROOTKIT_EXPOSE_THRESHOLD}. ` +
        `${ROOTKIT_EXPOSE_THRESHOLD - newApplied} more to expose rootkit.${suffix}`;

    return {
      updatedResources,
      updatedThreat,
      logEntries: [{
        ...base,
        id:       `t${state.turn}-rootkit-scan`,
        message,
        severity: nowExposed ? 'success' : 'info',
      }],
      diamondRoll: roll,
      extraTurn:  roll.extraTurn,
    };
  }

  // ── Spades → blocked if unexposed, 3× if exposed ───────
  if (card.suit === 'spades') {
    if (!rootkit.exposed) {
      return {
        updatedResources: state.resources,
        updatedThreat:    threat,
        logEntries: [{
          ...base,
          id:       `t${state.turn}-rootkit-blocked`,
          message:  `[BLOCKED] ${card.label} had no effect — rootkit is still hidden. ` +
                    `Apply Diamond scans (${rootkit.diamondsApplied}/${ROOTKIT_EXPOSE_THRESHOLD}) to expose it first.`,
          severity: 'warning',
        }],
        extraTurn: false,
      };
    }

    // Exposed: 3× multiplied damage
    if (state.resources.mana < card.manaCost) {
      return {
        updatedResources: state.resources,
        updatedThreat:    threat,
        logEntries: [{
          ...base,
          id:       `t${state.turn}-rootkit-nomana`,
          message:  `[FIZZLE] ${card.label} — not enough mana (need ${card.manaCost}).`,
          severity: 'warning',
        }],
        extraTurn: false,
      };
    }

    const updatedResources = applySpadeCardCost(state.resources, card);
    const rawDmg      = Math.round(card.power * ROOTKIT_EXPOSED_MULTIPLIER);
    const newHp       = Math.max(0, threat.hp - rawDmg);
    const updatedThreat: SimThreat = { ...threat, hp: newHp };

    return {
      updatedResources,
      updatedThreat: newHp === 0 ? null : updatedThreat,
      logEntries: [{
        ...base,
        id:       `t${state.turn}-rootkit-strike`,
        message:  newHp === 0
          ? `[ELIMINATED] ${card.label} dealt ${rawDmg} amplified damage — rootkit destroyed!`
          : `[STRIKE] ${card.label} dealt ${rawDmg} (${ROOTKIT_EXPOSED_MULTIPLIER}×) damage. ${newHp}/${threat.maxHp} HP.`,
        severity: newHp === 0 ? 'success' : 'info',
      }],
      extraTurn: false,
    };
  }

  // ── Hearts / Clubs → normal resource recovery (allowed) ─
  if (card.suit === 'hearts') {
    const updatedResources = applyHeartCard(state.resources, card);
    const gained = updatedResources.health - state.resources.health;
    return {
      updatedResources,
      updatedThreat: threat,
      logEntries: [{
        ...base,
        id:       `t${state.turn}-rootkit-heal`,
        message:  `[RECOVERY] ${card.label} restored ${gained} HP while scanning rootkit.`,
        severity: 'info',
      }],
      extraTurn: false,
    };
  }

  // Clubs
  const updatedResources = applyClubCard(state.resources, card);
  const manaGained = updatedResources.mana - state.resources.mana;
  return {
    updatedResources,
    updatedThreat: threat,
    logEntries: [{
      ...base,
      id:       `t${state.turn}-rootkit-mana`,
      message:  `[PATCH] ${card.label} restored ${manaGained} mana while scanning rootkit.`,
      severity: 'info',
    }],
    extraTurn: false,
  };
}

// ----------------------------
// AI Adapter resolution
// All Spades → 0 damage (adapts instantly).
// Hearts / Clubs / Diamonds → normal resource effects.
// Only the Jackpot can destroy it (handled in useSimulation).
// ----------------------------

export function resolveAiAdapter(
  state: SimulationState,
  card: SimCard,
): CardPlayResult {
  const threat = state.activeThreat!;
  const ts = new Date().toISOString();
  const base = { turn: state.turn, phase: 'resolve' as const, timestamp: ts };

  if (card.suit === 'spades') {
    return {
      updatedResources: state.resources,
      updatedThreat:    threat,
      logEntries: [{
        ...base,
        id:       `t${state.turn}-adapter-immune`,
        message:  `[ADAPTED] AI Adapter analyzed and countered ${card.label}. ` +
                  `This attack vector is now neutralized. Use the Black Hat Jackpot.`,
        severity: 'warning',
      }],
      extraTurn: false,
    };
  }

  // Non-Spade cards still work for resource management
  if (card.suit === 'hearts') {
    const updatedResources = applyHeartCard(state.resources, card);
    const gained = updatedResources.health - state.resources.health;
    return {
      updatedResources, updatedThreat: threat,
      logEntries: [{
        ...base,
        id: `t${state.turn}-adapter-heal`,
        message: `[RECOVERY] ${card.label} restored ${gained} HP. AI Adapter still active.`,
        severity: 'info',
      }],
      extraTurn: false,
    };
  }

  if (card.suit === 'clubs') {
    const updatedResources = applyClubCard(state.resources, card);
    const gained = updatedResources.mana - state.resources.mana;
    return {
      updatedResources, updatedThreat: threat,
      logEntries: [{
        ...base,
        id: `t${state.turn}-adapter-mana`,
        message: `[PATCH] ${card.label} restored ${gained} mana. AI Adapter still active.`,
        severity: 'info',
      }],
      extraTurn: false,
    };
  }

  // Diamonds
  if (state.resources.mana < card.manaCost) {
    return {
      updatedResources: state.resources, updatedThreat: threat,
      logEntries: [{
        ...base,
        id: `t${state.turn}-adapter-fizzle`,
        message: `[FIZZLE] ${card.label} — not enough mana.`,
        severity: 'warning',
      }],
      extraTurn: false,
    };
  }
  const { resources: updatedResources, roll } = applyDiamondCard(state.resources, card);
  return {
    updatedResources, updatedThreat: threat,
    logEntries: [{
      ...base,
      id: `t${state.turn}-adapter-reinforce`,
      message: `[REINFORCE] ${card.label} +${roll.strengthGained} strength. ` +
               `Preparing for Jackpot activation.` +
               (roll.blockedAttack ? ' ★ NEXT ATTACK BLOCKED' : '') +
               (roll.extraTurn     ? ' ★ EXTRA ACTION' : ''),
      severity: roll.blockedAttack || roll.extraTurn ? 'success' : 'info',
    }],
    diamondRoll: roll,
    extraTurn: roll.extraTurn,
  };
}

// ----------------------------
// AI Adapter: HP regeneration (called during enemy-respond)
// ----------------------------

export function applyAiAdapterRegen(threat: SimThreat): SimThreat {
  const newHp = Math.min(threat.maxHp, threat.hp + AI_ADAPTER_REGEN_PER_TURN);
  return { ...threat, hp: newHp };
}
