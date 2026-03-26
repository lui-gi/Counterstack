// ============================================================
// simulation/engine/types.ts
// Single source of truth for all Simulation / Tabletop Mode types.
// Pure TypeScript — zero React, zero side effects.
// ============================================================

// ----------------------------
// Card System
// ----------------------------

export type SimSuit = 'spades' | 'clubs' | 'hearts' | 'diamonds';

/** 1 = Ace (critical), 2-5 = tactical, 6-9 = operational, 10-11 = large, 12 = Q strategic, 13 = K major */
export type SimRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface SimCard {
  id: string;         // e.g. "A♠", "7♦"
  suit: SimSuit;
  rank: SimRank;
  label: string;      // "Ace of Spades"
  symbol: string;     // "♠", "♣", "♥", "♦"
  /** Effective power (Ace = 14, K = 13 … 2 = 2). Used for damage / heal math. */
  power: number;
  /** Mana cost to play. Diamonds always cost mana; Spades cost mana at rank ≥ 10. */
  manaCost: number;
  /** One-line flavour text shown on the card face. */
  flavour: string;
}

// ----------------------------
// Player Resources
// ----------------------------

export interface PlayerResources {
  /** System integrity 0–100. Reaching 0 = defeat. */
  health: number;
  /** Operational capacity 0–100. Required for Diamonds + high-rank Spades. */
  mana: number;
  /** Temporary defense boost 0–100. Decays –10 per turn; reduces incoming damage. */
  strength: number;
}

export const RESOURCE_CAPS = { health: 100, mana: 100, strength: 100 } as const;
export const STRENGTH_DECAY_PER_TURN = 10;

// ----------------------------
// Threats
// ----------------------------

/** How the threat behaves on its counter-attack step. */
export type ThreatBehavior = 'exploit' | 'escalate' | 'spread' | 'hide';

export type ThreatDifficulty = 'easy' | 'medium' | 'hard' | 'elite';

export interface SimThreat {
  id: string;
  name: string;
  description: string;
  /** Current HP. Threat is neutralized when this reaches 0. */
  hp: number;
  maxHp: number;
  /** Base damage dealt each turn via Exploit. Escalate adds to this. */
  attackPower: number;
  difficulty: ThreatDifficulty;
  /** All behaviors this threat can use, in priority order. */
  behaviors: ThreatBehavior[];
  /** Which behavior executes this turn (set by Magician dealer). */
  currentBehavior: ThreatBehavior;
  /**
   * Hide evasion factor 0.0–1.0.
   * Reduces effective card power: effectivePower = power * (1 - evasion).
   */
  evasion: number;
  /** Flavour tags for the UI badge row. */
  tags: string[];
  cveId?: string;
  /**
   * Optional boss-level special mechanic.
   * When set, overrides normal card resolution rules for this threat.
   */
  specialMechanic?: SpecialMechanic;
  /** Rootkit Trojan: tracks diamond expose progress. */
  rootkitState?: RootkitState;
}

// ----------------------------
// Posture — 5-level model
// ----------------------------

export type PostureLevel = 'secure' | 'stable' | 'strained' | 'critical' | 'breached';

export interface PostureState {
  level: PostureLevel;
  /** Derived 0–100 gauge value for the animated dial. */
  score: number;
}

// Thresholds (inclusive lower bound)
export const POSTURE_THRESHOLDS: Record<PostureLevel, number> = {
  secure:   80,
  stable:   60,
  strained: 40,
  critical: 20,
  breached: 0,
} as const;

// ----------------------------
// Special Threat Mechanics
// ----------------------------

/**
 * Special mechanics that override normal card resolution.
 * Each special mechanic has unique win/loss conditions beyond standard combat.
 */
export type SpecialMechanic =
  | 'system-patch'   // Only Spades are valid — any other suit → SYSTEM COMPROMISED
  | 'rootkit-trojan' // Must apply 7 diamonds to expose, then Spades deal 3× damage
  | 'ai-adapter';    // Immune to Spades, regenerates HP — only Jackpot can kill it

export interface RootkitState {
  /** Diamonds applied so far toward the 7-diamond expose threshold. */
  diamondsApplied: number;
  /** True once 7 diamonds have been played — Spades now deal 3× damage. */
  exposed: boolean;
}

