import type { SuitConfig } from './SuitConfig.interface';

export interface AiAnalysis {
  loading: boolean;
  recommendations?: string[];
  reasoning?: string;
}

/** Per-suit AI analysis cache used by SOCDashboard */
export type SuitAnalysisCache = Record<string, AiAnalysis>;

export interface SuitDashboardProps {
  suitKey: string;
  cfg: SuitConfig;
  rank: number;
  onClose: () => void;
  allRanks: Record<string, number>;
  aiAnalysis?: AiAnalysis | null;
  onRequestAnalysis: () => void;
  hasOrgProfile: boolean;
}
