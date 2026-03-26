import type { ScoredCve } from './ScoredCve.interface';

export interface IncidentRoomProps {
  ranks: Record<string, number>;
  posture: { hand: string; score: number; royal: boolean };
  threatPressure: number;
  activeCve?: ScoredCve | null;
  geminiThreatPct?: number | null;
  geminiReasoning?: string;
  geminiAnalyzing?: boolean;
  onClose: () => void;
}
