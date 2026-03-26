import { useState, useCallback } from 'react';
import type {
  SimState,
  SimCard,
  SimThreat,
  SimSuit,
  LogEntry,
  PostureLevel,
} from '../engine/types';

// ── Threat pool ──────────────────────────────────────────────────────────────

const THREAT_POOL: Omit<SimThreat, 'id' | 'hp'>[] = [
  {
    name: 'Ransomware Deployment',
    description: 'Encrypted payloads spreading across file shares',
    maxHp: 80,
    attackPower: 18,
    evasion: 0.1,
    difficulty: 'medium',
    behavior: 'aggressive',
    cveTag: 'CVE-2024-1234',
    specialMechanic: 'ransomware',
  },
  {
    name: 'APT Lateral Movement',
    description: 'Advanced persistent threat pivoting through internal network',
    maxHp: 60,
    attackPower: 12,
    evasion: 0.35,
    difficulty: 'hard',
    behavior: 'stealth',
    specialMechanic: 'lateral-movement',
  },
  {
    name: 'DDoS Amplification',
    description: 'Volumetric attack saturating external bandwidth',
    maxHp: 50,
    attackPower: 20,
    evasion: 0.05,
    difficulty: 'easy',
    behavior: 'aggressive',
    specialMechanic: 'ddos',
  },
  {
    name: 'Rootkit Trojan',
    description: 'Kernel-level rootkit masking malicious processes',
    maxHp: 100,
    attackPower: 10,
    evasion: 0.6,
    difficulty: 'elite',
    behavior: 'stealth',
    cveTag: 'CVE-2024-5678',
    specialMechanic: 'rootkit-trojan',
    diamondsPlayed: 0,
  },
  {
    name: 'Credential Stuffing',
    description: 'Automated login attacks using leaked credential pairs',
    maxHp: 45,
    attackPower: 14,
    evasion: 0.2,
    difficulty: 'easy',
    behavior: 'persistent',
  },
  {
    name: 'Supply Chain Compromise',
    description: 'Trojanized dependency injected into build pipeline',
    maxHp: 70,
    attackPower: 16,
    evasion: 0.25,
    difficulty: 'hard',
    behavior: 'evasive',
    cveTag: 'CVE-2025-0099',
  },
  {
    name: 'Zero-Day API Exploit',
    description: 'Unauthenticated RCE on public-facing API gateway',
    maxHp: 55,
    attackPower: 22,
    evasion: 0.15,
    difficulty: 'medium',
    behavior: 'aggressive',
    cveTag: 'CVE-2025-1337',
  },
];

// ── Card action names per suit ───────────────────────────────────────────────

