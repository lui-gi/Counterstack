import type { ScoredCve } from './ScoredCve.interface';

export interface IncidentRoomProps {
  ranks: Record<string, number>;
  posture: { hand: string; score: number; royal: boolean };
  threatPressure: number;
  activeCve?: ScoredCve | null;
  geminiThreatPct?: number | null;
  geminiExposure?: string;
  geminiControls?: string;
  geminiVerdict?: string;
  geminiAnalyzing?: boolean;
  geminiAttackVectors?: string[];
  geminiRemediationSteps?: string[];
  onClose: () => void;
}
