import type { ScoredCve } from './ScoredCve.interface';

export interface IncidentRoomProps {
  posture: { hand: string; score: number; royal: boolean };
  activeCve?: ScoredCve | null;
  geminiThreatPct?: number | null;
  geminiSummary?: string;
  geminiExposure?: string;
  geminiControls?: string;
  geminiVerdict?: string;
  geminiAnalyzing?: boolean;
  geminiAttackVectors?: string[];
  geminiRemediationSteps?: string[];
  onClose: () => void;
}