const ACTION_NAMES: Record<SimSuit, string[]> = {
  spade:   ['Firewall Block', 'IDS Rule', 'Threat Hunt', 'Isolate Host', 'Force Patch'],
  club:    ['SIEM Query', 'Log Harvest', 'Scan Subnet', 'Health Check', 'Intel Pull'],
  diamond: ['Harden Config', 'Rotate Creds', 'WAF Update', 'Zero-Trust Rule', 'PAM Enforce'],
  heart:   ['Restore Backup', 'Run Playbook', 'DR Activate', 'Patch Deploy', 'RTO Reset'],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomThreat(): SimThreat {
  const template = THREAT_POOL[Math.floor(Math.random() * THREAT_POOL.length)];
  return {
    ...template,
    id: `threat-${Date.now()}`,
    hp: template.maxHp,
    diamondsPlayed: template.specialMechanic === 'rootkit-trojan' ? 0 : undefined,
  };
}

function drawHand(ranks: Record<string, number>): SimCard[] {
  const suits: SimSuit[] = ['spade', 'club', 'diamond', 'heart'];
  return suits.map((suit, i) => {
    const suitKey = suit === 'club' ? 'clover' : suit;
    const rank = ranks[suitKey] ?? 7;
    const actions = ACTION_NAMES[suit];
    return {
      id: `card-${suit}-${Date.now()}-${i}`,
      suit,
      rank,
      power: rank * 3,
      actionName: actions[Math.floor(Math.random() * actions.length)],
      manaCost: suit === 'diamond' ? Math.max(0, rank - 6) : suit === 'heart' ? Math.max(0, rank - 5) : 0,
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
function makeLog(turn: number, text: string, severity: LogEntry['severity']): LogEntry {
  return { id: String(logIdCounter++), turn, text, severity };
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
    log: [makeLog(0, 'Simulation started. Threat scan initiated.', 'info')],
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
    setState(prev => {
      const threat = randomThreat();
      return {
        ...prev,
        phase: 'choose',
        activeThreat: threat,
        log: [...prev.log, makeLog(prev.turn, `Threat detected: ${threat.name}`, 'danger')],
      };
    });
  }, []);

  const playCard = useCallback((card: SimCard) => {
    setState(prev => {
      if (prev.phase !== 'choose' || !prev.activeThreat) return prev;

      const threat = { ...prev.activeThreat };
      let { health, mana, strength } = { ...prev.resources };
      const newLog: LogEntry[] = [];
      let newPhase: SimState['phase'] = 'enemy-respond';

      // Mana cost check
      if (card.manaCost > mana) {
        newLog.push(makeLog(prev.turn, `Not enough mana to play ${card.actionName} (need ${card.manaCost})`, 'warning'));
        return { ...prev, log: [...prev.log, ...newLog] };
      }

      mana = Math.max(0, mana - card.manaCost);

      // Rootkit special: must use spades
      if (threat.specialMechanic === 'rootkit-trojan' && card.suit !== 'spade' && card.suit !== 'diamond') {
        newLog.push(makeLog(prev.turn, 'Rootkit active — only Spades deal damage. System compromised by wrong play!', 'danger'));
        return { ...prev, phase: 'compromised', log: [...prev.log, ...newLog] };
      }

      switch (card.suit) {
        case 'spade': {
          const base = card.rank * 3;
          const hit = Math.random() > threat.evasion;
          if (hit) {
            const dmg = Math.round(base * (1 - threat.evasion * 0.5));
            threat.hp = Math.max(0, threat.hp - dmg);
            newLog.push(makeLog(prev.turn, `${card.actionName}: dealt ${dmg} damage to ${threat.name}`, 'success'));
          } else {
            newLog.push(makeLog(prev.turn, `${card.actionName}: evaded! Threat dodged the attack.`, 'warning'));
          }
          break;
        }
        case 'club': {
          const gained = Math.round(card.rank * 0.8 * 5);
          mana = Math.min(100, mana + gained);
          newLog.push(makeLog(prev.turn, `${card.actionName}: restored ${gained} mana`, 'info'));
          break;
        }
        case 'heart': {
          const hpGain = Math.round(card.rank * 1.5 * 2);
          const manaGain = Math.round(card.rank * 0.5 * 3);
          health = Math.min(100, health + hpGain);
          mana = Math.min(100, mana + manaGain);
          newLog.push(makeLog(prev.turn, `${card.actionName}: +${hpGain} HP, +${manaGain} mana`, 'success'));
          break;
        }
        case 'diamond': {
          const strGain = Math.round(card.rank * 1.2);
          strength = Math.min(100, strength + strGain);
          // 20% chance extra turn
          const extraTurn = Math.random() < 0.2;
          if (extraTurn) newPhase = 'choose';
          newLog.push(makeLog(prev.turn, `${card.actionName}: +${strGain} strength${extraTurn ? ' (EXTRA TURN!)' : ''}`, 'info'));
          // Rootkit diamond counter
          if (threat.specialMechanic === 'rootkit-trojan') {
            threat.diamondsPlayed = (threat.diamondsPlayed ?? 0) + 1;
            if (threat.diamondsPlayed >= 7) {
              threat.hp = 0;
              newLog.push(makeLog(prev.turn, 'Rootkit exposed and neutralised!', 'success'));
            }
          }
          break;
        }
      }

      // Block incoming damage from strength
      if (threat.hp <= 0) {
        newLog.push(makeLog(prev.turn, `${threat.name} neutralised!`, 'success'));
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
    setState(prev => {
      if (prev.foldCount >= 3 || prev.phase !== 'choose') return prev;
      return {
        ...prev,
        foldCount: prev.foldCount + 1,
        hand: drawHand(initialRanks),
        log: [...prev.log, makeLog(prev.turn, `FOLD — new hand drawn (${3 - prev.foldCount - 1} folds remaining)`, 'warning')],
      };
    });
  }, [initialRanks]);

  const useJackpot = useCallback(() => {
    setState(prev => {
      if (!prev.jackpotAvailable || prev.jackpotUsed || prev.phase !== 'choose') return prev;
      const threat = prev.activeThreat ? { ...prev.activeThreat, hp: 0 } : null;
      return {
        ...prev,
        jackpotUsed: true,
        jackpotAvailable: false,
        activeThreat: null,
        resources: { health: Math.min(100, prev.resources.health + 30), mana: 100, strength: prev.resources.strength + 20 },
        phase: 'posture-update',
        log: [...prev.log, makeLog(prev.turn, '🎰 BLACK HAT JACKPOT activated! All resources restored, threat eliminated.', 'success')],
      };
    });
  }, []);

  const nextPhase = useCallback(() => {
    setState(prev => {
      if (prev.phase === 'enemy-respond') {
        const threat = prev.activeThreat;
        if (!threat) return { ...prev, phase: 'posture-update' };

        let { health, strength } = { ...prev.resources };
        const newLog: LogEntry[] = [];

        const block = Math.min(strength, threat.attackPower * 0.4);
        const dmg = Math.round(Math.max(0, threat.attackPower - block));
        health = Math.max(0, health - dmg);
        if (block > 0) newLog.push(makeLog(prev.turn, `Strength absorbed ${Math.round(block)} damage`, 'info'));
        newLog.push(makeLog(prev.turn, `${threat.name} attacks for ${dmg} damage`, 'danger'));

        if (health <= 0) {
          return {
            ...prev,
            resources: { ...prev.resources, health: 0, strength },
            phase: 'defeat',
            log: [...prev.log, ...newLog, makeLog(prev.turn, 'BREACH — systems compromised!', 'danger')],
          };
        }

        return {
          ...prev,
          resources: { ...prev.resources, health, strength },
          phase: 'posture-update',
          log: [...prev.log, ...newLog],
        };
      }

      if (prev.phase === 'posture-update') {
        const newScore = Math.max(10, Math.min(100, Math.round((prev.resources.health * 0.6) + (prev.resources.mana * 0.2) + (prev.resources.strength * 0.2))));
        const newLevel = scoreToPostureLevel(newScore);

        if (prev.turn > 20) {
          return { ...prev, phase: 'victory', posture: { level: newLevel, score: newScore } };
        }

        return {
          ...prev,
          phase: 'threat-appears',
          posture: { level: newLevel, score: newScore },
        };
      }

      return prev;
    });
  }, []);

  return { state, startTurn, playCard, fold, useJackpot, nextPhase };
}
