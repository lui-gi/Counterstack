import type { Suit } from './Suit.interface';
import type { Rank } from './Rank.interface';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  name: string;
  description: string;
  effect: number;       // positive = buff, negative = damage
  svgPath?: string;
  isJoker?: boolean;
  cveId?: string;       // populated for Spade cards via cveMapper
}
