// ============================================================
// State.ts — Mock Backend / Single Source of Truth
// No database. No server. One object rules them all.
// ============================================================

import {
  calculateOverallPosture,
  getPostureZone,
} from './posture';

// ----------------------------
// Types (imported from interfaces/)
// ----------------------------

import type { PostureZone } from '../interfaces/PostureZone.interface';
import type { Suit } from '../interfaces/Suit.interface';
import type { Rank } from '../interfaces/Rank.interface';
import type { Threat } from '../interfaces/Threat.interface';
import type { Card } from '../interfaces/Card.interface';
import type { OrganizationState } from '../interfaces/OrganizationState.interface';
import type { GameState } from '../interfaces/GameState.interface';
import type { IncidentEntry } from '../interfaces/IncidentEntry.interface';

export type { PostureZone, Suit, Rank, Threat, Card, OrganizationState, GameState, IncidentEntry };

// ----------------------------
// Posture Formula
// ----------------------------

export { getPostureZone };

export function calculatePosture(org: OrganizationState): number {
  const { health, hardening, recovery, attack } = org;

  const { score } = calculateOverallPosture({
    healthScore: (health.visibilityScore + health.hygienePercent) / 2,
    hardeningScore: hardening.hardeningScore,
    recoveryScore: recovery.resilienceFactor,
    incomingSpadeRaw: 0,
    currentPressure: attack.pressureLevel,
  });

  return score;
}

// ----------------------------
// Initial State
// ----------------------------

export const INITIAL_ORG_STATE: OrganizationState = {
  health: {
    visibilityScore: 75,
    hygienePercent: 70,
  },
  hardening: {
    hardeningScore: 65,
    activePolicies: ['Firewall Active', 'Antivirus Deployed'],
  },
  recovery: {
    resilienceFactor: 65,
    lastBackupTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  attack: {
    activeThreats: [],
    pressureLevel: 5,
  },
  overallPosture: 70,
};

export const INITIAL_GAME_STATE: GameState = {
  org: INITIAL_ORG_STATE,
  phase: 'deal',
  turnNumber: 0,
  dealerCard: null,
  playerHand: [],
  lastPlayedCard: null,
  incidentLog: [],
  isRedAlert: false,
  isEmergencyMode: false,
  demoMode: false,
};

// ----------------------------
// Pure State Updaters
// ----------------------------

export function applyCardEffect(state: GameState, card: Card): GameState {
  const org = { ...state.org };

  switch (card.suit) {
    case 'clubs':
      org.health = {
        visibilityScore: Math.min(100, org.health.visibilityScore + card.effect),
        hygienePercent: Math.min(100, org.health.hygienePercent + card.effect * 0.5),
      };
      break;

    case 'diamonds':
      org.hardening = {
        ...org.hardening,
        hardeningScore: Math.min(100, org.hardening.hardeningScore + card.effect),
      };
      break;

    case 'hearts':
      org.recovery = {
        ...org.recovery,
        resilienceFactor: Math.min(100, org.recovery.resilienceFactor + card.effect),
        lastBackupTimestamp: new Date().toISOString(),
      };
      break;

    case 'spades': {
      // Use calculateOverallPosture to apply shield logic for incoming Spade hits
      const { effectivePressure } = calculateOverallPosture({
        healthScore: (org.health.visibilityScore + org.health.hygienePercent) / 2,
        hardeningScore: org.hardening.hardeningScore,
        recoveryScore: org.recovery.resilienceFactor,
        incomingSpadeRaw: Math.abs(card.effect),
        currentPressure: org.attack.pressureLevel,
      });
      org.attack = {
        ...org.attack,
        pressureLevel: effectivePressure,
      };
      break;
    }
  }

  const newPosture = calculatePosture(org);
  org.overallPosture = newPosture;

  const isRedAlert = newPosture < 30;

  const logEntry: IncidentEntry = {
    id: `${state.turnNumber}-${card.id}`,
    turnNumber: state.turnNumber,
    timestamp: new Date().toISOString(),
    message:
      card.suit === 'spades'
        ? `[THREAT] ${card.name}: ${card.description}`
        : `[ACTION] ${card.name} applied — posture now ${newPosture}`,
    severity: card.suit === 'spades' ? (card.rank === 'A' ? 'critical' : 'warning') : 'info',
    cveId: card.cveId,
  };

  return {
    ...state,
    org,
    lastPlayedCard: card,
    incidentLog: [logEntry, ...state.incidentLog].slice(0, 50),
    isRedAlert,
  };
}

export function applyDealerCard(state: GameState, card: Card): GameState {
  if (card.isJoker) {
    return {
      ...state,
      dealerCard: card,
      phase: 'action',
      isEmergencyMode: true,
      incidentLog: [
        {
          id: `joker-${state.turnNumber}`,
          turnNumber: state.turnNumber,
          timestamp: new Date().toISOString(),
          message: '[EMERGENCY] Joker dealt — chaos event triggered!',
          severity: 'critical',
        },
        ...state.incidentLog,
      ],
    };
  }

  const afterCard = card.suit === 'spades' ? applyCardEffect(state, card) : state;

  return {
    ...afterCard,
    dealerCard: card,
    phase: 'action',
  };
}

export function advanceTurn(state: GameState): GameState {
  return {
    ...state,
    phase: 'deal',
    turnNumber: state.turnNumber + 1,
    dealerCard: null,
    lastPlayedCard: null,
    isEmergencyMode: false,
  };
}

export function resetGame(): GameState {
  return { ...INITIAL_GAME_STATE };
}

// ----------------------------
// Demo Sequence Patches
// Hard-coded for the money-shot scripted flow
// ----------------------------

export function applyDemoStep(state: GameState, step: number): GameState {
  switch (step) {
    case 0: // Start: posture 70, calm green
      return {
        ...state,
        org: {
          ...state.org,
          overallPosture: 70,
          attack: { ...state.org.attack, pressureLevel: 5 },
        },
        isRedAlert: false,
      };
    case 1: // Ace of Spades hits — posture craters to 28
      return {
        ...state,
        org: {
          ...state.org,
          overallPosture: 28,
          attack: { ...state.org.attack, pressureLevel: 72 },
        },
        isRedAlert: true,
        incidentLog: [
          {
            id: `demo-ace-${state.turnNumber}`,
            turnNumber: state.turnNumber,
            timestamp: new Date().toISOString(),
            message: '[THREAT] CVE-2021-44228: Apache Log4Shell RCE — critical impact detected',
            severity: 'critical',
            cveId: 'CVE-2021-44228',
          },
          ...state.incidentLog,
        ],
      };
    case 2: // King of Hearts played — recovery to 60
      return {
        ...state,
        org: {
          ...state.org,
          overallPosture: 60,
          attack: { ...state.org.attack, pressureLevel: 40 },
          recovery: { ...state.org.recovery, resilienceFactor: 80 },
        },
        isRedAlert: false,
        incidentLog: [
          {
            id: `demo-recovery-${state.turnNumber}`,
            turnNumber: state.turnNumber,
            timestamp: new Date().toISOString(),
            message: '[ACTION] King of Hearts: DR failover initiated — posture recovering',
            severity: 'info',
          },
          ...state.incidentLog,
        ],
      };
    default:
      return state;
  }
}
