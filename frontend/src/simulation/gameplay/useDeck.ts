// ============================================================
// simulation/gameplay/useDeck.ts
// Derived hook — provides hand display metadata.
// Checks which cards are playable given current mana.
// ============================================================

import { useMemo } from 'react';
import type { SimCard, PlayerResources } from '../engine/types';

export interface PlayableCard extends SimCard {
  /** False when the player lacks mana to play this card. */
  canPlay: boolean;
  /** Suit display color hex. */
  color: string;
}

const SUIT_COLORS: Record<string, string> = {
  spades:   '#60A5FA',  // blue (player attack)
  clubs:    '#34D399',  // emerald (mana)
  hearts:   '#F472B6',  // pink (health)
  diamonds: '#A78BFA',  // violet (reinforce)
};

export function useDeck(hand: SimCard[], resources: PlayerResources): PlayableCard[] {
  return useMemo(() =>
    hand.map(card => ({
      ...card,
      canPlay: resources.mana >= card.manaCost,
      color:   SUIT_COLORS[card.suit] ?? '#FFFFFF',
    })),
    [hand, resources.mana],
  );
}
