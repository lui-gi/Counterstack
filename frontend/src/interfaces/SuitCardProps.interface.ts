import type { SuitConfig } from './SuitConfig.interface';

export interface SuitCardProps {
  suitKey: string;
  cfg: SuitConfig;
  rank: number;
  active: boolean;
  dimmed: boolean;
  onClick: () => void;
  flipping: boolean;
}
