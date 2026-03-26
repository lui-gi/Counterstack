export type SimSuit = 'spade' | 'club' | 'diamond' | 'heart';

export type ThreatBehavior = 'Exploit' | 'Escalate' | 'Spread' | 'Hide' | 'aggressive' | 'evasive' | 'persistent' | 'stealth';

export type ThreatDifficulty = 'easy' | 'medium' | 'hard' | 'elite';

export type ThreatSpecialMechanic = 'system-patch' | 'rootkit-trojan' | 'ai-adapter' | 'ransomware' | 'lateral-movement' | 'ddos' | null;

export interface SimThreat {
  id: string;
  name: string;
  description: string;
  hp: number;
  maxHp: number;
  attackPower: number;
  evasion: number;
  difficulty: ThreatDifficulty;
  behavior: ThreatBehavior;
  cveTag?: string;
  specialMechanic?: ThreatSpecialMechanic;
  diamondsPlayed?: number;
}

export interface SimCard {
  id: string;
  suit: SimSuit;
  rank: number;
  actionName: string;
  manaCost: number;
  power: number;
}

/** @deprecated use SimCard */
export interface SimResources {
  health: number;
  mana: number;
  strength: number;
}

/** Resources used in simulation */
export type PlayerResources = SimResources;

export type PostureLevel = 'secure' | 'stable' | 'strained' | 'critical' | 'breached';

export interface SimPosture {
  level: PostureLevel;
  score: number;
}

/** @deprecated use SimPosture */
export type PostureState = SimPosture;

export type SimPhase =
  | 'threat-appears'
  | 'draw'
  | 'choose'
  | 'resolve'
  | 'card-played'
  | 'enemy-respond'
  | 'posture-update'
  | 'victory'
  | 'defeat'
  | 'compromised';

export interface LogEntry {
  id: string;
  turn: number;
  text: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

/** @deprecated use LogEntry */
export type SimLogEntry = LogEntry;

export interface SimulationState {
  phase: SimPhase;
  turn: number;
  resources: PlayerResources;
  activeThreat: SimThreat | null;
  threatQueue: SimThreat[];
  hand: SimCard[];
  deck: SimCard[];
  discardPile: SimCard[];
  posture: PostureState;
  log: LogEntry[];
  jackpotAvailable: boolean;
  jackpotUsed: boolean;
  attackBlocked: boolean;
  extraTurnAvailable: boolean;
  foldCount: number;
}

/** @deprecated use SimulationState */
export type SimState = SimulationState;
