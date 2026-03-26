import type { SuitMetric } from './SuitMetric.interface';
import type { SuitRisk } from './SuitRisk.interface';

export interface SuitDataEntry {
  metrics: SuitMetric[];
  risks: SuitRisk[];
  capabilities: string[];
  upgradePath: string[];
  aiRecs: string[];
  baseScore: number;
}
