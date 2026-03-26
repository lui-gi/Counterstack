import type { SuitConfig } from './SuitConfig.interface';

export interface SuitAnalysisCache {
  recommendations: string[];
  reasoning: string;
  loading: boolean;
}

export interface SuitDashboardProps {
  suitKey: string;
  cfg: SuitConfig;
  rank: number;
  onClose: () => void;
  allRanks: Record<string, number>;
  aiAnalysis?: SuitAnalysisCache | null;
  onRequestAnalysis?: () => void;
  hasOrgProfile?: boolean;
}
