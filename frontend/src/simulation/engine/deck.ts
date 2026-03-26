// ============================================================
// simulation/engine/deck.ts
// 52-card deck factory, shuffle, and draw utilities.
// Pure functions — no state.
// ============================================================

import type { SimCard, SimSuit, SimRank } from './types';

// ----------------------------
// Rank metadata
// ----------------------------

const RANK_LABELS: Record<SimRank, string> = {
  1:  'Ace',
  2:  '2', 3:  '3', 4:  '4', 5:  '5',
  6:  '6', 7:  '7', 8:  '8', 9:  '9',
  10: '10',
  11: 'Jack',
  12: 'Queen',
  13: 'King',
};

const SUIT_SYMBOLS: Record<SimSuit, string> = {
  spades:   '♠',
  clubs:    '♣',
  hearts:   '♥',
  diamonds: '♦',
};

/**
 * Card power by rank.
 * Ace is highest (14), then King (13) … down to 2.
 */
function rankToPower(rank: SimRank): number {
  return rank === 1 ? 14 : rank;
}

/**
 * Mana cost by suit + rank.
 * Diamonds always cost mana (reinforcement requires effort).
 * Spades cost mana at rank 10+ (major operations).
 * Clubs and Hearts are free.
 */
function manaCostFor(suit: SimSuit, rank: SimRank): number {
  const power = rankToPower(rank);
  if (suit === 'diamonds') return Math.max(1, Math.floor(power / 4));
  if (suit === 'spades' && power >= 10) return Math.floor((power - 9) * 1.5);
  return 0;
}

/** One-line flavour text keyed to suit + rough rank tier. */
function flavourFor(suit: SimSuit, rank: SimRank): string {
  const power = rankToPower(rank);
  const tier = power <= 5 ? 'low' : power <= 9 ? 'mid' : 'high';

  const table: Record<SimSuit, Record<string, string>> = {
    spades: {
      low:  'Block a malicious IP.',
      mid:  'Isolate compromised host.',
      high: 'Remove malware and sever C2 channel.',
    },
    clubs: {
      low:  'Reallocate analyst time.',
      mid:  'Automate SIEM correlation.',
      high: 'Full resource reallocation — team at capacity.',
    },
    hearts: {
      low:  'Restore backup for one system.',
      mid:  'Rebuild compromised machines.',
      high: 'DR failover — services restored.',
    },
    diamonds: {
      low:  'Reinforce firewall rules.',
      mid:  'Deploy additional monitoring layer.',
      high: 'Harden network perimeter — patch applied.',
    },
  };

  return table[suit][tier];
}

// ----------------------------
// Deck builder
// ----------------------------

const SUITS: SimSuit[]  = ['spades', 'clubs', 'hearts', 'diamonds'];
const RANKS: SimRank[]  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function buildFullDeck(): SimCard[] {
  const deck: SimCard[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      const power   = rankToPower(rank);
      const symbol  = SUIT_SYMBOLS[suit];
      const rankStr = RANK_LABELS[rank];

      deck.push({
        id:       `${rankStr}${symbol}`,
        suit,
        rank,
        label:    `${rankStr} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`,
        symbol,
        power,
        manaCost: manaCostFor(suit, rank),
        flavour:  flavourFor(suit, rank),
      });
    }
  }

  return deck;
}

// ----------------------------
// Fisher-Yates shuffle (in-place)
// ----------------------------

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ----------------------------
// Draw N cards from top of deck
// ----------------------------

export function drawCards(
  deck: SimCard[],
  hand: SimCard[],
  n: number,
): { hand: SimCard[]; deck: SimCard[] } {
  const drawn = deck.slice(0, n);
  return {
    hand: [...hand, ...drawn],
    deck: deck.slice(n),
  };
}

/** Fill hand up to maxHandSize from deck. */
export const MAX_HAND_SIZE = 5;

export function fillHand(
  deck: SimCard[],
  hand: SimCard[],
  discard: SimCard[],
): { hand: SimCard[]; deck: SimCard[]; discard: SimCard[] } {
  const needed = MAX_HAND_SIZE - hand.length;
  if (needed <= 0) return { hand, deck, discard };

  // Reshuffle discard into deck if needed
  if (deck.length < needed) {
    deck = shuffle([...deck, ...discard]);
    discard = [];
  }

  const { hand: newHand, deck: newDeck } = drawCards(deck, hand, needed);
  return { hand: newHand, deck: newDeck, discard };
}

/** Remove a played card from hand, put it in discard. */
export function playCardFromHand(
  hand: SimCard[],
  discard: SimCard[],
  cardId: string,
): { hand: SimCard[]; discard: SimCard[]; played: SimCard | null } {
  const idx = hand.findIndex(c => c.id === cardId);
  if (idx === -1) return { hand, discard, played: null };

  const played = hand[idx];
  return {
    hand:    [...hand.slice(0, idx), ...hand.slice(idx + 1)],
    discard: [...discard, played],
    played,
  };
}
