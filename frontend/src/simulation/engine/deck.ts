import type { SimCard } from './types';
import { getCardAction } from './cardActions';

export function createDeck(): SimCard[] {
  const suits: Array<'spade' | 'club' | 'diamond' | 'heart'> = ['spade', 'club', 'diamond', 'heart'];
  const cards: SimCard[] = [];
  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      const manaCost = (suit === 'diamond') || (suit === 'spade' && rank >= 10) ? 15 + rank * 2 : 0;
      const power = rank * 5 + (suit === 'spade' ? 10 : suit === 'heart' ? 8 : 5);
      cards.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        actionName: getCardAction(suit, rank),
        manaCost,
        power,
      });
    }
  }
  return shuffle(cards);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fillHand(
  hand: SimCard[],
  deck: SimCard[],
  discardPile: SimCard[]
): { hand: SimCard[]; deck: SimCard[]; discardPile: SimCard[] } {
  let d = [...deck];
  let dp = [...discardPile];
  const h = [...hand];

  while (h.length < 5) {
    if (d.length === 0) {
      d = shuffle(dp);
      dp = [];
    }
    if (d.length === 0) break;
    h.push(d.shift()!);
  }

  return { hand: h, deck: d, discardPile: dp };
}
