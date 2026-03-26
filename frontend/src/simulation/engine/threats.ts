import type { SimThreat, ThreatDifficulty } from './types';
import { shuffle } from './deck';

export const THREAT_CATALOG: SimThreat[] = [
  { id: 't1', name: 'Phishing Campaign', description: 'Mass credential harvesting via spoofed emails', hp: 30, maxHp: 30, attackPower: 8, evasion: 0.1, difficulty: 'easy', behavior: 'Exploit', cveTag: 'Social Engineering' },
  { id: 't2', name: 'Ransomware Dropper', description: 'Encrypts endpoints and demands bitcoin payment', hp: 40, maxHp: 40, attackPower: 12, evasion: 0.2, difficulty: 'medium', behavior: 'Escalate', cveTag: 'CVE-2022-30190' },
  { id: 't3', name: 'Lateral Mover', description: 'Traverses internal network to reach domain controller', hp: 35, maxHp: 35, attackPower: 10, evasion: 0.25, difficulty: 'medium', behavior: 'Spread', cveTag: 'CVE-2020-1472' },
  { id: 't4', name: 'Credential Stealer', description: 'Harvests and exfiltrates authentication tokens', hp: 25, maxHp: 25, attackPower: 9, evasion: 0.15, difficulty: 'easy', behavior: 'Hide', cveTag: 'Pass-the-Hash' },
  { id: 't5', name: 'Supply Chain Backdoor', description: 'Compromised vendor update contains persistent backdoor', hp: 55, maxHp: 55, attackPower: 14, evasion: 0.3, difficulty: 'hard', behavior: 'Exploit', cveTag: 'SolarWinds-type' },
  { id: 't6', name: 'Zero Day Exploit', description: 'Unknown vulnerability being actively exploited in the wild', hp: 50, maxHp: 50, attackPower: 16, evasion: 0.35, difficulty: 'hard', behavior: 'Escalate', cveTag: 'CVE-2024-21887' },
  { id: 't7', name: 'APT Group', description: 'Nation-state threat actor performing targeted intrusion', hp: 70, maxHp: 70, attackPower: 18, evasion: 0.4, difficulty: 'elite', behavior: 'Spread', cveTag: 'APT29' },
];

export const SPECIAL_THREATS: SimThreat[] = [
  { id: 'sp1', name: 'System Patch Window', description: 'Patch deployment in progress — only Spades allowed or system is compromised', hp: 45, maxHp: 45, attackPower: 14, evasion: 0, difficulty: 'hard', behavior: 'Exploit', specialMechanic: 'system-patch', cveTag: 'PATCH-WINDOW' },
  { id: 'sp2', name: 'Rootkit Trojan', description: 'Hidden rootkit — immune to Spades until 7 Diamond cards expose it', hp: 90, maxHp: 90, attackPower: 16, evasion: 1.0, difficulty: 'elite', behavior: 'Hide', specialMechanic: 'rootkit-trojan', cveTag: 'CVE-2021-44228', diamondsPlayed: 0 },
  { id: 'sp3', name: 'AI Adapter', description: 'Self-adapting AI threat — completely immune to Spades, regenerates 8HP/turn', hp: 60, maxHp: 60, attackPower: 18, evasion: 0, difficulty: 'elite', behavior: 'Escalate', specialMechanic: 'ai-adapter', cveTag: 'AI-THREAT' },
];

export function difficultyForTurn(turn: number): ThreatDifficulty {
  if (turn <= 3) return 'easy';
  if (turn <= 7) return 'medium';
  if (turn <= 12) return 'hard';
  return 'elite';
}

export function selectThreat(difficulty: ThreatDifficulty): SimThreat {
  const filtered = THREAT_CATALOG.filter(t => t.difficulty === difficulty);
  const pool = filtered.length > 0 ? filtered : THREAT_CATALOG;

  // 30% chance of special threat at hard/elite
  if ((difficulty === 'hard' || difficulty === 'elite') && Math.random() < 0.30) {
    const eligible = SPECIAL_THREATS.filter(t =>
      difficulty === 'elite' || t.difficulty === 'hard'
    );
    if (eligible.length > 0) {
      const special = shuffle(eligible)[0];
      return { ...special, diamondsPlayed: 0 };
    }
  }

  return { ...shuffle(pool)[0] };
}

export function chooseThreatBehavior(
  threat: SimThreat,
  resources: { health: number; mana: number }
): string {
  if (resources.mana < 20) return 'escalate';
  if (resources.health < 30) return 'exploit';

  const roll = Math.random();
  if (roll < 0.40) return 'exploit';
  if (roll < 0.65) return 'escalate';
  if (roll < 0.85) return 'spread';
  return 'hide';
}
