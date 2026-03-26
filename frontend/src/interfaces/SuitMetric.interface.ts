export interface SuitMetric {
  key: string;
  value: string;
  rawPct: number;
  trend: 'up' | 'down' | 'flat';
}
