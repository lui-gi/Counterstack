// Simulation engine types used by useSimulation.ts

export type SimSuit = 'spade' | 'club' | 'diamond' | 'heart';

export type SpecialMechanic =
  | 'ransomware'
  | 'lateral-movement'
  | 'ddos'
  | 'rootkit-trojan';

export type PostureLevel = 'secure' | 'stable' | 'strained' | 'critical' | 'breached';

export interface SimCard {
  id: string;
  suit: SimSuit;
  rank: number;
  power: number;
  actionName: string;
  manaCost: number;
}

export interface SimThreat {
  id: string;
  hp: number;
  name: string;
  description: string;
  maxHp: number;
  attackPower: number;
  evasion: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'elite';
  behavior: string;
  cveTag?: string;
  specialMechanic?: SpecialMechanic;
  diamondsPlayed?: number;
}

export interface LogEntry {
  id: string;
  turn: number;
  text: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export interface SimState {
  phase:
    | 'threat-appears'
    | 'choose'
    | 'enemy-respond'
    | 'posture-update'
    | 'victory'
    | 'defeat'
    | 'compromised';
  turn: number;
  resources: { health: number; mana: number; strength: number };
  activeThreat: SimThreat | null;
  threatQueue: SimThreat[];
  hand: SimCard[];
  deck: SimCard[];
  discardPile: SimCard[];
  log: LogEntry[];
  posture: { level: PostureLevel; score: number };
  jackpotAvailable: boolean;
  jackpotUsed: boolean;
  attackBlocked: boolean;
  extraTurnAvailable: boolean;
  foldCount: number;
}
