import { useState, useCallback } from 'react';
import type {
  SimulationState,
  SimCard,
  SimThreat,
  SimSuit,
  SimLogEntry,
  PostureLevel,
  SimPhase,
  SimRank,
} from '../engine/types';

// Local aliases for brevity
type SimState = SimulationState;
type LogEntry = SimLogEntry;

// ── Threat pool ──────────────────────────────────────────────────────────────

const THREAT_POOL: Omit<SimThreat, 'id' | 'hp'>[] = [
  {
    name: 'Ransomware Deployment',
    description: 'Encrypted payloads spreading across file shares',
    maxHp: 80,
    attackPower: 18,
    evasion: 0.1,
    difficulty: 'medium',
    behaviors: ['exploit'],
    currentBehavior: 'exploit',
    tags: ['ransomware', 'encryption'],
    cveId: 'CVE-2024-1234',
    specialMechanic: 'system-patch',
  },
  {
    name: 'APT Lateral Movement',
    description: 'Advanced persistent threat pivoting through internal network',
    maxHp: 60,
    attackPower: 12,
    evasion: 0.35,
    difficulty: 'hard',
    behaviors: ['hide', 'escalate'],
    currentBehavior: 'hide',
    tags: ['apt', 'lateral-movement'],
  },
  {
    name: 'DDoS Amplification',
    description: 'Volumetric attack saturating external bandwidth',
    maxHp: 50,
    attackPower: 20,
    evasion: 0.05,
    difficulty: 'easy',
    behaviors: ['exploit'],
    currentBehavior: 'exploit',
    tags: ['ddos', 'volumetric'],
  },
  {
    name: 'Rootkit Trojan',
    description: 'Kernel-level rootkit masking malicious processes',
    maxHp: 100,
    attackPower: 10,
    evasion: 0.6,
    difficulty: 'elite',
    behaviors: ['hide'],
    currentBehavior: 'hide',
    tags: ['rootkit', 'stealth'],
    cveId: 'CVE-2024-5678',
    specialMechanic: 'rootkit-trojan',
    rootkitState: { diamondsApplied: 0, exposed: false },
  },
  {
    name: 'Credential Stuffing',
    description: 'Automated login attacks using leaked credential pairs',
    maxHp: 45,
    attackPower: 14,
    evasion: 0.2,
    difficulty: 'easy',
    behaviors: ['escalate'],
    currentBehavior: 'escalate',
    tags: ['credential', 'brute-force'],
  },
  {
    name: 'Supply Chain Compromise',
    description: 'Trojanized dependency injected into build pipeline',
    maxHp: 70,
    attackPower: 16,
    evasion: 0.25,
    difficulty: 'hard',
    behaviors: ['hide', 'spread'],
    currentBehavior: 'hide',
    tags: ['supply-chain'],
    cveId: 'CVE-2025-0099',
  },
  {
    name: 'Zero-Day API Exploit',
    description: 'Unauthenticated RCE on public-facing API gateway',
    maxHp: 55,
    attackPower: 22,
    evasion: 0.15,
    difficulty: 'medium',
    behaviors: ['exploit', 'escalate'],
    currentBehavior: 'exploit',
    tags: ['zero-day', 'rce'],
    cveId: 'CVE-2025-1337',
  },
];

// ── Card action names per suit ───────────────────────────────────────────────

const ACTION_NAMES: Record<SimSuit, string[]> = {
  spades:   ['Firewall Block', 'IDS Rule', 'Threat Hunt', 'Isolate Host', 'Force Patch'],
  clubs:    ['SIEM Query', 'Log Harvest', 'Scan Subnet', 'Health Check', 'Intel Pull'],
  diamonds: ['Harden Config', 'Rotate Creds', 'WAF Update', 'Zero-Trust Rule', 'PAM Enforce'],
  hearts:   ['Restore Backup', 'Run Playbook', 'DR Activate', 'Patch Deploy', 'RTO Reset'],
};

