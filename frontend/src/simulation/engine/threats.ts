// ============================================================
// simulation/engine/threats.ts
// Threat catalog + behavior execution logic.
// The four behaviors: Exploit, Escalate, Spread, Hide.
// ============================================================

import type {
  SimThreat,
  ThreatBehavior,
  ThreatDifficulty,
  PlayerResources,
  SimLogEntry,
  ThreatResponseResult,
} from './types';
import { applyIncomingDamage } from './resources';
import {
  SYSTEM_PATCH_THREAT,
  ROOTKIT_TROJAN_THREAT,
  AI_ADAPTER_THREAT,
} from './specialThreats';

// ----------------------------
// Threat Catalog
// ----------------------------

const BASE_THREATS: Omit<SimThreat, 'id' | 'currentBehavior'>[] = [
  {
    name: 'Phishing Campaign',
    description: 'Credential harvesting via spear-phishing emails targeting finance team.',
    hp: 30, maxHp: 30,
    attackPower: 8,
    difficulty: 'easy',
    behaviors: ['exploit', 'escalate'],
    evasion: 0.0,
    tags: ['phishing', 'credential'],
  },
  {
    name: 'Ransomware Payload',
    description: 'Ransomware precursor detected — encryption staging in progress.',
    hp: 50, maxHp: 50,
    attackPower: 15,
    difficulty: 'medium',
    behaviors: ['exploit', 'escalate', 'spread'],
    evasion: 0.1,
    tags: ['ransomware', 'encryption'],
  },
  {
    name: 'Insider Threat',
    description: 'Anomalous data access by privileged account outside business hours.',
    hp: 35, maxHp: 35,
    attackPower: 10,
    difficulty: 'medium',
    behaviors: ['hide', 'exploit', 'escalate'],
    evasion: 0.35,
    tags: ['insider', 'priv-esc'],
  },
  {
    name: 'Botnet C2 Channel',
    description: 'Beaconing traffic to known C2 infrastructure via DNS tunneling.',
    hp: 40, maxHp: 40,
    attackPower: 12,
    difficulty: 'medium',
    behaviors: ['spread', 'exploit', 'hide'],
    evasion: 0.2,
    tags: ['botnet', 'C2', 'lateral'],
  },
  {
    name: 'APT Intrusion',
    description: 'Advanced persistent threat — long-dwell lateral movement across VPN segment.',
    hp: 70, maxHp: 70,
    attackPower: 20,
    difficulty: 'hard',
    behaviors: ['hide', 'escalate', 'exploit', 'spread'],
    evasion: 0.45,
    tags: ['APT', 'lateral', 'dwell'],
    cveId: 'CVE-2021-44228',
  },
  {
    name: 'Supply Chain Compromise',
    description: 'Malicious dependency injected into CI/CD pipeline during build step.',
    hp: 60, maxHp: 60,
    attackPower: 18,
    difficulty: 'hard',
    behaviors: ['spread', 'hide', 'escalate'],
    evasion: 0.3,
    tags: ['supply-chain', 'CI/CD', 'RCE'],
    cveId: 'CVE-2020-10148',
  },
  {
    name: 'Zero-Day Exploit',
    description: 'Unpatched RCE in public-facing API gateway — no existing signature.',
    hp: 80, maxHp: 80,
    attackPower: 25,
    difficulty: 'elite',
    behaviors: ['exploit', 'escalate', 'spread', 'hide'],
    evasion: 0.5,
    tags: ['zero-day', 'RCE', 'API'],
    cveId: 'CVE-2024-3901',
  },
];

let _threatCounter = 0;

export function buildThreat(
  base: Omit<SimThreat, 'id' | 'currentBehavior'>,
): SimThreat {
  return {
    ...base,
    id: `threat-${++_threatCounter}`,
    currentBehavior: base.behaviors[0],
  };
}

export const THREAT_CATALOG: SimThreat[] = BASE_THREATS.map(buildThreat);

// ----------------------------
// Special boss threats — injected into THREAT_CATALOG
// Only appear at hard/elite turns via difficultyForTurn
// ----------------------------

export const SPECIAL_THREATS = {
  systemPatch:   buildThreat(SYSTEM_PATCH_THREAT),
  rootkitTrojan: buildThreat(ROOTKIT_TROJAN_THREAT),
  aiAdapter:     buildThreat(AI_ADAPTER_THREAT),
};

/**
 * Pick a random threat scaled to the given difficulty tier.
 * At hard/elite, special boss threats have a 30% chance to appear.
 */
