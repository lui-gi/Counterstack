import type { GameState } from './GameState.interface';

export interface HandProps {
  hand: GameState['playerHand'];
  onPlayCard: (cardId: string) => void;
  phase: GameState['phase'];
}
