export interface IntegrationAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: 'splunk' | 'crowdstrike' | 'sentinel' | 'elastic';
  title: string;
  description?: string;
  tactic?: string;      // MITRE ATT&CK tactic
  technique?: string;   // MITRE technique ID (e.g., T1059)
  hostname?: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

export interface IntegrationMetric {
  label: string;
  value: string | number;
  trend?: number;       // +/- percentage change
  color?: string;
}

export interface SplunkData {
  connected: boolean;
  lastSync: string;
  notableEvents: IntegrationAlert[];
  riskScore: number;
  eventsPerSecond: number;
  openIncidents: number;
  dataVolumeGB: number;
}

export interface CrowdStrikeData {
  connected: boolean;
  lastSync: string;
  detections: IntegrationAlert[];
  sensorsOnline: number;
  sensorsOffline: number;
  preventionsToday: number;
  criticalVulns: number;
  ztaAvgScore: number;
}

export interface IntegrationStatus {
  splunk?: SplunkData;
  crowdstrike?: CrowdStrikeData;
}
