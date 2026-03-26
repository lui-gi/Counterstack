import type { OrganizationState } from './OrganizationState.interface';
import type { Card } from './Card.interface';
import type { IncidentEntry } from './IncidentEntry.interface';

export interface GameState {
  org: OrganizationState;
  phase: 'deal' | 'action' | 'resolve' | 'game-over';
  turnNumber: number;
  dealerCard: Card | null;
  playerHand: Card[];
  lastPlayedCard: Card | null;
  incidentLog: IncidentEntry[];
  isRedAlert: boolean;
  isEmergencyMode: boolean;
  demoMode: boolean;
}
