import type { GameState } from './GameState.interface';

export interface DashboardProps {
  gameState: GameState;
  onPlayCard: (cardId: string) => void;
}