export function selectThreat(difficulty: ThreatDifficulty): SimThreat {
  // 30% chance to spawn a special boss threat at hard or elite
  if ((difficulty === 'hard' || difficulty === 'elite') && Math.random() < 0.30) {
    const specials = [
      SYSTEM_PATCH_THREAT,
      ROOTKIT_TROJAN_THREAT,
      AI_ADAPTER_THREAT,
    ];
    const picked = specials[Math.floor(Math.random() * specials.length)];
    return buildThreat({ ...picked });
  }

  const pool = THREAT_CATALOG.filter(t => t.difficulty === difficulty && !t.specialMechanic);
  const source = pool.length > 0 ? pool : THREAT_CATALOG.filter(t => !t.specialMechanic);
  const base = source[Math.floor(Math.random() * source.length)];
  return buildThreat({ ...base, hp: base.maxHp });
}

// ----------------------------
// Difficulty progression by turn
// ----------------------------

export function difficultyForTurn(turn: number): ThreatDifficulty {
  if (turn <= 3)  return 'easy';
  if (turn <= 7)  return 'medium';
  if (turn <= 12) return 'hard';
  return 'elite';
}

// ----------------------------
// Threat behavior chooser
// The Magician picks behavior based on current game state.
// ----------------------------

export function chooseThreatBehavior(
  threat: SimThreat,
  resources: PlayerResources,
): ThreatBehavior {
  const { behaviors } = threat;

  // If player is low on mana, Escalate to pile on pressure
  if (resources.mana < 20 && behaviors.includes('escalate')) return 'escalate';

  // If player health is critical, go for the kill with Exploit
  if (resources.health < 30 && behaviors.includes('exploit')) return 'exploit';

  // Rotate through available behaviors (simple weighted round-robin)
  const weights: Record<ThreatBehavior, number> = {
    exploit:  40,
    escalate: 25,
    spread:   20,
    hide:     15,
  };

  const available = behaviors.filter(b => weights[b] !== undefined);
  const totalWeight = available.reduce((sum, b) => sum + weights[b], 0);
  let roll = Math.random() * totalWeight;

  for (const b of available) {
    roll -= weights[b];
    if (roll <= 0) return b;
  }

  return behaviors[0];
}

// ----------------------------
// Execute Threat Behavior
// Returns updated resources, possible spawned threat, and log entries.
// ----------------------------

export function executeThreatBehavior(
  threat: SimThreat,
  resources: PlayerResources,
  attackBlocked: boolean,
  logId: string,
  turn: number,
): ThreatResponseResult {
  const log: SimLogEntry[] = [];
  let updatedResources = { ...resources };
  let updatedThreat: SimThreat = { ...threat };
  let spawnedThreat: SimThreat | null = null;

  const phase = 'enemy-respond' as const;
  const ts = new Date().toISOString();

  switch (threat.currentBehavior) {
    case 'exploit': {
      // Direct damage — strength absorbs before health
      const dmg = updatedThreat.attackPower;
      updatedResources = applyIncomingDamage(updatedResources, dmg, attackBlocked);
      log.push({
        id: logId, turn, phase, timestamp: ts,
        message: attackBlocked
          ? `[BLOCKED] ${threat.name} attempted Exploit — Diamond shield held.`
          : `[EXPLOIT] ${threat.name} dealt ${dmg} damage. Health: ${updatedResources.health}`,
        severity: attackBlocked ? 'success' : (updatedResources.health < 30 ? 'critical' : 'warning'),
      });
      break;
    }

    case 'escalate': {
      // Permanently increase this threat's attack power
      updatedThreat = { ...updatedThreat, attackPower: updatedThreat.attackPower + 5 };
      log.push({
        id: logId, turn, phase, timestamp: ts,
        message: `[ESCALATE] ${threat.name} upgraded attack to ${updatedThreat.attackPower}. Threat intensifying.`,
        severity: 'warning',
      });
      break;
    }

    case 'spread': {
      // Spawn a secondary threat, queued for the next round
      const spawnDiff: ThreatDifficulty = threat.difficulty === 'elite' ? 'hard' : 'easy';
      spawnedThreat = selectThreat(spawnDiff);
      log.push({
        id: logId, turn, phase, timestamp: ts,
        message: `[SPREAD] ${threat.name} spawned secondary threat: ${spawnedThreat.name}.`,
        severity: 'critical',
      });
      break;
    }

    case 'hide': {
      // Increase evasion — reduces player's effective card power next turn
      updatedThreat = { ...updatedThreat, evasion: Math.min(0.8, updatedThreat.evasion + 0.15) };
      log.push({
        id: logId, turn, phase, timestamp: ts,
        message: `[HIDE] ${threat.name} increased evasion to ${Math.round(updatedThreat.evasion * 100)}%. Next attack reduced.`,
        severity: 'warning',
      });
      break;
    }
  }

  return { updatedResources, updatedThreat, spawnedThreat, logEntries: log };
}

// ----------------------------
// Apply player Spade damage to a threat
// ----------------------------

export function applySpadeAttack(
  threat: SimThreat,
  cardPower: number,
): SimThreat {
  // Evasion reduces effective damage
  const effective = Math.round(cardPower * (1 - threat.evasion));
  const newHp = Math.max(0, threat.hp - effective);
  return { ...threat, hp: newHp };
}
