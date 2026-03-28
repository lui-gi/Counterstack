import type { SuitConfig } from './SuitConfig.interface';

export interface SuitAnalysisCache {
  recommendations: string[];
  reasoning: string;
  loading: boolean;
  benchmarks?: Record<string, string>;
  upgradePath?: string[];
  complianceGaps?: string[];
  attackerView?: string[];
  businessImpact?: string[];
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
  orgProfile?: Record<string, unknown> | null;
}