// ----------------------------
// Turn Phases — State Machine
// ----------------------------

export type SimPhase =
  | 'threat-appears'  // Magician spawns/reveals threat
  | 'draw'            // Player draws to fill hand (up to 5 cards)
  | 'choose'          // Player selects a card
  | 'resolve'         // Card effect resolves against threat / resources
  | 'enemy-respond'   // Threat executes its behavior
  | 'posture-update'  // Recalculate posture, check win/loss conditions
  | 'victory'         // Threat HP reached 0
  | 'defeat'          // Player health reached 0
  | 'compromised'     // System Patch violated: player played a non-Spade card
  | 'folded';         // Player folded — hand redrawn, returns to draw phase

// ----------------------------
// Black Hat Jackpot
// ----------------------------

export const JACKPOT_UNLOCK_TURN = 13;

export type JackpotEffectType =
  | 'massive-attack'      // Deal 40 damage to active threat, ignoring evasion
  | 'instant-disruption'  // Fully neutralize the current threat
  | 'resource-recovery'   // Restore all resources to 80
  | 'double-turn'         // Player takes two card actions this turn
  | 'backfire';           // Jackpot fails — threat escalates twice (risk!)

export interface JackpotEffect {
  type: JackpotEffectType;
  label: string;
  description: string;
}

// ----------------------------
// Diamond Chance Results
// ----------------------------

export interface DiamondRollResult {
  /** 10% chance — block the next incoming threat attack. */
  blockedAttack: boolean;
  /** 20% chance — grant one extra card action this turn. */
  extraTurn: boolean;
  strengthGained: number;
}

// ----------------------------
// Card Play Result
// ----------------------------

export interface CardPlayResult {
  updatedResources: PlayerResources;
  /** null if the threat was neutralized by this play. */
  updatedThreat: SimThreat | null;
  logEntries: SimLogEntry[];
  diamondRoll?: DiamondRollResult;
  extraTurn: boolean;
}

// ----------------------------
// Threat Response Result
// ----------------------------

export interface ThreatResponseResult {
  updatedResources: PlayerResources;
  /**
   * The threat after its behavior executes.
   * Escalate increases attackPower; Hide increases evasion.
   * null if the behavior neutralized the threat (reserved for future mechanics).
   */
  updatedThreat: SimThreat;
  /** New threat spawned by Spread, if any. */
  spawnedThreat: SimThreat | null;
  logEntries: SimLogEntry[];
}

// ----------------------------
// Action Log
// ----------------------------

export type LogSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface SimLogEntry {
  id: string;
  turn: number;
  phase: SimPhase;
  message: string;
  severity: LogSeverity;
  timestamp: string;
}

// ----------------------------
// Master Simulation State
// ----------------------------

export interface SimulationState {
  phase: SimPhase;
  turn: number;
  resources: PlayerResources;
  activeThreat: SimThreat | null;
  /** Threats queued by Spread behavior — Magician introduces them sequentially. */
  threatQueue: SimThreat[];
  hand: SimCard[];
  deck: SimCard[];
  discardPile: SimCard[];
  posture: PostureState;
  log: SimLogEntry[];
  jackpotAvailable: boolean;
  jackpotUsed: boolean;
  /** Diamond proc: next enemy attack is blocked. */
  attackBlocked: boolean;
  /** Diamond proc: extra card action available this turn. */
  extraTurnAvailable: boolean;
  foldCount: number;
}

// ----------------------------
// Initial State Factory
// ----------------------------

export function makeInitialResources(): PlayerResources {
  return { health: 80, mana: 70, strength: 0 };
}

export function makeInitialSimState(): SimulationState {
  return {
    phase: 'threat-appears',
    turn: 1,
    resources: makeInitialResources(),
    activeThreat: null,
    threatQueue: [],
    hand: [],
    deck: [],
    discardPile: [],
    posture: { level: 'stable', score: 65 },
    log: [],
    jackpotAvailable: false,
    jackpotUsed: false,
    attackBlocked: false,
    extraTurnAvailable: false,
    foldCount: 0,
  };
}
