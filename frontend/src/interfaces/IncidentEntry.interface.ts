export interface IncidentEntry {
  id: string;
  turnNumber: number;
  timestamp: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  cveId?: string;
}
