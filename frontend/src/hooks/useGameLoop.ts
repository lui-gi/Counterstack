// ============================================================
// hooks/useGameLoop.ts
// Drives Dashboard.tsx — manages GameState + card deck.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState } from '../interfaces/GameState.interface';
import type { Card } from '../interfaces/Card.interface';
import type { Suit } from '../interfaces/Suit.interface';
import type { Rank } from '../interfaces/Rank.interface';
import {
  INITIAL_GAME_STATE,
  applyCardEffect,
  applyDealerCard,
  advanceTurn,
} from '../engine/State';

const SUITS: Suit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];

const RANK_EFFECT: Record<Rank, number> = {
  A: 15, K: 12, Q: 10, J: 8, '10': 7, '9': 6, '8': 5, '7': 4,
};

const CARD_NAMES: Record<Suit, string[]> = {
  clubs:    ['Full-Scope IR', 'SOC Escalation', 'Threat Hunt', 'Alert Triage', 'SIEM Sweep', 'Log Review', 'Analyst Deploy', 'Patrol Cycle'],
  diamonds: ['Zero Trust Rollout', 'Patch Enforcement', 'Access Hardening', 'MFA Rollout', 'Network Segment', 'Firewall Update', 'Policy Audit', 'Config Baseline'],
  hearts:   ['DR Failover', 'Backup Restore', 'System Recovery', 'Data Resync', 'Resilience Drill', 'Snapshot Rollback', 'Service Rehydration', 'Chain Heal'],
  spades:   ['APT Intrusion', 'Ransomware Drop', 'Phishing Wave', 'C2 Callback', 'Brute Force', 'SQL Injection', 'Zero-Day Exploit', 'Data Exfiltration'],
};

const CVES: Partial<Record<Rank, string>> = {
  A:   'CVE-2021-44228',
  K:   'CVE-2023-44487',
  Q:   'CVE-2022-30190',
  J:   'CVE-2021-26084',
  '10':'CVE-2020-1472',
};

function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let i = 0; i < RANKS.length; i++) {
      const rank = RANKS[i];
      const base = RANK_EFFECT[rank];
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        name: CARD_NAMES[suit][i],
        description: '',
        effect: suit === 'spades' ? -base : base,
        ...(suit === 'spades' && CVES[rank] ? { cveId: CVES[rank] } : {}),
      });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState>({
    ...INITIAL_GAME_STATE,
    phase: 'deal',
    turnNumber: 1,
  });
  const deckRef = useRef<Card[]>(shuffle(buildDeck()));

  // Auto-deal when phase enters 'deal'
  useEffect(() => {
    if (gameState.phase !== 'deal') return;

    if (deckRef.current.length < 6) {
      deckRef.current = shuffle(buildDeck());
    }

    const dealerCard = deckRef.current[0];
    const playerCards = deckRef.current.slice(1, 6);
    deckRef.current = deckRef.current.slice(6);

    setGameState(prev =>
      applyDealerCard({ ...prev, playerHand: playerCards }, dealerCard),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.phase]);

  const onPlayCard = useCallback((cardId: string) => {
    setGameState(prev => {
      if (prev.phase !== 'action') return prev;
      const card = prev.playerHand.find(c => c.id === cardId);
      if (!card) return prev;
      const withoutCard = { ...prev, playerHand: prev.playerHand.filter(c => c.id !== cardId) };
      const afterEffect = applyCardEffect(withoutCard, card);
      if (afterEffect.org.overallPosture <= 0) {
        return { ...afterEffect, phase: 'game-over' };
      }
      return advanceTurn(afterEffect);
    });
  }, []);

  const resetGame = useCallback(() => {
    deckRef.current = shuffle(buildDeck());
    setGameState({ ...INITIAL_GAME_STATE, phase: 'deal', turnNumber: 1 });
  }, []);

  return { gameState, onPlayCard, resetGame };
}