const SUIT_SYMBOLS: Record<SimSuit, string> = {
  spades: '♠', clubs: '♣', hearts: '♥', diamonds: '♦',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomThreat(): SimThreat {
  const template = THREAT_POOL[Math.floor(Math.random() * THREAT_POOL.length)];
  return {
    ...template,
    id: `threat-${Date.now()}`,
    hp: template.maxHp,
    rootkitState: template.specialMechanic === 'rootkit-trojan'
      ? { diamondsApplied: 0, exposed: false }
      : undefined,
  };
}

function drawHand(ranks: Record<string, number>): SimCard[] {
  const suits: SimSuit[] = ['spades', 'clubs', 'diamonds', 'hearts'];
  return suits.map((suit, i) => {
    // Map plural suit name to the posture rank key (clubs → clover, others strip trailing 's')
    const suitKey = suit === 'clubs' ? 'clover' : suit.slice(0, -1);
    const rawRank = ranks[suitKey] ?? 7;
    const rank = (Math.max(1, Math.min(13, rawRank))) as SimRank;
    const actions = ACTION_NAMES[suit];
    const label = actions[Math.floor(Math.random() * actions.length)];
    return {
      id: `card-${suit}-${Date.now()}-${i}`,
      suit,
      rank,
      label,
      symbol: SUIT_SYMBOLS[suit],
      power: rank * 3,
      manaCost: suit === 'diamonds' ? Math.max(0, rank - 6) : suit === 'hearts' ? Math.max(0, rank - 5) : 0,
      flavour: '',
    };
  });
}

function scoreToPostureLevel(score: number): PostureLevel {
  if (score >= 80) return 'secure';
  if (score >= 60) return 'stable';
  if (score >= 40) return 'strained';
  if (score >= 20) return 'critical';
  return 'breached';
}

let logIdCounter = 0;
function makeLog(turn: number, phase: SimPhase, message: string, severity: LogEntry['severity']): LogEntry {
  return { id: String(logIdCounter++), turn, phase, message, severity, timestamp: new Date().toISOString() };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

function buildInitialState(initialRanks: Record<string, number>): SimState {
  return {
    phase: 'threat-appears',
    turn: 1,
    resources: { health: 100, mana: 100, strength: 0 },
    activeThreat: null,
    threatQueue: [],
    hand: drawHand(initialRanks),
    deck: [],
    discardPile: [],
    log: [makeLog(0, 'threat-appears', 'Simulation started. Threat scan initiated.', 'info')],
    posture: { level: 'stable', score: 70 },
    jackpotAvailable: false,
    jackpotUsed: false,
    attackBlocked: false,
    extraTurnAvailable: false,
    foldCount: 0,
  };
}

export function useSimulation(initialRanks: Record<string, number>) {
  const [state, setState] = useState<SimState>(() => buildInitialState(initialRanks));

  const startTurn = useCallback(() => {
    setState((prev: SimState) => {
      const threat = randomThreat();
      return {
        ...prev,
        phase: 'choose' as SimPhase,
        activeThreat: threat,
        log: [...prev.log, makeLog(prev.turn, 'threat-appears', `Threat detected: ${threat.name}`, 'critical')],
      };
    });
  }, []);

  const playCard = useCallback((card: SimCard) => {
    setState((prev: SimState) => {
      if (prev.phase !== 'choose' || !prev.activeThreat) return prev;

      const threat = { ...prev.activeThreat };
      let { health, mana, strength } = { ...prev.resources };
      const newLog: LogEntry[] = [];
      let newPhase: SimPhase = 'enemy-respond';

      // Mana cost check
      if (card.manaCost > mana) {
        newLog.push(makeLog(prev.turn, prev.phase, `Not enough mana to play ${card.label} (need ${card.manaCost})`, 'warning'));
        return { ...prev, log: [...prev.log, ...newLog] };
      }

      mana = Math.max(0, mana - card.manaCost);

      // System-patch special: only Spades are valid
      if (threat.specialMechanic === 'system-patch' && card.suit !== 'spades') {
        newLog.push(makeLog(prev.turn, prev.phase, 'System Patch active — only Spades deal damage. System compromised by wrong play!', 'critical'));
        return { ...prev, phase: 'compromised', log: [...prev.log, ...newLog] };
      }

      switch (card.suit) {
        case 'spades': {
          const base = card.rank * 3;
          const hit = Math.random() > threat.evasion;
          if (hit) {
            const dmg = Math.round(base * (1 - threat.evasion * 0.5));
            threat.hp = Math.max(0, threat.hp - dmg);
            newLog.push(makeLog(prev.turn, prev.phase, `${card.label}: dealt ${dmg} damage to ${threat.name}`, 'success'));
          } else {
            newLog.push(makeLog(prev.turn, prev.phase, `${card.label}: evaded! Threat dodged the attack.`, 'warning'));
          }
          break;
        }
        case 'clubs': {
          const gained = Math.round(card.rank * 0.8 * 5);
          mana = Math.min(100, mana + gained);
          newLog.push(makeLog(prev.turn, prev.phase, `${card.label}: restored ${gained} mana`, 'info'));
          break;
        }
        case 'hearts': {
          const hpGain = Math.round(card.rank * 1.5 * 2);
          const manaGain = Math.round(card.rank * 0.5 * 3);
          health = Math.min(100, health + hpGain);
          mana = Math.min(100, mana + manaGain);
          newLog.push(makeLog(prev.turn, prev.phase, `${card.label}: +${hpGain} HP, +${manaGain} mana`, 'success'));
          break;
        }
        case 'diamonds': {
          const strGain = Math.round(card.rank * 1.2);
          strength = Math.min(100, strength + strGain);
          const extraTurn = Math.random() < 0.2;
          if (extraTurn) newPhase = 'choose';
          newLog.push(makeLog(prev.turn, prev.phase, `${card.label}: +${strGain} strength${extraTurn ? ' (EXTRA TURN!)' : ''}`, 'info'));
          // Rootkit diamond counter
          if (threat.specialMechanic === 'rootkit-trojan' && threat.rootkitState) {
            const applied = threat.rootkitState.diamondsApplied + 1;
            threat.rootkitState = { diamondsApplied: applied, exposed: applied >= 7 };
            if (applied >= 7) {
              threat.hp = 0;
              newLog.push(makeLog(prev.turn, prev.phase, 'Rootkit exposed and neutralised!', 'success'));
            }
          }
          break;
        }
      }

      if (threat.hp <= 0) {
        newLog.push(makeLog(prev.turn, prev.phase, `${threat.name} neutralised!`, 'success'));
        newPhase = 'posture-update';
      }

      const newTurn = prev.turn + 1;
      const jackpotAvailable = newTurn >= 13 && !prev.jackpotUsed;

      return {
        ...prev,
        phase: newPhase,
        turn: newTurn,
        resources: { health, mana, strength },
        activeThreat: threat.hp <= 0 ? null : threat,
        hand: drawHand(initialRanks),
        log: [...prev.log, ...newLog],
        jackpotAvailable,
      };
    });
  }, [initialRanks]);

  const fold = useCallback(() => {
    setState((prev: SimState) => {
      if (prev.foldCount >= 3 || prev.phase !== 'choose') return prev;
      return {
        ...prev,
        foldCount: prev.foldCount + 1,
        hand: drawHand(initialRanks),
        log: [...prev.log, makeLog(prev.turn, prev.phase, `FOLD — new hand drawn (${3 - prev.foldCount - 1} folds remaining)`, 'warning')],
      };
    });
  }, [initialRanks]);

  const useJackpot = useCallback(() => {
    setState((prev: SimState) => {
      if (!prev.jackpotAvailable || prev.jackpotUsed || prev.phase !== 'choose') return prev;
      return {
        ...prev,
        jackpotUsed: true,
        jackpotAvailable: false,
        activeThreat: null,
        resources: { health: Math.min(100, prev.resources.health + 30), mana: 100, strength: prev.resources.strength + 20 },
        phase: 'posture-update' as SimPhase,
        log: [...prev.log, makeLog(prev.turn, prev.phase, 'BLACK HAT JACKPOT activated! All resources restored, threat eliminated.', 'success')],
      };
    });
  }, []);

  const nextPhase = useCallback(() => {
    setState((prev: SimState) => {
      if (prev.phase === 'enemy-respond') {
        const threat = prev.activeThreat;
        if (!threat) return { ...prev, phase: 'posture-update' as SimPhase };

        let { health, strength } = { ...prev.resources };
        const newLog: LogEntry[] = [];

        const block = Math.min(strength, threat.attackPower * 0.4);
        const dmg = Math.round(Math.max(0, threat.attackPower - block));
        health = Math.max(0, health - dmg);
        if (block > 0) newLog.push(makeLog(prev.turn, prev.phase, `Strength absorbed ${Math.round(block)} damage`, 'info'));
        newLog.push(makeLog(prev.turn, prev.phase, `${threat.name} attacks for ${dmg} damage`, 'critical'));

        if (health <= 0) {
          return {
            ...prev,
            resources: { ...prev.resources, health: 0, strength },
            phase: 'defeat' as SimPhase,
            log: [...prev.log, ...newLog, makeLog(prev.turn, prev.phase, 'BREACH — systems compromised!', 'critical')],
          };
        }

        return {
          ...prev,
          resources: { ...prev.resources, health, strength },
          phase: 'posture-update' as SimPhase,
          log: [...prev.log, ...newLog],
        };
      }

      if (prev.phase === 'posture-update') {
        const newScore = Math.max(10, Math.min(100, Math.round(
          (prev.resources.health * 0.6) + (prev.resources.mana * 0.2) + (prev.resources.strength * 0.2)
        )));
        const newLevel = scoreToPostureLevel(newScore);

        if (prev.turn > 20) {
          return { ...prev, phase: 'victory' as SimPhase, posture: { level: newLevel, score: newScore } };
        }

        return {
          ...prev,
          phase: 'threat-appears' as SimPhase,
          posture: { level: newLevel, score: newScore },
        };
      }

      return prev;
    });
  }, []);

  return { state, startTurn, playCard, fold, useJackpot, nextPhase };
}
