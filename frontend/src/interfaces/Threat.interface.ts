export interface Threat {
  id: string;
  cveId?: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  pressureDelta: number;
}
