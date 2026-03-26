export interface MockIncident {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  time: string;
  status: 'open' | 'investigating' | 'resolved';
}
